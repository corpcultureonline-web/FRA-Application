import Link from "next/link";
import { queue, resendPreview, type Filter } from "@/lib/panel/reviews";
import { getScoringConfig } from "@/lib/scoring/config";
import styles from "../panel.module.css";
import { Elapsed, ist, p, Status } from "./bits";
import { ResendLink, type ResendCopy } from "./ResendLink";

export const dynamic = "force-dynamic";

/**
 * Admin §2's filter row, in its order. "In progress", "Approved" and "All" are the library's own words for
 * the three without a status key. In progress (v1.4) is never part of the default view.
 */
const FILTERS: { filter: Filter; label: () => string }[] = [
  { filter: "waiting", label: () => p("T2A-ST-WAITING") },
  { filter: "inprogress", label: () => "In progress" },
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
  // T2A-RESEND-CONFIRM reads the address live: resolved for each row as the page renders.
  const previews = await Promise.all(rows.map((row) => resendPreview(row.orderId)));
  const resendCopy = (i: number): ResendCopy | null => {
    const preview = previews[i];
    if (!preview) return null;
    return {
      label: p("T2A-RESEND"),
      confirm: (preview.linkType ? p("T2A-RESEND-CONFIRM").replace("{link_type}", preview.linkType) : p("T2A-RESEND-CONFIRM-BOTH"))
        .replace("{brand}", preview.brand)
        .replace("{email}", preview.email),
      cancel: p("T2A-CANCEL"),
      done: p("T2A-RESEND-DONE"),
      wait: p("T2A-RESEND-WAIT"),
      fail: p("T2A-RESEND-FAIL"),
    };
  };

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
              <th>
                <span className="sr-only">{p("T2A-RESEND")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const copy = resendCopy(i);
              return (
                <tr key={row.orderId} className={row.status === "waiting" && row.hours > 24 ? styles.breach : undefined}>
                  <td>
                    {/* A partial row has no Report to review yet, so no review screen to open. */}
                    {row.submittedAt ? (
                      <Link className={styles.brand} href={`/manage/reports/${row.orderId}`}>
                        {row.brand}
                      </Link>
                    ) : (
                      <span className={styles.brand}>{row.brand}</span>
                    )}
                  </td>
                  <td>{row.submittedAt ? ist(row.submittedAt) : ""}</td>
                  <td>
                    <Elapsed row={row} />
                  </td>
                  <td className={styles.num}>{row.overall ?? ""}</td>
                  <td>{row.band ? bandName(row.band) : ""}</td>
                  <td>
                    <Status status={row.status} progress={row.progress} />
                  </td>
                  <td className={styles.muted}>{row.approvedBy && row.approvedAt ? `${row.approvedBy}, ${ist(row.approvedAt)}` : ""}</td>
                  <td>{copy ? <ResendLink orderId={row.orderId} copy={copy} /> : null}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </main>
  );
}
