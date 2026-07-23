import Link from "next/link";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { HireMindLogo } from "@/components/HireMindLogo";
import { ThemeToggle } from "@/components/ThemeToggle";

const benefits = [
  "Resume-aware question generation",
  "AI evaluation with fallback",
  "Interview reports and history",
];

export default function LoginPage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="hiremind-ambient min-h-screen overflow-hidden bg-[#070B1D] px-4 py-6 text-slate-50 sm:px-6 lg:px-8"
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/" className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
          <HireMindLogo subtitle />
        </Link>
        <div className="w-36">
          <ThemeToggle compact />
        </div>
      </nav>

      <section className="mx-auto grid min-h-[calc(100vh-7rem)] max-w-7xl items-center gap-10 py-12 lg:grid-cols-[1fr_0.78fr]">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-cyan-300">
            Secure Google sign-in
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Continue your interview preparation workspace.
          </h1>
          <p className="mt-5 text-base leading-8 text-slate-300">
            Sign in to access your resumes, configured interviews, AI feedback,
            performance history, and saved settings.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {benefits.map((benefit) => (
              <div
                key={benefit}
                className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 text-sm font-medium text-slate-200"
              >
                {benefit}
              </div>
            ))}
          </div>
        </div>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.08] p-6 shadow-2xl shadow-blue-950/40 backdrop-blur-xl">
          <div className="rounded-3xl border border-slate-700/70 bg-slate-950/35 p-6">
            <HireMindLogo size="lg" subtitle />
            <h2 className="mt-8 text-2xl font-semibold text-white">
              Sign in to HireMind
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Use the same Google account you used to create your HireMind
              workspace.
            </p>
            <GoogleLoginButton />
            <Link
              href="/"
              className="mt-5 inline-flex rounded-xl px-1 py-2 text-sm font-medium text-slate-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              Back to home
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
