export type Rating = "Good" | "Average" | "Weak";

const RATING_STYLES: Record<Rating, { icon: string; className: string }> = {
  Good: { icon: "✓", className: "bg-[#e3f1e5] text-[#1b6b2f]" },
  Average: { icon: "–", className: "bg-[#fdeccf] text-[#8a5300]" },
  Weak: { icon: "!", className: "bg-[#fde4e1] text-[#b42318]" },
};

export function RatingPill({ rating }: { rating: Rating }) {
  const { icon, className } = RATING_STYLES[rating];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1 text-[13px] font-bold ${className}`}
    >
      <span aria-hidden="true">{icon}</span>
      {rating}
    </span>
  );
}
