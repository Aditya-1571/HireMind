type ProfileCompletionCardProps = {
  percentage: number;
};

function completionMessage(percentage: number) {
  if (percentage >= 100) {
    return "Your professional profile is complete.";
  }
  if (percentage >= 80) {
    return "Your profile is almost complete.";
  }
  if (percentage >= 40) {
    return "Your profile is taking shape. Add the remaining details.";
  }
  return "Add your professional details to personalize HireMind.";
}

export function ProfileCompletionCard({ percentage }: ProfileCompletionCardProps) {
  const normalized = Math.max(0, Math.min(100, Math.round(percentage)));

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-neutral-500">
            Profile completion
          </p>
          <p className="mt-2 text-sm text-neutral-600">
            {completionMessage(normalized)}
          </p>
        </div>
        <p className="text-2xl font-semibold text-neutral-950">
          {normalized}%
        </p>
      </div>
      <div
        className="mt-5 h-2 rounded-full bg-neutral-100"
        role="progressbar"
        aria-label="Profile completion"
        aria-valuenow={normalized}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-2 rounded-full bg-neutral-950"
          style={{ width: `${normalized}%` }}
        />
      </div>
    </section>
  );
}
