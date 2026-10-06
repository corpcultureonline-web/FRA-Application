const RINGS = [
  { radius: 11, dots: 12, size: 1.5 },
  { radius: 16.5, dots: 17, size: 1.8 },
  { radius: 22, dots: 22, size: 2.1 },
  { radius: 27.5, dots: 27, size: 2.3 },
];

// The mark is a "C": rings of dots with the right-hand side left open.
const START_DEG = 40;
const END_DEG = 320;

function dotColor(angleDeg: number) {
  // Amber across the top fading to brand red at the bottom.
  const t = (1 - Math.sin((angleDeg * Math.PI) / 180)) / 2;
  const mix = (a: number, b: number) => Math.round(a + (b - a) * t);
  return `rgb(${mix(249, 232)}, ${mix(166, 65)}, ${mix(27, 42)})`;
}

const dots = RINGS.flatMap(({ radius, dots: count, size }) =>
  Array.from({ length: count }, (_, i) => {
    const angle = START_DEG + ((END_DEG - START_DEG) * i) / (count - 1);
    const rad = (angle * Math.PI) / 180;
    return {
      cx: 32 + radius * Math.cos(rad),
      // SVG y grows downward, so negate to sweep counter-clockwise from the top.
      cy: 32 - radius * Math.sin(rad),
      r: size,
      angle,
    };
  }),
);

export function Logo({
  inverted = false,
  compact = false,
}: {
  inverted?: boolean;
  compact?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg
        viewBox="0 0 64 64"
        className={compact ? "size-11 sm:size-12" : "size-12 sm:size-14"}
        aria-hidden="true"
      >
        {dots.map((dot, i) => (
          <circle
            key={i}
            cx={dot.cx.toFixed(2)}
            cy={dot.cy.toFixed(2)}
            r={dot.r}
            fill={inverted ? "#ffffff" : dotColor(dot.angle)}
          />
        ))}
      </svg>
      <span
        className={`${compact ? "text-[11px]" : "text-[13px] sm:text-sm"} leading-[1.15] font-bold tracking-tight ${
          inverted ? "text-white" : "text-ink"
        }`}
      >
        CORPORATE
        <br />
        CULTURE
      </span>
    </span>
  );
}
