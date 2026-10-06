/** Renders text with **bold** markup. */
export function Rich({ text, strongClass = "text-ink" }: { text: string; strongClass?: string }) {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className={`font-bold ${strongClass}`}>
        {part}
      </strong>
    ) : (
      part
    ),
  );
}
