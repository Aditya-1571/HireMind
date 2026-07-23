import { redirect } from "next/navigation";
import { PageContainer } from "@/components/PageContainer";
import { Sidebar } from "@/components/Sidebar";
import { StartInterviewForm } from "@/components/StartInterviewForm";
import { PageHeader } from "@/components/ui";
import { getProfile, getResumes } from "@/lib/api";
import { getCurrentUser, getSessionToken } from "@/lib/auth";

type StartInterviewPageProps = {
  searchParams?: Promise<{
    role?: string;
    difficulty?: string;
    interview_type?: string;
    question_count?: string;
    time_limit_minutes?: string;
    evaluation_style?: string;
    answer_mode?: string;
  }>;
};

export default async function StartInterviewPage({
  searchParams,
}: StartInterviewPageProps) {
  const initialValues = await searchParams;
  const [user, token] = await Promise.all([getCurrentUser(), getSessionToken()]);

  if (!user || !token) {
    redirect("/login");
  }
  const [resumes, profile] = await Promise.all([
    getResumes(token),
    getProfile(token),
  ]);
  const analyzedResumes = resumes.filter(
    (resume) => resume.analysis_status === "ready" && resume.analysis_data,
  );

  return (
    <div className="hiremind-ambient min-h-screen md:flex">
      <Sidebar user={user} />
      <PageContainer className="py-8">
        <PageHeader
          eyebrow="Interview setup"
          title="Start Interview"
          description="Choose the role, difficulty, resume context, and evaluation preferences for your next practice session."
        />
        <StartInterviewForm
          resumes={analyzedResumes}
          initialValues={{
            role: initialValues?.role,
            difficulty: initialValues?.difficulty,
            interviewType: initialValues?.interview_type,
            questionCount: initialValues?.question_count,
            timeLimitMinutes: initialValues?.time_limit_minutes,
            evaluationStyle: initialValues?.evaluation_style,
            answerMode: initialValues?.answer_mode,
          }}
          savedDefaults={profile?.interview_defaults ?? null}
          savedTargetRole={profile?.profile.target_role ?? null}
          hasSavedDefaults={Boolean(profile)}
        />
      </PageContainer>
    </div>
  );
}
