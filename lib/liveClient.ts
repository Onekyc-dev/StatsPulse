"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { LiveEvent, LiveSnap, StatRow } from "./live";

const POLL_MS = 15000;
const BEFORE_KICKOFF_MS = 15 * 60000;
const AFTER_KICKOFF_MS = 3.5 * 3600000;

/* ---------- shared poller for scores (one request covers every match on the page) ---------- */

const snaps = new Map<number, LiveSnap>();
const wanted = new Map<number, number>();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;
let inflight = false;

function emit() {
  listeners.forEach((l) => l());
}

async function poll() {
  if (inflight || wanted.size === 0 || document.hidden) return;
  inflight = true;
  try {
    const res = await fetch(`/api/live?ids=${[...wanted.keys()].slice(0, 12).join(",")}`, { cache: "no-store" });
    if (res.ok) {
      const j = (await res.json()) as { matches?: LiveSnap[] };
      for (const m of j.matches ?? []) snaps.set(m.id, m);
      emit();
    }
  } catch {
    // network hiccup: try again next tick
  } finally {
    inflight = false;
  }
}

function onVisible() {
  if (!document.hidden) void poll();
}

function start() {
  if (timer) return;
  timer = setInterval(poll, POLL_MS);
  document.addEventListener("visibilitychange", onVisible);
  void poll();
}

function stop() {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
  document.removeEventListener("visibilitychange", onVisible);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** True from 15 minutes before kickoff until 3.5 hours after, unless the match is already over. */
function inWindow(kickoffIso: string, initialStatus: string): boolean {
  if (initialStatus === "FT" || initialStatus === "OFF") return false;
  const t = new Date(kickoffIso).getTime();
  const now = Date.now();
  return now >= t - BEFORE_KICKOFF_MS && now <= t + AFTER_KICKOFF_MS;
}

/** Live snapshot for one match. Polls only while the match is on, and stops once it has finished. */
export function useLiveSnap(id: number, kickoffIso: string, initialStatus: string): LiveSnap | null {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const check = () => setOpen(inWindow(kickoffIso, initialStatus));
    check();
    const t = setInterval(check, 30000);
    return () => clearInterval(t);
  }, [kickoffIso, initialStatus]);

  const snap = useSyncExternalStore(
    subscribe,
    () => snaps.get(id) ?? null,
    () => null
  );
  const finished = snap?.status === "FT" || snap?.status === "OFF";

  useEffect(() => {
    if (!open || finished) return;
    wanted.set(id, (wanted.get(id) ?? 0) + 1);
    start();
    return () => {
      const n = (wanted.get(id) ?? 1) - 1;
      if (n <= 0) wanted.delete(id);
      else wanted.set(id, n);
      if (wanted.size === 0) stop();
    };
  }, [id, open, finished]);

  return snap;
}

/* ---------- Match Centre: events and statistics for one match ---------- */

export type CentreData = { snap: LiveSnap | null; events: LiveEvent[]; stats: StatRow[]; at: number };

export function useMatchCentre(id: number, kickoffIso: string, initialStatus: string) {
  const [data, setData] = useState<CentreData | null>(null);
  const [failed, setFailed] = useState(false);
  const haveData = useRef(false);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const load = async () => {
      if (document.hidden && haveData.current) return;
      try {
        const res = await fetch(`/api/live/${id}`, { cache: "no-store" });
        if (!res.ok) throw new Error("bad response");
        const j = (await res.json()) as CentreData;
        if (stopped) return;
        haveData.current = true;
        setData(j);
        setFailed(false);
        // Keep refreshing only while the match is on.
        const over = j.snap?.status === "FT" || j.snap?.status === "OFF";
        if (over && timer) {
          clearInterval(timer);
          timer = null;
        }
      } catch {
        if (!stopped) setFailed(true);
      }
    };

    void load();
    if (inWindow(kickoffIso, initialStatus)) timer = setInterval(load, POLL_MS);
    return () => {
      stopped = true;
      if (timer) clearInterval(timer);
    };
  }, [id, kickoffIso, initialStatus]);

  return { data, failed };
}
