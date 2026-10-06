"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { isActive, navItems } from "./nav";

export function MobileMenuButton({ label }: { label?: ReactNode }) {
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
        className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl px-2 text-white/70 hover:bg-white/[0.05] lg:hidden"
      >
        {label ?? <Menu size={21} />}
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
