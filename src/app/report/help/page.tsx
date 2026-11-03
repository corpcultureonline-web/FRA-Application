import { readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Image from "next/image";
import logo from "@/assets/logo.png";
import { Rich } from "@/components/Rich";
import { parseEscapeRows, parseHelpHeadings } from "@/lib/questionnaire/help-page";
import { getQuestionnaire } from "@/lib/questionnaire/store";
import { plain } from "@/lib/tier2/library";
import { t2 } from "@/lib/tier2/strings";
import styles from "./help.module.css";

export const dynamic = "force-static";

export const metadata: Metadata = { title: plain(t2("T2HP-HEAD")) };

/**
 * The help page (Help Page library v1.3), opened in a new tab from beneath
 * every questionnaire sub-screen. It explains what to measure and never how
 * answers score; it names no Roadmap and makes no claim about readiness (§1).
 *
 * Section 3's notes are the form's own help strings, beside the form's own
 * question stems, so a founder who reads one in each place reads the same
 * sentence twice (Help Page §4).
 */
export default function HelpPage() {
  const library = readFileSync(
    path.join(process.cwd(), "src", "content", "tier2", "Content-Library-Tier2-Help-Page.md"),
    "utf8",
  );
  const headings = parseHelpHeadings(library);
  const escapes = parseEscapeRows(library);
  const { questions, sections } = getQuestionnaire();
  const helped = questions.filter((q) => q.helpKey);
  const ids = ["what", "honest", "numbers", "cant", "terms", "after", "data"];
  const text = (key: string) => plain(t2(key));

  const body: React.ReactNode[] = [
    <>
      <p>{text("T2HP-WHAT-1")}</p>
      <p>{text("T2HP-WHAT-2")}</p>
    </>,
    <p key="h">{text("T2HP-HONEST")}</p>,
    <>
      <p>{text("T2HP-NUMBERS-INTRO")}</p>
      {sections
        .filter((section) => helped.some((q) => q.section === section.number))
        .map((section) => (
          <div key={section.number}>
            <p className={styles.grp}>{section.name}</p>
            {helped
              .filter((q) => q.section === section.number)
              .map((q) => (
                <div key={q.code} className={styles.fh}>
                  <p className={styles.qq}>{q.stem}</p>
                  <p>{text(q.helpKey!)}</p>
                </div>
              ))}
          </div>
        ))}
    </>,
    <>
      <p>{text("T2HP-ESC-INTRO")}</p>
      <dl className={styles.escl}>
        {escapes.map((row) => (
          <div key={row.key} className={styles.escrow}>
            <dt>
              <span className={styles.escchip}>
                <span className={styles.ring} aria-hidden="true" />
                {row.label}
              </span>
            </dt>
            <dd>{text(row.key)}</dd>
          </div>
        ))}
      </dl>
      <p>{text("T2HP-ESC-NOPEN")}</p>
    </>,
    <div key="t" className={styles.terms}>
      {["T2HP-TERM-1", "T2HP-TERM-2", "T2HP-TERM-3", "T2HP-TERM-4", "T2HP-TERM-5", "T2HP-TERM-6"].map((key) => (
        <p key={key}>
          <Rich text={t2(key)} strongClass="" />
        </p>
      ))}
    </div>,
    <>
      <p>{text("T2HP-AFTER-REVIEW")}</p>
      <p>{text("T2HP-AFTER-24H")}</p>
      <p>{text("T2HP-AFTER-CORRECT")}</p>
      <p>{text("T2HP-AFTER-REFUND")}</p>
    </>,
    <p key="d">{text("T2HP-DATA")}</p>,
  ];

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <Image src={logo} alt="Corporate Culture" unoptimized priority className={styles.logo} />
      </header>
      <main className={styles.main}>
        <h1 className={styles.title}>{text("T2HP-HEAD")}</h1>
        <nav className={styles.toc} aria-label={text("T2HP-HEAD")}>
          <ul>
            {headings.map((heading, i) => (
              <li key={heading}>
                <a href={`#${ids[i]}`}>{heading}</a>
              </li>
            ))}
          </ul>
        </nav>
        <article className={styles.article}>
          {headings.map((heading, i) => (
            <section key={heading} id={ids[i]} className={styles.sec} aria-labelledby={`${ids[i]}-h`}>
              <h2 id={`${ids[i]}-h`}>{heading}</h2>
              {body[i]}
            </section>
          ))}
          <p className={styles.entity}>{text("T2C-ENTITY")}</p>
        </article>
      </main>
    </div>
  );
}
