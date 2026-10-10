import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { EventTracker } from "@/components/EventTracker";
import { CANONICAL_URL, SEO_DESCRIPTION, SEO_TITLE, SITE_ORIGIN } from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Defaults for every page. Icons and the share image are file-based
 * (favicon.ico, icon.png, apple-icon.png, opengraph-image.jpg in app/).
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: { default: SEO_TITLE, template: "%s | Corporate Culture" },
  description: SEO_DESCRIPTION,
  applicationName: "Franchise Readiness Audit",
  openGraph: {
    type: "website",
    siteName: "Corporate Culture",
    locale: "en_IN",
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    url: CANONICAL_URL,
  },
  twitter: { card: "summary_large_image", title: SEO_TITLE, description: SEO_DESCRIPTION },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-IN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <EventTracker />
        {children}
      </body>
    </html>
  );
}
