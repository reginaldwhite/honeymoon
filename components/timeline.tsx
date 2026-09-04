import { Fragment, type ReactNode } from "react";
import { trip as buildTimeTrip } from "@/content/trip";
import { getChaptersWithDays, type ChapterWithDays } from "@/content/chapters";
import type { Activity, Day, Trip } from "@/content/types";
import { ChapterNav } from "./chapter-nav";
import { ChapterOpener } from "./chapter-opener";
import { DaySpread } from "./day-spread";

/**
 * The chapters, as one long scroll with a sticky chapter index.
 *
 * No longer its own page — `app/(site)/page.tsx` renders the opening and then
 * this, so the trip is a single continuous read. `scroll-mt-(--sticky-stack)`
 * is the pinned header + chapter bar, defined once in globals.css alongside
 * the heights it is the sum of.
 *
 * The `*Action` and `after*` props are slots the admin editor uses to place
 * Edit buttons inside the real components and edit forms beneath them. The
 * public site passes none of them, so its output is unchanged — which is the
 * point: the editor shows exactly what the reader will see.
 */
export function Timeline({
  source = buildTimeTrip,
  chapterAction,
  dayAction,
  activityAction,
  afterChapterOpener,
  afterDay,
}: {
  source?: Trip;
  chapterAction?: (chapter: ChapterWithDays) => ReactNode;
  dayAction?: (day: Day) => ReactNode;
  activityAction?: (activity: Activity, day: Day) => ReactNode;
  afterChapterOpener?: (chapter: ChapterWithDays) => ReactNode;
  afterDay?: (day: Day) => ReactNode;
}) {
  const chapters = getChaptersWithDays(source);

  // Day numbers run across the whole trip, not per chapter, so "day 11" means
  // the same thing here as it does in conversation. Every chapter day comes
  // from the trip's days, so the lookup cannot miss.
  const dayNumberById = new Map(source.days.map((day, i) => [day.id, i + 1]));

  return (
    <>
      <ChapterNav chapters={chapters} />

      {chapters.map((chapter, chapterIndex) => (
        <section key={chapter.id} id={chapter.id} className="scroll-mt-(--sticky-stack)">
          <ChapterOpener
            chapter={chapter}
            number={chapterIndex + 1}
            action={chapterAction?.(chapter)}
          />
          {afterChapterOpener?.(chapter)}

          {chapter.days.map((day, dayIndex) => (
            <Fragment key={day.id}>
              <DaySpread
                day={day}
                dayNumber={dayNumberById.get(day.id)!}
                index={dayIndex}
                isLast={dayIndex === chapter.days.length - 1}
                omitMediaId={chapter.cover?.id}
                dayAction={dayAction?.(day)}
                activityAction={activityAction && ((activity) => activityAction(activity, day))}
              />
              {afterDay?.(day)}
            </Fragment>
          ))}
        </section>
      ))}
    </>
  );
}
