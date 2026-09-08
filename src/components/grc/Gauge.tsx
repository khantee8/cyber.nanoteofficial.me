/** Half-circle arc for a 0–1 value. Pure SVG. */
export default function Gauge({ value, label, sub }: { value: number; label: string; sub?: string }) {
  const r = 54;
  const c = Math.PI * r; // half circumference
  const v = Math.max(0, Math.min(1, value));
  const color = v >= 0.8 ? 'var(--accent)' : v >= 0.5 ? 'var(--sev-medium)' : 'var(--sev-high)';
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 140 80" className="w-full max-w-[220px]" role="img" aria-label={`${label}: ${Math.round(v * 100)}%`}>
        <path d="M16 72 A54 54 0 0 1 124 72" fill="none" stroke="var(--surface-3)" strokeWidth="10" strokeLinecap="round" />
        <path d="M16 72 A54 54 0 0 1 124 72" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${c * v} ${c}`} />
        <text x="70" y="66" textAnchor="middle" fontSize="28" fontWeight="600" fill="var(--fg)" fontFamily="var(--font-mono)">
          {Math.round(v * 100)}%
        </text>
      </svg>
      <p className="eyebrow -mt-1">{label}</p>
      {sub ? <p className="mono mt-1 text-[11px] text-muted-soft">{sub}</p> : null}
    </div>
  );
}
