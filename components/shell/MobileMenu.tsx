"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { LeagueBadge } from "@/components/LeagueBadge";
import { isActive, leagues, navItems } from "./nav";

export function MobileMenuButton() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white/70 hover:bg-white/[0.05] lg:hidden"
      >
        <Menu size={21} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <nav className="relative flex h-full w-[300px] max-w-[84vw] flex-col gap-1 overflow-y-auto bg-[#050b0d] px-4 py-4">
            <div className="mb-2 flex items-center justify-between px-1">
              <Image src="/images/logo/logo-full.png" alt="StatPulse" width={661} height={160} className="h-8 w-auto" />
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="flex h-9 w-9 items-center justify-center rounded-lg text-white/60 hover:bg-white/[0.06]">
                <X size={19} />
              </button>
            </div>

            <div className="mb-1 mt-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-white/35">Menu</div>
            {navItems.map((item) => {
              const active = isActive(item.href, pathname);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium ${
                    active ? "bg-pulse-500/10 text-white" : "text-white/75 hover:bg-white/[0.05]"
                  }`}
                >
                  <Icon size={19} className={active ? "text-pulse-500" : "text-white/50"} />
                  {item.name}
                </Link>
              );
            })}

            <div className="mb-1 mt-5 px-2 text-[11px] font-semibold uppercase tracking-wider text-white/35">Leagues</div>
            {leagues.map((l) => (
              <Link
                key={l.name}
                href={l.live ? "/table" : "#"}
                aria-disabled={!l.live}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] ${
                  l.live ? "text-white/85 hover:bg-white/[0.05]" : "cursor-default text-white/35"
                }`}
              >
                {l.live ? (
                  <span className="flex h-5 w-5 items-center justify-center">
                    <LeagueBadge size={20} name={l.name} />
                  </span>
                ) : (
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.dot, opacity: 0.4 }} />
                )}
                <span className="flex-1">{l.name}</span>
                {!l.live && <span className="text-[10px] text-white/30">Soon</span>}
              </Link>
            ))}

            <div className="mt-auto rounded-2xl border border-pulse-500/20 bg-pulse-500/[0.06] p-4">
              <div className="text-sm font-semibold">Early build</div>
              <p className="mt-1 text-xs leading-relaxed text-white/55">Fixtures and injuries are live. Predictions are from a baseline model still being tested.</p>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
