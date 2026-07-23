import Link from "next/link";
import { Header } from "@/components/Header";
import { HireMindLogo } from "@/components/HireMindLogo";
import { Badge, Card, LinkButton } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";

const capabilityLabels = [
  "Role-specific questions",
  "Resume-aware practice",
  "AI evaluation",
  "Performance history",
  "Custom interview settings",
];

const features = [
  {
    title: "AI question generation",
    description:
      "Create targeted interview questions from role, difficulty, interview type, and analyzed resume context.",
    href: "/interviews/start",
  },
  {
    title: "Answer evaluation",
    description:
      "Complete an interview and receive structured scores, feedback, strengths, and improvement areas.",
    href: "/interviews/history",
  },
  {
    title: "Resume-aware preparation",
    description:
      "Upload resumes, extract readable text, and organize skills, projects, education, and experience.",
    href: "/dashboard#resume",
  },
  {
    title: "Professional reports",
    description:
      "Review completed interviews with question-by-question feedback and print-friendly summaries.",
    href: "/interviews/history",
  },
];

const steps = [
  "Upload or select your resume",
  "Configure role, difficulty, count, and timer",
  "Answer generated interview questions",
  "Review feedback and plan the next practice",
];

export default async function Home() {
  const user = await getCurrentUser();
  const startHref = user ? "/interviews/start" : "/login";

  return (
    <main className="min-h-screen overflow-hidden bg-[#050816] text-slate-50">
      <Header />
      <section className="hiremind-ambient relative px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="premium-grid absolute inset-0 opacity-45" aria-hidden="true" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="animate-hiremind-fade-up">
            <Badge tone="info">AI-powered interview preparation</Badge>
            <h1 className="mt-6 max-w-4xl text-[3.75rem] font-semibold leading-[0.96] tracking-[-0.055em] text-white sm:text-[4rem] lg:text-[4.5rem]">
              Practice smarter. Interview with confidence.
            </h1>
            <p className="mt-7 max-w-2xl text-[17px] leading-8 text-slate-300">
              Generate role-specific questions, practice realistic interviews,
              receive AI feedback, and track your improvement in one focused
              workspace.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href={startHref} variant="primary" className="px-5 py-3">
                Start practicing
              </LinkButton>
              <LinkButton href="#how-it-works" className="px-5 py-3">
                See how it works
              </LinkButton>
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              {capabilityLabels.map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-slate-300"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div
            className="animate-hiremind-float rounded-[2rem] border border-white/10 bg-slate-950/35 p-4 shadow-2xl shadow-blue-950/40 backdrop-blur-xl"
            aria-label="HireMind product preview"
          >
            <div className="rounded-[1.5rem] border border-slate-700/70 bg-[#0B1026]/90 p-5">
              <div className="flex items-center justify-between gap-4">
                <HireMindLogo size="sm" />
                <Badge tone="success">AI personalized</Badge>
              </div>
              <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <Card className="border-slate-700/70 bg-slate-900/72 p-5">
                  <p className="text-sm font-medium text-cyan-200">
                    Question 3 of 10
                  </p>
                  <h2 className="mt-3 text-lg font-semibold text-white">
                    How would you improve API performance for a role-based
                    dashboard?
                  </h2>
                  <div className="mt-5 h-28 rounded-2xl border border-slate-700/80 bg-slate-950/50 p-4 text-sm leading-6 text-slate-400">
                    I would first measure latency, identify slow endpoints, and
                    then optimize query patterns...
                  </div>
                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full w-[62%] rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500" />
                  </div>
                </Card>
                <div className="space-y-4">
                  <Card className="border-slate-700/70 bg-slate-900/72 p-5">
                    <p className="text-sm text-slate-400">Overall score</p>
                    <p className="mt-2 text-4xl font-semibold text-white">82</p>
                    <p className="mt-1 text-sm text-emerald-200">Strong</p>
                  </Card>
                  <Card className="border-slate-700/70 bg-slate-900/72 p-5">
                    <p className="text-sm font-medium text-slate-300">
                      Evaluation signals
                    </p>
                    <svg
                      viewBox="0 0 180 70"
                      className="mt-4 h-20 w-full text-cyan-300"
                      aria-hidden="true"
                    >
                      <path
                        d="M2 58 C34 52 35 22 68 27 C96 31 94 44 122 39 C148 34 149 12 178 15"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeWidth="4"
                        className="animate-hiremind-line"
                      />
                    </svg>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-cyan-300">Features</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.035em] text-white">
              Built around the real preparation workflow.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Link
                key={feature.title}
                href={feature.href}
                className="rounded-[1.35rem] border border-white/10 bg-white/[0.055] p-6 transition duration-200 hover:-translate-y-1 hover:border-cyan-300/35 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                <h3 className="text-base font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {feature.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold text-fuchsia-300">How it works</p>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {steps.map((step, index) => (
              <div
                key={step}
                className="rounded-2xl border border-white/10 bg-white/[0.055] p-5"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-fuchsia-500 text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <p className="mt-5 text-sm font-medium leading-6 text-slate-200">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="reports" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold text-cyan-300">Reports</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.035em] text-white">
              Turn practice sessions into reviewable progress.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              HireMind stores completed interviews, feedback, question-level
              scores, and print-friendly reports so you can prepare with a
              repeatable rhythm.
            </p>
          </div>
          <Card className="border-white/10 bg-white/[0.055] p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              {["Dashboard", "Interview", "Report"].map((label) => (
                <div key={label} className="rounded-2xl bg-slate-950/35 p-4">
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <div className="mt-4 space-y-2">
                    <div className="h-2 rounded-full bg-slate-700" />
                    <div className="h-2 w-3/4 rounded-full bg-slate-700" />
                    <div className="h-8 rounded-xl bg-gradient-to-r from-blue-500/40 to-fuchsia-500/40" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 text-center backdrop-blur">
          <h2 className="text-3xl font-semibold tracking-tight text-white">
            Ready for your next interview?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-400">
            Start a focused session, review the results, and keep your
            preparation history in one place.
          </p>
          <div className="mt-7 flex justify-center gap-3">
            <LinkButton href={startHref} variant="primary">
              Start an interview
            </LinkButton>
            <LinkButton href="/login">Sign in</LinkButton>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
          <div>
            <HireMindLogo size="sm" />
            <p className="mt-3 max-w-md">
              AI interview preparation with resume-aware practice, evaluation,
              history, and reports.
            </p>
          </div>
          <nav className="flex flex-wrap gap-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <Link href="/login" className="hover:text-white">Login</Link>
            <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
            <Link href="/interviews/start" className="hover:text-white">
              Start Interview
            </Link>
          </nav>
          <p>{new Date().getFullYear()} HireMind</p>
        </div>
      </footer>
    </main>
  );
}
