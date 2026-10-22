import { Fragment } from "react";

/** `**bold**` inside a line. */
export function Inline({ text }: { text: string }) {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : <Fragment key={i}>{part}</Fragment>));
}

const cells = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => cell.trim());

/**
 * One library paragraph as the library wrote it: a pipe table, a list of
 * `- ` items, or prose. Nothing is reworded; markup becomes elements.
 */
function Paragraph({ text }: { text: string }) {
  const lines = text.split("\n");
  if (lines.every((line) => line.trim().startsWith("|"))) {
    const rows = lines.filter((line) => !/^\|[\s:|-]+\|$/.test(line.trim())).map(cells);
    const [head, ...body] = rows;
    return (
      <table>
        <thead>
          <tr>
            {head.map((cell, i) => (
              <th key={i}>
                <Inline text={cell} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, r) => (
            <tr key={r}>
              {row.map((cell, i) => (
                <td key={i}>
                  <Inline text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  if (lines.every((line) => line.startsWith("- "))) {
    return (
      <ul>
        {lines.map((line, i) => (
          <li key={i}>
            <Inline text={line.slice(2)} />
          </li>
        ))}
      </ul>
    );
  }
  return (
    <p>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && " "}
          <Inline text={line} />
        </Fragment>
      ))}
    </p>
  );
}

/** A block's paragraphs; nothing at all when the library has not supplied it (the review panel holds it back). */
export function Prose({ paragraphs, className }: { paragraphs: (string | null)[] | null | undefined; className?: string }) {
  const present = (paragraphs ?? []).filter((p): p is string => Boolean(p));
  if (!present.length) return null;
  return (
    <div className={className}>
      {present.map((text, i) => (
        <Paragraph key={i} text={text} />
      ))}
    </div>
  );
}
