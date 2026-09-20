"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Club badge. Uses the data provider's image service, which serves badges for identifying teams inside the app.
 * If the image is missing or fails to load, a coloured shield with the team code is shown instead.
 */
export function Crest({ short, color, size = 48, teamId, name }: { short: string; color: string; size?: number; teamId?: number; name?: string }) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  // The error can fire before the page finishes loading, so check once on mount as well.
  useEffect(() => {
    const el = ref.current;
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, []);

  if (teamId && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        ref={ref}
        src={`https://sports.bzzoiro.com/img/team/${teamId}/?bg=transparent`}
        alt={`${name ?? short} badge`}
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

  return (
    <svg width={size} height={Math.round(size * 1.1)} viewBox="0 0 48 53" role="img" aria-label={`${short} badge`} className="shrink-0">
      <path d="M24 2 44 8v18c0 12-9 21-20 25C13 47 4 38 4 26V8Z" fill={color} />
      <path d="M24 2 44 8v18c0 12-9 21-20 25Z" fill="#000" opacity="0.2" />
      <path d="M24 2 44 8v18c0 12-9 21-20 25C13 47 4 38 4 26V8Z" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
      <text x="24" y="31" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff" fontFamily="var(--font-display), system-ui, sans-serif">
        {short}
      </text>
    </svg>
  );
}
