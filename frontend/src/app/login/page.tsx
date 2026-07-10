import Link from "next/link";
import { Header } from "@/components/Header";
import { PageContainer } from "@/components/PageContainer";

export default function LoginPage() {
  return (
    <>
      <Header />
      <PageContainer className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <section className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-6">
          <h1 className="text-2xl font-semibold text-neutral-950">
            Sign in to HireMind
          </h1>
          <p className="mt-3 text-sm leading-6 text-neutral-600">
            Authentication will be connected in a later phase. This button is a
            placeholder for Google login.
          </p>
          <button
            type="button"
            className="mt-6 flex w-full items-center justify-center rounded-md border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
          >
            Continue with Google
          </button>
          <Link
            href="/"
            className="mt-5 inline-flex text-sm font-medium text-neutral-600 hover:text-neutral-950"
          >
            Back to home
          </Link>
        </section>
      </PageContainer>
    </>
  );
}
