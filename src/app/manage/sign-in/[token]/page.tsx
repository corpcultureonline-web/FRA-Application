import { redirect } from "next/navigation";
import { linkIsLive } from "@/lib/panel/auth";
import { plain } from "@/lib/tier2/library";
import { t2 } from "@/lib/tier2/strings";
import { signInAction } from "../../actions";
import styles from "../../panel.module.css";
import { AutoSubmit } from "./AutoSubmit";

export const dynamic = "force-dynamic";

/**
 * The link from the sign-in email. Opening it does not sign in: the button
 * does, so a mail scanner that fetches the link cannot use it up. With
 * JavaScript the form submits itself, so a person sees no extra step.
 */
export default async function SignInLinkPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!(await linkIsLive(token))) redirect("/manage/sign-in?expired=1");
  return (
    <div className={styles.panel}>
      <form className={styles.sign} action={signInAction} id="sign-in">
        <h1>{plain(t2("T2M-SIGNIN-HEAD"))}</h1>
        <input type="hidden" name="token" value={token} />
        <button type="submit" className={styles.b1}>
          {plain(t2("T2M-SIGNIN-BTN"))}
        </button>
        <AutoSubmit form="sign-in" />
      </form>
    </div>
  );
}
