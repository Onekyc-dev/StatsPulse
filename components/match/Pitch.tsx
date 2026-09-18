import { withAlpha } from "@/lib/color";

type Dot = { x: number; y: number; label: string };

function labels(rowIndex: number, rowCount: number, count: number): string[] {
  const fill = (l: string) => Array.from({ length: count }, () => l);
  if (rowIndex === 0) {
    if (count === 4) return ["LB", "CB", "CB", "RB"];
    if (count === 5) return ["LWB", "CB", "CB", "CB", "RWB"];
    if (count === 3) return ["CB", "CB", "CB"];
    return fill("DF");
  }
  if (rowIndex === rowCount - 1) {
    if (count === 3) return ["LW", "ST", "RW"];
    if (count === 2) return ["ST", "ST"];
    if (count === 1) return ["ST"];
    return fill("FW");
  }
  if (rowCount === 4) {
    if (rowIndex === 1) return fill("DM");
    if (rowIndex === 2 && count === 3) return ["LW", "AM", "RW"];
  }
  if (count === 4) return ["LM", "CM", "CM", "RM"];
  return fill("CM");
}

export function buildDots(formation: string, width: number, height: number): Dot[] {
  const rows = formation
    .split("-")
    .map((n) => parseInt(n, 10))
    .filter((n) => n > 0);
  const top = 42;
  const bottom = height - 32;
  const dots: Dot[] = [{ x: width / 2, y: bottom, label: "GK" }];
  const step = (bottom - top) / rows.length;
  rows.forEach((count, i) => {
    const y = bottom - (i + 1) * step;
    const names = labels(i, rows.length, count);
    for (let j = 0; j < count; j++) {
      dots.push({ x: (width * (j + 1)) / (count + 1), y, label: names[j] });
    }
  });
  return dots;
}

export function Pitch({ formation, color }: { formation: string; color: string }) {
  const W = 300;
  const H = 380;
  const dots = buildDots(formation, W, H);
  const line = "rgba(255,255,255,0.22)";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto h-auto w-full max-w-sm" role="img" aria-label={`Expected ${formation} shape`}>
      <defs>
        <linearGradient id="pitchGrass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0d3b2a" />
          <stop offset="1" stopColor="#0a2c20" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={W} height={H} rx="16" fill="url(#pitchGrass)" />
      <g fill="none" stroke={line} strokeWidth="1.5">
        <rect x="10" y="10" width={W - 20} height={H - 20} rx="6" />
        <line x1="10" y1={H / 2} x2={W - 10} y2={H / 2} />
        <circle cx={W / 2} cy={H / 2} r="32" />
        <rect x="80" y="10" width="140" height="52" />
        <rect x="80" y={H - 62} width="140" height="52" />
        <rect x="112" y="10" width="76" height="22" />
        <rect x="112" y={H - 32} width="76" height="22" />
      </g>
      {dots.map((d, i) => (
        <g key={i}>
          <circle cx={d.x} cy={d.y} r="17" fill={withAlpha(color, 0.35)} />
          <circle cx={d.x} cy={d.y} r="13" fill={color} stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" />
          <text
            x={d.x}
            y={d.y + 3.5}
            textAnchor="middle"
            fontSize="9.5"
            fontWeight="800"
            fill="#fff"
            fontFamily="var(--font-display), system-ui, sans-serif"
          >
            {d.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
