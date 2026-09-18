import { CalendarDays, Home, Shield, Target, User, type LucideIcon } from "lucide-react";

export const navItems: { name: string; href: string; icon: LucideIcon }[] = [
  { name: "Home", href: "/", icon: Home },
  { name: "Matches", href: "/matches", icon: CalendarDays },
  { name: "Predictions", href: "/predictions", icon: Target },
  { name: "Teams", href: "/teams", icon: Shield },
  { name: "Players", href: "/players", icon: User }
];

export const leagues: { name: string; dot: string; live: boolean }[] = [
  { name: "Premier League", dot: "#a86bff", live: true },
  { name: "La Liga", dot: "#ff6b6b", live: false },
  { name: "Serie A", dot: "#4c9bff", live: false },
  { name: "Bundesliga", dot: "#ff5c6c", live: false },
  { name: "Ligue 1", dot: "#f5b73a", live: false }
];

export function isActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/matches") return pathname.startsWith("/match");
  return pathname.startsWith(href);
}
