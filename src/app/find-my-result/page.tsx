import type { Metadata } from "next";
import Link from "next/link";
import { AuditHeader } from "@/components/AuditHeader";
import { EntityLine } from "@/components/EntityLine";
import { T1F } from "@/lib/find-result/strings";
import { FindResultForm } from "./FindResultForm";

export const metadata: Metadata = {
  title: T1F["T1F-HEAD"],
  robots: { index: false, follow: false },
};

/**
 * "Get your result link again" (handoff v3.1 §6, Find-Result library v1.0):
 * a founder who lost the email types the address or mobile he used and is
 * sent the link to the furthest point he reached. Nothing else is shown here.
 */
export default function FindMyResultPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <AuditHeader />
      <main className="mx-auto w-full max-w-[480px] flex-1 px-5 pt-10 pb-16 sm:pt-16">
        {/* T1F-BACK goes to the Audit's own landing page, not the marketing site. */}
        <Link href="/" className="text-[15px] font-bold text-muted hover:text-ink">
          ← {T1F["T1F-BACK"]}
        </Link>
        <h1 className="mt-6 text-[30px] leading-tight font-black sm:text-[36px]">{T1F["T1F-HEAD"]}</h1>
        <p className="mt-3 text-[17px] leading-relaxed text-body">{T1F["T1F-SUB"]}</p>
        <FindResultForm />
      </main>
      <footer className="border-t border-black/10 px-5 py-6 text-center">
        <EntityLine />
      </footer>
    </div>
  );
}
