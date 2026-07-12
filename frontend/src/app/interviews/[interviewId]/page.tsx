import { notFound, redirect } from "next/navigation";
import { InterviewSession } from "@/components/InterviewSession";
import { PageContainer } from "@/components/PageContainer";
import { Sidebar } from "@/components/Sidebar";
import { getInterview } from "@/lib/api";
import { getCurrentUser, getSessionToken } from "@/lib/auth";

type InterviewPageProps = {
  params: Promise<{ interviewId: string }>;
};

export default async function InterviewPage({ params }: InterviewPageProps) {
  const { interviewId } = await params;
  const [user, token] = await Promise.all([getCurrentUser(), getSessionToken()]);

  if (!user || !token) {
    redirect("/login");
  }

  const interview = await getInterview(token, interviewId);

  if (!interview) {
    notFound();
  }

  if (interview.status === "completed") {
    redirect(`/interviews/${interview.id}/complete`);
  }

  return (
    <div className="min-h-screen bg-neutral-50 md:flex">
      <Sidebar />
      <PageContainer className="py-8">
        <InterviewSession initialInterview={interview} />
      </PageContainer>
    </div>
  );
}
