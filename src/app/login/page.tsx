"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setSubmitted(true);
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
          Sign in
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-zinc-950 underline underline-offset-2 dark:text-zinc-50"
          >
            Create one
          </Link>
        </p>

        {submitted ? (
          <p className="mt-8 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-300">
            Signed in successfully.
          </p>
        ) : (
          <form className="mt-8 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
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
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Password
                </label>
                <Link
                  href="#"
                  className="text-xs font-medium text-zinc-500 underline underline-offset-2 dark:text-zinc-400"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="rounded-lg border border-black/[.08] bg-white px-3 py-2 text-sm text-black outline-none focus:border-zinc-400 dark:border-white/[.145] dark:bg-black dark:text-zinc-50 dark:focus:border-zinc-500"
                placeholder="Enter your password"
              />
            </div>

            {error ? (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            ) : null}

            <button
              type="submit"
              className="mt-2 flex h-11 w-full items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              Sign in
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
