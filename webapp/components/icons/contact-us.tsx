export function ContactUsIcon() {
  return (
    <svg
      width="320"
      height="320"
      viewBox="0 0 320 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Background circle */}
      <circle cx="160" cy="160" r="130" className="fill-muted" opacity="0.4" />

      {/* Monitor / screen */}
      <rect
        x="80"
        y="110"
        width="160"
        height="100"
        rx="10"
        className="fill-muted stroke-border"
        strokeWidth="2"
      />
      {/* Screen glow area */}
      <rect
        x="88"
        y="118"
        width="144"
        height="84"
        rx="6"
        fill="hsl(var(--primary))"
        opacity="0.08"
      />
      {/* Monitor stand */}
      <rect
        x="148"
        y="210"
        width="24"
        height="20"
        className="fill-muted stroke-border"
        strokeWidth="2"
      />
      <rect
        x="130"
        y="228"
        width="60"
        height="8"
        rx="4"
        className="fill-muted stroke-border"
        strokeWidth="2"
      />

      {/* Screen content: search bar */}
      <rect
        x="100"
        y="132"
        width="120"
        height="16"
        rx="8"
        className="fill-background stroke-border"
        strokeWidth="1.5"
      />
      {/* Magnifier icon inside bar */}
      <circle
        cx="110"
        cy="140"
        r="3"
        className="stroke-primary"
        strokeWidth="1.5"
        fill="none"
      />
      <line
        x1="113"
        y1="143"
        x2="115"
        y2="145"
        className="stroke-primary"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Screen content: keyword rows */}
      <rect
        x="100"
        y="158"
        width="80"
        height="6"
        rx="3"
        className="fill-border"
        opacity="0.8"
      />
      <rect
        x="100"
        y="170"
        width="60"
        height="6"
        rx="3"
        className="fill-border"
        opacity="0.6"
      />
      <rect
        x="100"
        y="182"
        width="70"
        height="6"
        rx="3"
        className="fill-border"
        opacity="0.4"
      />

      {/* Screen content: bar chart (right side) */}
      <rect
        x="194"
        y="180"
        width="8"
        height="12"
        rx="2"
        fill="hsl(var(--primary))"
        opacity="0.5"
      />
      <rect
        x="206"
        y="170"
        width="8"
        height="22"
        rx="2"
        fill="hsl(var(--primary))"
        opacity="0.7"
      />
      <rect
        x="194"
        y="158"
        width="18"
        height="2"
        rx="1"
        className="fill-border"
        opacity="0.3"
      />

      {/* Floating keyword badge — "SEO" */}
      <rect
        x="20"
        y="90"
        width="52"
        height="22"
        rx="11"
        fill="hsl(var(--primary))"
        opacity="0.15"
        className="stroke-primary"
        strokeWidth="1.2"
      />
      <text
        x="46"
        y="105"
        textAnchor="middle"
        fontSize="10"
        fontWeight="600"
        fill="hsl(var(--primary))"
      >
        SEO
      </text>

      {/* Floating keyword badge — "CPC" */}
      <rect
        x="248"
        y="70"
        width="52"
        height="22"
        rx="11"
        fill="hsl(var(--primary))"
        opacity="0.15"
        className="stroke-primary"
        strokeWidth="1.2"
      />
      <text
        x="274"
        y="85"
        textAnchor="middle"
        fontSize="10"
        fontWeight="600"
        fill="hsl(var(--primary))"
      >
        CPC
      </text>

      {/* Floating keyword badge — "volume" */}
      <rect
        x="220"
        y="228"
        width="70"
        height="22"
        rx="11"
        fill="hsl(var(--primary))"
        opacity="0.1"
        className="stroke-primary"
        strokeWidth="1.2"
      />
      <text
        x="255"
        y="243"
        textAnchor="middle"
        fontSize="10"
        fontWeight="600"
        fill="hsl(var(--primary))"
      >
        volume
      </text>

      {/* Dot trail from badge to screen */}
      <circle cx="72" cy="104" r="2" fill="hsl(var(--primary))" opacity="0.4" />
      <circle
        cx="82"
        cy="112"
        r="1.5"
        fill="hsl(var(--primary))"
        opacity="0.3"
      />

      <circle cx="248" cy="94" r="2" fill="hsl(var(--primary))" opacity="0.4" />
      <circle
        cx="240"
        cy="104"
        r="1.5"
        fill="hsl(var(--primary))"
        opacity="0.3"
      />

      {/* Sparkle top-right */}
      <path
        d="M270 48 L272 54 L278 56 L272 58 L270 64 L268 58 L262 56 L268 54 Z"
        fill="hsl(var(--primary))"
        opacity="0.5"
      />

      {/* Tiny star bottom-left */}
      <path
        d="M50 240 L51.5 244 L56 244 L52.5 247 L54 252 L50 249 L46 252 L47.5 247 L44 244 L48.5 244 Z"
        fill="hsl(var(--primary))"
        opacity="0.35"
      />
    </svg>
  );
}
