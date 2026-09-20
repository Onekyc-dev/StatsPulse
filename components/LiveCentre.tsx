"use client";

import { useEffect, useRef, useState } from "react";
import { useLiveSnap } from "@/lib/liveClient";

type Slim = {
  id: number;
  kickoff: string;
  status: "UPCOMING" | "TODAY" | "LIVE" | "FT" | "OFF";
  score: { home: number; away: number } | null;
  time: string;
  dateLabel: string;
};

/**
 * The middle of a match card: status, score or kickoff time, and the date.
 * Updates by itself while the match is on (minute, half time, full time, goals).
 */
export function LiveCentre({
  match,
  size = "text-[26px]",
  subClass = "text-[11px] text-white/40",
  gap = "mt-1"
}: {
  match: Slim;
  size?: string;
  subClass?: string;
  gap?: string;
}) {
  const snap = useLiveSnap(match.id, match.kickoff, match.status);
  const status = snap && snap.status !== "UPCOMING" ? snap.status : match.status;
  const home = snap?.home ?? match.score?.home ?? null;
  const away = snap?.away ?? match.score?.away ?? null;
  const showScore = (status === "LIVE" || status === "FT") && home !== null && away !== null;
  const scoreKey = showScore ? `${home}-${away}` : null;

  // Highlight the score for a few seconds after a goal.
  const prev = useRef<string | null>(null);
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    const before = prev.current;
    prev.current = scoreKey;
    if (before !== null && scoreKey !== null && before !== scoreKey && status === "LIVE") {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 4000);
      return () => clearTimeout(t);
    }
  }, [scoreKey, status]);

  let pill: React.ReactNode;
  if (status === "LIVE") {
    const label = snap?.label ?? "";
    pill = (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-loss">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-loss" />
        {label === "HT" ? "Half time" : label && label !== "Live" ? `Live ${label}` : "Live"}
      </span>
    );
  } else if (status === "FT") {
    pill = <span className="text-[11px] font-bold text-white/50">Full time</span>;
  } else if (status === "OFF") {
    pill = <span className="text-[11px] font-bold text-draw">Off</span>;
  } else if (status === "TODAY") {
    pill = (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-pulse-400">
        <span className="h-1.5 w-1.5 rounded-full bg-pulse-500" />
        Today
      </span>
    );
  } else {
    pill = <span className="text-[11px] font-semibold text-white/45">{match.dateLabel}</span>;
  }

  const ht = status === "LIVE" && snap && snap.label !== "HT" && snap.htHome !== null && snap.htAway !== null ? `Half time ${snap.htHome}–${snap.htAway}` : null;
  const sub = ht ?? (status === "FT" ? match.dateLabel : `${match.dateLabel}, UK time`);

  return (
    <>
      {pill}
      <div className={`${gap} font-display font-extrabold leading-none tnum transition-colors duration-500 ${size} ${flash ? "text-pulse-400" : ""}`}>
        {showScore ? `${home}–${away}` : match.time}
      </div>
      <div className={`mt-1.5 ${subClass}`}>{sub}</div>
    </>
  );
}
