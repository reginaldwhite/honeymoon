"use client";

import { useState, useTransition } from "react";
import { GripVertical, TriangleAlert } from "lucide-react";
import { moveMediaToPosition } from "@/app/admin/itinerary/actions";
import { Lightbox } from "@/components/ui/lightbox";
import { cn } from "@/lib/utils";
import type { MediaRef } from "@/content/types";
import { useMediaDrag } from "./media-drag-context";
import { rawMediaUrl } from "./raw-media-url";

/**
 * Kept deliberately few-columned: the day editor is capped at max-w-5xl so its
 * forms stay readable, which makes column count the only lever on thumbnail
 * size.
 *
 * "grid" is a day's activity photos, four across at roughly 235px each.
 * "half" is for a slot that holds a single photo — a cover — where a quarter
 * width tile reads as an afterthought rather than the image representing the
 * whole day.
 */
const GRID_VARIANTS = {
  grid: "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4",
  half: "grid grid-cols-1 gap-4 sm:grid-cols-2",
} as const;

export type MediaGridVariant = keyof typeof GRID_VARIANTS;

/**
 * A day's photos for one slot, reorderable by dragging.
 *
 * Dropping onto a position in the same list reorders; dropping a photo dragged
 * from another activity moves it across. Both are the same server call — the
 * photo is pulled out of wherever it was and spliced in at the drop index.
 *
 * Native HTML drag-and-drop is used rather than a drag library: this is a
 * local-only authoring tool and the interaction is a flat, single-axis list.
 * It has no keyboard equivalent, so the expanded detail view carries explicit
 * move-earlier/move-later buttons for the same operation.
 */
export function SortableMediaGrid({
  media,
  targetKey,
  reorderable,
  variant = "grid",
}: {
  media: MediaRef[];
  targetKey: string;
  /** False for the cover slot, which holds a single photo and takes no drops. */
  reorderable: boolean;
  variant?: MediaGridVariant;
}) {
  const { dragging, begin, end } = useMediaDrag();
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  const acceptsDrop = reorderable && dragging !== null;

  const commit = (index: number) => {
    if (!dragging) return;
    const payload = dragging;
    setDropIndex(null);
    end();
    startTransition(async () => {
      await moveMediaToPosition({ mediaId: payload.mediaId, targetKey, index });
    });
  };

  return (
    <div
      className={cn(GRID_VARIANTS[variant], pending && "opacity-60")}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setDropIndex(null);
        }
      }}
      onDrop={(event) => {
        // A drop that lands on the grid's own padding rather than a tile.
        if (acceptsDrop) {
          event.preventDefault();
          commit(dropIndex ?? media.length);
        }
      }}
      onDragOver={(event) => {
        if (acceptsDrop) event.preventDefault();
      }}
    >
      {media.map((item, index) => (
        <div
          key={item.id}
          className="relative"
          onDragOver={(event) => {
            if (!acceptsDrop) return;
            event.preventDefault();
            const box = event.currentTarget.getBoundingClientRect();
            const after = event.clientX > box.left + box.width / 2;
            setDropIndex(after ? index + 1 : index);
          }}
          onDrop={(event) => {
            if (!acceptsDrop) return;
            event.preventDefault();
            event.stopPropagation();
            const box = event.currentTarget.getBoundingClientRect();
            commit(event.clientX > box.left + box.width / 2 ? index + 1 : index);
          }}
        >
          {dropIndex === index && <DropMarker side="start" />}
          {dropIndex === index + 1 && <DropMarker side="end" />}
          <MediaThumbTile
            media={item}
            draggable={reorderable || dragging !== null}
            isDragging={dragging?.mediaId === item.id}
            onDragStart={(event) => {
              begin({ mediaId: item.id, fromTargetKey: targetKey });
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", item.id);
            }}
            onDragEnd={() => {
              setDropIndex(null);
              end();
            }}
          />
        </div>
      ))}
    </div>
  );
}

function DropMarker({ side }: { side: "start" | "end" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute inset-y-0 z-10 w-1 rounded-full bg-primary",
        side === "start" ? "-left-2.5" : "-right-2.5",
      )}
    />
  );
}

function MediaThumbTile({
  media,
  draggable,
  isDragging,
  onDragStart,
  onDragEnd,
}: {
  media: MediaRef;
  draggable: boolean;
  isDragging: boolean;
  onDragStart: (event: React.DragEvent) => void;
  onDragEnd: () => void;
}) {
  const needsAlt = !media.alt.trim();
  const description = media.alt.trim() || media.sourcePath || media.publicId;

  const frameClasses = cn(
    "relative aspect-square w-full overflow-hidden rounded-md border-2 bg-secondary/40",
    needsAlt ? "border-destructive/60" : "border-border",
    isDragging && "opacity-40",
  );

  if (!media.sourcePath) {
    return (
      <span className={cn(frameClasses, "flex items-center justify-center")}>
        <span className="px-1 text-center text-[10px] text-muted-foreground">{media.kind}</span>
      </span>
    );
  }

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={draggable ? "cursor-grab active:cursor-grabbing" : undefined}
    >
      <Lightbox
        label={description}
        triggerLabel={`View ${description} full size`}
        triggerClassName={cn(
          frameClasses,
          "block transition-colors hover:border-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        )}
        trigger={
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- local dev-only file stream */}
            <img
              src={rawMediaUrl(media.sourcePath, undefined, 480)}
              alt=""
              title={description}
              loading="lazy"
              decoding="async"
              draggable={false}
              className="h-full w-full object-cover"
            />
            {draggable && (
              <span
                aria-hidden
                className="absolute bottom-1 left-1 flex size-5 items-center justify-center rounded bg-black/55 text-white/90"
              >
                <GripVertical className="size-3" />
              </span>
            )}
            {needsAlt && (
              <span
                aria-hidden
                title="No alt text yet"
                className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-destructive text-white"
              >
                <TriangleAlert className="size-3" />
              </span>
            )}
          </>
        }
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- full-resolution local original */}
        <img
          src={rawMediaUrl(media.sourcePath)}
          alt={description}
          className="max-h-[90vh] max-w-[95vw] rounded-md object-contain"
        />
      </Lightbox>
    </div>
  );
}
