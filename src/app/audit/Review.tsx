import {
  PROFILE_FIELDS,
  PROFILE_SECTION,
  QUESTION_SECTIONS,
  displayAnswer,
  type Answers,
  type Profile,
} from "@/lib/audit";

type Row = { key: string; label: string; value: string };

function ReviewCard({
  number,
  title,
  rows,
  onEdit,
}: {
  number: number;
  title: string;
  rows: Row[];
  onEdit: () => void;
}) {
  return (
    <section className="rounded-xl border border-black/10 bg-white px-4 pt-4 pb-1 sm:px-6 sm:pt-5">
      <h2 className="flex items-baseline gap-2 text-[18px] font-bold">
        <span className="text-[13px] text-brand-deep">{number}</span>
        {title}
      </h2>
      <dl>
        {rows.map((row) => (
          <div
            key={row.key}
            className="flex items-center gap-4 border-b border-black/10 py-3.5 last:border-b-0 sm:py-4"
          >
            <dt className="min-w-0 flex-1 text-[15px] text-muted sm:max-w-[300px]">{row.label}</dt>
            <dd className="ml-auto max-w-[60%] text-right text-[16px] font-bold [overflow-wrap:anywhere] sm:max-w-none">
              {row.value}
            </dd>
            <button
              type="button"
              onClick={onEdit}
              className="shrink-0 text-[15px] font-bold text-brand-deep underline underline-offset-4 hover:text-brand"
            >
              Edit<span className="sr-only"> {row.label}</span>
            </button>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function Review({
  profile,
  answers,
  onEdit,
}: {
  profile: Profile;
  answers: Answers;
  onEdit: (section: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3.5">
      <ReviewCard
        number={1}
        title={PROFILE_SECTION.title}
        rows={PROFILE_FIELDS.map(({ key, label }) => ({ key, label, value: profile[key] }))}
        onEdit={() => onEdit(0)}
      />
      {QUESTION_SECTIONS.map((section, i) => (
        <ReviewCard
          key={section.id}
          number={i + 2}
          title={section.title}
          rows={section.questions.map((question) => ({
            key: question.id,
            label: question.reviewLabel,
            value: displayAnswer(question, answers[question.id] ?? ""),
          }))}
          onEdit={() => onEdit(i + 1)}
        />
      ))}
    </div>
  );
}
