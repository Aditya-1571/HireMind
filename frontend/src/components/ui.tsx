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
};

type LinkButtonProps = BaseProps & {
  href: string;
  variant?: "primary" | "secondary" | "ghost";
};

type BadgeProps = BaseProps & {
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-cyan-300 dark:focus-visible:ring-offset-slate-950";

const buttonVariants = {
  primary:
    "border border-transparent bg-gradient-to-r from-blue-600 to-fuchsia-500 text-white shadow-sm shadow-blue-950/20 hover:from-blue-500 hover:to-fuchsia-400 disabled:from-slate-300 disabled:to-slate-300 disabled:text-white dark:shadow-blue-950/40",
  secondary:
    "border border-slate-200/80 bg-white/80 text-slate-800 shadow-sm shadow-blue-950/[0.03] hover:border-blue-200 hover:bg-blue-50 disabled:text-slate-400 dark:border-slate-700/70 dark:bg-slate-900/45 dark:text-slate-100 dark:shadow-none dark:hover:border-cyan-400/50 dark:hover:bg-slate-800/80 dark:disabled:text-slate-500",
  ghost:
    "border border-transparent bg-transparent text-slate-700 hover:bg-blue-50 disabled:text-slate-400 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:disabled:text-slate-600",
  danger:
    "border border-red-200 bg-white/80 text-red-700 hover:bg-red-50 disabled:text-red-300 dark:border-red-400/25 dark:bg-red-950/20 dark:text-red-200 dark:hover:bg-red-950/35",
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
      className={`rounded-2xl border border-slate-200/75 bg-white/82 shadow-sm shadow-blue-950/[0.04] backdrop-blur-xl dark:border-slate-700/55 dark:bg-slate-900/58 dark:shadow-blue-950/20 ${className}`}
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
    <Card className="p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          {eyebrow ? (
            <p className="text-sm font-medium text-blue-700 dark:text-cyan-300">{eyebrow}</p>
          ) : null}
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
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
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${focusRing} ${buttonVariants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  children,
  className = "",
  href,
  variant = "secondary",
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition-colors ${focusRing} ${buttonVariants[variant]} ${className}`}
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
    <div className={`rounded-md border p-4 text-sm ${styles[tone]} ${className}`}>
      {children}
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
      className={`rounded-2xl border border-dashed border-slate-300/80 bg-blue-50/45 p-8 text-center dark:border-slate-700 dark:bg-slate-900/35 ${className}`}
    >
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
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
    <Card className="p-5">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
        {value}
      </p>
      {helper ? <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{helper}</p> : null}
    </Card>
  );
}

export const fieldClassName = `w-full rounded-xl border border-slate-200/80 bg-white/85 px-3 py-2 text-sm text-slate-900 shadow-sm shadow-blue-950/[0.03] transition-colors placeholder:text-slate-400 focus:border-blue-400 dark:border-slate-700/70 dark:bg-slate-950/35 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-300 ${focusRing}`;

export const disabledFieldClassName =
  "w-full rounded-xl border border-slate-200/70 bg-slate-100/80 px-3 py-2 text-sm text-slate-600 dark:border-slate-700/60 dark:bg-slate-900/50 dark:text-slate-400";
