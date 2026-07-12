import { redirect } from "next/navigation";
import { PageContainer } from "@/components/PageContainer";
import { ResumeUploadForm } from "@/components/ResumeUploadForm";
import { Sidebar } from "@/components/Sidebar";
import { getInterviews, getResumes } from "@/lib/api";
import { getCurrentUser, getSessionToken } from "@/lib/auth";

const statusLabels: Record<string, string> = {
  uploaded: "Uploaded",
  processing: "Processing",
  ready: "Ready",
  failed: "Failed",
};

function getResumeStatusLabel(status?: string) {
  if (!status) {
    return "Not uploaded";
  }

  return statusLabels[status] ?? "Uploaded";
}

function getPreview(text: string) {
  return text.length > 280 ? `${text.slice(0, 280).trim()}...` : text;
}

function formatDate(value: string | null) {
  if (!value) {
    return "In progress";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function DashboardPage() {
  const [user, token] = await Promise.all([getCurrentUser(), getSessionToken()]);

  if (!user || !token) {
    redirect("/login");
  }

  const [resumes, interviews] = await Promise.all([
    getResumes(token),
    getInterviews(token),
  ]);
  const latestResume = resumes[0];
  const stats = [
    {
      label: "Resume Status",
      value: getResumeStatusLabel(latestResume?.processing_status),
    },
    { label: "Total Interviews", value: String(interviews.length) },
    { label: "Average Score", value: "N/A" },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 md:flex">
      <Sidebar />
      <PageContainer className="py-8">
        <section className="rounded-lg border border-neutral-200 bg-white p-6">
          <p className="text-sm font-medium text-neutral-500">Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold text-neutral-950">
            {user ? `Welcome, ${user.name}` : "Welcome to HireMind"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
            Track interview readiness, review candidate sessions, and monitor
            hiring signals as the platform grows.
          </p>
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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-neutral-950">
                Resume Upload
              </h2>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                Upload a resume so HireMind can tailor interview prep and
                evaluation to the candidate profile.
              </p>
            </div>
            {latestResume ? (
              <span className="rounded-md bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-700">
                {getResumeStatusLabel(latestResume.processing_status)}
              </span>
            ) : null}
          </div>
          <ResumeUploadForm />
          {latestResume ? (
            <div className="mt-5 rounded-md border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-sm font-medium text-neutral-700">
                Latest resume
              </p>
              <p className="mt-1 break-words text-sm text-neutral-950">
                {latestResume.original_filename}
              </p>
              <p className="mt-2 text-sm text-neutral-500">
                Status: {getResumeStatusLabel(latestResume.processing_status)}
              </p>
              {latestResume.processing_status === "ready" &&
              latestResume.extracted_text ? (
                <p className="mt-3 text-sm leading-6 text-neutral-600">
                  {getPreview(latestResume.extracted_text)}
                </p>
              ) : null}
              {latestResume.processing_status === "failed" ? (
                <p className="mt-3 text-sm text-red-600">
                  No readable resume text could be extracted.
                </p>
              ) : null}
              {latestResume.processing_status === "processing" ? (
                <p className="mt-3 text-sm text-neutral-600">
                  Resume text extraction is in progress.
                </p>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-neutral-950">
            Recent Interviews
          </h2>
          {interviews.length > 0 ? (
            <div className="mt-5 divide-y divide-neutral-200">
              {interviews.slice(0, 5).map((interview) => (
                <div
                  key={interview.id}
                  className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-950">
                      {interview.interview_type} - {interview.difficulty}
                    </p>
                    <p className="mt-1 text-sm text-neutral-500">
                      {interview.answered_count} of {interview.total_questions}{" "}
                      answered
                    </p>
                  </div>
                  <div className="text-sm text-neutral-500">
                    {interview.status === "completed"
                      ? formatDate(interview.completed_at)
                      : "In progress"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-md border border-dashed border-neutral-300 p-8 text-center">
              <p className="text-sm font-medium text-neutral-700">
                No interviews yet
              </p>
              <p className="mt-2 text-sm text-neutral-500">
                Recent interview activity will appear here once interviews are
                created.
              </p>
            </div>
          )}
        </section>
      </PageContainer>
    </div>
  );
}
