import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { panelUser } from "@/lib/panel/auth";
import { plain } from "@/lib/tier2/library";
import { t2 } from "@/lib/tier2/strings";
import { signOutAction } from "../actions";
import styles from "../panel.module.css";
import { PanelNav } from "./PanelNav";

export const dynamic = "force-dynamic";

/** Every signed-in panel screen: the session check, then the bar. The edit-rate link is for approvers only (§6). */
export default async function PanelLayout({ children }: { children: ReactNode }) {
  const user = await panelUser();
  if (!user) redirect("/manage/sign-in");
  const p = (key: string) => plain(t2(key));
  return (
    <div className={styles.panel}>
      <header className={styles.top}>
        <b>{p("T2A-LOGIN-HEAD")}</b>
        <PanelNav
          links={[
            { href: "/manage", label: p("T2A-NAV-QUEUE") },
            ...(user.role === "approver" ? [{ href: "/manage/rates", label: p("T2A-NAV-RATES") }] : []),
          ]}
        />
        <div className={styles.who}>
          <span>{user.email}</span>
          <form action={signOutAction}>
            <button type="submit" className={styles.linkButton}>
              {p("T2A-SIGNOUT")}
            </button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}
