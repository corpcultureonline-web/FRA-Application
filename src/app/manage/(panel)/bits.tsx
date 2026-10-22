import type { QueueRow } from "@/lib/panel/reviews";
import { plain } from "@/lib/tier2/library";
import { t2 } from "@/lib/tier2/strings";
import styles from "../panel.module.css";

export const p = (key: string) => plain(t2(key));

const STATUS_KEY = { waiting: "T2A-ST-WAITING", approved: "T2A-ST-APPROVED", returned: "T2A-ST-RETURNED", refunded: "T2A-ST-REFUNDED" };

/** IST, "13 Oct, 09:12" (Admin §7: times are IST). */
export const ist = (date: Date) =>
  date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });

/** §2: the elapsed column — plain under 18h, flagged from 18h, unmissable past 24h, frozen once delivered. */
export function Elapsed({ row }: { row: Pick<QueueRow, "hours" | "status"> }) {
  const n = String(row.hours);
  if (row.status === "approved") return <span className={`${styles.el} ${styles.done}`}>{p("T2A-DELIVERED-IN").replace("{n}", n)}</span>;
  if (row.hours > 24) return <span className={`${styles.el} ${styles.past}`}>{p("T2A-ELAPSED-BREACH").replace("{n}", n)}</span>;
  if (row.hours >= 18) return <span className={`${styles.el} ${styles.warn}`}>{p("T2A-ELAPSED-WARN").replace("{n}", n)}</span>;
  return <span className={styles.el}>{p("T2A-ELAPSED").replace("{n}", n)}</span>;
}

export function Status({ status }: { status: QueueRow["status"] }) {
  return <span className={`${styles.st} ${styles[`st_${status}`] ?? ""}`}>{p(STATUS_KEY[status])}</span>;
}
