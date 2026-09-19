import { Shield, ShieldAlert, Target, TrendingUp, type LucideIcon } from "lucide-react";
import { buildInsights, type Insight } from "@/lib/outlook";
import type { Match } from "@/lib/types";

const icons: Record<Insight["kind"], LucideIcon> = {
  xg: TrendingUp,
  form: Shield,
  absence: ShieldAlert,
  goals: Target
};

export function InsightsCard({ match }: { match: Match }) {
  const insights = buildInsights(match);
  return (
    <section className="card p-5">
      <h2 className="section-title">Why the model sees it this way</h2>
      <ul className="mt-4 flex flex-col gap-3.5">
        {insights.map((i, idx) => {
          const Icon = icons[i.kind];
          return (
            <li key={idx} className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pulse-500/10 text-pulse-500">
                <Icon size={16} />
              </span>
              <span className="pt-1 text-[13.5px] leading-snug text-white/75">{i.text}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
