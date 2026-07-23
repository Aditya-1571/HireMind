import Link from "next/link";

type BaseProps = {
  children: React.ReactNode;
  className?: string;
  id?: string;
};

type ButtonProps = BaseProps & {
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};

type LinkButtonProps = BaseProps & {
  href: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
};

type BadgeProps = BaseProps & {
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-cyan-300 dark:focus-visible:ring-offset-slate-950";

const buttonVariants = {
  primary:
    "border border-transparent bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-500 text-white shadow-sm shadow-blue-950/20 hover:from-blue-500 hover:via-violet-500 hover:to-fuchsia-400 disabled:from-slate-300 disabled:via-slate-300 disabled:to-slate-300 disabled:text-white dark:shadow-blue-950/40 dark:disabled:from-slate-700 dark:disabled:via-slate-700 dark:disabled:to-slate-700 dark:disabled:text-slate-300",
  secondary:
    "border border-slate-200/80 bg-white/80 text-slate-800 shadow-sm shadow-blue-950/[0.03] hover:border-blue-200 hover:bg-blue-50 disabled:text-slate-400 dark:border-slate-700/70 dark:bg-slate-900/45 dark:text-slate-100 dark:shadow-none dark:hover:border-cyan-400/50 dark:hover:bg-slate-800/80 dark:disabled:text-slate-500",
  ghost:
    "border border-transparent bg-transparent text-slate-700 hover:bg-blue-50 disabled:text-slate-400 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:disabled:text-slate-600",
  danger:
    "border border-red-200 bg-white/80 text-red-700 hover:bg-red-50 disabled:text-red-300 dark:border-red-400/25 dark:bg-red-950/20 dark:text-red-200 dark:hover:bg-red-950/35",
};

const buttonSizes = {
  sm: "min-h-9 px-3 py-1.5",
  md: "min-h-10 px-4 py-2",
  lg: "min-h-12 px-5 py-3",
};

const badgeTones = {
  neutral:
    "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800/75 dark:text-slate-200 dark:ring-slate-700",
  success:
    "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-200 dark:ring-emerald-400/25",
  warning:
    "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-400/25",
  danger:
    "bg-red-50 text-red-700 ring-red-200 dark:bg-red-400/10 dark:text-red-200 dark:ring-red-400/25",
  info:
    "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-cyan-400/10 dark:text-cyan-200 dark:ring-cyan-400/25",
};

export function Card({ children, className = "", id }: BaseProps) {
  return (
    <section
      id={id}
      className={`group/card rounded-[1.35rem] border border-slate-200/70 bg-gradient-to-br from-white/92 via-white/82 to-blue-50/52 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_70px_rgba(37,99,235,0.10)] dark:border-slate-700/45 dark:bg-gradient-to-br dark:from-[#111A38]/88 dark:via-[#0D1530]/82 dark:to-[#080D20]/76 dark:shadow-[0_22px_70px_rgba(2,6,23,0.30)] dark:hover:shadow-[0_26px_80px_rgba(37,99,235,0.15)] ${className}`}
    >
      {children}
    </section>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="p-7 sm:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          {eyebrow ? (
            <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-cyan-300">{eyebrow}</p>
          ) : null}
          <h1 className="mt-3 text-[2rem] font-semibold leading-tight tracking-[-0.025em] text-slate-950 dark:text-slate-50 sm:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-4 max-w-2xl text-[15px] leading-7 text-slate-600 dark:text-slate-300">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </Card>
  );
}

export function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">{title}</h2>
      {description ? (
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
      ) : null}
    </div>
  );
}

export function Button({
  children,
  className = "",
  type = "button",
  disabled,
  onClick,
  variant = "primary",
  size = "md",
  loading = false,
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:translate-y-0 disabled:cursor-not-allowed ${focusRing} ${buttonSizes[size]} ${buttonVariants[variant]} ${className}`}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : null}
      {children}
    </button>
  );
}

export function LinkButton({
  children,
  className = "",
  href,
  variant = "secondary",
  size = "md",
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-xl text-sm font-semibold transition duration-200 hover:-translate-y-0.5 active:translate-y-0 ${focusRing} ${buttonSizes[size]} ${buttonVariants[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}

export function Badge({ children, className = "", tone = "neutral" }: BadgeProps) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${badgeTones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Alert({
  children,
  tone = "danger",
  className = "",
}: BaseProps & { tone?: "success" | "warning" | "danger" | "info" }) {
  const styles = {
    success:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-100",
    warning:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-100",
    danger:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-400/25 dark:bg-red-400/10 dark:text-red-100",
    info:
      "border-blue-200 bg-blue-50 text-blue-800 dark:border-cyan-400/25 dark:bg-cyan-400/10 dark:text-cyan-100",
  };

  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={`rounded-md border p-4 text-sm ${styles[tone]} ${className}`}
    >
      {children}
    </div>
  );
}

export function Toast({
  children,
  tone = "info",
  className = "",
}: BaseProps & { tone?: "success" | "warning" | "danger" | "info" }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm px-4">
      <Alert tone={tone} className={`shadow-lg shadow-slate-950/10 dark:shadow-black/30 ${className}`}>
        {children}
      </Alert>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  className = "",
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[1.35rem] border border-dashed border-slate-300/80 bg-gradient-to-br from-blue-50/70 to-fuchsia-50/40 p-8 text-center dark:border-slate-700 dark:from-slate-900/55 dark:to-[#111A38]/45 ${className}`}
    >
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-fuchsia-500 text-white shadow-lg shadow-blue-950/20">
        <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5" fill="none">
          <path d="M5 10h10M10 5v10" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        </svg>
      </div>
      <p className="text-base font-semibold text-slate-800 dark:text-slate-100">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-[15px] leading-7 text-slate-500 dark:text-slate-400">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <Card className="p-6">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.025em] text-slate-950 dark:text-slate-50">
        {value}
      </p>
      {helper ? <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{helper}</p> : null}
    </Card>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-2xl bg-slate-200/75 dark:bg-slate-800/65 ${className}`}
    />
  );
}

export const fieldClassName = `w-full rounded-xl border border-slate-200/80 bg-white/85 px-3 py-2 text-sm text-slate-900 shadow-sm shadow-blue-950/[0.03] transition-colors placeholder:text-slate-400 focus:border-blue-400 dark:border-slate-700/70 dark:bg-slate-950/35 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-300 ${focusRing}`;

export const disabledFieldClassName =
  "w-full rounded-xl border border-slate-200/70 bg-slate-100/80 px-3 py-2 text-sm text-slate-600 dark:border-slate-700/60 dark:bg-slate-900/50 dark:text-slate-400";
