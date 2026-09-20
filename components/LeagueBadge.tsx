"use client";

import { useEffect, useRef, useState } from "react";

/** Competition logo from the data provider's image service. Shows nothing if it is unavailable. */
export function LeagueBadge({ id = 1, size = 18, name = "Premier League" }: { id?: number; size?: number; name?: string }) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, []);

  if (failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={`https://sports.bzzoiro.com/img/league/${id}/?bg=transparent`}
      alt={`${name} logo`}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="shrink-0 object-contain"
      style={{ width: size, height: size }}
    />
  );
}
