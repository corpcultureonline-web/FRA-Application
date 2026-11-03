import { notFound, redirect } from "next/navigation";
import { ReportView, type RenderPiece } from "@/app/report/my/[token]/report/ReportView";
import { panelUser } from "@/lib/panel/auth";
import { evidence } from "@/lib/panel/evidence";
import { reviewDetail } from "@/lib/panel/reviews";
import styles from "../../../panel.module.css";
import { Elapsed, ist, p, Status } from "../../bits";
import { EditablePiece, type EditCopy } from "./EditablePiece";
import { ReviewBar } from "./ReviewBar";

export const dynamic = "force-dynamic";

/**
 * Screen 9 (Admin §3): the Report on the left exactly as the founder will
 * receive it, the evidence on the right. Approvers edit, approve, return and
 * refund; the team login reads (§6).
 */
export default async function ReviewPage({ params }: { params: Promise<{ orderId: string }> }) {
  const user = await panelUser();
  if (!user) redirect("/manage/sign-in");
  const orderId = Number((await params).orderId);
  if (!Number.isInteger(orderId) || orderId <= 0) notFound();
  const detail = await reviewDetail(orderId);
  if (!detail) notFound();
  const proof = await evidence(orderId, detail.generated, detail.confirmedPairs);

  const approver = user.role === "approver";
  const open = detail.status === "waiting";
  const amount = detail.amount.replace(/^₹/, "");
  const mobile = detail.mobile ? `+91 ${detail.mobile}` : "";
  const editCopy: EditCopy = {
    edit: p("T2A-EDIT"),
    save: p("T2A-EDIT-SAVE"),
    cancel: p("T2A-EDIT-CANCEL"),
    edited: p("T2A-EDITED"),
    orig: p("T2A-EDIT-ORIG"),
    revert: p("T2A-EDIT-REVERT"),
  };

  // Each block shows the text that will go out; an edited one keeps its library version beside it.
  const piece: RenderPiece = (slot, _pieceId, paragraphs, className) => {
    const edit = detail.edits.get(slot);
    return (
      <EditablePiece
        orderId={orderId}
        slot={slot}
        paragraphs={paragraphs}
        original={edit ? edit.original : null}
        className={className}
        canEdit={approver && open}
        copy={editCopy}
      />
    );
  };

  return (
    <>
      <ReviewBar
        orderId={orderId}
        brand={detail.brand.name}
        meta={
          <>
            <Elapsed row={{ hours: detail.hours, status: detail.status }} />
            <Status status={detail.status} />
            <span>
              {detail.shown.cover.overall} · {detail.shown.cover.band.name}
            </span>
          </>
        }
        canApprove={approver && open}
        canRefund={approver && !detail.refunded}
        copy={{
          back: p("T2A-NAV-BACK"),
          approve: p("T2A-APPROVE"),
          approveConfirm: p("T2A-APPROVE-CONFIRM").replace("{email}", detail.email).replace("{mobile}", mobile),
          cancel: p("T2A-CANCEL"),
          return: p("T2A-RETURN"),
          returnLabel: p("T2A-RETURN-LABEL"),
          returnSave: p("T2A-RETURN-SAVE"),
          refund: p("T2A-REFUND"),
          refundConfirm: p("T2A-REFUND-CONFIRM").replace("{amount}", amount).replace("{brand}", detail.brand.name),
          refundDo: p("T2A-REFUND-DO").replace("{amount}", amount),
        }}
      />

      {(proof.flags.length > 0 || detail.generated.missing.length > 0 || detail.generated.flags.length > 0) && (
        <div className={styles.flags}>
          {proof.flags.map((flag) => (
            <p key={flag} className={styles.flag}>
              {flag}
            </p>
          ))}
          {/* What the libraries do not yet hold, and library text known to need the client's attention: one quiet box. */}
          {detail.generated.missing.length + detail.generated.flags.length > 0 && (
            <ul className={[styles.flag, styles.flagNote].join(" ")}>
              {[...detail.generated.missing, ...detail.generated.flags].map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className={styles.cols}>
        <ReportView doc={detail.shown} token={detail.token} mode="review" piece={piece} />

        <aside className={styles.side}>
          <section className={styles.pnl}>
            <h2>The brand</h2>
            <dl className={styles.kv}>
              <dt>Brand</dt>
              <dd>{detail.brand.name}</dd>
              <dt>Category</dt>
              <dd>{detail.brand.category}</dd>
              <dt>Outlets</dt>
              <dd>{detail.brand.outlets}</dd>
              <dt>City</dt>
              <dd>{detail.brand.city}</dd>
              <dt>Audit range</dt>
              <dd>
                {detail.brand.rangeLow} – {detail.brand.rangeHigh}
              </dd>
              <dt>Score · band</dt>
              <dd>
                {detail.shown.cover.overall} · {detail.shown.cover.band.name}
              </dd>
              <dt>Email</dt>
              <dd>{detail.email}</dd>
              <dt>WhatsApp</dt>
              <dd>{mobile}</dd>
              <dt>Submitted</dt>
              <dd>{ist(detail.submittedAt)}</dd>
              {detail.approved && (
                <>
                  <dt>{p("T2A-ST-APPROVED")}</dt>
                  <dd>
                    {detail.approved.by}, {ist(detail.approved.at)}
                  </dd>
                </>
              )}
              {detail.returned && (
                <>
                  <dt>{p("T2A-ST-RETURNED")}</dt>
                  <dd>
                    {detail.returned.by}, {ist(detail.returned.at)} — {detail.returned.note}
                  </dd>
                </>
              )}
              {detail.refunded && (
                <>
                  <dt>{p("T2A-ST-REFUNDED")}</dt>
                  <dd>
                    {detail.refunded.by}, {ist(detail.refunded.at)}
                  </dd>
                </>
              )}
            </dl>
          </section>

          <section className={styles.pnl}>
            <h2>Why each piece fired</h2>
            <div className={styles.why}>
              {proof.reasons.map((reason) => (
                <div key={reason.slot} className={styles.w}>
                  <b>
                    <code>{reason.pieceId}</code>
                    {detail.edits.has(reason.slot) && ` · ${p("T2A-EDITED")}`}
                  </b>
                  <span>
                    <code>{reason.rule}</code>
                  </span>
                  {reason.values && <span>{reason.values}</span>}
                </div>
              ))}
              {detail.confirmedPairs.length > 0 && (
                <div className={styles.w}>
                  <b>contradiction_warned · proceeded</b>
                  <span>
                    <code>{detail.confirmedPairs.join(" · ")}</code>
                  </span>
                </div>
              )}
            </div>
          </section>

          <section className={styles.pnl}>
            <h2>Their answers</h2>
            <div className={styles.ans}>
              {proof.answers.map((group) => (
                <div key={group.section}>
                  <h3>{group.section}</h3>
                  {group.rows.map((row) => (
                    <div key={row.code} className={styles.ansRow}>
                      <span className={styles.code}>{row.code}</span>
                      <span className={styles.q}>{row.stem}</span>
                      <span className={styles.v}>{row.value}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
