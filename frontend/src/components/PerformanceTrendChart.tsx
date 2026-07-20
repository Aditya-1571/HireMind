import type { ScoreTrendItem } from "@/lib/api";

type PerformanceTrendChartProps = {
  items: ScoreTrendItem[];
};

export function PerformanceTrendChart({ items }: PerformanceTrendChartProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-neutral-300 p-6 text-center">
        <p className="text-sm text-neutral-500">No scored interviews yet</p>
      </div>
    );
  }

  const width = 320;
  const height = 120;
  const points = items.map((item, index) => {
    const x = items.length === 1 ? width / 2 : (index / (items.length - 1)) * width;
    const y = height - (item.score / 100) * height;
    return { x, y, item };
  });
  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <div>
      <svg
        role="img"
        aria-label="Score trend over recent completed interviews"
        viewBox={`0 0 ${width} ${height}`}
        className="h-32 w-full overflow-visible"
      >
        <line
          x1="0"
          x2={width}
          y1={height}
          y2={height}
          stroke="currentColor"
          className="text-neutral-200"
        />
        <polyline
          fill="none"
          points={polyline}
          stroke="currentColor"
          strokeWidth="3"
          className="text-neutral-950"
        />
        {points.map((point) => (
          <circle
            key={point.item.interview_id}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="currentColor"
            className="text-neutral-950"
          />
        ))}
      </svg>
      <div className="mt-3 grid gap-2 text-xs text-neutral-500 sm:grid-cols-2">
        {items.map((item) => (
          <p key={item.interview_id}>
            {item.target_role}: {item.score}/100
          </p>
        ))}
      </div>
    </div>
  );
}
