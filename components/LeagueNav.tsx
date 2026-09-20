import Link from "next/link";

const TABS = [
  { key: "table", label: "Table", href: "/table" },
  { key: "teams", label: "Clubs", href: "/teams" },
  { key: "players", label: "Top players", href: "/players" }
] as const;

/** Switcher shared by the league pages. */
export function LeagueNav({ active }: { active: "table" | "teams" | "players" }) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      {TABS.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          aria-current={active === t.key ? "page" : undefined}
          className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
            active === t.key ? "border-pulse-500 bg-pulse-500 text-[#03100c]" : "border-white/[0.1] bg-white/[0.03] text-white/65 hover:text-white"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
