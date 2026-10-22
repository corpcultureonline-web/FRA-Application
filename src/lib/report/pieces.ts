/**
 * The Report's editable pieces (Admin library §3): every block of prose the
 * engine chose from a library, with a stable slot (where it sits) and the
 * library piece that filled it. The review panel edits by slot; the edit-rate
 * view counts by piece. Headings, labels, figures, the score and the band are
 * not pieces — they are never editable (§1).
 */
import type { Paragraphs } from "./content.ts";
import type { ReportDocument, Section } from "./assemble.ts";
import { SEVERITY_CODE, type Severity } from "./content.ts";

export type Piece = {
  /** "06.UE", "01.lead", "05.G4" … unique within a Report. */
  slot: string;
  /** "C-UE-B2", "LF-NO-ENTITY", "D-UE-MOD", "E1" … the same across Reports. */
  pieceId: string;
  paragraphs: Paragraphs;
};

type Of<N extends Section["number"]> = Extract<Section, { number: N }>;
const find = <N extends Section["number"]>(doc: ReportDocument, n: N) =>
  doc.sections.find((s) => s.number === n) as Of<N> | undefined;

export function pieces(doc: ReportDocument): Piece[] {
  const list: Piece[] = [];
  const add = (slot: string, pieceId: string, paragraphs: Paragraphs | null | undefined) => {
    if (paragraphs?.length) list.push({ slot, pieceId, paragraphs });
  };
  add("intro", "E1", doc.intro);
  const one = find(doc, "01");
  if (one) add("01.lead", one.lead.id, one.lead.paragraphs);
  for (const note of find(doc, "02")?.notes ?? []) add(`02.${note.id}`, note.id, note.paragraphs);
  const three = find(doc, "03");
  if (three) add("03.compare", "I-CMP", three.comparison.paragraphs.filter((p): p is string => Boolean(p)));
  const four = find(doc, "04");
  if (four) {
    add("04.framing", "E3", four.framing);
    for (const gap of four.gaps) add(`04.${gap.code}`, `D-${gap.code}-${SEVERITY_CODE[gap.severity as Severity]}`, gap.line ? [gap.line] : null);
  }
  for (const item of find(doc, "05")?.items ?? []) add(`05.${item.gate}`, item.id, item.paragraphs);
  for (const pillar of find(doc, "06")?.pillars ?? []) {
    add(`06.${pillar.code}`, pillar.assessed ? `C-${pillar.code}-${pillar.band}` : "T2R-NOTASSESSED-BLOCK", pillar.paragraphs);
  }
  add("08", "E8", find(doc, "08")?.paragraphs);
  add("09", "E5", find(doc, "09")?.paragraphs);
  add("10", "E6", find(doc, "10")?.paragraphs);
  return list;
}

/**
 * The Report with edits applied: what the founder receives (T70). Edits are
 * by slot; a slot the Report does not have is ignored rather than invented.
 * Pure — the input is never changed.
 */
export function applyEdits(doc: ReportDocument, edits: Map<string, Paragraphs>): ReportDocument {
  if (!edits.size) return doc;
  const copy = structuredClone(doc);
  const take = (slot: string, current: Paragraphs | null) => edits.get(slot) ?? current;
  copy.intro = take("intro", copy.intro);
  for (const section of copy.sections) {
    switch (section.number) {
      case "01":
        section.lead.paragraphs = take("01.lead", section.lead.paragraphs);
        break;
      case "02":
        for (const note of section.notes) note.paragraphs = take(`02.${note.id}`, note.paragraphs);
        break;
      case "03": {
        const edited = edits.get("03.compare");
        if (edited) section.comparison.paragraphs = edited;
        break;
      }
      case "04":
        section.framing = take("04.framing", section.framing);
        for (const gap of section.gaps) {
          const edited = edits.get(`04.${gap.code}`);
          if (edited) gap.line = edited.join(" ");
        }
        break;
      case "05":
        for (const item of section.items) item.paragraphs = take(`05.${item.gate}`, item.paragraphs);
        break;
      case "06":
        for (const pillar of section.pillars) pillar.paragraphs = take(`06.${pillar.code}`, pillar.paragraphs);
        break;
      case "08":
      case "09":
      case "10":
        section.paragraphs = take(section.number, section.paragraphs);
        break;
    }
  }
  // Section 03 and Section 06 share the pillar blocks; keep them one object.
  const six = copy.sections.find((s) => s.number === "06") as Of<"06"> | undefined;
  const threeCopy = copy.sections.find((s) => s.number === "03") as Of<"03"> | undefined;
  if (six && threeCopy) threeCopy.pillars = six.pillars;
  return copy;
}
