import type { Activity } from "@/content/types";
import { ratioOf } from "@/lib/photo-rows";
import { coverTarget } from "@/lib/trip-repository";
import {
  ACTIVITY_TITLE_CLASSES,
  ActivityHeroFrame,
  ActivitySpreadFrame,
  DESCRIPTION_CLASSES,
} from "@/components/activity-spread-frame";
import { SmallCaps } from "@/components/typography";
import { ActivityMeta } from "./activity-meta";
import { InlineInput, InlineNumber, InlineTextarea } from "./inline-field";
import { MediaFields, PhotoSlot } from "./photo-slot";
import { PhotoRowsEditor } from "./photo-rows-editor";

/**
 * One activity, in edit mode: the same ActivitySpreadFrame the public page
 * composes, with an input standing wherever a line of text would stand.
 * Photographs are the same cover slot and rows the reader sees, with their
 * controls attached.
 *
 * One line exists here that the public page has no equivalent for, set in
 * the muted metadata voice: the activity's time of day and interests, which
 * feed the planning page, and the control to delete it.
 */
export function ActivitySpreadEditor({
  chapterId,
  activity,
  index,
  isLast = false,
  omitMediaId,
}: {
  chapterId: string;
  activity: Activity;
  index: number;
  isLast?: boolean;
  /** The chapter hero, which the public page does not repeat as this activity's cover. */
  omitMediaId?: string;
}) {
  const cover = activity.coverMedia;
  const coverIsHero = Boolean(cover && cover.id === omitMediaId);

  return (
    <ActivitySpreadFrame
      id={activity.id}
      index={index}
      isLast={isLast}
      titleBlock={
        <>
          <SmallCaps className="flex flex-wrap items-baseline gap-x-2 text-[11px] text-neutral-700">
            <InlineInput
              k={`activity:${activity.id}:date`}
              initial={activity.date}
              type="date"
              placeholder="Date"
              className="w-auto text-[11px]"
            />
            <span className="flex items-baseline gap-1">
              &middot;
              <InlineNumber
                k={`activity:${activity.id}:durationMinutes`}
                initial={activity.durationMinutes}
                step={15}
                label="Duration in minutes"
                className="text-[11px]"
              />
              min
            </span>
          </SmallCaps>
          <InlineInput
            k={`activity:${activity.id}:title`}
            initial={activity.title}
            placeholder="Activity title"
            className={ACTIVITY_TITLE_CLASSES}
          />
        </>
      }
      hero={
        <ActivityHeroFrame
          ratio={cover ? ratioOf(cover) : 1.5}
          caption={
            cover && (
              <>
                <MediaFields media={cover} />
                {coverIsHero && (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    This is the chapter&apos;s hero, so the public page shows it once, above,
                    rather than again here.
                  </p>
                )}
              </>
            )
          }
        >
          <PhotoSlot
            media={cover}
            targetKey={`${chapterId}::${coverTarget(activity.id)}`}
            targetName="Cover photo"
            imageClassName="plate"
            fill
            fields={false}
          />
        </ActivityHeroFrame>
      }
      description={
        <InlineTextarea
          k={`activity:${activity.id}:description`}
          initial={activity.description}
          placeholder="What happened — the body copy"
          className={DESCRIPTION_CLASSES}
        />
      }
    >
      <ActivityMeta activity={activity} />
      <PhotoRowsEditor
        activityId={activity.id}
        targetKey={`${chapterId}::${activity.id}`}
        targetName={activity.title || "this activity"}
        media={activity.media}
        layout={activity.layout ?? []}
        className="mt-3"
      />
    </ActivitySpreadFrame>
  );
}
