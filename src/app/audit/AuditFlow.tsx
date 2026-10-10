"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AuditHeader } from "@/components/AuditHeader";
import {
  EMPTY_PROFILE,
  PROFILE_SECTION,
  QUESTION_SECTIONS,
  SECTION_TITLES,
  isAnswered,
  profileProblems,
  type Answers,
  type Profile,
} from "@/lib/audit";
import { EntityLine } from "@/components/EntityLine";
import { RESULT_STORAGE_KEY, type SavedSubmission } from "@/lib/result";
import { withBasePath } from "@/lib/base-path";
import { createAuditEvents } from "@/lib/events/audit-events";
import { flushEvents, setExitContext } from "@/lib/events/client";
import type { PublicScore } from "@/lib/scoring/public";
import { useIsBrowser } from "@/lib/useIsBrowser";
import { ProfileForm } from "./ProfileForm";
import { QuestionCard } from "./QuestionCard";
import { Review } from "./Review";

const STORAGE_KEY = "fra-audit-progress";
const TOTAL_MINUTES = 4;
const SECTION_COUNT = SECTION_TITLES.length;
/** The "Check your answers" step comes after the last section. */
const REVIEW = SECTION_COUNT;

type Progress = {
  step: number;
  furthest: number;
  profile: Profile;
  answers: Answers;
};

const INITIAL_PROGRESS: Progress = {
  step: 0,
  furthest: 0,
  profile: EMPTY_PROFILE,
  answers: {},
};

function readSavedProgress(): Progress | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Partial<Progress>;
    const furthest = Math.min(Math.max(Number(saved.furthest) || 0, 0), REVIEW);
    return {
      step: Math.min(Math.max(Number(saved.step) || 0, 0), furthest),
      furthest,
      profile: { ...EMPTY_PROFILE, ...saved.profile },
      answers: { ...saved.answers },
    };
  } catch {
    return null;
  }
}

function minutesLeft(step: number) {
  const minutes = Math.max(1, Math.round((TOTAL_MINUTES * (SECTION_COUNT - step)) / SECTION_COUNT));
  return `About ${minutes} minute${minutes === 1 ? "" : "s"} left`;
}

/** How many inputs in a section still need an answer. */
function remainingIn(step: number, progress: Progress) {
  if (step === 0) return profileProblems(progress.profile).length;
  if (step === REVIEW) return 0;
  return QUESTION_SECTIONS[step - 1].questions.filter((q) => !isAnswered(q, progress.answers))
    .length;
}

/**
 * Saved progress lives in localStorage, which the server cannot read, so the
 * form renders only in the browser; the server sends just the page frame.
 */
export function AuditFlow() {
  const isBrowser = useIsBrowser();

  if (!isBrowser) {
    return (
      <div className="flex min-h-screen flex-1 flex-col bg-cream text-ink">
        <AuditHeader />
      </div>
    );
  }
  return <AuditSteps />;
}

function AuditSteps() {
  const router = useRouter();
  const [saved] = useState(readSavedProgress);
  const [progress, setProgress] = useState<Progress>(() => saved ?? INITIAL_PROGRESS);
  const [showErrors, setShowErrors] = useState(false);
  const [returnToReview, setReturnToReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // Private mode or blocked storage: the audit still works, it just won't resume.
    }
  }, [progress]);

  // Event log (Event-Log-Spec §4.2). Created once per visit to the questionnaire.
  const [events] = useState(createAuditEvents);
  const latest = useRef(progress);
  useEffect(() => {
    latest.current = progress;
  }, [progress]);

  useEffect(() => {
    events.started(Boolean(saved && Object.keys(saved.answers).length));
    return setExitContext(() => events.exitContext(latest.current.answers, latest.current.furthest));
  }, [events, saved]);

  const { step } = progress;
  const remaining = remainingIn(step, progress);
  const isReview = step === REVIEW;

  function goTo(next: number) {
    setShowErrors(false);
    setSubmitError(null);
    if (next === REVIEW) setReturnToReview(false);
    events.sectionEntered();
    void flushEvents();
    setProgress((p) => ({ ...p, step: next, furthest: Math.max(p.furthest, next) }));
    window.scrollTo({ top: 0 });
  }

  function editFromReview(section: number) {
    setReturnToReview(true);
    goTo(section);
  }

  function handleBack() {
    if (step === 0) {
      router.push("/");
    } else {
      goTo(step - 1);
    }
  }

  async function handleContinue() {
    if (remaining > 0) {
      setShowErrors(true);
      return;
    }
    if (!isReview) {
      events.sectionCompleted(step + 1, step === 0 ? 0 : QUESTION_SECTIONS[step - 1].questions.length);
      goTo(returnToReview ? REVIEW : step + 1);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    events.submitted(progress.answers);
    // Everything queued must be stored before scoring, so the backfill attaches it.
    await flushEvents();
    try {
      const response = await fetch(withBasePath("/api/audit"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: progress.profile, answers: progress.answers }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
        id?: number;
        score?: PublicScore;
        reportToken?: string;
      };
      if (!response.ok || !result.score) {
        setSubmitError(result.error ?? `Could not submit your answers (HTTP ${response.status}).`);
        return;
      }

      const submission: SavedSubmission = {
        version: 2,
        id: result.id,
        reportToken: result.reportToken,
        profile: progress.profile,
        answers: progress.answers,
        score: result.score,
        submittedAt: new Date().toISOString(),
      };
      try {
        window.localStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(submission));
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {}
      router.push(result.reportToken ? `/audit/report/${result.reportToken}` : "/audit/result");
    } catch {
      setSubmitError("Unable to reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const statusText = submitError
    ? submitError
    : isReview
      ? null
      : remaining === 0
        ? "All set — continue when you are ready"
        : step === 0
          ? `${remaining} more field${remaining === 1 ? "" : "s"} to fill in`
          : `Answer ${remaining} more question${remaining === 1 ? "" : "s"} to continue`;
  const statusIsError = Boolean(submitError) || (showErrors && remaining > 0);
  const section = step > 0 && !isReview ? QUESTION_SECTIONS[step - 1] : null;
  const continueLabel = isReview ? "See my result" : "Continue";

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-cream text-ink">
      <AuditHeader />

      <div className="mx-auto grid w-full max-w-[1066px] flex-1 px-5 pt-6 pb-60 sm:px-8 lg:grid-cols-[260px_1fr] lg:gap-x-[86px] lg:pt-14 lg:pb-20 xl:px-0">
        <aside className="hidden lg:block">
          <div className="sticky top-8">
            <p className="flex items-baseline justify-between text-[15px]">
              <span className="font-bold text-brand-deep">
                {isReview ? `All ${SECTION_COUNT} sections done` : `Section ${step + 1} of ${SECTION_COUNT}`}
              </span>
              {isReview ? null : <span className="text-[13px] text-muted">{minutesLeft(step)}</span>}
            </p>
            <div className="mt-2">
              <ProgressSegments step={step} />
            </div>
            <nav aria-label="Audit sections" className="mt-6">
              <ol className="flex flex-col gap-1.5">
                {SECTION_TITLES.map((title, i) => (
                  <li key={title}>
                    <SectionNavItem
                      marker={i + 1}
                      title={title}
                      state={
                        i === step
                          ? "current"
                          : i <= progress.furthest && remainingIn(i, progress) === 0
                            ? "done"
                            : "todo"
                      }
                      reachable={i <= progress.furthest}
                      onSelect={() => goTo(i)}
                    />
                  </li>
                ))}
                {progress.furthest === REVIEW ? (
                  <li>
                    <SectionNavItem
                      marker={null}
                      title="Check your answers"
                      state={isReview ? "current" : "todo"}
                      reachable
                      onSelect={() => goTo(REVIEW)}
                    />
                  </li>
                ) : null}
              </ol>
            </nav>
            <p className="mt-6 border-t border-black/10 pt-5">
              <SavedNote />
            </p>
          </div>
        </aside>

        <main>
          {isReview ? null : (
            <div className="lg:hidden">
              <p className="text-[15px] font-bold">
                <span className="text-brand-deep">
                  Section {step + 1} of {SECTION_COUNT}
                </span>{" "}
                · {SECTION_TITLES[step]}
              </p>
              <p className="text-sm text-muted">{minutesLeft(step)}</p>
              <div className="mt-2">
                <ProgressSegments step={step} />
              </div>
            </div>
          )}

          <h1
            className={`text-[2rem] leading-tight font-extrabold tracking-tight lg:mt-0 lg:text-[2.6rem] ${isReview ? "mt-2" : "mt-8"}`}
          >
            {isReview ? "Check your answers." : SECTION_TITLES[step]}
          </h1>
          <p className="mt-2 text-[17px] leading-relaxed text-body lg:text-base">
            {isReview
              ? "Change anything that doesn’t look right. This is the last step before your result."
              : (section?.intro ?? PROFILE_SECTION.intro)}
          </p>

          <div className="mt-6 lg:mt-8">
            {isReview ? (
              <Review profile={progress.profile} answers={progress.answers} onEdit={editFromReview} />
            ) : section ? (
              <div className="flex flex-col gap-6 lg:gap-7">
                {section.note ? (
                  <p className="flex items-start gap-3 rounded-lg bg-peach px-4 py-3.5 text-[15px] leading-relaxed sm:items-center sm:px-5">
                    <svg viewBox="0 0 20 20" aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand sm:mt-0">
                      <rect x="4" y="9" width="12" height="9" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M7 9V6.5a3 3 0 0 1 6 0V9" fill="none" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                    {section.note}
                  </p>
                ) : null}
                {section.questions.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    value={progress.answers[question.id]}
                    showError={showErrors}
                    onChange={(value) => {
                      events.answered(question.id, value, progress.answers[question.id], step + 1);
                      setProgress((p) => ({
                        ...p,
                        answers: { ...p.answers, [question.id]: value },
                      }));
                    }}
                  />
                ))}
              </div>
            ) : (
              <ProfileForm
                profile={progress.profile}
                showErrors={showErrors}
                onChange={(profile) => setProgress((p) => ({ ...p, profile }))}
              />
            )}
          </div>

          {/* Desktop actions */}
          <div className="mt-10 hidden items-center gap-3 border-t border-black/10 pt-6 lg:flex">
            <p
              role="status"
              className={`mr-auto text-[15px] ${statusIsError ? "text-brand-deep" : "text-muted"}`}
            >
              {statusText}
            </p>
            <BackButton onClick={handleBack} className="w-[140px]" />
            <ContinueButton
              onClick={handleContinue}
              label={continueLabel}
              submitting={submitting}
              className="w-[260px]"
            />
          </div>
          <EntityLine className="mt-12 pb-28 lg:pb-0" />
        </main>

        {/* Mobile actions */}
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-black/10 bg-white px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-6px_20px_rgba(0,0,0,0.05)] sm:px-8 lg:hidden">
          {statusText ? (
            <p
              className={`mb-3 text-center text-sm ${statusIsError ? "text-brand-deep" : "text-muted"}`}
              aria-hidden="true"
            >
              {statusText}
            </p>
          ) : null}
          <div className="grid grid-cols-[112px_1fr] gap-2.5">
            <BackButton onClick={handleBack} />
            <ContinueButton onClick={handleContinue} label={continueLabel} submitting={submitting} />
          </div>
          {isReview ? null : (
            <p className="mt-3 text-center">
              <SavedNote />
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function SavedNote() {
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-muted">
      <span aria-hidden="true" className="font-bold text-[#1b6b2f]">
        ✓
      </span>
      Your answers are saved as you go
    </span>
  );
}

function ProgressSegments({ step }: { step: number }) {
  return (
    <div aria-hidden="true">
      <div className="grid grid-cols-7 gap-1.5">
        {SECTION_TITLES.map((title, i) => (
          <span key={title} className={`h-[5px] rounded-full ${i <= step ? "bg-cta" : "bg-sand"}`} />
        ))}
      </div>
      <div className="mt-1.5 grid grid-cols-7 gap-1.5 text-center text-xs font-bold">
        {SECTION_TITLES.map((title, i) => (
          <span
            key={title}
            className={i === step ? "text-brand-deep" : i < step ? "text-ink" : "text-muted/80"}
          >
            {i + 1}
          </span>
        ))}
      </div>
    </div>
  );
}

function SectionNavItem({
  marker,
  title,
  state,
  reachable,
  onSelect,
}: {
  /** Section number, or null for an unnumbered ring (the review step). */
  marker: number | null;
  title: string;
  state: "current" | "done" | "todo";
  reachable: boolean;
  onSelect: () => void;
}) {
  const badge =
    state === "done" ? (
      <span className="flex size-6 items-center justify-center rounded-full bg-ink text-xs font-bold text-cta">
        ✓
      </span>
    ) : (
      <span
        className={`flex size-6 items-center justify-center rounded-full border-2 text-xs font-bold ${
          state === "current" ? "border-cta text-ink" : "border-black/15 text-muted"
        }`}
      >
        {marker}
      </span>
    );

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!reachable || state === "current"}
      aria-current={state === "current" ? "step" : undefined}
      className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-[16px] ${
        state === "current"
          ? "bg-white font-bold"
          : state === "done"
            ? "text-ink hover:bg-white/60"
            : "text-body"
      } ${reachable && state !== "current" ? "cursor-pointer" : "cursor-default"}`}
    >
      {badge}
      {title}
    </button>
  );
}

function BackButton({ onClick, className = "" }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-[52px] items-center justify-center gap-3 rounded-md border border-ink/70 bg-white text-sm font-bold tracking-[0.18em] uppercase hover:bg-cream ${className}`}
    >
      <span aria-hidden="true" className="text-lg leading-none">
        ←
      </span>
      Back
    </button>
  );
}

function ContinueButton({
  onClick,
  label,
  submitting,
  className = "",
}: {
  onClick: () => void;
  label: string;
  submitting: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={submitting}
      className={`flex h-[52px] items-center justify-center gap-3 rounded-md bg-cta text-sm font-bold tracking-[0.18em] uppercase transition-colors hover:bg-cta-hover disabled:opacity-70 ${className}`}
    >
      {submitting ? "Submitting…" : label}
      <span aria-hidden="true" className="text-lg leading-none">
        →
      </span>
    </button>
  );
}
