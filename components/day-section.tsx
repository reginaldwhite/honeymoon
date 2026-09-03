import type { Day } from "@/content/types";
import { sortActivities } from "@/lib/activity-order";
import { formatDayDate, formatHours } from "@/lib/format";
import { bookedHoursForDay } from "@/lib/time-budget";
import { ActivityItem } from "./activity-item";
import { MediaThumb } from "./media-thumb";
import { Reveal } from "./reveal";

export function DaySection({ day, index }: { day: Day; index: number }) {
  const dayNumber = index + 1;
  const title = day.title || `Day ${dayNumber}`;
  const dayLabel = `day ${dayNumber} of the trip`;

  const bookedHours = bookedHoursForDay(day);
  const { bufferHours, rationale } = day.planningNotes;
  const plannedHours = bookedHours + bufferHours;

  // Guard the division: a day with nothing scheduled and no buffer has no
  // ratio to show, and 0/0 previously rendered `width: NaN%` on every day.
  const bookedPercent = plannedHours > 0 ? Math.round((bookedHours / plannedHours) * 100) : 0;
  const showPacing = Boolean(rationale) || plannedHours > 0;

  return (
    <section
      id={day.id}
      className="scroll-mt-28 py-16 first:pt-0"
      style={{ contentVisibility: "auto", containIntrinsicSize: "0 1200px" }}
    >
      <Reveal>
        {/* Even split from lg up: the cover carries as much of the day as the
            copy does, so it gets half the row rather than a narrow side column. */}
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary">
              Day {dayNumber}
              {day.location && ` · ${day.location}`}
            </p>
            <h2 className="mt-2 font-display text-3xl italic text-foreground sm:text-4xl">
              {title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{formatDayDate(day.date)}</p>
            {day.summary && (
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-foreground/80">
                {day.summary}
              </p>
            )}

            {showPacing && (
              <div className="mt-6 max-w-2xl rounded-md border border-border bg-card/50 p-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  How this day was paced
                </p>
                {rationale && <p className="mt-2 text-sm text-foreground/80">{rationale}</p>}
                {plannedHours > 0 && (
                  <div className="mt-3 flex items-center gap-3">
                    <div
                      role="img"
                      aria-label={`${formatHours(bookedHours)} booked, ${formatHours(bufferHours)} left open`}
                      className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary"
                    >
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${bookedPercent}%` }}
                      />
                    </div>
                    <span aria-hidden className="shrink-0 text-xs text-muted-foreground">
                      {formatHours(bookedHours)} booked · {formatHours(bufferHours)} open
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {day.coverMedia && (
            <div>
              <MediaThumb
                media={day.coverMedia}
                fallbackAlt={`${title}, ${dayLabel}`}
                className="aspect-[4/3]"
                // Half of the 976px content area, less the 32px grid gap.
                sizes="(min-width: 1024px) 472px, 100vw"
              />
            </div>
          )}
        </div>
      </Reveal>

      {day.activities.length > 0 && (
        <div className="mt-10 flex flex-col gap-10">
          {sortActivities(day.activities).map((activity, activityIndex) => (
            <Reveal key={activity.id} index={activityIndex}>
              <ActivityItem activity={activity} dayLabel={dayLabel} />
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}
