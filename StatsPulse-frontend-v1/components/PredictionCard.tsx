import { BrainCircuit } from "lucide-react";
import type { Prediction } from "@/data/mockData";

export function PredictionCard({ prediction }: { prediction: Prediction }) {
  return (
    <div className="panel relative overflow-hidden p-6">
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-pulse-500/10 blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <BrainCircuit className="h-4 w-4 text-pulse-400" /> StatPulse Prediction
        </div>
        <p className="mt-2 text-xs text-white/40">Model estimate · not a guarantee</p>

        <div className="mt-7 grid grid-cols-3 gap-2">
          <Prediction label="Home" value={`${prediction.homeWin}%`} />
          <Prediction label="Draw" value={`${prediction.draw}%`} />
          <Prediction label="Away" value={`${prediction.awayWin}%`} />
        </div>

        <div className="mt-6 rounded-xl bg-white/[0.035] p-4">
          <div className="text-xs uppercase tracking-wider text-white/35">Projected score</div>
          <div className="mt-1 text-3xl font-semibold">{prediction.score}</div>
          <p className="mt-2 text-sm leading-5 text-white/45">{prediction.summary}</p>
        </div>
      </div>
    </div>
  );
}

function Prediction({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3 text-center">
      <div className="text-[10px] uppercase tracking-wider text-white/35">{label}</div>
      <div className="mt-1 font-semibold text-pulse-400">{value}</div>
    </div>
  );
}