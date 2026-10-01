import { Bell } from "lucide-react";
import { InstallButton } from "@/components/InstallButton";
import { SearchBox } from "@/components/SearchBox";
import { MobileSearchButton } from "@/components/MobileSearchButton";
import { MobileMenuButton } from "./MobileMenu";
import { LogoLink } from "./LogoLink";

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-ink/85 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <MobileMenuButton />
        <LogoLink />
        <SearchBox variant="bar" />
        <div className="ml-auto flex items-center gap-2">
          <MobileSearchButton />
          <InstallButton variant="icon" />
          <button
            aria-label="Notifications"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white/70 hover:bg-white/[0.05]"
          >
            <Bell size={19} />
          </button>
          <button className="hidden rounded-xl bg-pulse-500 px-4 py-2 text-sm font-bold text-[#03100c] transition hover:bg-pulse-400 sm:block">
            Sign in
          </button>
        </div>
      </div>
    </header>
  );
}
