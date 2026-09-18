/** Placeholder crest: a shield in the team colour with its short code. Real crests need a licensed data source. */
export function Crest({ short, color, size = 48 }: { short: string; color: string; size?: number }) {
  return (
    <svg
      width={size}
      height={Math.round(size * 1.1)}
      viewBox="0 0 48 53"
      role="img"
      aria-label={`${short} crest`}
      className="shrink-0"
    >
      <path d="M24 2 44 8v18c0 12-9 21-20 25C13 47 4 38 4 26V8Z" fill={color} />
      <path d="M24 2 44 8v18c0 12-9 21-20 25Z" fill="#000" opacity="0.2" />
      <path
        d="M24 2 44 8v18c0 12-9 21-20 25C13 47 4 38 4 26V8Z"
        fill="none"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="1.5"
      />
      <text
        x="24"
        y="31"
        textAnchor="middle"
        fontSize="13"
        fontWeight="800"
        fill="#fff"
        fontFamily="var(--font-display), system-ui, sans-serif"
      >
        {short}
      </text>
    </svg>
  );
}
