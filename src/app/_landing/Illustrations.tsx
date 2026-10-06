const INK = "#231f20";
const ORANGE = "#f7931e";
const RED = "#ee4423";
const OUTLINE = "#d9765b";

function Awning({ x, y, width, height, stripes }: {
  x: number;
  y: number;
  width: number;
  height: number;
  stripes: number;
}) {
  const w = width / stripes;
  return (
    <g>
      {Array.from({ length: stripes }, (_, i) => (
        <path
          key={i}
          d={`M${x + i * w} ${y}h${w}v${height - w / 2}a${w / 2} ${w / 2} 0 0 1 ${-w} 0z`}
          fill={i % 2 === 0 ? ORANGE : RED}
        />
      ))}
    </g>
  );
}

/** A mini outlet shown inside a white card (the opened franchise outlets). */
function OutletCard({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width="74" height="74" rx="6" fill="#fff" />
      <rect x="13" y="15" width="48" height="7" rx="1" fill={INK} />
      <Awning x={13} y={22} width={48} height={12} stripes={4} />
      <rect x="15" y="40" width="20" height="12" fill="none" stroke={INK} strokeWidth="1.6" />
      <rect x="43" y="38" width="10" height="20" fill={INK} />
      <line x1="11" y1="59" x2="63" y2="59" stroke={INK} strokeWidth="1.6" />
    </g>
  );
}

/** A dashed, unfilled outlet (a location not opened yet). */
function FutureOutlet({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} stroke={OUTLINE} fill="none" strokeWidth="1.4">
      <rect width="76" height="74" rx="5" strokeDasharray="3 3" />
      <rect x="13" y="16" width="50" height="7" />
      <path d="M13 23h50v4a6 6 0 0 1-12 0a6 6 0 0 1-13 0a6 6 0 0 1-13 0a6 6 0 0 1-12 0z" />
      <rect x="13" y="30" width="50" height="30" />
      <rect x="19" y="36" width="20" height="10" />
      <rect x="44" y="40" width="12" height="20" />
    </g>
  );
}

export function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 440 440"
      className={className}
      role="img"
      aria-label="One storefront connected to several new franchise outlets"
    >
      <circle cx="220" cy="220" r="212" fill="#efe6da" />

      <g stroke={RED} strokeWidth="1.6" strokeDasharray="2 5" strokeLinecap="round" fill="none">
        <path d="M118 133L190 195" />
        <path d="M322 125L250 195" />
        <path d="M95 275L135 280" />
        <path d="M345 275L305 280" />
      </g>

      <OutletCard x={46} y={58} />
      <OutletCard x={318} y={50} />
      <FutureOutlet x={18} y={236} />
      <FutureOutlet x={348} y={236} />

      {/* Main store */}
      <rect x="135" y="196" width="170" height="30" rx="3" fill={INK} />
      <rect x="185" y="208" width="70" height="7" rx="3.5" fill={ORANGE} />
      <Awning x={135} y={226} width={170} height={38} stripes={8} />
      <rect x="135" y="264" width="170" height="80" fill="#fff" />
      <rect x="150" y="272" width="80" height="55" fill="#fdeee2" stroke={INK} strokeWidth="2.5" />
      <line x1="190" y1="272" x2="190" y2="327" stroke={INK} strokeWidth="2.5" />
      <rect x="244" y="270" width="48" height="74" fill={INK} />
      <circle cx="281" cy="310" r="3" fill={ORANGE} />
      <line x1="114" y1="345" x2="326" y2="345" stroke={INK} strokeWidth="2.5" />
    </svg>
  );
}

export function ReportThumbnail({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 130 162" className={className} aria-hidden="true">
      <rect x="10" y="10" width="112" height="148" rx="3" fill="#efe6da" />
      <rect x="2" y="2" width="112" height="150" rx="3" fill="#fff" stroke="#e5ddd3" />
      <rect x="2" y="2" width="112" height="9" rx="2" fill={RED} />
      <rect x="14" y="26" width="58" height="4" rx="2" fill={INK} />
      <rect x="14" y="35" width="40" height="3" rx="1.5" fill="#b8b1ab" />
      <rect x="14" y="52" width="88" height="4" rx="2" fill="#efe6da" />
      <rect x="51" y="52" width="18" height="4" rx="2" fill={RED} />
      {[70, 82, 94, 106].map((y, i) => (
        <g key={y}>
          <rect x="14" y={y} width={[60, 52, 64, 48][i]} height="3" rx="1.5" fill="#b8b1ab" />
          <rect
            x="88"
            y={y - 1}
            width="14"
            height="5"
            rx="2.5"
            fill={["#fde4e1", "#fdeccf", "#e3f1e5", "#fdeccf"][i]}
          />
        </g>
      ))}
      <rect x="14" y="124" width="88" height="17" rx="2" fill="#fdeee2" />
      <text x="96" y="148" fontSize="5" fill="#9a928c" textAnchor="end">
        PDF
      </text>
    </svg>
  );
}
