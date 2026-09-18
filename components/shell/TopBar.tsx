import Image from "next/image";
import Link from "next/link";
import { Bell, Search } from "lucide-react";

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-ink/85 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 lg:hidden" aria-label="StatPulse home">
          <Image src="/images/logo/logo-mark.png" alt="" width={36} height={40} priority className="h-10 w-auto" />
          <span className="font-display text-[20px] font-extrabold tracking-tight">
            Stat<span className="text-pulse-500">Pulse</span>
          </span>
        </Link>

        <label className="hidden h-10 max-w-xl flex-1 items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 lg:flex">
          <Search size={16} className="text-white/40" />
          <input
            type="text"
            placeholder="Search teams, players, leagues"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
          />
        </label>

        <div className="ml-auto flex items-center gap-2">
          <button
            aria-label="Search"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white/70 hover:bg-white/[0.05] lg:hidden"
          >
            <Search size={19} />
          </button>
          <button
            aria-label="Notifications"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white/70 hover:bg-white/[0.05]"
          >
            <Bell size={19} />
          </button>
          <button className="hidden rounded-xl bg-pulse-500 px-4 py-2 text-sm font-bold text-[#03100c] transition hover:bg-pulse-400 sm:block">
            Sign in
          </button>
        </div>
      </div>
    </header>
  );
}
