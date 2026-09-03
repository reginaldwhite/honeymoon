import type { Activity } from "@/content/types";
import { formatTimeOfDay } from "@/lib/format";
import { InterestTag } from "./interest-tag";
import { MediaThumb } from "./media-thumb";

export function ActivityItem({
  activity,
  dayLabel,
}: {
  activity: Activity;
  /** Used to describe this activity's photos when they have no alt text yet. */
  dayLabel: string;
}) {
  const time = formatTimeOfDay(activity.time);
  const title = activity.title || "Untitled activity";
  const singleMedia = activity.media.length === 1;

  return (
    <div className="relative border-l border-border pl-6" style={{ contentVisibility: "auto" }}>
      <span
        aria-hidden
        className="absolute top-1.5 -left-[5px] size-2.5 rounded-full bg-primary"
      />
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {time && <span className="font-mono text-xs tracking-wide text-primary">{time}</span>}
        <h3 className="font-display text-xl text-foreground">{title}</h3>
      </div>

      {activity.description && (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {activity.description}
        </p>
      )}

      {activity.interestTags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {activity.interestTags.map((slug) => (
            <InterestTag key={slug} slug={slug} />
          ))}
        </div>
      )}

      {activity.media.length > 0 && (
        <div
          className={`mt-4 grid gap-3 ${
            singleMedia ? "grid-cols-1 sm:max-w-md" : "grid-cols-2 sm:grid-cols-3"
          }`}
        >
          {activity.media.map((media) => (
            <MediaThumb
              key={media.id}
              media={media}
              fallbackAlt={`${title}, ${dayLabel}`}
              sizes={
                singleMedia
                  ? "(min-width: 640px) 448px, 100vw"
                  : "(min-width: 640px) 240px, 50vw"
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
