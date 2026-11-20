import "server-only";
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getDatabase } from "@/lib/db";
import { contactHashes, flagsOnEntering, isForward, type State, type StatusFlags } from "./identity-rules";
import { backfillPerson, personFor, writeEvents, type EventContext } from "./server";

/**
 * Identity stitching and lifecycle (Developer-Handoff-Identity-Attribution,
 * 20 Nov 2026, §5–§6). Append-only: a person row is never deleted or merged
 * into another, and every link that could go wrong is written down as an
 * event (identity_resolved, identity_merged, state_changed) so it can be
 * unwound. Only hashes reach `person`; the contact details stay in the Audit.
 */

type Contact = { phone?: string | null; email?: string | null };
type PersonRow = { person_id: number; phone_hash: string | null; email_hash: string | null };

const DEADLOCK = new Set(["ER_LOCK_DEADLOCK", "ER_DUP_ENTRY"]);

async function inTransaction<T>(work: (db: PoolConnection) => Promise<T>): Promise<T> {
  // A first-time contact saved twice at once can race on the unique hashes: one retry settles it.
  for (let attempt = 0; ; attempt++) {
    const db = await getDatabase().getConnection();
    try {
      await db.beginTransaction();
      const result = await work(db);
      await db.commit();
      return result;
    } catch (error) {
      await db.rollback().catch(() => {});
      if (attempt === 0 && DEADLOCK.has((error as { code?: string }).code ?? "")) continue;
      throw error;
    } finally {
      db.release();
    }
  }
}

/**
 * Section 1 is complete (§6.2): find the person by contact hash or create
 * them as a User, point this browser at them, and attach every earlier event
 * from this browser. On a second device the same contact finds the same
 * person, and the link is recorded as identity_merged (§6.3). Idempotent: a
 * repeat with nothing new writes nothing.
 */
export async function resolveIdentity(context: EventContext, contact: Contact): Promise<number | null> {
  const { phoneHash, emailHash } = contactHashes(contact);
  if (!phoneHash && !emailHash) return null;

  return inTransaction(async (db) => {
    const [found] = await db.execute<RowDataPacket[]>(
      `SELECT person_id, phone_hash, email_hash FROM person
        WHERE phone_hash = ? OR email_hash = ? ORDER BY person_id FOR UPDATE`,
      [phoneHash, emailHash],
    );
    const people = found as unknown as PersonRow[];
    const events: { type: "identity_resolved" | "identity_merged"; payload: Record<string, unknown> }[] = [];

    let personId: number;
    let created = false;
    if (!people.length) {
      const [inserted] = await db.execute<ResultSetHeader>(
        "INSERT INTO person (phone_hash, email_hash, state, first_seen_at) VALUES (?, ?, 'user', CURRENT_TIMESTAMP(3))",
        [phoneHash, emailHash],
      );
      personId = inserted.insertId;
      created = true;
    } else {
      // The oldest match is the person. A phone on one row and an email on
      // another are two people the contact now joins: recorded, never merged.
      personId = people[0].person_id;
      if (people.length > 1) {
        events.push({
          type: "identity_merged",
          payload: { reason: "contact_split", person_id: personId, other_person_ids: people.slice(1).map((p) => p.person_id) },
        });
      } else {
        // Fill in the contact the person did not have yet; nobody else holds it, or it would have matched.
        const person = people[0];
        if (!person.phone_hash && phoneHash) {
          await db.execute("UPDATE person SET phone_hash = ? WHERE person_id = ?", [phoneHash, personId]);
        }
        if (!person.email_hash && emailHash) {
          await db.execute("UPDATE person SET email_hash = ? WHERE person_id = ?", [emailHash, personId]);
        }
      }
    }

    let linked = false;
    if (context.visitorId) {
      const [visitors] = await db.execute<RowDataPacket[]>(
        "SELECT person_id FROM visitor WHERE visitor_id = ? FOR UPDATE",
        [context.visitorId],
      );
      const current = visitors[0] as { person_id: number | null } | undefined;
      if (!current) {
        await db.execute(
          `INSERT INTO visitor (visitor_id, person_id, first_seen_at, last_seen_at)
           VALUES (?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))`,
          [context.visitorId, personId],
        );
        linked = true;
      } else if (current.person_id !== personId) {
        await db.execute("UPDATE visitor SET person_id = ? WHERE visitor_id = ?", [personId, context.visitorId]);
        linked = true;
        if (current.person_id) {
          // One browser, a second person (a shared laptop): the earlier events keep their person.
          events.push({
            type: "identity_merged",
            payload: { reason: "visitor_relinked", visitor_id: context.visitorId, from_person_id: current.person_id, to_person_id: personId },
          });
        }
      }
      if (linked && !created) {
        const [others] = await db.execute<RowDataPacket[]>(
          "SELECT visitor_id FROM visitor WHERE person_id = ? AND visitor_id <> ? ORDER BY first_seen_at LIMIT 10",
          [personId, context.visitorId],
        );
        if (others.length) {
          events.push({
            type: "identity_merged",
            payload: {
              reason: "cross_device",
              person_id: personId,
              visitor_id: context.visitorId,
              other_visitor_ids: others.map((row) => row.visitor_id as string),
            },
          });
        }
      }
    }

    const stitched = await backfillPerson(db, context, personId);
    if (created || linked || stitched) {
      events.unshift({
        type: "identity_resolved",
        payload: { person_id: personId, new_person: created, rows_stitched: stitched, visitor_linked: linked },
      });
    }
    await writeEvents(db, context, events.map((event) => ({ ...event, personId })));
    return personId;
  });
}

function applyFlags(flags: StatusFlags | null, set: StatusFlags, clear: (keyof StatusFlags)[]) {
  const next: StatusFlags = { ...(flags ?? {}), ...set };
  for (const key of clear) delete next[key];
  return next;
}

async function lockPerson(db: PoolConnection, personId: number) {
  const [rows] = await db.execute<RowDataPacket[]>(
    "SELECT state, status_flags FROM person WHERE person_id = ? FOR UPDATE",
    [personId],
  );
  const row = rows[0];
  if (!row) return null;
  const flags = typeof row.status_flags === "string" ? JSON.parse(row.status_flags) : row.status_flags;
  return { state: row.state as string, flags: (flags ?? null) as StatusFlags | null };
}

/**
 * §5.1: moves the person forward to `to`, never back, settling the flags that
 * state answers (§5.2), and writes state_changed. Returns false if they were
 * already there or beyond.
 */
export async function advanceState(context: EventContext, personId: number, to: State, ids: { submissionId?: number | null; orderId?: number | null } = {}) {
  return inTransaction(async (db) => {
    const person = await lockPerson(db, personId);
    if (!person || !isForward(person.state, to)) return false;
    const { set, clear } = flagsOnEntering(to);
    await db.execute("UPDATE person SET state = ?, status_flags = ? WHERE person_id = ?", [
      to,
      JSON.stringify(applyFlags(person.flags, set, clear)),
      personId,
    ]);
    await writeEvents(db, context, [
      {
        type: "state_changed",
        payload: { person_id: personId, from: person.state, to },
        personId,
        submissionId: ids.submissionId ?? null,
        orderId: ids.orderId ?? null,
      },
    ]);
    return true;
  });
}

/**
 * §5.2: sets drop-off flags, only while the person is still in `onlyIn`
 * (a Customer has not "clicked upgrade and not paid").
 */
export async function setFlags(personId: number, set: StatusFlags, onlyIn: State[] | null = null, clear: (keyof StatusFlags)[] = []) {
  await inTransaction(async (db) => {
    const person = await lockPerson(db, personId);
    if (!person || (onlyIn && !onlyIn.includes(person.state as State))) return;
    await db.execute("UPDATE person SET status_flags = ? WHERE person_id = ?", [
      JSON.stringify(applyFlags(person.flags, set, clear)),
      personId,
    ]);
  });
}

/**
 * The person behind an Audit or an order, for lifecycle moves the browser is
 * not part of (Razorpay's webhook, the review panel). An Audit scored before
 * identity existed gets its person now, from the Audit's own contact.
 */
export async function personForRun(context: EventContext, ids: { submissionId?: number | null; orderId?: number | null }) {
  const db = getDatabase();
  const known = await personFor(db, null, ids);
  if (known) return known;
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT s.email, s.phone FROM audit_submissions s
      WHERE s.id = COALESCE(?, (SELECT o.audit_submission_id FROM report_orders o WHERE o.id = ?))`,
    [ids.submissionId ?? null, ids.orderId ?? null],
  );
  const row = rows[0];
  if (!row) return null;
  // No browser to link here: only the person is created.
  return resolveIdentity({ ...context, visitorId: null }, { phone: row.phone as string, email: row.email as string });
}
