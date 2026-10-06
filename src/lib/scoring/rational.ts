/**
 * Exact rational arithmetic on BigInt. Scores are never held in a float: the
 * spec's test vectors break under float rounding in ways that look like logic
 * bugs (Tier 1 spec §3, decision S7).
 */
export type Rational = { readonly n: bigint; readonly d: bigint };

function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) [x, y] = [y, x % y];
  return x;
}

export function rat(n: bigint | number, d: bigint | number = 1n): Rational {
  let num = BigInt(n);
  let den = BigInt(d);
  if (den === 0n) throw new Error("Division by zero");
  if (den < 0n) [num, den] = [-num, -den];
  const g = gcd(num, den) || 1n;
  return { n: num / g, d: den / g };
}

/** Parses a decimal string such as "12", "12.5" or "-0.25" exactly. */
export function parseDecimal(value: string): Rational {
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(value.trim());
  if (!match) throw new Error(`Not a decimal: ${value}`);
  const [, sign, whole, fraction = ""] = match;
  const n = BigInt(whole + fraction) * (sign ? -1n : 1n);
  return rat(n, 10n ** BigInt(fraction.length));
}

export const add = (a: Rational, b: Rational) => rat(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a: Rational, b: Rational) => rat(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a: Rational, b: Rational) => rat(a.n * b.n, a.d * b.d);
export const div = (a: Rational, b: Rational) => rat(a.n * b.d, a.d * b.n);
export const cmp = (a: Rational, b: Rational) => {
  const diff = a.n * b.d - b.n * a.d;
  return diff < 0n ? -1 : diff > 0n ? 1 : 0;
};

export function floor(a: Rational): bigint {
  const q = a.n / a.d;
  return a.n < 0n && q * a.d !== a.n ? q - 1n : q;
}

export function ceil(a: Rational): bigint {
  return -floor(rat(-a.n, a.d));
}

/** Rounds half away from zero to `places` decimals, for display and DECIMAL columns only. */
export function toFixed(a: Rational, places = 2): string {
  const scale = 10n ** BigInt(places);
  const negative = a.n < 0n;
  const absN = negative ? -a.n : a.n;
  const scaled = (absN * scale * 2n + a.d) / (2n * a.d);
  const whole = (scaled / scale).toString();
  const fraction = (scaled % scale).toString().padStart(places, "0");
  return `${negative && scaled !== 0n ? "-" : ""}${whole}${places > 0 ? `.${fraction}` : ""}`;
}
