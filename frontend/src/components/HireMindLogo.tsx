type HireMindLogoProps = {
  variant?: "icon" | "wordmark";
  size?: "sm" | "md" | "lg";
  subtitle?: boolean;
  className?: string;
  tone?: "gradient" | "mono";
};

const sizes = {
  sm: {
    icon: "h-8 w-8",
    title: "text-base",
    subtitle: "text-[10px]",
  },
  md: {
    icon: "h-10 w-10",
    title: "text-lg",
    subtitle: "text-xs",
  },
  lg: {
    icon: "h-14 w-14",
    title: "text-2xl",
    subtitle: "text-sm",
  },
};

export function HireMindLogo({
  variant = "wordmark",
  size = "md",
  subtitle = false,
  className = "",
  tone = "gradient",
}: HireMindLogoProps) {
  const selected = sizes[size];

  return (
    <span
      aria-label="HireMind"
      className={`inline-flex items-center gap-3 ${className}`}
      role="img"
    >
      <span className={`relative inline-flex ${selected.icon}`}>
        <svg
          viewBox="0 0 64 64"
          className="h-full w-full drop-shadow-[0_10px_22px_rgba(37,99,235,0.25)]"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="hiremind-logo-gradient" x1="8" y1="8" x2="56" y2="56">
              <stop stopColor="#22D3EE" />
              <stop offset="0.45" stopColor="#2563EB" />
              <stop offset="1" stopColor="#A855F7" />
            </linearGradient>
          </defs>
          <rect
            width="64"
            height="64"
            rx="16"
            fill={tone === "gradient" ? "url(#hiremind-logo-gradient)" : "currentColor"}
          />
          <path
            d="M15 46V18h10v10h14V18h10v28H39V36H25v10H15Z"
            fill="#F8FAFC"
          />
          <path
            d="M25 46V31l7 7 7-7v15h-7v-5l-7-7v12h-7Z"
            fill="#EEF2FF"
            opacity="0.98"
          />
        </svg>
      </span>
      {variant === "wordmark" ? (
        <span className="leading-tight">
          <span
            className={`block font-semibold tracking-tight text-slate-950 dark:text-slate-50 ${selected.title}`}
          >
            HireMind
          </span>
          {subtitle ? (
            <span
              className={`block font-medium text-slate-500 dark:text-slate-400 ${selected.subtitle}`}
            >
              AI Interview Prep
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
