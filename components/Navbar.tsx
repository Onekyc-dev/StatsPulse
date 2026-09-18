"use client";

import Link from "next/link";
import { useState } from "react";

const navItems = [
  { name: "Home", href: "/" },
  { name: "Matches", href: "/matches" },
  { name: "Predictions", href: "/predictions" },
  { name: "Teams", href: "/teams" },
  { name: "Players", href: "/players" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#050b0d]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-between px-5 sm:px-8 lg:px-10">

        {/* BRAND */}
        <Link
          href="/"
          className="flex items-center gap-3"
          onClick={() => setMenuOpen(false)}
        >
          <img
            src="/images/logo/logo-mark.png"
            alt="StatPulse"
            className="h-11 w-11 object-contain"
          />

          <div className="hidden sm:block leading-none">
            <div className="text-[22px] font-bold tracking-[-0.04em]">
              <span className="text-white">Stat</span>
              <span className="text-[#18e6a4]">Pulse</span>
            </div>

            <div className="mt-1 text-[8px] font-medium uppercase tracking-[0.22em] text-white/45">
              See Beneath the Surface.
            </div>
          </div>
        </Link>

        {/* DESKTOP NAV */}
        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="group relative py-2 text-[13px] font-medium text-white/65 transition-colors hover:text-white"
            >
              {item.name}

              <span className="absolute bottom-0 left-0 h-[2px] w-0 rounded-full bg-[#18e6a4] transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}

          <div className="relative">
            <button className="flex items-center gap-1.5 py-2 text-[13px] font-medium text-white/65 transition-colors hover:text-white">
              Leagues

              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          </div>
        </nav>

        {/* DESKTOP RIGHT SIDE */}
        <div className="hidden items-center gap-4 md:flex">

          {/* SEARCH */}
          <div className="flex h-10 w-[230px] items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3.5">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-white/40"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>

            <input
              type="text"
              placeholder="Search teams, players..."
              className="w-full bg-transparent text-xs text-white outline-none placeholder:text-white/30"
            />
          </div>

          {/* THEME */}
          <button
            aria-label="Toggle theme"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition hover:bg-white/[0.06] hover:text-white"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.7 6.7 0 0 0 21 12.8Z" />
            </svg>
          </button>

          {/* SIGN IN */}
          <button className="rounded-xl bg-[#18e6a4] px-5 py-2.5 text-xs font-bold text-[#03100c] transition hover:bg-[#2df5b3] hover:shadow-[0_0_24px_rgba(24,230,164,0.2)]">
            Sign In
          </button>
        </div>

        {/* MOBILE MENU BUTTON */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-white md:hidden"
          aria-label="Open menu"
        >
          {menuOpen ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </div>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="border-t border-white/[0.06] bg-[#050b0d] px-5 py-5 md:hidden">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-4 py-3.5 text-sm font-medium text-white/70 transition hover:bg-white/[0.04] hover:text-[#18e6a4]"
              >
                {item.name}
              </Link>
            ))}

            <div className="my-3 h-px bg-white/[0.06]" />

            <button className="rounded-xl bg-[#18e6a4] px-4 py-3.5 text-sm font-bold text-[#03100c]">
              Sign In
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
