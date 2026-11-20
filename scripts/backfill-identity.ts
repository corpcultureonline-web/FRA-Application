/**
 * Step 4 of the Identity handoff (20 Nov 2026, §6.4): assigns person_id to
 * the event log rows written before identity existed, for everyone who
 * reached Section 1 — every Audit lead and every scored Audit — and sets each
 * person's lifecycle state and flags from the records.
 *
 * What cannot be recovered is the link between a person's separate visits:
 * no visitor_id existed. Only the sessions that hold a lead, a submission or
 * an order are stitched.
 *
 * Safe to re-run: people are found by contact hash, only NULL person_id is
 * filled, and states only move forward. Run after migration 018.
 *
 * Usage: node scripts/backfill-identity.ts [--apply]   (dry run without --apply)
 */
import { randomUUID } from "node:crypto";
import mysql, { type Connection, type ResultSetHeader, type RowDataPacket } from "mysql2/promise";
import { contactHashes, isForward, type State, type StatusFlags } from "../src/lib/events/identity-rules.ts";

const apply = process.argv.includes("--apply");
process.loadEnvFile?.(".env.local");
if (!process.env.DATABASE_URL) process.loadEnvFile?.(".env");
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

type Contact = {
  email: string;
  phone: string;
  firstSeen: Date;
  sessions: Set<string>;
  submissions: Set<number>;
};

const db: Connection = await mysql.createConnection({ uri: process.env.DATABASE_URL });
const contacts = new Map<string, Contact>();

function contactFor(email: string, phone: string, at: Date) {
  const { phoneHash } = contactHashes({ phone });
  const key = phoneHash ?? email.trim().toLowerCase();
  let contact = contacts.get(key);
  if (!contact) {
    contact = { email, phone, firstSeen: at, sessions: new Set(), submissions: new Set() };
    contacts.set(key, contact);
  }
  if (at < contact.firstSeen) contact.firstSeen = at;
  return contact;
}

const [leads] = await db.query<RowDataPacket[]>(
  "SELECT email, phone, session_id, submission_id, created_at FROM audit_leads",
);
for (const lead of leads) {
  const contact = contactFor(lead.email, lead.phone, lead.created_at);
  contact.sessions.add(lead.session_id);
  if (lead.submission_id) contact.submissions.add(lead.submission_id);
}
const [audits] = await db.query<RowDataPacket[]>("SELECT id, email, phone, created_at FROM audit_submissions");
for (const audit of audits) contactFor(audit.email, audit.phone, audit.created_at).submissions.add(audit.id);

console.log(`${contacts.size} people from ${leads.length} leads and ${audits.length} Audits.${apply ? "" : " Dry run."}`);

const totals = { stitched: 0, created: 0, states: new Map<string, number>() };

for (const contact of contacts.values()) {
  const ids = [...contact.submissions];
  const sessions = [...contact.sessions];
  const [orders] = ids.length
    ? await db.query<RowDataPacket[]>(
        "SELECT id, status, submitted_at, report_sent_at FROM report_orders WHERE audit_submission_id IN (?)",
        [ids],
      )
    : [[] as RowDataPacket[]];
  const orderIds = orders.map((o) => o.id as number);
  const paid = orders.filter((o) => o.status === "paid");

  // The furthest state the records support, and the flags it leaves open (§5).
  let state: State = ids.length ? "participant" : "user";
  if (paid.length) state = "customer";
  if (paid.some((o) => o.report_sent_at)) state = "client";
  const flags: StatusFlags = {};
  if (state === "customer") flags.paid_questions_incomplete = paid.every((o) => !o.submitted_at);
  if (state === "client") flags.paid_questions_incomplete = false;

  // Every session that touched this person, and what the browser said in them.
  const where = [
    sessions.length ? "session_id IN (?)" : null,
    ids.length ? "submission_id IN (?)" : null,
    orderIds.length ? "order_id IN (?)" : null,
  ].filter(Boolean);
  const params = [sessions, ids, orderIds].filter((list) => list.length);
  if (!where.length) continue;
  const [sessionRows] = await db.query<RowDataPacket[]>(
    `SELECT DISTINCT session_id FROM event_log WHERE ${where.join(" OR ")}`,
    params,
  );
  const allSessions = [...new Set([...sessions, ...sessionRows.map((r) => r.session_id as string)])];
  if (allSessions.length && state === "participant") {
    const [clicks] = await db.query<RowDataPacket[]>(
      `SELECT 1 FROM event_log WHERE session_id IN (?) AND event_type = 'cta_clicked'
         AND JSON_UNQUOTE(JSON_EXTRACT(payload, '$.cta')) = 'tier2_upgrade' LIMIT 1`,
      [allSessions],
    );
    if (clicks.length) flags.upgrade_clicked_unpaid = true;
  }
  if (allSessions.length && state === "user") {
    const [exits] = await db.query<RowDataPacket[]>(
      `SELECT JSON_EXTRACT(payload, '$.furthest_section') AS section FROM event_log
        WHERE session_id IN (?) AND event_type = 'page_exit' AND JSON_EXTRACT(payload, '$.furthest_section') IS NOT NULL
        ORDER BY id DESC LIMIT 1`,
      [allSessions],
    );
    if (exits[0]?.section != null) flags.stalled_at_section = Number(exits[0].section);
  }
  totals.states.set(state, (totals.states.get(state) ?? 0) + 1);

  if (!apply) {
    const [count] = allSessions.length
      ? await db.query<RowDataPacket[]>(
          "SELECT COUNT(*) AS n FROM event_log WHERE person_id IS NULL AND session_id IN (?)",
          [allSessions],
        )
      : [[{ n: 0 }] as RowDataPacket[]];
    totals.stitched += Number(count[0].n);
    continue;
  }

  const { phoneHash, emailHash } = contactHashes(contact);
  await db.beginTransaction();
  try {
    const [found] = await db.query<RowDataPacket[]>(
      "SELECT person_id, state FROM person WHERE phone_hash = ? OR email_hash = ? ORDER BY person_id LIMIT 1 FOR UPDATE",
      [phoneHash, emailHash],
    );
    let personId: number;
    let current: string | null = null;
    if (found[0]) {
      personId = found[0].person_id;
      current = found[0].state;
    } else {
      const [inserted] = await db.execute<ResultSetHeader>(
        "INSERT INTO person (phone_hash, email_hash, state, status_flags, first_seen_at) VALUES (?, ?, ?, ?, ?)",
        [phoneHash, emailHash, state, JSON.stringify(flags), contact.firstSeen],
      );
      personId = inserted.insertId;
      totals.created++;
    }
    if (current && isForward(current, state)) {
      await db.execute("UPDATE person SET state = ?, status_flags = ? WHERE person_id = ?", [
        state,
        JSON.stringify(flags),
        personId,
      ]);
    }
    let stitched = 0;
    if (allSessions.length) {
      const [result] = await db.query<ResultSetHeader>(
        "UPDATE event_log SET person_id = ? WHERE person_id IS NULL AND session_id IN (?)",
        [personId, allSessions],
      );
      stitched = result.affectedRows;
    }
    if (stitched) {
      await db.execute(
        `INSERT INTO event_log (session_id, person_id, event_type, payload, is_internal)
         VALUES (?, ?, 'identity_resolved', ?, FALSE)`,
        [
          randomUUID(),
          personId,
          JSON.stringify({ person_id: personId, new_person: !found[0], rows_stitched: stitched, backfill: true }),
        ],
      );
    }
    totals.stitched += stitched;
    await db.commit();
  } catch (error) {
    await db.rollback();
    throw error;
  }
}

console.log(
  `${apply ? "Stitched" : "Would stitch"} ${totals.stitched} event rows; ${apply ? `created ${totals.created} people; ` : ""}states: ${[
    ...totals.states,
  ]
    .map(([state, n]) => `${state} ${n}`)
    .join(", ")}.`,
);
await db.end();
