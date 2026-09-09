import type { Activity } from "@/content/types";
import { formatDurationLabel, formatTimeOfDay, formatWeekdayDate } from "@/lib/format";
import { photoRows, ratioOf } from "@/lib/photo-rows";
import {
  ACTIVITY_TITLE_CLASSES,
  ActivityHeroFrame,
  ActivitySpreadFrame,
  DESCRIPTION_CLASSES,
  PhotoRowGrid,
  cellSizes,
  heroSizes,
} from "./activity-spread-frame";
import { MediaThumb } from "./media-thumb";
import { PlateCaption, SmallCaps } from "./typography";

/**
 * One activity, as the reader sees it. Composes ActivitySpreadFrame — the
 * editor composes the same frame with inputs — so the two are laid out
 * identically.
 *
 * The cover is skipped when the chapter opener directly above is already
 * showing it (`omitMediaId`), and an activity with no photographs anywhere
 * gets a bordered empty plate rather than a collapsed row, so an unfinished
 * one reads as intentional instead of broken.
 */
export function ActivitySpread({
  activity,
  index,
  isLast = false,
  omitMediaId,
}: {
  activity: Activity;
  index: number;
  isLast?: boolean;
  omitMediaId?: string;
}) {
  const hero =
    activity.coverMedia && activity.coverMedia.id !== omitMediaId ? activity.coverMedia : undefined;
  const dateLabel = activity.date ? formatWeekdayDate(activity.date) : "";
  const alt = `${activity.title || "This activity"}${dateLabel ? `, ${dateLabel}` : ""}`;
  const meta = [dateLabel, durationLabel(activity)].filter(Boolean).join(" · ");

  return (
    <ActivitySpreadFrame
      id={activity.id}
      index={index}
      isLast={isLast}
      titleBlock={
        <>
          {meta && <SmallCaps className="block text-[11px] text-neutral-700">{meta}</SmallCaps>}
          {activity.title && <h3 className={ACTIVITY_TITLE_CLASSES}>{activity.title}</h3>}
        </>
      }
      hero={
        hero ? (
          <ActivityHeroFrame
            ratio={ratioOf(hero)}
            caption={hero.caption && <PlateCaption>{hero.caption}</PlateCaption>}
          >
            <MediaThumb
              media={hero}
              fallbackAlt={alt}
              className="plate h-full"
              sizes={heroSizes(ratioOf(hero))}
            />
          </ActivityHeroFrame>
        ) : (
          activity.media.length === 0 && (
            <div className="mt-6 flex h-[200px] items-end border border-divider p-4 sm:h-[260px]">
              <SmallCaps>No photographs yet</SmallCaps>
            </div>
          )
        )
      }
      description={
        activity.description && <p className={DESCRIPTION_CLASSES}>{activity.description}</p>
      }
    >
      <ActivityPhotos activity={activity} alt={alt} />
    </ActivitySpreadFrame>
  );
}

/** Whether an activity has anything to show yet. The public page skips one that doesn't. */
export function isWritten(activity: Activity): boolean {
  return Boolean(
    activity.title || activity.description || activity.coverMedia || activity.media.length > 0,
  );
}

/** An activity's own length, falling back to its time of day when untimed. */
export function durationLabel(activity: Activity): string {
  return formatDurationLabel(activity.durationMinutes) || formatTimeOfDay(activity.time);
}

/** An activity's photographs in their authored rows; rows with nothing in them are skipped. */
function ActivityPhotos({ activity, alt }: { activity: Activity; alt: string }) {
  const rows = photoRows(activity.media, activity.layout).filter((row) =>
    row.cells.some((cell) => cell !== null),
  );

  return (
    <PhotoRowGrid
      rows={rows}
      className="mt-6 lg:mt-8"
      renderCell={(row, _rowIndex, cellIndex) => {
        const media = row.cells[cellIndex];
        if (!media) return null;
        return (
          <MediaThumb
            media={media}
            fallbackAlt={alt}
            className="plate h-full"
            sizes={cellSizes(row.columns)}
          />
        );
      }}
    />
  );
}
