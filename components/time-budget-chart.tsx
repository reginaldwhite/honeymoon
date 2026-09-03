import { formatHours } from "@/lib/format";
import type { TimeBudgetCategory } from "@/lib/time-budget";

const BAR_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

/**
 * Horizontal bars in plain CSS, server-rendered.
 *
 * This was a Recharts bar chart behind a `ssr: false` dynamic import, which
 * shipped roughly 300KB of charting library — and a blank skeleton until it
 * loaded — to draw five static bars. The markup here is a list, so the numbers
 * are readable as text without any of that.
 */
export function TimeBudgetChart({ data }: { data: TimeBudgetCategory[] }) {
  if (data.length === 0) return null;

  const max = Math.max(...data.map((entry) => entry.hours), 1);

  return (
    <ul className="flex flex-col gap-3">
      {data.map((entry, index) => (
        <li key={entry.category} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3">
          <span className="truncate text-xs text-foreground" title={entry.category}>
            {entry.category}
          </span>
          <span aria-hidden className="h-2.5 overflow-hidden rounded-full bg-secondary">
            <span
              className="block h-full rounded-full"
              style={{
                width: `${Math.max((entry.hours / max) * 100, 1)}%`,
                background: BAR_COLORS[index % BAR_COLORS.length],
              }}
            />
          </span>
          <span className="w-12 text-right font-mono text-xs text-muted-foreground">
            {formatHours(entry.hours)}
          </span>
        </li>
      ))}
    </ul>
  );
}
