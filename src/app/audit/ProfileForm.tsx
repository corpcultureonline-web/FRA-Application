import type { ReactNode } from "react";
import { CATEGORIES, OUTLET_BANDS, profileProblems, type Profile } from "@/lib/audit";

const fieldClass =
  "h-[52px] w-full rounded-md border bg-white px-4 text-[17px] text-ink outline-none transition-colors focus:border-ink focus:ring-1 focus:ring-ink";

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="text-[16px] font-bold">
        {label}
      </label>
      {hint ? <p className="mt-1 text-[15px] font-semibold text-muted">{hint}</p> : null}
      <div className="mt-2.5">{children}</div>
      {error ? <p className="mt-1.5 text-sm text-brand-deep">{error}</p> : null}
    </div>
  );
}

export function ProfileForm({
  profile,
  showErrors,
  onChange,
}: {
  profile: Profile;
  showErrors: boolean;
  onChange: (profile: Profile) => void;
}) {
  const problems = showErrors ? profileProblems(profile) : [];
  const has = (field: keyof Profile) => problems.includes(field);
  const border = (field: keyof Profile) => (has(field) ? "border-brand" : "border-black/20");
  const set = (field: keyof Profile) => (value: string) => onChange({ ...profile, [field]: value });

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-black/10 bg-white p-4 sm:p-6">
      <div className="grid gap-6 sm:grid-cols-2 sm:gap-5">
        <Field id="brandName" label="Brand name" error={has("brandName") ? "Enter your brand name." : undefined}>
          <input
            id="brandName"
            autoComplete="organization"
            value={profile.brandName}
            onChange={(e) => set("brandName")(e.target.value)}
            className={`${fieldClass} ${border("brandName")}`}
          />
        </Field>
        <Field id="founderName" label="Your name" error={has("founderName") ? "Enter your name." : undefined}>
          <input
            id="founderName"
            autoComplete="name"
            value={profile.founderName}
            onChange={(e) => set("founderName")(e.target.value)}
            className={`${fieldClass} ${border("founderName")}`}
          />
        </Field>
      </div>

      <Field
        id="email"
        label="Email"
        hint="We’ll send your result here. No spam, no account."
        error={has("email") ? "Enter a valid email address." : undefined}
      >
        <input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={profile.email}
          onChange={(e) => set("email")(e.target.value)}
          className={`${fieldClass} ${border("email")}`}
        />
      </Field>

      {/* T1Q-PHONE-* (Tier 1 Questionnaire v1.1): mandatory, below Email. The WHY line must not be
          shortened. This is T1Q-PHONE-WHY, "until WhatsApp ships"; T1Q-PHONE-WHY-WA replaces it the
          day WhatsApp delivery goes live, with Privacy v1.7 (T177). */}
      <Field
        id="phone"
        label="Your WhatsApp number"
        hint="Your result comes to your email, and we may call this number once to talk through what it says."
        error={has("phone") ? "Enter a 10-digit mobile number." : undefined}
      >
        <div className="relative">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[17px] text-muted"
          >
            +91
          </span>
          <input
            id="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="98765 43210"
            maxLength={16}
            value={profile.phone}
            onChange={(e) => set("phone")(e.target.value)}
            className={`${fieldClass} ${border("phone")} pl-14 placeholder:text-muted/60`}
          />
        </div>
      </Field>

      <Field id="category" label="Category" error={has("category") ? "Choose a category." : undefined}>
        <div className="relative">
          <select
            id="category"
            value={profile.category}
            onChange={(e) => set("category")(e.target.value)}
            className={`${fieldClass} ${border("category")} appearance-none pr-12 ${profile.category ? "" : "text-muted"}`}
          >
            <option value="" disabled>
              Choose one
            </option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category} className="text-ink">
                {category}
              </option>
            ))}
          </select>
          <svg
            viewBox="0 0 20 20"
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-ink"
          >
            <path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
      </Field>

      <fieldset id="outlets">
        <legend className="text-[16px] font-bold">Number of outlets you run today</legend>
        <div className="mt-2.5 grid grid-cols-4 gap-2">
          {OUTLET_BANDS.map((band) => {
            const selected = profile.outlets === band;
            return (
              <label
                key={band}
                className={`flex h-[52px] cursor-pointer items-center justify-center rounded-md border text-[17px] font-bold transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink ${
                  selected ? "border-cta bg-cta" : `${border("outlets")} bg-white hover:border-ink/50`
                }`}
              >
                <input
                  type="radio"
                  name="outlets"
                  value={band}
                  checked={selected}
                  onChange={() => set("outlets")(band)}
                  className="sr-only"
                />
                {band}
              </label>
            );
          })}
        </div>
        {has("outlets") ? (
          <p className="mt-1.5 text-sm text-brand-deep">Choose how many outlets you run.</p>
        ) : null}
      </fieldset>

      <Field id="city" label="City" error={has("city") ? "Enter your city." : undefined}>
        <input
          id="city"
          autoComplete="address-level2"
          value={profile.city}
          onChange={(e) => set("city")(e.target.value)}
          className={`${fieldClass} ${border("city")}`}
        />
      </Field>
    </div>
  );
}
