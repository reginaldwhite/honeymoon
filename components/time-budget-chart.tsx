import { formatHours } from "@/lib/format";
import type { TimeBudgetCategory } from "@/lib/time-budget";
import { SmallCaps } from "./typography";

/**
 * The time budget as hairline bars.
 *
 * Restyled for Classical: bars are drawn with a 1px accent border over a faint
 * accent tint rather than filled with solid color, and the figures set tabular
 * so the column reads as a column. The markup is a list, so the numbers are
 * readable as text without any of it.
 */
export function TimeBudgetChart({ data }: { data: TimeBudgetCategory[] }) {
  if (data.length === 0) return null;

  const max = Math.max(...data.map((entry) => entry.hours), 1);
  const total = data.reduce((sum, entry) => sum + entry.hours, 0);

  return (
    <div className="flex flex-col">
      {data.map((entry) => (
        <div
          key={entry.category}
          className="grid items-center gap-4 border-b border-divider py-3 last:border-b-0"
          style={{ gridTemplateColumns: "minmax(120px,180px) minmax(0,1fr) 56px" }}
        >
          <span className="text-sm">{entry.category}</span>

          <div aria-hidden className="relative h-6 border-b border-neutral-300">
            <div
              className="absolute inset-y-0 left-0"
              style={{
                width: `${Math.max(2, Math.round((entry.hours / max) * 100))}%`,
                border: "1px solid var(--accent)",
                background: "color-mix(in srgb, var(--accent) 14%, transparent)",
              }}
            />
          </div>

          <SmallCaps className="text-right tracking-[0.12em]">{formatHours(entry.hours)}</SmallCaps>
        </div>
      ))}

      <SmallCaps as="p" className="mt-4 tracking-[0.14em]">
        {formatHours(total)} accounted for across {data.length}{" "}
        {data.length === 1 ? "category" : "categories"}
      </SmallCaps>
    </div>
  );
}
