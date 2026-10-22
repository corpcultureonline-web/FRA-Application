/**
 * The Landing library's strings that are written in prose rather than in a
 * key table (Landing v1.5 §2): the fixed known-visitor opening, the boundary
 * panel's heading, and the four FAQ entries. Read from the file as written,
 * like every other Tier 2 string. Pure, so the tests read the real file.
 */

export type LandingProse = {
  /** "You scored between {low} and {high}." */
  knownHead: string;
  knownSub: string;
  /** "Get my full report" */
  knownCta: string;
  /** "This diagnoses. It does not prescribe. That is the Roadmap." */
  boundaryHead: string;
  faq: { key: string; question: string; answer: string }[];
};

export function parseLandingProse(markdown: string): LandingProse {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");

  // "Headline, sub-line and CTA are fixed and already in the design: *"…"* · *"…"* · **…**"
  const fixed = lines.find((line) => line.startsWith("Headline, sub-line and CTA are fixed")) ?? "";
  const quoted = [...fixed.matchAll(/\*"([^"]+)"\*/g)].map((m) => m[1]);
  const cta = /\*\*([^*]+)\*\*\s*$/.exec(fixed)?.[1] ?? "";

  // "| — | fixed | **This diagnoses. It does not prescribe. That is the Roadmap.** |"
  const boundaryRow = lines.find((line) => /^\|\s*—\s*\|\s*fixed\s*\|/.test(line)) ?? "";
  const boundaryHead = /\*\*([^*]+)\*\*/.exec(boundaryRow)?.[1] ?? "";

  // "**Can I finish it later?** — `T2L-FAQ-RESUME` (P29)" then "> answer"
  const faq: LandingProse["faq"] = [];
  lines.forEach((line, i) => {
    const m = /^\*\*(.+?)\*\* — `(T2L-FAQ-[A-Z-]+)`/.exec(line);
    if (!m) return;
    const answer: string[] = [];
    for (const next of lines.slice(i + 1)) {
      if (next.startsWith(">")) answer.push(next.replace(/^>\s?/, ""));
      else if (answer.length) break;
    }
    faq.push({ key: m[2], question: m[1], answer: answer.join(" ").trim() });
  });

  return { knownHead: quoted[0] ?? "", knownSub: quoted[1] ?? "", knownCta: cta, boundaryHead, faq };
}
