import type { QueueRow } from "@/lib/panel/reviews";
import { plain } from "@/lib/tier2/library";
import { t2 } from "@/lib/tier2/strings";
import styles from "../panel.module.css";

export const p = (key: string) => plain(t2(key));

const STATUS_KEY: Record<QueueRow["status"], string> = {
  waiting: "T2A-ST-WAITING",
  approved: "T2A-ST-APPROVED",
  returned: "T2A-ST-RETURNED",
  refunded: "T2A-ST-REFUNDED",
  // Admin v1.4 (T177): paid and not submitted.
  paid: "T2A-ST-PAID",
  answering: "T2A-ST-ANSWERING",
};

/** IST, "13 Oct, 09:12" (Admin §7: times are IST). */
export const ist = (date: Date) =>
  date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });

/**
 * §2: the elapsed column — plain under 18h, flagged from 18h, unmissable past 24h, frozen once delivered.
 * A partial row shows T2A-WAITING-ON-THEM instead, never flagged: the 24-hour promise starts at submission (v1.4).
 */
export function Elapsed({ row }: { row: Pick<QueueRow, "hours" | "status"> }) {
  const n = String(row.hours);
  if (row.status === "paid" || row.status === "answering") return <span className={styles.el}>{p("T2A-WAITING-ON-THEM").replace("{n}", n)}</span>;
  if (row.status === "approved") return <span className={`${styles.el} ${styles.done}`}>{p("T2A-DELIVERED-IN").replace("{n}", n)}</span>;
  if (row.hours > 24) return <span className={`${styles.el} ${styles.past}`}>{p("T2A-ELAPSED-BREACH").replace("{n}", n)}</span>;
  if (row.hours >= 18) return <span className={`${styles.el} ${styles.warn}`}>{p("T2A-ELAPSED-WARN").replace("{n}", n)}</span>;
  return <span className={styles.el}>{p("T2A-ELAPSED").replace("{n}", n)}</span>;
}

export function Status({ status, progress = null }: { status: QueueRow["status"]; progress?: QueueRow["progress"] }) {
  const label = p(STATUS_KEY[status])
    .replace("{n}", String(progress?.section ?? ""))
    .replace("{total}", String(progress?.total ?? ""));
  return <span className={`${styles.st} ${styles[`st_${status}`] ?? ""}`}>{label}</span>;
}
