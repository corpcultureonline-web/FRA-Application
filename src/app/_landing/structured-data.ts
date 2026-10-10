/**
 * JSON-LD for the landing page: the organisation, the page, the service and
 * its prices, the FAQ, and who conducts the audit. Built from the same sources
 * the page renders (FAQ list, pricing.ts, company.ts), so it cannot claim
 * anything the page does not.
 *
 * Ronak's figures come from FOUNDER_STATS, as printed on the page (confirmed
 * 10 October 2026, Open Item O8). His title stays out until O6 is settled.
 */
import { BASE_PATH } from "../../lib/base-path.ts";
import { CONTACT_EMAIL, FOUNDER_STATS, WHATSAPP_DISPLAY } from "../../lib/company.ts";
import { GST_PERCENT, TIERS } from "../../lib/pricing.ts";
import { CANONICAL_URL, ORGANIZATION_URL, SEO_DESCRIPTION, SEO_TITLE, SITE_ORIGIN } from "../../lib/seo.ts";
import { FAQ, faqPlainText } from "./faq.ts";

const ORG_ID = `${ORGANIZATION_URL}/#organization`;
const SERVICE_ID = `${CANONICAL_URL}#service`;

function paidOffer(tier: keyof typeof TIERS) {
  const { name, base } = TIERS[tier];
  return {
    "@type": "Offer",
    name,
    price: String(base),
    priceCurrency: "INR",
    // The base price is shown exclusive of GST (CANONICAL-VALUES §1).
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: base,
      priceCurrency: "INR",
      valueAddedTaxIncluded: false,
    },
    description: `${name}. ${GST_PERCENT}% GST is added at payment.`,
    seller: { "@id": ORG_ID },
  };
}

export function landingStructuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORG_ID,
        name: "Corporate Culture",
        url: ORGANIZATION_URL,
        logo: { "@type": "ImageObject", url: `${SITE_ORIGIN}${BASE_PATH}/icon.png`, width: 512, height: 512 },
        email: CONTACT_EMAIL,
        telephone: WHATSAPP_DISPLAY.replace(/\s+/g, ""),
        parentOrganization: { "@type": "Organization", name: "Blue Bird Ventures" },
      },
      {
        "@type": "WebPage",
        "@id": CANONICAL_URL,
        url: CANONICAL_URL,
        name: SEO_TITLE,
        description: SEO_DESCRIPTION,
        inLanguage: "en-IN",
        publisher: { "@id": ORG_ID },
        about: { "@id": SERVICE_ID },
      },
      {
        "@type": "Service",
        "@id": SERVICE_ID,
        name: "Franchise Readiness Audit",
        serviceType: "Franchise readiness assessment",
        description: SEO_DESCRIPTION,
        url: CANONICAL_URL,
        provider: { "@id": ORG_ID },
        areaServed: { "@type": "Country", name: "India" },
        offers: [
          {
            "@type": "Offer",
            name: "Franchise Readiness Audit",
            price: "0",
            priceCurrency: "INR",
            url: CANONICAL_URL,
            seller: { "@id": ORG_ID },
          },
          paidOffer("report"),
          paidOffer("roadmap"),
        ],
      },
      {
        "@type": "Person",
        name: "Ronak Patel",
        worksFor: { "@id": ORG_ID },
        description: `Conducts the Franchise Readiness Audit. ${FOUNDER_STATS.map(
          (stat) => `${stat.value} ${stat.label.toLowerCase()}`,
        ).join(", ")}.`,
      },
      {
        "@type": "FAQPage",
        "@id": `${CANONICAL_URL}#faq`,
        mainEntity: FAQ.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faqPlainText(faq) },
        })),
      },
    ],
  };
}

/** Safe inside a <script> tag: no "</script>" can close it early. */
export function jsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
