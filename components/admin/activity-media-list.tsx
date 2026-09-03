"use client";

import { useId, useState } from "react";
import { ChevronDown, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MediaRef } from "@/content/types";
import { AddImageButton } from "./add-image-button";
import { MediaDetailsForm } from "./media-details-form";
import { SortableMediaGrid, type MediaGridVariant } from "./sortable-media-grid";

/**
 * An activity's photos, in one of two layouts.
 *
 * Collapsed (the default) is a grid of thumbnails, so an activity with a dozen
 * photos stays scannable. Expanding swaps in the full alt-text and caption form
 * for every photo at once — editing them one at a time was the only reason the
 * stacked layout existed.
 */
export function ActivityMediaList({
  media,
  dayId,
  targetKey,
  targetName,
  reorderable = true,
  variant = "grid",
  className,
}: {
  media: MediaRef[];
  dayId: string;
  /** `${dayId}::cover` or `${dayId}::${activityId}` — where Add image assigns to. */
  targetKey: string;
  targetName: string;
  /** Cover slots hold one photo and take no drops. */
  reorderable?: boolean;
  /** Tile size. "half" suits a single-photo slot; see SortableMediaGrid. */
  variant?: MediaGridVariant;
  className?: string;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const panelId = useId();

  const missingAlt = media.filter((item) => !item.alt.trim()).length;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center gap-3">
        {media.length > 0 ? (
          <button
            type="button"
            onClick={() => setShowDetails((open) => !open)}
            aria-expanded={showDetails}
            aria-controls={panelId}
            className="flex flex-1 items-center gap-2 rounded-md py-0.5 text-left text-[11px] uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <ChevronDown
              aria-hidden
              className={cn(
                "size-3.5 shrink-0 transition-transform motion-reduce:transition-none",
                !showDetails && "-rotate-90",
              )}
            />
            <span>Photos ({media.length})</span>
            {missingAlt > 0 && (
              <span className="flex items-center gap-1 text-destructive">
                <TriangleAlert aria-hidden className="size-3" />
                {missingAlt} need{missingAlt === 1 ? "s" : ""} alt text
              </span>
            )}
            <span className="normal-case tracking-normal text-muted-foreground/80">
              · {showDetails ? "Hide details" : "Edit details"}
            </span>
            {!showDetails && media.length > 1 && reorderable && (
              <span className="normal-case tracking-normal text-muted-foreground/60">
                · drag to reorder
              </span>
            )}
          </button>
        ) : (
          <p className="flex-1 text-[11px] uppercase tracking-wide text-muted-foreground">
            No photos yet
          </p>
        )}

        <AddImageButton targetKey={targetKey} targetName={targetName} />
      </div>

      {media.length > 0 && (
        <div id={panelId}>
          {showDetails ? (
            <div className="flex flex-col gap-3">
              {media.map((item, index) => (
                <MediaDetailsForm
                  key={item.id}
                  media={item}
                  dayId={dayId}
                  targetKey={targetKey}
                  index={index}
                  total={media.length}
                />
              ))}
            </div>
          ) : (
            <SortableMediaGrid
              media={media}
              targetKey={targetKey}
              reorderable={reorderable}
              variant={variant}
            />
          )}
        </div>
      )}
    </div>
  );
}
