import type { Question } from "@/lib/audit";

const focusRing =
  "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink";

function Check() {
  return (
    <span
      aria-hidden="true"
      className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-cta"
    >
      ✓
    </span>
  );
}

function Option({
  question,
  option,
  selected,
  onChange,
}: {
  question: Question;
  option: string;
  selected: boolean;
  onChange: (value: string) => void;
}) {
  const tone = selected ? "border-cta bg-cta" : "border-black/20 bg-white hover:border-ink/50";
  const input = (
    <input
      type="radio"
      name={question.id}
      value={option}
      checked={selected}
      onChange={() => onChange(option)}
      className="sr-only"
    />
  );

  if (question.layout === "buttons") {
    return (
      <label
        className={`flex min-h-[52px] cursor-pointer items-center justify-center rounded-md border px-2 text-center text-[17px] font-bold transition-colors ${focusRing} ${tone}`}
      >
        {input}
        {option}
      </label>
    );
  }

  if (question.layout === "statements") {
    return (
      <label
        className={`flex cursor-pointer items-start justify-between gap-4 rounded-lg border px-5 py-5 text-[16px] leading-relaxed transition-colors sm:py-6 ${focusRing} ${tone}`}
      >
        {input}
        <span className="max-w-[640px]">{option}</span>
        {selected ? <Check /> : <span aria-hidden="true" className="size-[22px] shrink-0" />}
      </label>
    );
  }

  return (
    <label
      className={`flex min-h-[52px] cursor-pointer items-center justify-between gap-4 rounded-md border px-4 py-3 text-[17px] transition-colors ${focusRing} ${tone}`}
    >
      {input}
      {option}
      {selected ? (
        <Check />
      ) : (
        <span aria-hidden="true" className="size-[22px] shrink-0 rounded-full border border-black/30" />
      )}
    </label>
  );
}

export function QuestionCard({
  question,
  value,
  showError,
  onChange,
}: {
  question: Question;
  value: string | undefined;
  showError: boolean;
  onChange: (value: string) => void;
}) {
  const missing = showError && !question.options.includes(value ?? "");
  const statements = question.layout === "statements";

  const optionsClass =
    question.layout === "buttons"
      ? `grid gap-2 ${question.options.length === 2 ? "grid-cols-2" : "grid-cols-3"}`
      : `flex flex-col ${statements ? "gap-3" : "gap-2"}`;

  return (
    <fieldset
      id={question.id}
      className={
        statements
          ? ""
          : `rounded-xl border bg-white p-4 sm:p-6 ${missing ? "border-brand" : "border-black/10"}`
      }
    >
      <legend
        className={`float-left w-full leading-snug font-bold ${statements ? "text-[20px] sm:text-[21px]" : "text-[19px] sm:text-[20px]"}`}
      >
        {question.prompt}
      </legend>
      <div className={`clear-both pt-4 ${optionsClass}`}>
        {question.options.map((option) => (
          <Option
            key={option}
            question={question}
            option={option}
            selected={value === option}
            onChange={onChange}
          />
        ))}
      </div>
      {missing ? <p className="mt-2 text-sm text-brand-deep">Pick the closest answer.</p> : null}
    </fieldset>
  );
}
