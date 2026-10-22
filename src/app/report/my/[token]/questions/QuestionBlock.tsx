"use client";

import { useState } from "react";
import { marginFrom, parseNumber, type Answer, type Contradiction } from "@/lib/questionnaire/rules";
import type { Question } from "@/lib/questionnaire/source";
import styles from "./questionnaire.module.css";

/** Library strings with their **bold** markup, rendered as <b>. */
export function Marked({ text }: { text: string }) {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 === 1 ? <b key={i}>{part}</b> : part));
}

export const unmark = (text: string) => text.replace(/\*\*(.+?)\*\*/g, "$1");

const fill = (text: string, vars: Record<string, string>) =>
  text.replace(/\{(\w+)\}/g, (whole, name: string) => vars[name] ?? whole);

/** "640000" → "6,40,000" as he types; digits only. */
const rupees = (raw: string) => {
  const digits = raw.replace(/\D/g, "").slice(0, 12);
  return digits ? Number(digits).toLocaleString("en-IN") : "";
};

function Tick() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2.2 6.3l2.4 2.4 5.2-5.4" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Alert() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true" className={styles.alertIcon}>
      <circle cx="8" cy="8" r="6.5" stroke="#B8360F" strokeWidth="1.5" />
      <path d="M8 4.6v4.2" stroke="#B8360F" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="8" cy="11.2" r=".9" fill="#B8360F" />
    </svg>
  );
}

export type BlockCopy = {
  helpA11y: string;
  anchorNote: string;
  anchorNoteFl2: string;
  calcLink: string;
  calcRev: string;
  calcCost: string;
  calcCostNote: string;
  calcResult: string;
  contraHead: string;
  contraGo: string;
  contraLines: Record<Contradiction["key"], string>;
};

/**
 * One question: its stem, its `?` help note (inline, never a modal), its
 * options or number field, its escape answer where it has one (Field Help §2),
 * the EBITDA calculator on UE7 (T47), and any contradiction it completes.
 * Nothing here knows which answer scores better.
 */
export function QuestionBlock({
  question,
  answer,
  draft,
  help,
  belowNote,
  helpOpen,
  single,
  warnings,
  copy,
  onHelp,
  onAnswer,
  onDraft,
  onConfirm,
}: {
  question: Question;
  answer: Answer | undefined;
  /** The number field's text as typed, which may not be a valid answer yet. */
  draft: string;
  help: string | null;
  /** Shown when a whole number below the field's minimum is typed and it means something (MR5 = 1: T2V-MR5-ONE). */
  belowNote: string | null;
  helpOpen: boolean;
  /** The only question on the screen: its stem is the heading. */
  single: boolean;
  warnings: Contradiction[];
  copy: BlockCopy;
  onHelp: () => void;
  onAnswer: (answer: Answer | null) => void;
  onDraft: (text: string) => void;
  onConfirm: (warning: Contradiction) => void;
}) {
  const [calcOpen, setCalcOpen] = useState(false);
  const [revenue, setRevenue] = useState("");
  const [cost, setCost] = useState("");
  const id = `q-${question.code}`;
  const escaped = Boolean(answer?.escape);
  const anchored = question.type === "anchored";

  const choose = (option: number) => onAnswer({ option, number: null, escape: null, computed: false });

  const typeNumber = (text: string, computed = false) => {
    onDraft(text);
    const value = question.input ? parseNumber(text, question.input) : null;
    onAnswer(value === null ? null : { option: null, number: value, escape: null, computed });
  };

  const calculate = (rev: string, cst: string) => {
    const margin = marginFrom(Number(rev.replace(/\D/g, "")), Number(cst.replace(/\D/g, "")));
    if (margin !== null && rev && cst) typeNumber(String(margin), true);
  };
  const computedMargin = marginFrom(Number(revenue.replace(/\D/g, "")), Number(cost.replace(/\D/g, "")));

  const Heading = single ? "h1" : "h2";

  return (
    <div className={styles.block} role="group" aria-labelledby={`${id}-stem`}>
      <div className={styles.qrow}>
        <Heading id={`${id}-stem`} className={single ? styles.stem : styles.qt}>
          {question.stem}
        </Heading>
        {help && (
          <button
            type="button"
            className={styles.qh}
            aria-expanded={helpOpen}
            aria-controls={`${id}-help`}
            aria-label={copy.helpA11y}
            data-help-toggle
            onClick={onHelp}
          >
            <span aria-hidden="true">?</span>
          </button>
        )}
      </div>
      {help && helpOpen && (
        <p id={`${id}-help`} className={styles.qhelp} data-help-note>
          {help}
        </p>
      )}

      {anchored && <p className={styles.anote}>{question.code === "FL2" ? copy.anchorNoteFl2 : copy.anchorNote}</p>}

      {question.type === "num" && question.input && (
        <>
          <div className={`${styles.numf} ${escaped ? styles.numDim : ""}`}>
            <input
              id={`${id}-input`}
              type="text"
              inputMode={question.input.inputmode}
              autoComplete="off"
              aria-labelledby={`${id}-stem`}
              value={escaped ? "" : draft}
              onChange={(event) => typeNumber(event.target.value)}
            />
            {question.input.suffix && <span className={styles.suf}>{question.input.suffix}</span>}
          </div>
          {belowNote && !escaped && /^\s*-?\d+\s*$/.test(draft) && Number(draft) < question.input.min && (
            <p className={styles.belowNote} role="status">
              {belowNote}
            </p>
          )}

          {question.code === "UE7" && (
            <>
              <button
                type="button"
                className={styles.calcLink}
                aria-expanded={calcOpen}
                onClick={() => setCalcOpen((open) => !open)}
              >
                {unmark(copy.calcLink)}
              </button>
              {calcOpen && (
                <div className={styles.calc}>
                  <div>
                    <label htmlFor={`${id}-rev`}>{copy.calcRev}</label>
                    <div className={styles.numf}>
                      <span className={`${styles.suf} ${styles.pre}`}>₹</span>
                      <input
                        id={`${id}-rev`}
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        value={revenue}
                        onChange={(event) => {
                          const value = rupees(event.target.value);
                          setRevenue(value);
                          calculate(value, cost);
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor={`${id}-cost`}>{copy.calcCost}</label>
                    <p className={styles.calcNote}>{copy.calcCostNote}</p>
                    <div className={styles.numf}>
                      <span className={`${styles.suf} ${styles.pre}`}>₹</span>
                      <input
                        id={`${id}-cost`}
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        value={cost}
                        onChange={(event) => {
                          const value = rupees(event.target.value);
                          setCost(value);
                          calculate(revenue, value);
                        }}
                      />
                    </div>
                  </div>
                  {computedMargin !== null && revenue && cost && (
                    <p className={styles.calcResult} aria-live="polite">
                      <Marked text={fill(copy.calcResult, { n: String(computedMargin) })} />
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}

      {question.type === "tiles" && (
        <div
          className={styles.tiles}
          role="radiogroup"
          aria-labelledby={`${id}-stem`}
          style={{ gridTemplateColumns: `repeat(${question.options.length}, minmax(0, 1fr))` }}
        >
          {question.options.map((option, i) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={!escaped && answer?.option === i}
              className={styles.tile}
              onClick={() => choose(i)}
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {question.type === "list" && (
        <div className={styles.list} role="radiogroup" aria-labelledby={`${id}-stem`}>
          {question.options.map((option, i) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={answer?.option === i}
              className={styles.lopt}
              onClick={() => choose(i)}
            >
              <span>{option}</span>
              <span className={styles.ring} aria-hidden="true">
                {answer?.option === i && <Tick />}
              </span>
            </button>
          ))}
        </div>
      )}

      {anchored && (
        <div className={styles.cards} role="radiogroup" aria-labelledby={`${id}-stem`}>
          {question.options.map((option, i) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={answer?.option === i}
              className={styles.card4}
              onClick={() => choose(i)}
            >
              {option}
              <span className={styles.tick} aria-hidden="true">
                <Tick />
              </span>
            </button>
          ))}
        </div>
      )}

      {question.escape && (
        <button
          type="button"
          role="checkbox"
          aria-checked={escaped}
          className={styles.esc}
          onClick={() => {
            if (escaped) {
              onAnswer(null);
            } else {
              onDraft("");
              onAnswer({ option: null, number: null, escape: question.escape!.kind, computed: false });
            }
          }}
        >
          <span className={styles.escRing} aria-hidden="true">
            {escaped && <Tick />}
          </span>
          {question.escape.label}
        </button>
      )}

      {warnings.map((warning) => (
        <div key={warning.pair} className={styles.contra} role="status">
          <p className={styles.contraHead}>
            <Alert />
            <b>{unmark(copy.contraHead)}</b>
          </p>
          <p>{fill(copy.contraLines[warning.key], warning.vars)}</p>
          <button type="button" className={styles.contraGo} onClick={() => onConfirm(warning)}>
            {unmark(copy.contraGo)}
          </button>
        </div>
      ))}
    </div>
  );
}
