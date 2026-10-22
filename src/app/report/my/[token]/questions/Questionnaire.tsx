"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import logo from "@/assets/logo.png";
import { withBasePath } from "@/lib/base-path";
import { contradictions, isAnswered, type Answer, type Answers, type Contradiction, type ContradictionPair } from "@/lib/questionnaire/rules";
import type { Questionnaire as QuestionnaireData, Question } from "@/lib/questionnaire/source";
import { Marked, QuestionBlock, unmark, type BlockCopy } from "./QuestionBlock";
import styles from "./questionnaire.module.css";

export type QuestionnaireCopy = Record<
  | "T2Q-PROGRESS" | "T2Q-SAVED" | "T2Q-BACK" | "T2Q-NEXT" | "T2Q-FINISH" | "T2Q-LEGAL-NOTE" | "T2Q-RESUME-NOTE"
  | "T2Q-SAVEFAIL" | "T2Q-HELP-LINK" | "T2Q-ANCHOR-NOTE" | "T2Q-ANCHOR-NOTE-FL2" | "T2Q-REMAIN" | "T2Q-REMAIN-ONE"
  | "T2Q-ALLSET" | "T2Q-REVIEW-HEAD" | "T2Q-REVIEW-SUB" | "T2Q-REVIEW-EDIT" | "T2Q-REVIEW-BACK" | "T2Q-HELP-A11Y"
  | "T2H-UE7-CALC-LINK" | "T2H-UE7-CALC-REV" | "T2H-UE7-CALC-COST" | "T2H-UE7-CALC-COST-NOTE" | "T2H-UE7-CALC-RESULT"
  | "T2V-CONTRADICT" | "T2V-CONTRADICT-GO" | "T2V-CONTRA-FL" | "T2V-CONTRA-UE" | "T2V-CONTRA-BP" | "T2V-CONTRA-MARGIN"
  | "T2C-ENTITY",
  string
>;

type Place = number | "review";

/** A save waiting to reach the server, newest answer per question. */
type Pending = { answer: Answer; helpOpened: boolean; msSincePrevious: number | null };

const RETRY_MS = [2000, 4000, 8000, 15000];
/** Typing in a number field saves once he pauses, not on every key. */
const NUMBER_DEBOUNCE_MS = 700;

function Arrow({ back = false }: { back?: boolean }) {
  return (
    <svg width="16" height="11" viewBox="0 0 18 12" fill="none" aria-hidden="true" style={back ? { transform: "scaleX(-1)" } : undefined}>
      <path d="M1 6h15M11 1l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M8 2h4v4M12 2L6.5 7.5M10.5 8.5V12H2V3.5h3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** How an answer reads on the review screen: the option's words, the figure, or the escape. */
function answerText(question: Question, answer: Answer | undefined) {
  if (!answer) return "";
  if (answer.escape) return question.escape?.label ?? "";
  if (question.type === "num") {
    const suffix = question.input?.suffix;
    return answer.number === null ? "" : suffix === "%" ? `${answer.number}%` : suffix ? `${answer.number} ${suffix}` : String(answer.number);
  }
  return answer.option === null ? "" : question.options[answer.option];
}

/**
 * Screen 4. Answers save to the server one by one as they are given (T32); a
 * failed save retries quietly and never blocks the next question. Next stays
 * unavailable until the sub-screen is answered (T43), with the counter saying
 * why. The review screen ends it, and only there can he Finish and send (T51).
 */
export function Questionnaire({
  token,
  questionnaire,
  initialAnswers,
  confirmed: initialConfirmed,
  auditMargin,
  start,
  copy,
  help,
  belowNotes,
}: {
  token: string;
  questionnaire: QuestionnaireData;
  initialAnswers: Answers;
  confirmed: ContradictionPair[];
  auditMargin: string | null;
  start: Place;
  copy: QuestionnaireCopy;
  help: Record<string, string>;
  /** Field Help's below-range notes by question code (MR5: T2V-MR5-ONE). */
  belowNotes: Record<string, string>;
}) {
  const { questions, screens, sections } = questionnaire;
  const byCode = useMemo(() => new Map(questions.map((q) => [q.code, q])), [questions]);

  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      Object.entries(initialAnswers).flatMap(([code, answer]) =>
        answer && answer.number !== null && !answer.escape ? [[code, String(answer.number)]] : [],
      ),
    ),
  );
  const [place, setPlace] = useState<Place>(start);
  /** Arrived on this sub-screen from Edit on the review screen. */
  const [fromReview, setFromReview] = useState(false);
  const [openHelp, setOpenHelp] = useState<string | null>(null);
  const [helpOpened, setHelpOpened] = useState<Set<string>>(() => new Set());
  const [confirmed, setConfirmed] = useState<Set<ContradictionPair>>(() => new Set(initialConfirmed));
  const [savedVisible, setSavedVisible] = useState(false);
  const [failing, setFailing] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const pending = useRef(new Map<string, Pending>());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const attempts = useRef(0);
  const inFlight = useRef<Promise<void> | null>(null);
  const lastAnsweredAt = useRef<number | null>(null);
  const startedAt = useRef<number | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Warnings on screen, with when they were first shown, to log the outcome. */
  const shownWarnings = useRef(new Map<ContradictionPair, number>());

  const showSaved = useCallback(() => {
    setSavedVisible(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSavedVisible(false), 2200);
  }, []);

  /** Sends every waiting save; on failure, retries with backoff and shows the quiet strip. */
  const flush = useCallback(async (): Promise<void> => {
    if (inFlight.current) return inFlight.current;
    const run = (async () => {
      while (pending.current.size) {
        const [code, item] = pending.current.entries().next().value as [string, Pending];
        let ok = false;
        try {
          const response = await fetch(withBasePath(`/api/runs/${token}/answers`), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code,
              ...item.answer,
              help_opened: item.helpOpened,
              ms_since_previous: item.msSincePrevious,
            }),
            keepalive: true,
          });
          // 409: already submitted elsewhere. 400: the server refused this
          // answer. Neither will succeed on retry.
          ok = response.ok || response.status === 400 || response.status === 409;
          if (response.status === 409) window.location.assign(withBasePath(`/report/my/${token}`));
        } catch {
          ok = false;
        }
        if (!ok) {
          setFailing(true);
          const wait = RETRY_MS[Math.min(attempts.current, RETRY_MS.length - 1)];
          attempts.current += 1;
          await new Promise((resolve) => setTimeout(resolve, wait));
          continue;
        }
        // A newer answer for the same question may have arrived meanwhile.
        if (pending.current.get(code) === item) pending.current.delete(code);
        attempts.current = 0;
        setFailing(false);
        showSaved();
      }
    })();
    inFlight.current = run.finally(() => {
      inFlight.current = null;
    });
    return inFlight.current;
  }, [token, showSaved]);

  const queueSave = useCallback(
    (code: string, answer: Answer, delay = 0) => {
      const now = Date.now();
      pending.current.set(code, {
        answer,
        helpOpened: helpOpened.has(code),
        msSincePrevious: lastAnsweredAt.current === null ? null : now - lastAnsweredAt.current,
      });
      lastAnsweredAt.current = now;
      const existing = timers.current.get(code);
      if (existing) clearTimeout(existing);
      timers.current.set(
        code,
        setTimeout(() => {
          timers.current.delete(code);
          void flush();
        }, delay),
      );
    },
    [flush, helpOpened],
  );

  /** Sends anything still waiting on a debounce, and waits for the queue to empty. */
  const flushNow = useCallback(async () => {
    for (const [code, timer] of timers.current) {
      clearTimeout(timer);
      timers.current.delete(code);
    }
    await flush();
  }, [flush]);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  // Leaving the page: send what is queued (keepalive survives the unload).
  useEffect(() => {
    const leave = () => {
      if (document.visibilityState === "hidden") void flushNow();
    };
    document.addEventListener("visibilitychange", leave);
    return () => document.removeEventListener("visibilitychange", leave);
  }, [flushNow]);

  // "Closed by tapping anywhere" (Field Help §4).
  useEffect(() => {
    if (!openHelp) return;
    const close = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-help-toggle]") && !target.closest("[data-help-note]")) setOpenHelp(null);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [openHelp]);

  // Keep the place in the address, so reload and Back land where he is.
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("s", String(place));
    window.history.replaceState(null, "", url);
    window.scrollTo(0, 0);
  }, [place]);

  const setAnswer = (code: string, answer: Answer | null, delay = 0) => {
    setAnswers((current) => ({ ...current, [code]: answer ?? undefined }));
    if (answer) queueSave(code, answer, delay);
  };

  // Contradictions: shown under the question that completes the pair, until
  // he confirms it ("proceeded") or changes an answer so it no longer holds ("amended").
  const live = useMemo(() => contradictions(questions, answers, auditMargin), [questions, answers, auditMargin]);
  const visible = live.filter((c) => !confirmed.has(c.pair));
  const screenCodes = place === "review" ? [] : screens[place].codes;
  const onScreen = visible.filter((c) => screenCodes.includes(c.under));

  useEffect(() => {
    const now = Date.now();
    for (const warning of onScreen) if (!shownWarnings.current.has(warning.pair)) shownWarnings.current.set(warning.pair, now);
    for (const [pair, shownAt] of shownWarnings.current) {
      if (!live.some((c) => c.pair === pair)) {
        shownWarnings.current.delete(pair);
        void flushNow().then(() =>
          fetch(withBasePath(`/api/runs/${token}/contradiction`), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pair, outcome: "amended", ms_shown: Date.now() - shownAt }),
          }).catch(() => {}),
        );
      }
    }
  }, [onScreen, live, token, flushNow]);

  const confirm = async (warning: Contradiction) => {
    setConfirmed((current) => new Set(current).add(warning.pair));
    const shownAt = shownWarnings.current.get(warning.pair) ?? Date.now();
    shownWarnings.current.delete(warning.pair);
    await flushNow();
    await fetch(withBasePath(`/api/runs/${token}/contradiction`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pair: warning.pair, outcome: "proceeded", ms_shown: Date.now() - shownAt }),
    }).catch(() => {});
  };

  const openHelpPage = () => {
    const from = screenCodes[0] ?? questions[0].code;
    navigator.sendBeacon?.(withBasePath(`/api/runs/${token}/help`), JSON.stringify({ from_code: from }));
  };

  const blockCopy: BlockCopy = {
    helpA11y: unmark(copy["T2Q-HELP-A11Y"]),
    anchorNote: unmark(copy["T2Q-ANCHOR-NOTE"]),
    anchorNoteFl2: unmark(copy["T2Q-ANCHOR-NOTE-FL2"]),
    calcLink: copy["T2H-UE7-CALC-LINK"],
    calcRev: unmark(copy["T2H-UE7-CALC-REV"]),
    calcCost: unmark(copy["T2H-UE7-CALC-COST"]),
    calcCostNote: unmark(copy["T2H-UE7-CALC-COST-NOTE"]),
    calcResult: copy["T2H-UE7-CALC-RESULT"],
    contraHead: copy["T2V-CONTRADICT"],
    contraGo: copy["T2V-CONTRADICT-GO"],
    contraLines: {
      "T2V-CONTRA-FL": unmark(copy["T2V-CONTRA-FL"]),
      "T2V-CONTRA-UE": unmark(copy["T2V-CONTRA-UE"]),
      "T2V-CONTRA-BP": unmark(copy["T2V-CONTRA-BP"]),
      "T2V-CONTRA-MARGIN": unmark(copy["T2V-CONTRA-MARGIN"]),
    },
  };

  const header = (
    <header className={styles.bar}>
      <Image src={logo} alt="Corporate Culture" unoptimized priority className={styles.logo} />
      <span className={`${styles.saved} ${savedVisible ? "" : styles.savedHidden}`} role="status" aria-live="polite">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <circle cx="7" cy="7" r="7" fill="#231F20" />
          <path d="M4 7.2l2 2 4-4.2" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {savedVisible ? unmark(copy["T2Q-SAVED"]) : ""}
      </span>
    </header>
  );

  const helpLink = (
    <a className={styles.hlink} href={withBasePath("/report/help")} target="_blank" rel="noopener" onClick={openHelpPage}>
      {unmark(copy["T2Q-HELP-LINK"])}
      <ExternalIcon />
    </a>
  );

  // ---------- Review screen (T51) ----------
  if (place === "review") {
    const finish = async () => {
      if (finishing) return;
      setFinishing(true);
      await flushNow();
      try {
        const response = await fetch(withBasePath(`/api/runs/${token}/submit`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ms_total: startedAt.current === null ? null : Date.now() - startedAt.current }),
        });
        const body = (await response.json()) as { next?: string; missing?: string[] };
        if (response.ok && body.next) {
          window.location.assign(body.next);
          return;
        }
        // Something is unanswered on the server: take him to it.
        const missing = body.missing?.[0];
        const screen = missing ? screens.findIndex((s) => s.codes.includes(missing)) : -1;
        if (screen >= 0) setPlace(screen);
      } catch {
        setFailing(true);
      }
      setFinishing(false);
    };

    return (
      <div className={styles.page}>
        {header}
        {failing && <SaveFail text={unmark(copy["T2Q-SAVEFAIL"])} />}
        <main className={styles.main}>
          <div className={`${styles.card} ${styles.review}`}>
            <div className={styles.reviewIntro}>
              <h1 className={styles.reviewHead}>{unmark(copy["T2Q-REVIEW-HEAD"])}</h1>
              <p className={styles.reviewSub}>{unmark(copy["T2Q-REVIEW-SUB"])}</p>
            </div>
            {sections.map((section) => (
              <section key={section.number} className={styles.rvGroup} aria-labelledby={`rv-${section.number}`}>
                <h2 id={`rv-${section.number}`}>
                  <span className={styles.rvN}>{section.number}</span>
                  {section.name}
                </h2>
                {questions
                  .filter((question) => question.section === section.number)
                  .map((question) => (
                    <div key={question.code} className={styles.rvRow}>
                      <p className={styles.rvQ}>{question.stem}</p>
                      <p className={`${styles.rvA} ${question.type === "anchored" ? styles.rvLong : ""}`}>
                        {answerText(question, answers[question.code])}
                      </p>
                      <button
                        type="button"
                        className={styles.rvE}
                        aria-label={`${unmark(copy["T2Q-REVIEW-EDIT"])}: ${question.stem}`}
                        onClick={() => {
                          setFromReview(true);
                          setPlace(screens.findIndex((s) => s.codes.includes(question.code)));
                        }}
                      >
                        {unmark(copy["T2Q-REVIEW-EDIT"])}
                      </button>
                    </div>
                  ))}
              </section>
            ))}
            {helpLink}
            <p className={styles.entity}>{unmark(copy["T2C-ENTITY"])}</p>
            <div className={styles.acts}>
              <button type="button" className={`${styles.btn} ${styles.ghost}`} onClick={() => setPlace(screens.length - 1)}>
                <Arrow back />
                {unmark(copy["T2Q-BACK"])}
              </button>
              <button type="button" className={styles.btn} onClick={finish} aria-busy={finishing}>
                {unmark(copy["T2Q-FINISH"])}
                <Arrow />
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ---------- A sub-screen ----------
  const screen = screens[place];
  const section = sections[screen.section - 1];
  const sectionScreens = screens.map((s, i) => [s, i] as const).filter(([s]) => s.section === screen.section);
  const pip = sectionScreens.findIndex(([, i]) => i === place);
  const screenQuestions = screen.codes.map((code) => byCode.get(code)!);
  const remaining = screenQuestions.filter((q) => !isAnswered(q, answers[q.code])).length;
  const complete = remaining === 0;
  const single = screenQuestions.length === 1;

  const counter =
    remaining === 0
      ? unmark(copy["T2Q-ALLSET"])
      : remaining === 1
        ? unmark(copy["T2Q-REMAIN-ONE"])
        : unmark(copy["T2Q-REMAIN"]).replace("{n}", String(remaining));

  const next = () => {
    if (!complete) return;
    void flushNow();
    if (fromReview) {
      setFromReview(false);
      setPlace("review");
    } else {
      setPlace(place + 1 < screens.length ? place + 1 : "review");
    }
  };

  return (
    <div className={styles.page}>
      {header}
      <main className={styles.main}>
        <div className={styles.card}>
          <div className={styles.prog}>
            <p className={styles.lbl}>
              <span>
                <b>{unmark(copy["T2Q-PROGRESS"]).replace("{n}", String(screen.section))}</b>
                {" · "}
                <span className={styles.nm}>{section.name}</span>
              </span>
              {sectionScreens.length > 1 && (
                <span className={styles.pips} aria-hidden="true">
                  {sectionScreens.map(([, i], n) => (
                    <i key={i} className={n <= pip ? styles.pipOn : ""} />
                  ))}
                </span>
              )}
            </p>
            <div className={styles.seg} aria-hidden="true">
              {sections.map((s) => (
                <i key={s.number} className={s.number < screen.section ? styles.done : s.number === screen.section ? styles.cur : ""} />
              ))}
            </div>
          </div>
          {failing && <SaveFail text={unmark(copy["T2Q-SAVEFAIL"])} />}

          <div className={styles.body}>
            {place === 0 && (
              <p className={`${styles.note} ${styles.noteLine}`}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <circle cx="7" cy="7" r="7" fill="#231F20" />
                  <path d="M4 7.2l2 2 4-4.2" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {unmark(copy["T2Q-RESUME-NOTE"])}
              </p>
            )}
            {screen.section === 8 && (
              <p className={styles.note}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <rect x="2.5" y="7" width="11" height="7.5" rx="1.5" stroke="#231F20" strokeWidth="1.5" />
                  <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="#231F20" strokeWidth="1.5" />
                </svg>
                {unmark(copy["T2Q-LEGAL-NOTE"])}
              </p>
            )}

            {screenQuestions.map((question) => (
              <QuestionBlock
                key={question.code}
                question={question}
                answer={answers[question.code]}
                draft={drafts[question.code] ?? ""}
                help={help[question.code] ?? null}
                belowNote={belowNotes[question.code] ?? null}
                helpOpen={openHelp === question.code}
                single={single}
                warnings={onScreen.filter((c) => c.under === question.code)}
                copy={blockCopy}
                onHelp={() => {
                  setOpenHelp((open) => (open === question.code ? null : question.code));
                  setHelpOpened((current) => new Set(current).add(question.code));
                }}
                onAnswer={(answer) => setAnswer(question.code, answer, question.type === "num" && answer && !answer.escape ? NUMBER_DEBOUNCE_MS : 0)}
                onDraft={(text) => setDrafts((current) => ({ ...current, [question.code]: text }))}
                onConfirm={confirm}
              />
            ))}

            <div className={styles.helpRow}>{helpLink}</div>
          </div>

          <div className={styles.acts}>
            <p className={styles.cnt} aria-live="polite">
              {counter}
            </p>
            {fromReview ? (
              <button type="button" className={`${styles.btn} ${styles.full} ${complete ? "" : styles.off}`} aria-disabled={!complete} onClick={next}>
                <Marked text={unmark(copy["T2Q-REVIEW-BACK"])} />
                <Arrow />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.ghost}`}
                  onClick={() => {
                    void flushNow();
                    if (place === 0) window.location.assign(withBasePath(`/report/my/${token}`));
                    else setPlace(place - 1);
                  }}
                >
                  <Arrow back />
                  {unmark(copy["T2Q-BACK"])}
                </button>
                <button type="button" className={`${styles.btn} ${complete ? "" : styles.off}`} aria-disabled={!complete} onClick={next}>
                  {unmark(copy["T2Q-NEXT"])}
                  <Arrow />
                </button>
              </>
            )}
          </div>
        </div>
        <div className={styles.helpBelow}>{helpLink}</div>
      </main>
    </div>
  );
}

function SaveFail({ text }: { text: string }) {
  return (
    <p className={styles.fail} role="status">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="6.5" stroke="#B8360F" strokeWidth="1.5" />
        <path d="M8 4.6v4.2" stroke="#B8360F" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="8" cy="11.2" r=".9" fill="#B8360F" />
      </svg>
      {text}
    </p>
  );
}
