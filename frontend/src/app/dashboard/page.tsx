import { PageContainer } from "@/components/PageContainer";
import { Sidebar } from "@/components/Sidebar";
import { getBackendHealth } from "@/lib/api";

export const dynamic = "force-dynamic";

const stats = [
  { label: "Resume Status", value: "Not uploaded" },
  { label: "Total Interviews", value: "0" },
  { label: "Average Score", value: "N/A" },
];

export default async function DashboardPage() {
  const backendHealth = await getBackendHealth();

  return (
    <div className="min-h-screen bg-neutral-50 md:flex">
      <Sidebar />
      <PageContainer className="py-8">
        <section className="rounded-lg border border-neutral-200 bg-white p-6">
          <p className="text-sm font-medium text-neutral-500">Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold text-neutral-950">
            Welcome to HireMind
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
            Track interview readiness, review candidate sessions, and monitor
            hiring signals as the platform grows.
          </p>
          <div className="mt-5 inline-flex rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-medium text-neutral-800">
            {backendHealth.connected
              ? "Backend connected"
              : "Backend unavailable"}
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <article
              key={stat.label}
              className="rounded-lg border border-neutral-200 bg-white p-5"
            >
              <p className="text-sm font-medium text-neutral-500">
                {stat.label}
              </p>
              <p className="mt-3 text-2xl font-semibold text-neutral-950">
                {stat.value}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-neutral-950">
            Recent Interviews
          </h2>
          <div className="mt-6 rounded-md border border-dashed border-neutral-300 p-8 text-center">
            <p className="text-sm font-medium text-neutral-700">
              No interviews yet
            </p>
            <p className="mt-2 text-sm text-neutral-500">
              Recent interview activity will appear here once interviews are
              created.
            </p>
          </div>
        </section>
      </PageContainer>
    </div>
  );
}
