import Link from "next/link";
import { plain } from "@/lib/tier2/library";
import { t2 } from "@/lib/tier2/strings";
import styles from "../panel.module.css";

export default function SignedOutPage() {
  return (
    <div className={styles.panel}>
      <div className={styles.sign}>
        <h1>{plain(t2("T2A-SIGNEDOUT-HEAD"))}</h1>
        <Link className={styles.b1} href="/manage/sign-in" >
          {plain(t2("T2A-SIGNEDOUT-BTN"))}
        </Link>
      </div>
    </div>
  );
}
