import Image from "next/image";
import Link from "next/link";
import { FaqItem } from "./_landing/FaqItem";
import { HeroIllustration, ReportThumbnail } from "./_landing/Illustrations";
import founderPhoto from "@/assets/ronak-patel.jpg";
import { Logo } from "@/components/Logo";
import { RatingPill, type Rating } from "@/components/RatingPill";
import { BRAND_ENTITY_LINE, CONTACT_EMAIL, FOUNDER_STATS, WHATSAPP_DISPLAY, WHATSAPP_URL } from "@/lib/company";
import { payableLabel, priceLabel } from "@/lib/pricing";

const START_AUDIT_HREF = "/audit";
// Drop the PDF into public/ under this name.
const SAMPLE_REPORT_HREF = "/sample-report.pdf";

const AREAS: { name: string; question: string; rating: Rating; weakest?: boolean }[] = [
  { name: "Profit & Payback", question: "Will a franchise owner make money?", rating: "Average" },
  { name: "Systems", question: "Can someone else run it like you do?", rating: "Good" },
  { name: "Support", question: "Can you help an owner after they join?", rating: "Good" },
  { name: "Your Role", question: "Does the business run without you?", rating: "Weak" },
  {
    name: "Market Proof",
    question: "Does it work outside your home city?",
    rating: "Weak",
    weakest: true,
  },
  { name: "Brand Pull", question: "Do people come asking for your franchise?", rating: "Weak" },
  { name: "Right Partner", question: "Do you know who should run your next outlet?", rating: "Good" },
];

const AREA_MEANINGS: [string, string][] = [
  ["Profit & Payback", "whether a franchise owner makes money."],
  ["Systems", "whether someone else can run it the way you do."],
  ["Support", "whether you can help an owner after they join."],
  ["Your Role", "whether the business runs without you."],
  ["Market Proof", "whether it works outside your home city."],
  ["Brand Pull", "whether people come asking for your franchise."],
  ["Right Partner", "whether you know who should run your next outlet."],
];

const STEPS = [
  {
    title: "Answer 11 questions",
    body: "About your outlet, your systems, your team and your brand. Roughly 4 minutes.",
  },
  {
    title: "See your result straight away",
    body: "Your score range, your 7 areas, and your weakest point. No waiting.",
  },
  {
    title: "Keep it — a copy by email",
    body: "Your result is on screen the moment you finish, and a copy goes to the email you give us at the start.",
  },
];

const container = "mx-auto w-full max-w-[1200px] px-5 sm:px-8 xl:px-0";
const eyebrow = "text-brand-deep";
const monoCaps = "font-mono text-[11px] uppercase tracking-[0.25em]";

function StartAuditButton({ className = "" }: { className?: string }) {
  return (
    <Link
      href={START_AUDIT_HREF}
      className={`inline-flex h-14 items-center justify-center gap-3 rounded bg-cta px-9 text-sm font-bold tracking-[0.18em] text-ink uppercase transition-colors hover:bg-cta-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${className}`}
    >
      Start the audit
      <span aria-hidden="true" className="text-lg leading-none">
        →
      </span>
    </Link>
  );
}

function SampleReportLink() {
  return (
    <a
      href={SAMPLE_REPORT_HREF}
      target="_blank"
      rel="noopener noreferrer"
      className={`${monoCaps} border-b border-brand-deep pb-0.5 tracking-[0.2em] text-brand-deep hover:text-brand`}
    >
      See a sample report
    </a>
  );
}

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-white text-ink">
      {/* Hero */}
      <header className="bg-cream">
        <div className={`${container} pt-3 sm:pt-4`}>
          <Link href="/" aria-label="Corporate Culture home">
            <Logo />
          </Link>
        </div>
        <div
          className={`${container} grid items-center gap-10 pt-10 pb-12 md:grid-cols-[1.25fr_1fr] md:pt-12 md:pb-16`}
        >
          <div>
            <h1 className="text-[2.6rem] leading-[1.05] font-extrabold tracking-tight sm:text-5xl lg:text-[4rem]">
              Is your business ready to <span className="text-brand">franchise?</span>
            </h1>
            <p className="mt-8 text-lg leading-relaxed text-body sm:text-xl">
              11 questions. About 4 minutes. Free, with no signup.
            </p>
            <div className="mt-10 flex flex-col items-stretch gap-8 sm:flex-row sm:items-center">
              <StartAuditButton />
              <div className="text-center sm:text-left">
                <SampleReportLink />
              </div>
            </div>
          </div>
          <HeroIllustration className="mx-auto w-full max-w-[320px] md:max-w-[440px]" />
        </div>
      </header>

      <main>
        {/* What you get */}
        <section className={`${container} py-16 md:py-24`}>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className={eyebrow}>What you get</p>
              <h2 className="mt-1 text-3xl leading-tight font-extrabold md:text-[2.5rem]">
                A clear picture of
                <br />
                where you stand.
              </h2>
            </div>
            <p className="max-w-[420px] text-lg leading-relaxed text-body md:text-base md:leading-[1.8]">
              Your answers turn into a one-page snapshot. Here is what a founder receives.
            </p>
          </div>

          <div className="mt-10 overflow-hidden rounded-lg border border-black/10 md:mt-12">
            <div className="flex flex-col items-start gap-3 bg-cream px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-8">
              <span className={`${monoCaps} text-muted`}>Franchise readiness snapshot</span>
              <span
                className={`${monoCaps} rounded-full border border-brand-deep px-3 py-1 text-[10px] text-brand-deep`}
              >
                Illustrative example
              </span>
            </div>

            <div className="grid md:grid-cols-[440px_1fr]">
              <div className="border-black/10 px-5 py-8 md:border-r md:px-10 md:py-10">
                <p className="text-[13px] font-bold tracking-[0.18em] text-muted uppercase">
                  Readiness range
                </p>
                <p className="mt-2 text-7xl font-black tracking-tight text-brand">54 – 71</p>
                <div className="relative mt-6 h-2.5 rounded-full bg-sand" aria-hidden="true">
                  <div className="absolute inset-y-0 left-[54%] w-[17%] rounded-full bg-brand" />
                </div>
                <div className="mt-3 flex justify-between text-sm text-muted">
                  <span>Not ready</span>
                  <span>Ready to scale</span>
                </div>
                <p className="mt-6 leading-relaxed text-muted">
                  Always a range. 11 answers place you closely, not exactly.
                </p>
                <div className="mt-8 rounded-lg bg-peach px-6 py-6">
                  <p className={`${monoCaps} text-[10px] text-brand-deep`}>Weakest area</p>
                  <p className="mt-1 text-xl font-bold">Market Proof</p>
                  <p className="mt-2 leading-relaxed text-body">
                    Every sale so far comes from one city. There is no proof yet that the model
                    works where people don&rsquo;t already know you.
                  </p>
                </div>
              </div>

              <ul className="border-t border-black/10 px-5 py-4 md:border-t-0 md:px-7 md:py-4">
                {AREAS.map((area) => (
                  <li
                    key={area.name}
                    className={`flex items-center justify-between gap-4 border-b border-black/10 px-3.5 py-4 last:border-b-0 ${
                      area.weakest ? "rounded-md border-transparent bg-peach" : ""
                    }`}
                  >
                    <div>
                      <p className="text-[17px] font-bold">
                        {area.name}
                        {area.weakest ? (
                          <span className={`${monoCaps} ml-2 text-[10px] text-brand-deep`}>
                            Weakest
                          </span>
                        ) : null}
                      </p>
                      <p className="text-[15px] text-body">{area.question}</p>
                    </div>
                    <RatingPill rating={area.rating} />
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-black/10 bg-cream px-5 py-5 md:px-10">
              <p className="flex items-center gap-2 text-[13px] font-bold tracking-[0.18em] text-muted uppercase">
                <svg viewBox="0 0 16 16" className="size-4 text-ink" aria-hidden="true">
                  <path
                    d="M8 1.5 2.5 3.5v4c0 3.3 2.3 5.9 5.5 7 3.2-1.1 5.5-3.7 5.5-7v-4z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
                Legal check
              </p>
              <ul className="mt-2 flex flex-col gap-1 sm:flex-row sm:gap-10">
                <li className="flex items-center gap-2.5">
                  <span aria-hidden="true" className="font-bold text-[#c27a00]">
                    –
                  </span>
                  Trademark: filed, not yet registered
                </li>
                <li className="flex items-center gap-2.5">
                  <span aria-hidden="true" className="font-bold text-[#1b6b2f]">
                    ✓
                  </span>
                  Disputes: none declared
                </li>
              </ul>
            </div>
          </div>

          <p className="mt-8 leading-relaxed text-body">
            This is a sample result for a business that does not exist. Your own result will
            look like this, with your answers.
          </p>

          <ul className="mt-10 grid border-t border-black/10 text-body md:mt-14 md:grid-cols-4 md:border-t-0">
            {[
              "Where you stand across the 7 areas that decide a franchise",
              "Your weakest area named, with what it costs",
              "A legal check — trademark and disputes",
              "Things you can act on yourself, straight away",
            ].map((item) => (
              <li
                key={item}
                className="border-b border-black/10 py-4 leading-relaxed md:border-b-0 md:border-l md:px-7 md:py-0 md:first:border-l-0 md:first:pl-0"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Sample report */}
        <section className="bg-cream py-12 md:py-16">
          <div className={container}>
            <div className="grid items-center gap-8 rounded-lg border border-black/10 bg-white p-5 sm:p-8 md:grid-cols-[auto_1fr_auto] md:gap-14 md:px-12 md:py-10">
              <ReportThumbnail className="w-24 md:w-[120px]" />
              <div>
                <p className={eyebrow}>Sample report</p>
                <h2 className="mt-1 text-2xl leading-tight font-extrabold md:text-3xl">
                  Read a completed sample
                  <br className="hidden md:block" /> audit before you start.
                </h2>
                <p className="mt-3 leading-relaxed text-body">
                  A full result for a fictional business, every page as a founder receives it.
                  4 pages, PDF.
                </p>
              </div>
              <div className="text-center">
                <a
                  href={SAMPLE_REPORT_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-8 rounded border border-brand px-7 py-4 text-left text-sm leading-tight font-bold tracking-[0.18em] text-brand-deep uppercase transition-colors hover:bg-peach md:min-w-[300px]"
                >
                  Open the sample report
                  <span aria-hidden="true">↗</span>
                </a>
                <p className="mt-5 text-sm leading-relaxed text-body">
                  Opens straight away in a new tab.
                  <br />
                  No email, no form, nothing to sign up for.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className={`${container} py-16 md:py-24`}>
          <p className={eyebrow}>How it works</p>
          <h2 className="mt-1 text-3xl leading-tight font-extrabold md:text-[2.1rem]">
            3 steps. Nothing to prepare.
          </h2>
          <ol className="mt-10 grid gap-x-14 md:mt-12 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="border-t border-black/10 py-6 md:pb-0">
                <p className="text-4xl text-brand">{i + 1}</p>
                <h3 className="mt-3 text-xl font-bold">{step.title}</h3>
                <p className="mt-4 leading-relaxed text-body">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Founder */}
        <section className="bg-cream py-16 md:py-24">
          <div className={`${container} grid items-center gap-10 md:grid-cols-[400px_1fr] md:gap-20`}>
            <Image
              src={founderPhoto}
              alt="Ronak Patel, Founder of Corporate Culture"
              className="w-full rounded-lg"
              sizes="(min-width: 768px) 400px, 100vw"
              placeholder="blur"
            />
            <div>
              <p className="text-sm font-bold tracking-[0.18em] text-brand uppercase">
                Who conducts your audit
              </p>
              <h2 className="mt-3 text-5xl font-extrabold tracking-tight">Ronak Patel</h2>
              <p className="mt-3 text-lg text-body">Founder, Corporate Culture</p>
              <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8 border-b border-black/15 pb-8 lg:grid-cols-[auto_auto_auto_auto] lg:justify-between">
                {FOUNDER_STATS.map((stat) => (
                  <div key={stat.label} className="flex flex-col-reverse justify-end">
                    <dt className="mt-2 max-w-[9rem] text-[13px] font-bold tracking-[0.15em] text-muted uppercase">
                      {stat.label}
                    </dt>
                    <dd className="text-3xl font-extrabold whitespace-nowrap text-brand sm:text-4xl xl:text-5xl">
                      {stat.value}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-8 text-lg leading-[1.8] text-body md:px-9">
                Corporate Culture has worked with consumer brands across F&amp;B, retail,
                lifestyle, wellness and education — helping them scale with structure, funding
                access and long-term expansion clarity. The 7 areas in this assessment come from
                those engagements.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className={`${container} py-16 md:py-24`}>
          <p className={eyebrow}>Questions</p>
          <h2 className="mt-1 text-3xl leading-tight font-extrabold md:text-[2.5rem]">
            What is a Franchise Readiness Audit?
          </h2>
          <div className="mt-8 grid border-b border-black/10 md:mt-12 md:grid-cols-2 md:gap-x-20 md:border-b-0">
            <FaqItem question="What is a Franchise Readiness Audit?" defaultOpen>
              A structured assessment of whether a business can be franchised successfully. It
              measures 7 areas and produces a score, along with a separate legal and trademark
              check.
            </FaqItem>
            <FaqItem question="How is my score calculated?">
              Each of the 7 areas is weighted by how much it determines franchise success.
              Profit &amp; Payback and Systems carry the most weight, because they are what a
              franchise owner is actually buying: a model whose numbers work, and a system they
              can reproduce.
            </FaqItem>
            <FaqItem question="Why is my score a range and not one number?">
              11 questions can place you closely, not exactly. A range is honest about that. The
              Franchise Readiness Report asks 44 and gives you one number.
            </FaqItem>
            <FaqItem question="What do the 7 areas measure?">
              <ul className="flex flex-col gap-1.5">
                {AREA_MEANINGS.map(([name, meaning]) => (
                  <li key={name}>
                    <strong className="text-ink">{name}</strong> — {meaning}
                  </li>
                ))}
              </ul>
            </FaqItem>
            <FaqItem question="How long does it take?">About 4 minutes. No signup, no cost.</FaqItem>
            <FaqItem question="What happens to my answers?">
              They are used to produce your result and nothing else. They are never shared with
              any brand, investor or third party without your permission.
            </FaqItem>
            {/* Prices live only in "What does it cost?" (Content Library §19). */}
            <FaqItem question="What happens after the free audit?">
              <div className="space-y-3">
                <p>
                  Your Score gives you a range and shows which of the seven areas are strong and
                  which are not. If you want the exact number, the{" "}
                  <strong className="text-ink">Franchise Readiness Report</strong> gives you your
                  precise score and a written diagnosis of all seven areas, with your gaps ranked by
                  what each one costs you.
                </p>
                <p>
                  The <strong className="text-ink">Franchise Readiness Roadmap</strong> goes further
                  again — it works out what a franchise partner would actually earn from your
                  business and how long their money takes to come back, and it includes a call with
                  our team to talk it through.
                </p>
                <p>
                  See <strong className="text-ink">“What does it cost?”</strong> below for prices.
                </p>
              </div>
            </FaqItem>
            <FaqItem question="What does it cost?">
              <div className="space-y-3">
                <p>
                  The Franchise Readiness Audit is free — eleven questions, about 4 minutes, and your
                  Franchise Readiness Score appears on screen straight away.
                </p>
                <p>
                  The full <strong className="text-ink">Franchise Readiness Report</strong> is{" "}
                  <strong className="text-ink">{priceLabel("report")}</strong> ({payableLabel("report")}). About thirty
                  more questions, and you receive the report within 24 hours.
                </p>
                <p>
                  The <strong className="text-ink">Franchise Readiness Roadmap</strong> is{" "}
                  <strong className="text-ink">{priceLabel("roadmap")}</strong> ({payableLabel("roadmap")}). It picks up where
                  the Report stops, works through what a franchise partner would actually earn, and
                  includes a call with our team.
                </p>
                <p>
                  Each stage is priced on its own. Nothing is credited or adjusted if you move to the
                  next one.
                </p>
              </div>
            </FaqItem>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-black/10 bg-cream py-16 md:py-24">
          <div className={`${container} flex flex-col gap-10 md:flex-row md:items-center md:justify-between`}>
            <div className="max-w-[560px]">
              <h2 className="text-3xl leading-[1.1] font-extrabold tracking-tight md:text-5xl">
                Find out where you stand <span className="text-brand">in 4 minutes.</span>
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-body md:text-xl">
                11 questions. Free, no signup. Your result is on screen the moment you finish.
              </p>
            </div>
            <div className="flex flex-col items-stretch gap-7 text-center md:min-w-[262px] md:text-left">
              <StartAuditButton />
              <div>
                <SampleReportLink />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-ink py-12 text-white/80 md:py-14">
        <div className={container}>
          <div className="grid gap-10 md:grid-cols-[1fr_auto_auto] md:gap-16">
            <div>
              <Logo inverted />
              <p className="mt-4 text-lg">Franchise. Fund. Scale.</p>
            </div>
            <div>
              <p className="text-[13px] font-bold tracking-[0.18em] text-white/60 uppercase">
                Contact
              </p>
              <ul className="mt-4 flex flex-col gap-2 text-white">
                <li>
                  <a href={`mailto:${CONTACT_EMAIL}`} className="hover:underline">
                    {CONTACT_EMAIL}
                  </a>
                </li>
                <li>
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    WhatsApp {WHATSAPP_DISPLAY}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-[13px] font-bold tracking-[0.18em] text-white/60 uppercase">
                Registered address
              </p>
              <address className="mt-4 leading-relaxed text-white not-italic">
                Shivalaya Buildings, 16, Ethiraj Salai
                <br />
                Egmore, Chennai, Tamil Nadu 600008
              </address>
            </div>
          </div>
          <div className="mt-10 flex flex-col gap-6 border-t border-white/15 pt-8 text-sm md:flex-row md:items-center md:justify-between">
            <ul className="flex flex-wrap gap-x-6 gap-y-3">
              {["Privacy Policy", "Terms & Conditions", "Refund Policy", "Contact"].map((label) => (
                <li key={label}>
                  <a href="#" className="hover:text-white">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
            <p>
              © 2026 Corporate Culture. All rights reserved.
              <br />
              {BRAND_ENTITY_LINE}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
