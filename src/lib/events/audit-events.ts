/**
 * The questionnaire's events (Event-Log-Spec §4.2), with their timing kept
 * here rather than in the component: plain timestamps, subtracted — no timers.
 */
import { ALL_QUESTIONS, type Answers } from "../audit";
import { BASE_PATH } from "../base-path";
import { previousPage, track } from "./client";

/** Position of a question in the whole audit, 1-based. */
export function seqOf(code: string) {
  return ALL_QUESTIONS.findIndex((q) => q.id === code) + 1;
}

function entryOf(resumed: boolean) {
  if (resumed) return "resume";
  if (previousPage() === "/") return "landing_cta";
  try {
    // A full page load from the landing page (no in-app navigation).
    const from = document.referrer ? new URL(document.referrer) : null;
    if (from?.origin === location.origin && from.pathname.replace(/\/$/, "") === BASE_PATH) return "landing_cta";
  } catch {}
  return "direct";
}

export function createAuditEvents() {
  const startedAt = Date.now();
  let sectionAt = startedAt;
  let lastAnsweredAt = 0;
  let changes = 0;
  let lastCode: string | null = null;
  let startedSent = false;
  const answeredAt: Record<string, number> = {};

  return {
    started(resumed: boolean) {
      if (startedSent) return; // Once per visit, even if an effect re-runs.
      startedSent = true;
      track("audit_started", { entry: entryOf(resumed) });
    },

    /** `previous` is the label already chosen, if any; `section` is 1-based. */
    answered(code: string, label: string, previous: string | undefined, section: number) {
      if (previous === label) return;
      const now = Date.now();
      if (previous) {
        changes++;
        track("answer_changed", {
          code,
          from_label: previous,
          to_label: label,
          ms_since_answered: answeredAt[code] ? now - answeredAt[code] : null,
        });
      } else {
        track("question_answered", {
          code,
          section,
          seq: seqOf(code),
          label,
          ms_since_previous: lastAnsweredAt ? now - lastAnsweredAt : null,
          variant: "default",
        });
        lastAnsweredAt = now;
      }
      answeredAt[code] = now;
      lastCode = code;
    },

    sectionCompleted(section: number, questions: number) {
      track("section_completed", { section, questions, ms_in_section: Date.now() - sectionAt });
    },

    sectionEntered() {
      sectionAt = Date.now();
    },

    submitted(answers: Answers) {
      track("audit_submitted", {
        questions_answered: ALL_QUESTIONS.filter((q) => answers[q.id]).length,
        ms_total: Date.now() - startedAt,
        changes_made: changes,
      });
    },

    /** What page_exit reports if the founder leaves mid-audit. */
    exitContext(answers: Answers, furthestStep: number) {
      const answered = ALL_QUESTIONS.filter((q) => answers[q.id]);
      const code = lastCode ?? answered.at(-1)?.id ?? null;
      return {
        completed: false,
        last_question_code: code,
        last_question_seq: code ? seqOf(code) : null,
        questions_answered: answered.length,
        furthest_section: furthestStep + 1,
      };
    },
  };
}
