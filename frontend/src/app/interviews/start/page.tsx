import { redirect } from "next/navigation";
import { PageContainer } from "@/components/PageContainer";
import { Sidebar } from "@/components/Sidebar";
import { StartInterviewForm } from "@/components/StartInterviewForm";
import { getResumes } from "@/lib/api";
import { getCurrentUser, getSessionToken } from "@/lib/auth";

export default async function StartInterviewPage() {
  const [user, token] = await Promise.all([getCurrentUser(), getSessionToken()]);

  if (!user || !token) {
    redirect("/login");
  }
  const resumes = await getResumes(token);
  const analyzedResumes = resumes.filter(
    (resume) => resume.analysis_status === "ready" && resume.analysis_data,
  );

  return (
    <div className="min-h-screen bg-neutral-50 md:flex">
      <Sidebar />
      <PageContainer className="py-8">
        <StartInterviewForm resumes={analyzedResumes} />
      </PageContainer>
    </div>
  );
}
