type HireMindLogoProps = {
  variant?: "icon" | "wordmark";
  size?: "sm" | "md" | "lg";
  subtitle?: boolean;
  className?: string;
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
            <linearGradient id="hiremind-logo-shine" x1="14" y1="10" x2="50" y2="54">
              <stop stopColor="#F8FAFC" stopOpacity="0.88" />
              <stop offset="1" stopColor="#F8FAFC" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <rect
            width="64"
            height="64"
            rx="18"
            fill="url(#hiremind-logo-gradient)"
          />
          <path
            d="M16 46V18h8v10h16V18h8v28h-8V35H24v11h-8Z"
            fill="url(#hiremind-logo-shine)"
          />
          <path
            d="M27 46V28l5 5 5-5v18h-6v-7l-4 4-4-4v7h4Z"
            fill="#EEF2FF"
            opacity="0.96"
          />
          <path
            d="M14 15h36"
            stroke="#FFFFFF"
            strokeOpacity="0.42"
            strokeWidth="2"
            strokeLinecap="round"
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
