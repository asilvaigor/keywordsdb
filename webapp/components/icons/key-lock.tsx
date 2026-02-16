function KeyLock({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Glow circle behind the lock */}
      <circle cx="100" cy="72" r="56" className="fill-primary/10" />
      <circle cx="100" cy="72" r="36" className="fill-primary/15" />

      {/* Lock body */}
      <rect
        x="76"
        y="64"
        width="48"
        height="36"
        rx="6"
        className="fill-primary/25 stroke-primary"
        strokeWidth="2.5"
      />

      {/* Lock shackle (open) */}
      <path
        d="M86 64V52C86 42 92 36 100 36C108 36 114 42 114 52"
        className="stroke-primary"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Shackle open part - lifted arc */}
      <path
        d="M114 52V44"
        className="stroke-primary/60"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="3 3"
      />

      {/* Keyhole */}
      <circle cx="100" cy="78" r="5" className="fill-primary" />
      <rect
        x="98"
        y="82"
        width="4"
        height="8"
        rx="1"
        className="fill-primary"
      />

      {/* Sparkles */}
      <g className="animate-pulse">
        <circle cx="134" cy="42" r="2.5" className="fill-primary/70" />
        <circle cx="66" cy="50" r="2" className="fill-primary/50" />
        <circle cx="142" cy="70" r="1.5" className="fill-primary/60" />
        <circle cx="56" cy="82" r="1.5" className="fill-primary/40" />
      </g>

      {/* Decorative sparkle stars */}
      <path
        d="M140 34l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"
        className="fill-primary/60"
      />
      <path
        d="M58 38l1.5 3.5 3.5 1.5-3.5 1.5L58 48l-1.5-3.5L53 43l3.5-1.5z"
        className="fill-primary/40"
      />
      <path
        d="M150 58l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z"
        className="fill-primary/50"
      />
    </svg>
  );
}

export default KeyLock;
