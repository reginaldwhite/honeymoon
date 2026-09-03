import type { Day } from "@/content/types";
import { formatShortDate } from "@/lib/format";

/**
 * Sticky day index for the timeline. Sixteen days is a lot of scrolling to get
 * back to a specific one, and the anchors are plain links so this works with no
 * client JS. Offset matches the fixed header height.
 */
export function DayJumpNav({ days }: { days: Day[] }) {
  if (days.length < 2) return null;

  return (
    <nav
      aria-label="Jump to a day"
      className="sticky top-14 z-30 -mx-6 border-b border-border bg-background/90 px-6 py-2 backdrop-blur"
    >
      <ul className="flex gap-1.5 overflow-x-auto">
        {days.map((day, index) => (
          <li key={day.id}>
            <a
              href={`#${day.id}`}
              title={day.title || `Day ${index + 1}`}
              className="flex shrink-0 items-baseline gap-1.5 rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <span className="font-mono">{index + 1}</span>
              <span className="whitespace-nowrap">{formatShortDate(day.date)}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
