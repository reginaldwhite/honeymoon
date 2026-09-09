import { trip as buildTimeTrip } from "@/content/trip";
import { getChapters } from "@/content/chapters";
import type { Trip } from "@/content/types";
import { ActivitySpread, isWritten } from "./activity-spread";
import { ChapterOpener } from "./chapter-opener";

/**
 * The chapters, as one long scroll. No longer its own page —
 * `app/(site)/page.tsx` renders the opening and then this, so the trip is a
 * single continuous read. `scroll-mt-(--sticky-stack)` keeps anchored
 * sections clear of the pinned header; see globals.css.
 */
export function Timeline({ source = buildTimeTrip }: { source?: Trip }) {
  const chapters = getChapters(source);

  return (
    <>
      {chapters.map((chapter) => {
        const activities = chapter.activities.filter(isWritten);
        return (
          <section key={chapter.id} id={chapter.id} className="scroll-mt-(--sticky-stack)">
            <ChapterOpener chapter={chapter} />
            {activities.map((activity, index) => (
              <ActivitySpread
                key={activity.id}
                activity={activity}
                index={index}
                isLast={index === activities.length - 1}
                omitMediaId={chapter.cover?.id}
              />
            ))}
          </section>
        );
      })}
    </>
  );
}
