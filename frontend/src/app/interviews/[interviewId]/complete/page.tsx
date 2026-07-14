import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageContainer } from "@/components/PageContainer";
import { Sidebar } from "@/components/Sidebar";
import { getInterview } from "@/lib/api";
import { getCurrentUser, getSessionToken } from "@/lib/auth";

type CompletePageProps = {
  params: Promise<{ interviewId: string }>;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not completed";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function InterviewCompletePage({ params }: CompletePageProps) {
  const { interviewId } = await params;
  const [user, token] = await Promise.all([getCurrentUser(), getSessionToken()]);

  if (!user || !token) {
    redirect("/login");
  }

  const interview = await getInterview(token, interviewId);

  if (!interview) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-neutral-50 md:flex">
      <Sidebar />
      <PageContainer className="py-8">
        <section className="rounded-lg border border-neutral-200 bg-white p-6">
          <p className="text-sm font-medium text-neutral-500">
            Interview Complete
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-neutral-950">
            Summary
          </h1>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border border-neutral-200 p-4">
              <dt className="text-sm text-neutral-500">Interview type</dt>
              <dd className="mt-1 font-medium text-neutral-950">
                {interview.interview_type}
              </dd>
            </div>
            <div className="rounded-md border border-neutral-200 p-4">
              <dt className="text-sm text-neutral-500">Difficulty</dt>
              <dd className="mt-1 font-medium text-neutral-950">
                {interview.difficulty}
              </dd>
            </div>
            <div className="rounded-md border border-neutral-200 p-4">
              <dt className="text-sm text-neutral-500">Target role</dt>
              <dd className="mt-1 font-medium text-neutral-950">
                {interview.target_role}
              </dd>
            </div>
            <div className="rounded-md border border-neutral-200 p-4">
              <dt className="text-sm text-neutral-500">Answered questions</dt>
              <dd className="mt-1 font-medium text-neutral-950">
                {interview.answered_count} of {interview.total_questions}
              </dd>
            </div>
            <div className="rounded-md border border-neutral-200 p-4">
              <dt className="text-sm text-neutral-500">Completion date</dt>
              <dd className="mt-1 font-medium text-neutral-950">
                {formatDate(interview.completed_at)}
              </dd>
            </div>
          </dl>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex rounded-md bg-neutral-950 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            Back to Dashboard
          </Link>
        </section>
      </PageContainer>
    </div>
  );
}
