type Props = {
  home: number;
  draw: number;
  away: number;
  homeLabel: string;
  awayLabel: string;
  large?: boolean;
};

export function ProbBar({ home, draw, away, homeLabel, awayLabel, large = false }: Props) {
  const num = large ? "text-2xl" : "text-base";
  return (
    <div>
      <div className="flex h-2 gap-[3px] overflow-hidden rounded-full" role="img" aria-label={`${homeLabel} ${home} percent, draw ${draw} percent, ${awayLabel} ${away} percent`}>
        <div className="rounded-full bg-pulse-500" style={{ width: `${home}%` }} />
        <div className="rounded-full bg-white/25" style={{ width: `${draw}%` }} />
        <div className="rounded-full bg-away" style={{ width: `${away}%` }} />
      </div>
      <div className="mt-2.5 flex items-end justify-between">
        <div>
          <div className={`font-display font-extrabold tnum leading-none text-pulse-500 ${num}`}>{home}%</div>
          <div className="mt-1 text-[11px] text-white/50">{homeLabel}</div>
        </div>
        <div className="text-center">
          <div className={`font-display font-extrabold tnum leading-none text-white/70 ${num}`}>{draw}%</div>
          <div className="mt-1 text-[11px] text-white/50">Draw</div>
        </div>
        <div className="text-right">
          <div className={`font-display font-extrabold tnum leading-none text-away ${num}`}>{away}%</div>
          <div className="mt-1 text-[11px] text-white/50">{awayLabel}</div>
        </div>
      </div>
    </div>
  );
}
