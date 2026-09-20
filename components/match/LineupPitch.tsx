import { withAlpha } from "@/lib/color";
import { formationRows, surname, type TeamLineup, type XIPlayer } from "@/lib/lineups";

/** Draws a lineup on a pitch, laid out by its formation. Returns null if the formation does not fit the players. */
export function LineupPitch({ lineup, color }: { lineup: TeamLineup; color: string }) {
  const layout = formationRows(lineup);
  if (!layout) return null;

  const W = 300;
  const H = 420;
  const top = 46;
  const bottom = H - 46;
  const step = (bottom - top) / layout.rows.length;
  const line = "rgba(255,255,255,0.22)";

  const dots: { p: XIPlayer; x: number; y: number }[] = [{ p: layout.gk, x: W / 2, y: bottom }];
  layout.rows.forEach((row, i) => {
    const y = bottom - (i + 1) * step;
    row.forEach((p, j) => dots.push({ p, x: (W * (j + 1)) / (row.length + 1), y }));
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto h-auto w-full max-w-sm" role="img" aria-label={`Lineup, ${lineup.formation}`}>
      <defs>
        <linearGradient id="lineupGrass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0d3b2a" />
          <stop offset="1" stopColor="#0a2c20" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={W} height={H} rx="16" fill="url(#lineupGrass)" />
      <g fill="none" stroke={line} strokeWidth="1.5">
        <rect x="10" y="10" width={W - 20} height={H - 20} rx="6" />
        <line x1="10" y1={H / 2} x2={W - 10} y2={H / 2} />
        <circle cx={W / 2} cy={H / 2} r="32" />
        <rect x="80" y="10" width="140" height="52" />
        <rect x="80" y={H - 62} width="140" height="52" />
      </g>
      {dots.map(({ p, x, y }) => (
        <g key={p.id}>
          <circle cx={x} cy={y} r="15" fill={withAlpha(color, 0.35)} />
          <circle cx={x} cy={y} r="12" fill={color} stroke={p.captain ? "#f5b73a" : "rgba(255,255,255,0.85)"} strokeWidth={p.captain ? 2.5 : 1.5} />
          <text x={x} y={y + 3.5} textAnchor="middle" fontSize="10" fontWeight="800" fill="#fff" fontFamily="var(--font-display), system-ui, sans-serif">
            {p.number ?? ""}
          </text>
          <text x={x} y={y + 27} textAnchor="middle" fontSize="8.5" fontWeight="600" fill="rgba(255,255,255,0.92)" style={{ paintOrder: "stroke" }} stroke="rgba(0,0,0,0.55)" strokeWidth="2.5">
            {surname(p)}
          </text>
        </g>
      ))}
    </svg>
  );
}
