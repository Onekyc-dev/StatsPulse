"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

/** Shows an "Install" button when Chrome says StatPulse can be installed. Hidden once installed. */
export function InstallButton({ variant }: { variant: "icon" | "full" }) {
  const [evt, setEvt] = useState<PromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as PromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setEvt(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!evt || installed) return null;

  const install = async () => {
    await evt.prompt();
    const choice = await evt.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setEvt(null);
  };

  if (variant === "icon") {
    return (
      <button
        onClick={install}
        aria-label="Install StatPulse"
        className="flex h-10 items-center gap-1.5 rounded-xl border border-pulse-500/30 bg-pulse-500/10 px-3 text-[13px] font-bold text-pulse-400 hover:bg-pulse-500/15"
      >
        <Download size={16} />
        Install
      </button>
    );
  }
  return (
    <button
      onClick={install}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-pulse-500 px-4 py-2.5 text-sm font-bold text-[#03100c] transition hover:bg-pulse-400"
    >
      <Download size={16} />
      Install StatPulse
    </button>
  );
}
