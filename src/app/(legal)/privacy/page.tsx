import type { Metadata } from "next";
import { legalTitle } from "@/lib/legal/documents";
import { LegalDocument } from "../LegalDocument";

export const dynamic = "force-static";

export const metadata: Metadata = { title: legalTitle("privacy"), description: null, openGraph: null, twitter: null };

export default function PrivacyPage() {
  return <LegalDocument slug="privacy" />;
}
