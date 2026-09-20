"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { InstallButton } from "@/components/InstallButton";
import { LeagueBadge } from "@/components/LeagueBadge";
import { isActive, leagues, navItems } from "./nav";

export function Sidebar() {
  const pathname = usePathname();

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
          {leagues.map((l) => (
            <li key={l.name}>
              <Link
                href={l.live ? "/table" : "#"}
                aria-disabled={!l.live}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] ${
                  l.live ? "text-white/80 hover:bg-white/[0.04]" : "cursor-default text-white/35"
                }`}
              >
                {l.live ? (
                  <span className="flex h-4 w-4 items-center justify-center">
                    <LeagueBadge size={16} name={l.name} />
                  </span>
                ) : (
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.dot, opacity: 0.4 }} />
                )}
                <span className="flex-1">{l.name}</span>
                {!l.live && <span className="text-[10px] text-white/30">Soon</span>}
              </Link>
            </li>
          ))}
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
