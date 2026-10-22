import Link from "next/link";
import { queue, type Filter } from "@/lib/panel/reviews";
import { getScoringConfig } from "@/lib/scoring/config";
import styles from "../panel.module.css";
import { Elapsed, ist, p, Status } from "./bits";

export const dynamic = "force-dynamic";

/** Admin §2's filter row, in its order. "Approved" and "All" are the library's own words for the two without a status key. */
const FILTERS: { filter: Filter; label: () => string }[] = [
  { filter: "waiting", label: () => p("T2A-ST-WAITING") },
  { filter: "returned", label: () => p("T2A-ST-RETURNED") },
  { filter: "approved", label: () => "Approved" },
  { filter: "refunded", label: () => p("T2A-ST-REFUNDED") },
  { filter: "all", label: () => "All" },
];

/** Screen 8 (Admin §2): the queue, oldest first, "Awaiting review" by default. */
export default async function QueuePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const filter = (FILTERS.find((f) => f.filter === query.show)?.filter ?? "waiting") as Filter;
  const [{ rows, counts }, config] = await Promise.all([queue(filter), getScoringConfig()]);
  const bandName = (code: string) => config.bands.find((b) => b.code === code)?.displayName ?? code;

  return (
    <main className={styles.wrap}>
      <nav className={styles.filters}>
        {FILTERS.map(({ filter: f, label }) => (
          <Link key={f} href={f === "waiting" ? "/manage" : `/manage?show=${f}`} aria-current={f === filter ? "page" : undefined}>
            {label()} <span>{counts[f]}</span>
          </Link>
        ))}
      </nav>
      {rows.length === 0 ? (
        <div className={styles.empty}>
          <b>{p("T2A-EMPTY")}</b>
          <span className={styles.muted}>{p("T2A-EMPTY-SUB")}</span>
        </div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Brand</th>
              <th>Submitted</th>
              <th>Elapsed</th>
              <th className={styles.num}>Score</th>
              <th>Band</th>
              <th>Status</th>
              <th>Approved by</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.orderId} className={row.status === "waiting" && row.hours > 24 ? styles.breach : undefined}>
                <td>
                  <Link className={styles.brand} href={`/manage/reports/${row.orderId}`}>
                    {row.brand}
                  </Link>
                </td>
                <td>{ist(row.submittedAt)}</td>
                <td>
                  <Elapsed row={row} />
                </td>
                <td className={styles.num}>{row.overall}</td>
                <td>{bandName(row.band)}</td>
                <td>
                  <Status status={row.status} />
                </td>
                <td className={styles.muted}>{row.approvedBy && row.approvedAt ? `${row.approvedBy}, ${ist(row.approvedAt)}` : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
