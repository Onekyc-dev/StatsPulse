
import {
  Home,
  Radio,
  Shield,
  Star,
  Target,
  Trophy,
  User,
  type LucideIcon,
} from "lucide-react";

export const navItems: {
  name: string;
  href: string;
  icon: LucideIcon;
  bottom: boolean;
}[] = [
  { name: "Home", href: "/", icon: Home, bottom: true },
  { name: "Live", href: "/live", icon: Radio, bottom: true },
  { name: "Table", href: "/table", icon: Trophy, bottom: false },
  { name: "Predictions", href: "/predictions", icon: Target, bottom: true },
  { name: "Teams", href: "/teams", icon: Shield, bottom: false },
  { name: "Players", href: "/players", icon: User, bottom: false },
  { name: "Favourites", href: "/favourites", icon: Star, bottom: true },
];

export const leagues: {
  name: string;
  dot: string;
  live: boolean;
}[] = [
  { name: "Premier League", dot: "#a86bff", live: true },
  { name: "La Liga", dot: "#ff6b6b", live: false },
  { name: "Serie A", dot: "#4c9bff", live: false },
  { name: "Bundesliga", dot: "#ff5c6c", live: false },
  { name: "Ligue 1", dot: "#f5b73a", live: false },
];

export function isActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/teams") return pathname.startsWith("/team");
  if (href === "/live" || href === "/favourites") {
    return pathname === href || pathname.startsWith(`${href}/`);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
