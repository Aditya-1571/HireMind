import Link from "next/link";
import { Header } from "@/components/Header";
import { PageContainer } from "@/components/PageContainer";

const features = [
  "AI-assisted interview planning",
  "Structured candidate evaluation",
  "Recruiter-ready interview insights",
];

export default function Home() {
  return (
    <>
      <Header />
      <PageContainer className="py-16 sm:py-20">
        <section className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            AI Interview Platform
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-neutral-950 sm:text-5xl">
            HireMind
          </h1>
          <p className="mt-5 text-lg leading-8 text-neutral-600">
            HireMind helps teams run more consistent interviews with structured
            workflows, AI-assisted evaluation, and clear hiring signals.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex rounded-md border border-neutral-900 bg-neutral-950 px-5 py-3 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            Get Started
          </Link>
        </section>

        <section className="mt-14 grid gap-4 sm:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature}
              className="rounded-lg border border-neutral-200 bg-white p-5"
            >
              <h2 className="text-base font-semibold text-neutral-950">
                {feature}
              </h2>
            </div>
          ))}
        </section>
      </PageContainer>
    </>
  );
}
