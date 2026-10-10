"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Crest } from "./Crest";
import { PlayerAvatar } from "./PlayerAvatar";
import type { SearchHit } from "@/lib/search";

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function Results({
  hits,
  onPick,
  loading,
  scrollable = true
}: {
  hits: SearchHit[];
  onPick: () => void;
  loading: boolean;
  scrollable?: boolean;
}) {
  if (loading) return <div className="px-4 py-6 text-center text-[13px] text-white/45">Searching</div>;
  if (hits.length === 0) return <div className="px-4 py-6 text-center text-[13px] text-white/45">No matches found.</div>;
  return (
    <ul className={`py-1 ${scrollable ? "max-h-[70vh] overflow-y-auto" : ""}`}>
      {hits.map((h) => (
        <li key={`${h.kind}-${h.id}`}>
          <Link
            href={h.kind === "team" ? `/team/${h.id}` : `/player/${h.id}`}
            onClick={onPick}
            className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.05]"
          >
            {h.kind === "team" ? (
              <Crest short={h.short} color={h.color} size={30} teamId={h.id} name={h.name} />
            ) : (
              <PlayerAvatar id={h.id} name={h.name} size={30} />
            )}
            <div className="min-w-0">
              <div className="truncate text-[14px] font-semibold">{h.name}</div>
              <div className="truncate text-[11px] text-white/45">{h.kind === "team" ? "Club" : h.teamName || "Player"}</div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function SearchBox({ variant, onCloseOverlay }: { variant: "bar" | "overlay"; onCloseOverlay?: () => void }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"all" | "team" | "player">("all");
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const debounced = useDebounced(query, 250);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounced.trim().length < 2) {
      setHits([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(debounced)}`)
      .then((r) => r.json())
      .then((j: { hits: SearchHit[] }) => {
        if (!cancelled) setHits(j.hits ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  useEffect(() => {
    if (variant !== "bar") return;
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [variant]);

  useEffect(() => {
    if (variant !== "overlay") return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [variant]);

  const close = () => {
    setOpen(false);
    setQuery("");
    onCloseOverlay?.();
  };

  if (variant === "overlay") {
    const filtered = tab === "all" ? hits : hits.filter((h) => h.kind === tab);
    return (
      <div className="fixed inset-0 z-[80] flex flex-col bg-[#050b0d]">
        <div className="flex h-16 items-center gap-2 border-b border-white/[0.08] px-4">
          <button
            onClick={close}
            aria-label="Close search"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/60 hover:bg-white/[0.06]"
          >
            <X size={19} />
          </button>
          <div className="flex h-11 flex-1 items-center gap-2.5 rounded-xl bg-white/[0.06] px-3.5">
            <Search size={17} className="shrink-0 text-white/40" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search teams and players"
              className="h-full flex-1 bg-transparent text-[15px] outline-none placeholder:text-white/35"
            />
          </div>
        </div>

        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto border-b border-white/[0.06] px-4 py-2.5">
          {(
            [
              ["all", "All"],
              ["team", "Teams"],
              ["player", "Players"]
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold ${
                tab === key ? "border-transparent bg-pulse-500 text-[#03100c]" : "border-white/10 bg-white/[0.04] text-white/65"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto bg-[#050b0d]">
          {query.trim().length < 2 ? (
            <div className="px-4 py-6 text-center text-[13px] text-white/45">Search for a team or player.</div>
          ) : (
            <Results hits={filtered} onPick={close} loading={loading} scrollable={false} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={boxRef} className="relative hidden max-w-xl flex-1 lg:block">
      <label className="flex h-10 items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5">
        <Search size={16} className="text-white/40" />
        <input
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          placeholder="Search teams, players, leagues"
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
        />
      </label>
      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-xl border border-white/[0.1] bg-ink-900 shadow-2xl">
          <Results hits={hits} onPick={close} loading={loading} />
        </div>
      )}
    </div>
  );
}
