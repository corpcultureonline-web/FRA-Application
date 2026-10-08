import { BRAND_ENTITY_LINE } from "@/lib/company";

/** "Corporate Culture is a brand of Blue Bird Ventures" — required on every page (Decision Log P9). */
export function EntityLine({ className = "" }: { className?: string }) {
  return <p className={`text-[12px] text-muted ${className}`}>{BRAND_ENTITY_LINE}</p>;
}
