import Image from "next/image";
import { Fragment, type ReactNode } from "react";
import logo from "@/assets/logo.png";
import { BRAND_ENTITY_LINE } from "@/lib/company";
import { LEGAL_LAST_UPDATED, LEGAL_PAGES, loadLegalDocument, type LegalSlug } from "@/lib/legal/documents";
import { DATE_TOKEN, type Block, type Inline } from "@/lib/legal/markdown";
import { withBasePath } from "@/lib/base-path";
import styles from "./legal.module.css";

const EMAIL = /([\w.+-]+@[\w-]+\.[\w.]+)/g;
const NO_BREAK = /(\+ 18% GST)/g;

/** Plain text, with email addresses linked and "+ 18% GST" kept on one line. */
function renderText(text: string, key: string): ReactNode {
  return text.split(EMAIL).map((part, i) => {
    if (i % 2 === 1) {
      return (
        <a key={`${key}-${i}`} href={`mailto:${part}`}>
          {part}
        </a>
      );
    }
    return part.split(NO_BREAK).map((piece, j) =>
      j % 2 === 1 ? (
        <span key={`${key}-${i}-${j}`} className={styles.nowrap}>
          {piece}
        </span>
      ) : (
        piece
      ),
    );
  });
}

function renderInline(nodes: Inline[], key = "i"): ReactNode {
  return nodes.map((node, i) => {
    const k = `${key}-${i}`;
    switch (node.t) {
      case "text":
        return <Fragment key={k}>{renderText(node.v, k)}</Fragment>;
      case "code":
        return <Fragment key={k}>{node.v}</Fragment>;
      case "b":
        return <b key={k}>{renderInline(node.c, k)}</b>;
      case "i":
        return <em key={k}>{renderInline(node.c, k)}</em>;
      case "a":
        return (
          <a key={k} href={node.href}>
            {renderInline(node.c, k)}
          </a>
        );
    }
  });
}

function renderBlock(block: Block, i: number): ReactNode {
  switch (block.t) {
    case "title":
      return <h1 key={i}>{block.text}</h1>;
    case "updated":
      return (
        <p key={i} className={styles.updated}>
          {block.label}
          {LEGAL_LAST_UPDATED ?? <span className={styles.placeholder}>{DATE_TOKEN}</span>}
        </p>
      );
    case "section":
      return (
        <h2 key={i} id={block.n ? `s${block.n}` : undefined}>
          {block.n && <span className={styles.number}>{block.n}</span>}
          <span>{renderInline([{ t: "text", v: block.text }])}</span>
        </h2>
      );
    case "subsection":
      return <h3 key={i}>{block.text}</h3>;
    case "p":
      return (
        <p key={i}>
          {block.lines.map((line, j) => (
            <Fragment key={j}>
              {j > 0 && <br />}
              {renderInline(line, `${i}-${j}`)}
            </Fragment>
          ))}
        </p>
      );
    case "list": {
      const List = block.ordered ? "ol" : "ul";
      return (
        <List key={i}>
          {block.items.map((item, j) => (
            <li key={j}>{renderInline(item, `${i}-${j}`)}</li>
          ))}
        </List>
      );
    }
    case "kv":
      return (
        <dl key={i} className={styles.kv}>
          {block.rows.map((row, j) => (
            <div key={j}>
              <dt>{renderInline(row.label, `${i}-${j}-l`)}</dt>
              <dd>{renderInline(row.value, `${i}-${j}-v`)}</dd>
            </div>
          ))}
        </dl>
      );
    case "table":
      return (
        <Fragment key={i}>
          {/* Phones: one block per row, each value under its column label. */}
          <div className={styles.rows} role="list">
            {block.rows.map((row, j) => (
              <div key={j} className={styles.row} role="listitem">
                <span className={styles.rowHead}>{renderInline(row[0], `${i}-${j}-0`)}</span>
                {row.slice(1).map((cell, k) => (
                  <span key={k} className={styles.rowCell}>
                    {block.head.length > 2 && (
                      <i className={styles.rowLabel}>{renderInline(block.head[k + 1], `${i}-h${k}`)}</i>
                    )}
                    {renderInline(cell, `${i}-${j}-${k + 1}`)}
                  </span>
                ))}
              </div>
            ))}
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                {block.head.map((cell, k) => (
                  <th key={k} scope="col">
                    {renderInline(cell, `${i}-th${k}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, j) => (
                <tr key={j}>
                  {row.map((cell, k) => (
                    <td key={k}>{renderInline(cell, `${i}-${j}-td${k}`)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Fragment>
      );
  }
}

/** One template for the Privacy Policy, Terms & Conditions and Refund Policy (HANDOFF.md §13). */
export function LegalDocument({ slug }: { slug: LegalSlug }) {
  const blocks = loadLegalDocument(slug);
  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <Image src={logo} alt="Corporate Culture" unoptimized priority className={styles.logo} />
      </header>
      <main className={styles.main}>{blocks.map(renderBlock)}</main>
      <footer className={styles.foot}>
        <nav aria-label="Policies">
          {LEGAL_PAGES.map((page) => (
            <a
              key={page.slug}
              href={withBasePath(`/${page.slug}`)}
              aria-current={page.slug === slug ? "page" : undefined}
            >
              {page.label}
            </a>
          ))}
        </nav>
        <p>{BRAND_ENTITY_LINE}</p>
      </footer>
    </div>
  );
}
