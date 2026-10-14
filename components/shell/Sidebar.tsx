"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { InstallButton } from "@/components/InstallButton";
import { LeagueBadge } from "@/components/LeagueBadge";
import { flagFor } from "@/lib/countries";
import { isActive, navItems } from "./nav";

type League = { id: number; name: string; country: string; tier: number; color: string };

export function Sidebar() {
  const pathname = usePathname();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [openCountry, setOpenCountry] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/leagues")
      .then((r) => r.json())
      .then((j: { leagues: League[] }) => setLeagues(j.leagues ?? []))
      .catch(() => {});
  }, []);

  const byCountry = new Map<string, League[]>();
  for (const l of leagues) {
    const list = byCountry.get(l.country) ?? [];
    list.push(l);
    byCountry.set(l.country, list);
  }
  const countries = Array.from(byCountry.entries())
    .map(([country, ls]) => [country, ls.sort((a, b) => a.tier - b.tier)] as const)
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));

  return (
    <aside className="sticky top-0 hidden h-screen flex-col gap-6 overflow-y-auto border-r border-white/[0.06] bg-[#040a0c]/80 px-4 py-5 lg:flex">
      <Link href="/" className="px-2" aria-label="StatPulse home">
        <Image
          src="/images/logo/logo-full.png"
          alt="StatPulse. See Beneath the Surface."
          width={661}
          height={160}
          priority
          className="h-auto w-[176px]"
        />
      </Link>

      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const active = isActive(item.href, pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl border-l-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "border-pulse-500 bg-pulse-500/10 text-white"
                  : "border-transparent text-white/60 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <Icon size={18} className={active ? "text-pulse-500" : ""} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div>
        <div className="mb-2 px-3 text-[11px] font-semibold text-white/35">Leagues</div>
        <ul className="flex flex-col gap-0.5">
          {countries.map(([country, ls]) => {
            const isOpen = openCountry === country;
            return (
              <li key={country}>
                <button
                  type="button"
                  onClick={() => setOpenCountry(isOpen ? null : country)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-white/80 hover:bg-white/[0.04]"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[11px]">
                    {flagFor(country)}
                  </span>
                  <span className="flex-1 text-left font-medium">{country}</span>
                  <ChevronDown size={13} className={`text-white/35 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <ul className="ml-4 flex flex-col gap-0.5 border-l border-white/[0.06] pl-2">
                    {ls.map((l) => (
                      <li key={l.id}>
                        <Link
                          href={`/table?league=${l.id}`}
                          className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[12.5px] text-white/70 hover:bg-white/[0.04] hover:text-white"
                        >
                          <LeagueBadge id={l.id} size={15} name={l.name} />
                          <span className="truncate">{l.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-auto flex flex-col gap-3">
        <InstallButton variant="full" />
        <div className="rounded-2xl border border-pulse-500/20 bg-pulse-500/[0.06] p-4">
          <div className="text-sm font-semibold">Early build</div>
          <p className="mt-1 text-xs leading-relaxed text-white/55">
            Fixtures and injuries are live. Predictions are from a baseline model still being tested.
          </p>
        </div>
      </div>
    </aside>
  );
}