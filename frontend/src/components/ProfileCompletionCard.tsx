import { Card } from "@/components/ui";

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
    <Card className="p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue-700 dark:text-cyan-300">
            Profile completion
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {completionMessage(normalized)}
          </p>
        </div>
        <p className="text-2xl font-semibold text-slate-950 dark:text-slate-50">
          {normalized}%
        </p>
      </div>
      <div
        className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
        role="progressbar"
        aria-label="Profile completion"
        aria-valuenow={normalized}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-fuchsia-500 transition-all"
          style={{ width: `${normalized}%` }}
        />
      </div>
    </Card>
  );
}
