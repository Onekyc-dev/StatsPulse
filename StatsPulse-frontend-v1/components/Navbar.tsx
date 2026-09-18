import Link from "next/link";
import { Activity, Search } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#070a0d]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-pulse-500 text-black">
            <Activity className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">StatPulse</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-white/50 md:flex">
          <Link href="/" className="hover:text-white">Home</Link>
          <Link href="/matches" className="hover:text-white">Matches</Link>
          <Link href="/teams" className="hover:text-white">Teams</Link>
          <Link href="/players" className="hover:text-white">Players</Link>
          <Link href="/predictions" className="hover:text-white">Predictions</Link>
        </nav>

        <div className="flex items-center gap-3">
          <button className="rounded-xl border border-white/10 p-2 text-white/55 hover:bg-white/5 hover:text-white">
            <Search className="h-4 w-4" />
          </button>
          <button className="hidden rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-white/75 hover:bg-white/5 sm:block">
            Get started
          </button>
        </div>
      </div>
    </header>
  );
}