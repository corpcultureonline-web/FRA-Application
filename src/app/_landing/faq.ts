/**
 * The landing page FAQ — rendered on the page and published as FAQPage
 * structured data from this one list, so the two can never disagree (Google
 * requires the marked-up answers to match the visible ones).
 *
 * Answers are paragraphs with **bold** markup. Prices come from pricing.ts and
 * live only in "What does it cost?" (Content Library §19).
 */
import { payableLabel, priceLabel } from "../../lib/pricing.ts";

export const AREA_MEANINGS: [string, string][] = [
  ["Profit & Payback", "whether a franchise owner makes money."],
  ["Systems", "whether someone else can run it the way you do."],
  ["Support", "whether you can help an owner after they join."],
  ["Your Role", "whether the business runs without you."],
  ["Market Proof", "whether it works outside your home city."],
  ["Brand Pull", "whether people come asking for your franchise."],
  ["Right Partner", "whether you know who should run your next outlet."],
];

export type Faq = {
  question: string;
  answer: string[];
  /** A name — meaning list, shown after the paragraphs. */
  list?: [string, string][];
};

export const FAQ: Faq[] = [
  {
    question: "What is a Franchise Readiness Audit?",
    answer: [
      "A structured assessment of whether a business can be franchised successfully. It measures 7 areas and produces a score, along with a separate legal and trademark check.",
    ],
  },
  {
    question: "How is my score calculated?",
    answer: [
      "Each of the 7 areas is weighted by how much it determines franchise success. Profit & Payback and Systems carry the most weight, because they are what a franchise owner is actually buying: a model whose numbers work, and a system they can reproduce.",
    ],
  },
  {
    question: "Why is my score a range and not one number?",
    answer: [
      "11 questions can place you closely, not exactly. A range is honest about that. The Franchise Readiness Report asks 44 and gives you one number.",
    ],
  },
  { question: "What do the 7 areas measure?", answer: [], list: AREA_MEANINGS },
  { question: "How long does it take?", answer: ["About 4 minutes. No signup, no cost."] },
  {
    question: "What happens to my answers?",
    answer: [
      "They are used to produce your result and nothing else. They are never shared with any brand, investor or third party without your permission.",
    ],
  },
  {
    question: "What happens after the free audit?",
    answer: [
      "Your Score gives you a range and shows which of the seven areas are strong and which are not. If you want the exact number, the **Franchise Readiness Report** gives you your precise score and a written diagnosis of all seven areas, with your gaps ranked by what each one costs you.",
      "The **Franchise Readiness Roadmap** goes further again — it works out what a franchise partner would actually earn from your business and how long their money takes to come back, and it includes a call with our team to talk it through.",
      "See **“What does it cost?”** below for prices.",
    ],
  },
  {
    question: "What does it cost?",
    answer: [
      "The Franchise Readiness Audit is free — eleven questions, about 4 minutes, and your Franchise Readiness Score appears on screen straight away.",
      `The full **Franchise Readiness Report** is **${priceLabel("report")}** (${payableLabel("report")}). About thirty more questions, and you receive the report within 24 hours.`,
      `The **Franchise Readiness Roadmap** is **${priceLabel("roadmap")}** (${payableLabel("roadmap")}). It picks up where the Report stops, works through what a franchise partner would actually earn, and includes a call with our team.`,
      "Each stage is priced on its own. Nothing is credited or adjusted if you move to the next one.",
    ],
  },
];

/** An answer as plain text, for structured data. */
export function faqPlainText(faq: Faq) {
  const list = (faq.list ?? []).map(([name, meaning]) => `${name}: ${meaning}`);
  return [...faq.answer, ...list].join("\n").replace(/\*\*(.+?)\*\*/g, "$1");
}
