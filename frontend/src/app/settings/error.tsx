"use client";

import { ErrorState } from "@/components/ErrorState";

export default function SettingsError({ reset }: { reset: () => void }) {
  return (
    <ErrorState
      title="Could not load settings"
      description="Your profile settings could not be loaded right now. Try again in a moment."
      onRetry={reset}
    />
  );
}
