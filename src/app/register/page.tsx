"use client";

import Link from "next/link";
import { EntityLine } from "@/components/EntityLine";
import { useState, type FormEvent } from "react";

export default function RegisterPage() {
  const [brandName, setBrandName] = useState("");
  const [founderName, setFounderName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!brandName.trim() || !founderName.trim() || !email.trim() || !phone.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!/^[\d\s()+-]{7,}$/.test(phone.trim())) {
      setError("Please enter a valid phone number.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: brandName.trim(),
          founderName: founderName.trim(),
          email: email.trim(),
          phone: phone.trim(),
        }),
      });

      // An error page (404/500) is HTML, not JSON, so parse defensively —
      // otherwise the throw lands in the catch below and a routing problem is
      // reported as "cannot reach the server".
      let result: { error?: string } = {};
      try {
        result = (await response.json()) as { error?: string };
      } catch {
        result = {};
      }

      if (!response.ok) {
        setError(
          result.error ?? `Unable to submit your registration (HTTP ${response.status}).`,
        );
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-50 px-4 py-16 dark:bg-black">
      <Link
        href="/"
        className="text-lg font-semibold tracking-tight text-black dark:text-zinc-50"
      >
        Franchise Readiness Audit
      </Link>
      <div className="w-full max-w-sm rounded-2xl border border-black/[.08] bg-white p-8 shadow-sm dark:border-white/[.145] dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Create an account
        </h1>
        {submitted ? (
          <p className="mt-8 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-300">
            Thanks for registering. Your franchise readiness audit can now begin.
          </p>
        ) : (
          <form className="mt-8 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="brandName"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Brand Name
              </label>
              <input
                id="brandName"
                name="brandName"
                type="text"
                autoComplete="organization"
                value={brandName}
                onChange={(event) => setBrandName(event.target.value)}
                className="rounded-lg border border-black/[.08] bg-white px-3 py-2 text-sm text-black outline-none focus:border-zinc-400 dark:border-white/[.145] dark:bg-black dark:text-zinc-50 dark:focus:border-zinc-500"
                placeholder="Acme Coffee"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="founderName"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Founder Name
              </label>
              <input
                id="founderName"
                name="founderName"
                type="text"
                autoComplete="name"
                value={founderName}
                onChange={(event) => setFounderName(event.target.value)}
                className="rounded-lg border border-black/[.08] bg-white px-3 py-2 text-sm text-black outline-none focus:border-zinc-400 dark:border-white/[.145] dark:bg-black dark:text-zinc-50 dark:focus:border-zinc-500"
                placeholder="Jane Doe"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="rounded-lg border border-black/[.08] bg-white px-3 py-2 text-sm text-black outline-none focus:border-zinc-400 dark:border-white/[.145] dark:bg-black dark:text-zinc-50 dark:focus:border-zinc-500"
                placeholder="jane@example.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="phone"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="rounded-lg border border-black/[.08] bg-white px-3 py-2 text-sm text-black outline-none focus:border-zinc-400 dark:border-white/[.145] dark:bg-black dark:text-zinc-50 dark:focus:border-zinc-500"
                placeholder="+1 555 123 4567"
              />
            </div>

            {error ? (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex h-11 w-full items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              {isSubmitting ? "Submitting..." : "Create account"}
            </button>
          </form>
        )}
        <EntityLine className="mt-8 text-center" />
      </div>
    </div>
  );
}
