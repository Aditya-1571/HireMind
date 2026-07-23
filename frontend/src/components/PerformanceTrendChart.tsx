import type { ScoreTrendItem } from "@/lib/api";

type PerformanceTrendChartProps = {
  items: ScoreTrendItem[];
};

export function PerformanceTrendChart({ items }: PerformanceTrendChartProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300/80 bg-blue-50/35 p-6 text-center dark:border-slate-700 dark:bg-slate-950/25">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No scored interviews yet
        </p>
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
  const area =
    points.length > 0
      ? `0,${height} ${polyline} ${width},${height}`
      : "";

  return (
    <div>
      <svg
        role="img"
        aria-label="Score trend over recent completed interviews"
        viewBox={`0 0 ${width} ${height}`}
        className="h-32 w-full overflow-visible"
      >
        <defs>
          <linearGradient id="score-trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#22D3EE" stopOpacity="0.24" />
            <stop offset="1" stopColor="#A855F7" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="score-trend-stroke" x1="0" y1="0" x2="1" y2="0">
            <stop stopColor="#2563EB" />
            <stop offset="0.55" stopColor="#22D3EE" />
            <stop offset="1" stopColor="#A855F7" />
          </linearGradient>
        </defs>
        <line
          x1="0"
          x2={width}
          y1={height}
          y2={height}
          stroke="currentColor"
          className="text-slate-200 dark:text-slate-800"
        />
        <polygon points={area} fill="url(#score-trend-fill)" />
        <polyline
          fill="none"
          points={polyline}
          stroke="url(#score-trend-stroke)"
          strokeWidth="3"
          className="text-blue-600 dark:text-cyan-300"
        />
        {points.map((point) => (
          <circle
            key={point.item.interview_id}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="currentColor"
            className="text-fuchsia-500 dark:text-fuchsia-300"
          />
        ))}
      </svg>
      <div className="mt-3 grid gap-2 text-xs text-slate-500 dark:text-slate-400 sm:grid-cols-2">
        {items.map((item) => (
          <p key={item.interview_id}>
            {item.target_role}: {item.score}/100
          </p>
        ))}
      </div>
    </div>
  );
}
