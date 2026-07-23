import { Button, Card, LinkButton } from "@/components/ui";

export function ErrorState({
  title,
  description,
  onRetry,
  homeHref = "/dashboard",
}: {
  title: string;
  description: string;
  onRetry?: () => void;
  homeHref?: string;
}) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen px-4 py-16 sm:px-6 lg:px-8"
    >
      <div className="mx-auto flex max-w-2xl items-center justify-center">
        <Card className="w-full p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-red-600 dark:border-red-400/25 dark:bg-red-400/10 dark:text-red-200">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none">
              <path d="M12 8v5M12 17h.01" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
              <path d="M10.3 4.3 2.9 17.1A2 2 0 0 0 4.6 20h14.8a2 2 0 0 0 1.7-2.9L13.7 4.3a2 2 0 0 0-3.4 0Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
            </svg>
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-[-0.02em] text-slate-950 dark:text-slate-50">
            {title}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">
            {description}
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            {onRetry ? <Button onClick={onRetry}>Try again</Button> : null}
            <LinkButton href={homeHref} variant={onRetry ? "secondary" : "primary"}>
              Go to dashboard
            </LinkButton>
          </div>
        </Card>
      </div>
    </main>
  );
}
