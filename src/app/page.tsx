import Link from "next/link";

const features = [
  {
    title: "Compliance Score",
    description:
      "Instantly see how ready your business is against franchisor legal, financial, and operational requirements.",
  },
  {
    title: "Financial Readiness",
    description:
      "Review capital requirements, cash flow projections, and funding gaps before you sign anything.",
  },
  {
    title: "Operational Checklist",
    description:
      "Track site, staffing, training, and systems readiness in one place, with nothing falling through the cracks.",
  },
  {
    title: "Actionable Report",
    description:
      "Get a clear, shareable audit report with prioritized next steps for you and your team.",
  },
];

const steps = [
  {
    number: "01",
    title: "Answer a guided questionnaire",
    description: "Cover legal, financial, and operational readiness in about 15 minutes.",
  },
  {
    number: "02",
    title: "Get your readiness score",
    description: "See exactly where you stand and which areas need attention first.",
  },
  {
    number: "03",
    title: "Follow your action plan",
    description: "Work through prioritized recommendations to close every gap before launch.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-black/[.08] dark:border-white/[.145]">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
          <span className="text-lg font-semibold tracking-tight text-black dark:text-zinc-50">
            Franchise Readiness Audit
          </span>
          <nav className="flex items-center gap-3 text-sm font-medium">
            <Link
              href="/login"
              className="text-zinc-700 hover:text-black dark:text-zinc-300 dark:hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="flex h-9 items-center justify-center rounded-full bg-foreground px-4 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-6 py-24 text-center">
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-black dark:text-zinc-50 sm:text-5xl">
            Know if you&apos;re ready to franchise before you commit
          </h1>
          <p className="max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Run a fast, structured audit of your legal, financial, and operational
            readiness &mdash; and get a clear action plan to close the gaps.
          </p>
          <div className="mt-2 flex flex-col gap-4 text-base font-medium sm:flex-row">
            <Link
              href="/register"
              className="flex h-12 items-center justify-center rounded-full bg-foreground px-6 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              Start your free audit
            </Link>
            <Link
              href="/login"
              className="flex h-12 items-center justify-center rounded-full border border-solid border-black/[.08] px-6 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
            >
              Sign in
            </Link>
          </div>
        </section>

        <section className="border-t border-black/[.08] bg-white py-20 dark:border-white/[.145] dark:bg-zinc-950">
          <div className="mx-auto w-full max-w-5xl px-6">
            <h2 className="text-center text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
              Everything you need to assess readiness
            </h2>
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-black/[.08] bg-zinc-50 p-6 dark:border-white/[.145] dark:bg-black"
                >
                  <h3 className="text-base font-semibold text-black dark:text-zinc-50">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto w-full max-w-5xl px-6">
            <h2 className="text-center text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
              How it works
            </h2>
            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
              {steps.map((step) => (
                <div key={step.number} className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-zinc-400 dark:text-zinc-600">
                    {step.number}
                  </span>
                  <h3 className="text-base font-semibold text-black dark:text-zinc-50">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-black/[.08] bg-white py-20 dark:border-white/[.145] dark:bg-zinc-950">
          <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-6 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
              Ready to see where you stand?
            </h2>
            <p className="max-w-md text-base leading-7 text-zinc-600 dark:text-zinc-400">
              It takes about 15 minutes and gives you a clear picture of your franchise readiness.
            </p>
            <Link
              href="/register"
              className="flex h-12 items-center justify-center rounded-full bg-foreground px-6 text-base font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              Start your free audit
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/[.08] py-8 dark:border-white/[.145]">
        <div className="mx-auto w-full max-w-5xl px-6 text-center text-sm text-zinc-500 dark:text-zinc-500">
          © {new Date().getFullYear()} Franchise Readiness Audit
        </div>
      </footer>
    </div>
  );
}
