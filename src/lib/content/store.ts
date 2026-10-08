import "server-only";
import type { RowDataPacket } from "mysql2";
import { getDatabase } from "@/lib/db";
import type { ContentPiece } from "./select";

/**
 * Active rows of `content_piece`. Cached briefly so an edit in the table
 * shows on the next result within a minute, without a deployment.
 */
const CACHE_MS = 60_000;
let cached: { pieces: ContentPiece[]; loadedAt: number } | undefined;

export async function getContentPieces(): Promise<ContentPiece[]> {
  if (cached && Date.now() - cached.loadedAt < CACHE_MS) return cached.pieces;

  const [rows] = await getDatabase().query<RowDataPacket[]>(
    `SELECT id, section, note_type, priority, trigger_expr, heading, body, active
       FROM content_piece WHERE active = TRUE`,
  );
  const pieces = rows.map((row) => ({
    id: row.id,
    section: row.section,
    note_type: row.note_type,
    priority: Number(row.priority),
    trigger_expr: row.trigger_expr,
    heading: row.heading,
    body: row.body,
    active: Boolean(row.active),
  })) as ContentPiece[];

  cached = { pieces, loadedAt: Date.now() };
  return pieces;
}
