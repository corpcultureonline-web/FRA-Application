"use client";

import { useEffect } from "react";

/** Submits the sign-in form once the page has run in a real browser (scanners do not run scripts). */
export function AutoSubmit({ form }: { form: string }) {
  useEffect(() => {
    (document.getElementById(form) as HTMLFormElement | null)?.requestSubmit();
  }, [form]);
  return null;
}
