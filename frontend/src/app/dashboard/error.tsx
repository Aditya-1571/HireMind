"use client";

import { ErrorState } from "@/components/ErrorState";

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <ErrorState
      title="Could not load your dashboard"
      description="Dashboard data could not be loaded right now. Try again without losing your session."
      onRetry={reset}
    />
  );
}
