import { plain } from "@/lib/tier2/library";
import { t2 } from "@/lib/tier2/strings";
import { requestLinkAction } from "../actions";
import styles from "../panel.module.css";

export const dynamic = "force-dynamic";

/** Admin §8: request a link · link sent · link expired. One page, three states. */
export default async function SignInPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const p = (key: string) => plain(t2(key));
  if (query.sent === "1") {
    return (
      <div className={styles.panel}>
        <div className={styles.sign}>
          <h1>{p("T2A-LOGIN-SENT-HEAD")}</h1>
          <p>{p("T2A-LOGIN-SENT-SUB")}</p>
        </div>
      </div>
    );
  }
  const expired = query.expired === "1";
  return (
    <div className={styles.panel}>
      <form className={styles.sign} action={requestLinkAction}>
        <h1>{p(expired ? "T2A-LOGIN-EXPIRED-HEAD" : "T2A-LOGIN-HEAD")}</h1>
        <p>{p(expired ? "T2A-LOGIN-EXPIRED-SUB" : "T2A-LOGIN-SUB")}</p>
        <label>
          {p("T2A-LOGIN-LABEL")}
          <input type="email" name="email" autoComplete="email" required />
        </label>
        <button type="submit" className={styles.b1}>
          {p(expired ? "T2A-LOGIN-EXPIRED-BTN" : "T2A-LOGIN-BTN")}
        </button>
      </form>
    </div>
  );
}
