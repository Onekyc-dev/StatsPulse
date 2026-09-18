import type { Metadata } from "next";

export const metadata: Metadata = { title: "Players" };

export default function Page() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Players</h1>
      <div className="card mt-6 px-6 py-12 text-center">
        <h2 className="font-display text-lg font-bold">Coming with live data</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/55">Player intelligence: form, appearances, goals and assists, discipline and availability.</p>
      </div>
    </div>
  );
}
