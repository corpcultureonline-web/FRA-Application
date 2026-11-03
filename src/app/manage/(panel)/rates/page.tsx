import { notFound, redirect } from "next/navigation";
import { panelUser } from "@/lib/panel/auth";
import { editRates } from "@/lib/panel/reviews";
import styles from "../../panel.module.css";
import { ist, p } from "../bits";

export const dynamic = "force-dynamic";

/**
 * Admin §4: which blocks keep getting rewritten. Approvers only — for the team
 * login the page does not exist, as its link does not (§6).
 */
export default async function RatesPage() {
  const user = await panelUser();
  if (!user) redirect("/manage/sign-in");
  if (user.role !== "approver") notFound();
  const rows = await editRates();

  return (
    <main className={styles.wrap}>
      <div className={styles.rateHead}>
        <h1>{p("T2A-RATE-HEAD")}</h1>
        <p className={styles.muted}>{p("T2A-RATE-SUB")}</p>
      </div>
      {rows.length === 0 ? (
        <div className={styles.empty}>
          <b>{p("T2A-RATE-EMPTY")}</b>
        </div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Piece</th>
              <th className={styles.num}>Appeared in</th>
              <th className={styles.num}>Edited in</th>
              <th className={styles.num}>Rate</th>
              <th>Last edited</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.pieceId}>
                <td>
                  <code>{row.pieceId}</code>
                </td>
                <td className={styles.num}>{row.appeared}</td>
                <td className={styles.num}>{row.edited}</td>
                <td className={styles.num}>{Math.round(row.rate * 100)}%</td>
                <td className={styles.muted}>{row.lastAt ? `${ist(row.lastAt)}, ${row.lastBy}` : ""}</td>
                <td>{row.flag && <span className={styles.rateFlag}>{p("T2A-RATE-FLAG")}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
