/**
 * Tier prices — the one source in code (CANONICAL-VALUES §1, decisions P8, P10).
 * Base prices are stored exclusive of GST; the payable total is computed and
 * rounded to the nearest rupee, never stored. The GST rate stays configurable
 * until the CA confirms the SAC code.
 *
 * The Content Library's upgrade copy states the price in its own words; when a
 * price changes, CANONICAL-VALUES §9 lists every place to update.
 */
export const GST_PERCENT = 18;

export const TIERS = {
  report: { name: "Franchise Readiness Report", base: 1999 },
  roadmap: { name: "Franchise Readiness Roadmap", base: 5999 },
} as const;

export type PaidTier = keyof typeof TIERS;

const rupees = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

/** Total including GST, rounded to the nearest rupee: 1999 → 2359. */
export function payable(tier: PaidTier) {
  return Math.round(TIERS[tier].base * (1 + GST_PERCENT / 100));
}

/** "₹1,999 + 18% GST" — the headline form. */
export function priceLabel(tier: PaidTier) {
  return `${rupees(TIERS[tier].base)} + ${GST_PERCENT}% GST`;
}

/** "₹1,999 + GST" — for tight spaces such as a table header. */
export function shortPriceLabel(tier: PaidTier) {
  return `${rupees(TIERS[tier].base)} + GST`;
}

/** "₹2,359" — the amount charged. */
export function payableLabel(tier: PaidTier) {
  return rupees(payable(tier));
}
