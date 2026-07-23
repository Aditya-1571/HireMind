"use client";

import { ErrorState } from "@/components/ErrorState";

export default function InterviewsError({ reset }: { reset: () => void }) {
  return (
    <ErrorState
      title="Could not load this interview area"
      description="Interview data could not be loaded. Retry the request or return to your dashboard."
      onRetry={reset}
    />
  );
}
