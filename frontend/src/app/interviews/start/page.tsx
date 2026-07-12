import { redirect } from "next/navigation";
import { PageContainer } from "@/components/PageContainer";
import { Sidebar } from "@/components/Sidebar";
import { StartInterviewForm } from "@/components/StartInterviewForm";
import { getCurrentUser } from "@/lib/auth";

export default async function StartInterviewPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-neutral-50 md:flex">
      <Sidebar />
      <PageContainer className="py-8">
        <StartInterviewForm />
      </PageContainer>
    </div>
  );
}
