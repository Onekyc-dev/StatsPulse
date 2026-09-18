import { PredictionCard } from "@/components/PredictionCard";
import { featuredMatch } from "@/data/mockData";

export default function PredictionsPage() {
  return <div className="mx-auto max-w-7xl px-5 py-12 md:px-8"><div className="eyebrow">Model</div><h1 className="mt-2 text-4xl font-semibold">Predictions</h1><p className="mt-3 text-white/45">StatPulse estimates, tracked over time.</p><div className="mt-8 max-w-xl"><PredictionCard prediction={featuredMatch.prediction} /></div></div>;
}