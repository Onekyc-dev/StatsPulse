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

function Results({ hits, onPick, loading }: { hits: SearchHit[]; onPick: () => void; loading: boolean }) {
  if (loading) return <div className="px-4 py-6 text-center text-[13px] text-white/45">Searching</div>;
  if (hits.length === 0) return <div className="px-4 py-6 text-center text-[13px] text-white/45">No matches found.</div>;
  return (
    <ul className="max-h-[70vh] overflow-y-auto py-1">
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

/** Inline search box, used both in the top bar (desktop) and as a full overlay (mobile). */
export function SearchBox({ variant, onCloseOverlay }: { variant: "bar" | "overlay"; onCloseOverlay?: () => void }) {
  const [open, setOpen] = useState(false);
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

  const close = () => {
    setOpen(false);
    setQuery("");
    onCloseOverlay?.();
  };

  if (variant === "overlay") {
    return (
      <div className="fixed inset-0 z-[60] bg-ink">
        <div className="flex h-16 items-center gap-2 border-b border-white/[0.08] px-4">
          <Search size={18} className="shrink-0 text-white/40" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search teams and players"
            className="h-full flex-1 bg-transparent text-[15px] outline-none placeholder:text-white/35"
          />
          <button onClick={close} aria-label="Close search" className="flex h-9 w-9 items-center justify-center rounded-lg text-white/60 hover:bg-white/[0.06]">
            <X size={19} />
          </button>
        </div>
        <Results hits={hits} onPick={close} loading={loading} />
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
