import type { ReactNode } from "react";
import type { Activity, Day } from "@/content/types";
import { sortActivities } from "@/lib/activity-order";
import { formatShortDate, formatTimeOfDay } from "@/lib/format";
import { cn } from "@/lib/utils";
import { MediaThumb } from "./media-thumb";
import { Reveal } from "./reveal";
import { SmallCaps } from "./typography";

/**
 * One day, as a spread: the lead photograph on one side with the day's notes
 * beside it, alternating sides down the page so the eye zig-zags rather than
 * marching, then every remaining photograph in a grid across the full width.
 *
 * The lead is a FLOAT, deliberately. A grid would pin the copy to a narrow
 * column for its whole height; a float lets a long day's paragraphs run beside
 * the photograph and then wrap underneath it, so no white space is stranded
 * under the plate. The copy's blocks are therefore ordinary flow — not a flex
 * column — because only normal line boxes shorten around a float; a flex
 * container beside one is narrowed for its entire height instead.
 *
 * Top padding is deliberately larger than bottom: top-aligned copy sits
 * against the rule above it and needs to clear it.
 *
 * A day's cover photograph leads its spread, ahead of the activity photographs
 * — unless that same photograph is already the chapter's opener directly
 * above, in which case it would appear twice on one screen and is left to the
 * opener. Every other authored photograph renders — a day on the trail carries
 * a dozen or more, and they are the reason to scroll, so none are hidden
 * behind a cap.
 *
 * A day with no photographs yet gets a bordered empty plate rather than a
 * collapsed row, so an unfinished day reads as intentional instead of broken.
 *
 * `dayAction` and `activityAction` are optional slots the admin uses to place
 * Edit buttons inside this exact rendering. The public site passes neither.
 * When `activityAction` is present, an activity with nothing to show yet is
 * still listed (as "Untitled activity") so its button has somewhere to be.
 */
export function DaySpread({
  day,
  dayNumber,
  index,
  isLast = false,
  omitMediaId,
  dayAction,
  activityAction,
}: {
  day: Day;
  /** 1-based position in the whole trip, shown as the display numeral. */
  dayNumber: number;
  /** Position within the chapter — decides which side the lead photograph sits on. */
  index: number;
  /**
   * Last day in its chapter: drops the bottom rule, because the next chapter's
   * own 2px rule follows immediately and two rules back to back read as a
   * mistake.
   */
  isLast?: boolean;
  /** A photograph already shown by the chapter opener, so not repeated here. */
  omitMediaId?: string;
  dayAction?: ReactNode;
  activityAction?: (activity: Activity) => ReactNode;
}) {
  const activities = sortActivities(day.activities);
  const cover =
    day.coverMedia && day.coverMedia.id !== omitMediaId
      ? [{ media: day.coverMedia, activityTitle: "" }]
      : [];
  const photos = [
    ...cover,
    ...activities.flatMap((activity) =>
      activity.media.map((media) => ({ media, activityTitle: activity.title })),
    ),
  ];
  const [lead, ...rest] = photos;
  const flip = index % 2 === 1;
  const isUnwritten = !day.summary && activities.length === 0;
  const dateLabel = formatShortDate(day.date);

  const altFor = (activityTitle: string) =>
    `${activityTitle || day.title || "This day"}, ${dateLabel}`;

  return (
    <Reveal
      as="article"
      id={day.id}
      index={index}
      className={cn(
        "scroll-mt-(--sticky-stack) pt-13 pb-11 lg:pt-[4.5rem] lg:pb-16",
        !isLast && "border-b border-divider",
      )}
    >
      {/* flow-root contains the float, so the grid below always starts clear of it. */}
      <div className="flow-root">
        <div
          className={cn(
            "mb-6 lg:mb-4 lg:w-[63%]",
            flip ? "lg:float-right lg:ml-12" : "lg:float-left lg:mr-12",
          )}
        >
          {lead ? (
            <MediaThumb
              media={lead.media}
              fallbackAlt={altFor(lead.activityTitle)}
              className="plate h-[240px] sm:h-[320px] lg:h-[430px]"
              // 63% of the 1104px content width.
              sizes="(min-width: 1024px) 700px, 100vw"
            />
          ) : (
            <div className="flex h-[200px] items-end border border-divider p-4 sm:h-[260px] lg:h-[320px]">
              <SmallCaps>No photographs this day</SmallCaps>
            </div>
          )}
        </div>

        <div className="min-w-0 pt-2 [&>*+*]:mt-3">
          <div className="flex items-baseline gap-3">
            <span className="tnum font-heading text-3xl font-normal leading-none text-accent">
              {String(dayNumber).padStart(2, "0")}
            </span>
            <SmallCaps className="tracking-[0.14em]">{dateLabel}</SmallCaps>
            {dayAction && <span className="ml-auto">{dayAction}</span>}
          </div>

          {day.title && (
            <h3 className="max-w-[26ch] text-2xl font-normal leading-[1.12] lg:text-3xl">
              {day.title}
            </h3>
          )}

          {day.location && (
            <p className="font-heading text-xs uppercase tracking-[0.14em] text-accent-700">
              {day.location}
            </p>
          )}

          {day.summary && (
            <p className="font-heading text-xl leading-[1.45] text-pretty">{day.summary}</p>
          )}

          {activities.map((activity) => {
            const isEmpty = !activity.title && !activity.description;
            if (isEmpty && !activityAction) return null;
            const time = formatTimeOfDay(activity.time);

            return (
              <div key={activity.id} className="[&>*+*]:mt-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  {activity.title ? (
                    <h4 className="text-base font-normal leading-[1.25]">{activity.title}</h4>
                  ) : (
                    isEmpty && (
                      <h4 className="text-base font-normal leading-[1.25] text-muted-foreground">
                        Untitled activity
                      </h4>
                    )
                  )}
                  {time && <SmallCaps className="text-[10px] tracking-[0.14em]">{time}</SmallCaps>}
                  {activityAction && <span className="ml-1">{activityAction(activity)}</span>}
                </div>
                {activity.description && (
                  <p className="text-[15px] leading-[1.7] text-pretty">{activity.description}</p>
                )}
              </div>
            );
          })}

          {isUnwritten && <p className="text-base italic text-muted-foreground">Still to write.</p>}
        </div>
      </div>

      {rest.length > 0 && (
        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:mt-3 lg:grid-cols-6">
          {rest.map(({ media, activityTitle }) => (
            <MediaThumb
              key={media.id}
              media={media}
              fallbackAlt={altFor(activityTitle)}
              className="plate h-[110px] sm:h-[150px] lg:h-[190px]"
              // Six across the full 1104px content width, less five 8px gaps.
              sizes="(min-width: 1024px) 180px, (min-width: 640px) 25vw, 33vw"
            />
          ))}
        </div>
      )}
    </Reveal>
  );
}
