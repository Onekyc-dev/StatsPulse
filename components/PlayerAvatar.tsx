"use client";

import { useEffect, useRef, useState } from "react";

/** Player photo from the data provider's image service, with initials if it is missing. */
export function PlayerAvatar({ id, name, size = 36 }: { id: number | null; name: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, []);

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");

  if (!id || failed) {
    return (
      <span
        className="flex shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-[11px] font-bold text-white/60"
        style={{ width: size, height: size }}
        aria-hidden
      >
        {initials}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={`https://sports.bzzoiro.com/img/player/${id}/`}
      alt={name}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="shrink-0 rounded-full bg-white/[0.06] object-cover"
      style={{ width: size, height: size }}
    />
  );
}
