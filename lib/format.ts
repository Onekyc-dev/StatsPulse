import type { MatchStatus } from "./types";

const TZ = "Europe/London";
const dateFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" });
const timeFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });
const dayKey = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: TZ });

export function formatKickoff(iso: string) {
  const d = new Date(iso);
  return { dateLabel: dateFmt.format(d), time: timeFmt.format(d) };
}

export function deriveStatus(providerStatus: string, kickoffIso: string, now: Date): MatchStatus {
  const s = providerStatus.toLowerCase();
  if (s === "finished") return "FT";
  if (["cancelled", "canceled", "postponed", "abandoned", "suspended", "unresolved"].includes(s)) return "OFF";
  // A match that never got a final status is treated as finished after 3.5 hours, so it cannot show "Live" forever.
  if (now.getTime() - new Date(kickoffIso).getTime() > 3.5 * 3600000) return "FT";
  if (s === "notstarted" || s === "scheduled" || s === "upcoming") {
    return dayKey(new Date(kickoffIso)) === dayKey(now) ? "TODAY" : "UPCOMING";
  }
  return "LIVE";
}

export function niceTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${dateFmt.format(d)}, ${timeFmt.format(d)} UK time`;
}
