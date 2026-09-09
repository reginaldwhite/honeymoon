"use client";

import { useActionState } from "react";
import { X } from "lucide-react";
import { unassignMedia } from "@/app/admin/itinerary/actions";
import type { MediaRef } from "@/content/types";
import { cn } from "@/lib/utils";
import { AddImageButton } from "./add-image-button";
import { InlineInput } from "./inline-field";
import { rawMediaUrl } from "./raw-media-url";

/**
 * A single-photograph slot — an activity's cover, a chapter's hero, the
 * frontispiece — rendered at exactly the size the public page gives it.
 * "Add image" opens the same picker as an activity; × removes; alt text and
 * caption are edited directly beneath. `fallback` is a photograph the public
 * page would show in this slot's place when it is empty (a chapter hero
 * falling back to an activity cover); it is displayed but not editable here.
 */
export function PhotoSlot({
  media,
  fallback,
  targetKey,
  targetName,
  imageClassName,
  placeholderClassName,
  fields = true,
  controlsClassName,
  fill = false,
}: {
  media?: MediaRef;
  fallback?: MediaRef;
  targetKey: string;
  targetName: string;
  imageClassName: string;
  /** Box shown when the slot is empty, so the layout keeps its shape. */
  placeholderClassName?: string;
  /** Show alt/caption inputs beneath the photograph. */
  fields?: boolean;
  controlsClassName?: string;
  /** Fill the parent's box (the caller sets the aspect ratio) instead of a fixed height. */
  fill?: boolean;
}) {
  const [removeState, removeAction, removing] = useActionState(unassignMedia, undefined);
  const shown = media ?? fallback;

  const controls = (
    <div className={cn("flex items-center gap-2", controlsClassName)}>
      <AddImageButton targetKey={targetKey} targetName={targetName} />
      {media && (
        <form action={removeAction}>
          <input type="hidden" name="mediaId" value={media.id} />
          <button
            type="submit"
            disabled={removing}
            aria-label={`Remove ${targetName.toLowerCase()}`}
            title="Remove"
            className="flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white shadow transition-colors hover:bg-destructive disabled:cursor-default"
          >
            <X className="size-4" aria-hidden />
          </button>
        </form>
      )}
    </div>
  );

  return (
    <div className={cn("relative", fill && "h-full", removing && "opacity-50")}>
      {shown?.sourcePath ? (
        // eslint-disable-next-line @next/next/no-img-element -- local dev-only file stream
        <img
          src={rawMediaUrl(shown.sourcePath, undefined, 1200)}
          alt=""
          className={cn("block w-full object-cover", fill ? "h-full" : imageClassName)}
        />
      ) : (
        <div
          className={cn(
            "flex items-end border border-dashed border-primary/40 p-4",
            fill ? "h-full" : (placeholderClassName ?? imageClassName),
          )}
        >
          <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            No {targetName.toLowerCase()} yet
          </span>
        </div>
      )}

      <div className="absolute top-3 right-3">{controls}</div>

      {!media && fallback && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Automatic — showing an activity cover until you choose one.
        </p>
      )}
      {removeState?.error && (
        <p role="alert" className="mt-2 text-[11px] text-destructive">
          {removeState.error}
        </p>
      )}

      {fields && media && <MediaFields media={media} />}
    </div>
  );
}

/** Alt text and caption for one photograph, saved with everything else. */
export function MediaFields({
  media,
  compact = false,
  tone = "paper",
}: {
  media: MediaRef;
  compact?: boolean;
  /** "photo" when the fields sit over a dark scrim. */
  tone?: "paper" | "photo";
}) {
  const size = compact ? "text-[10px]" : "text-[11px]";
  const onPhoto = tone === "photo";
  return (
    <div className={cn("mt-1.5 flex flex-col gap-1", size)}>
      <InlineInput
        k={`media:${media.id}:alt`}
        initial={media.alt}
        placeholder="Alt text — what a screen reader announces"
        className={cn(
          size,
          "leading-tight",
          onPhoto && "border-white/50 text-white placeholder:text-white/50",
          !media.alt.trim() && "border-destructive/60",
        )}
      />
      <InlineInput
        k={`media:${media.id}:caption`}
        initial={media.caption ?? ""}
        placeholder="Caption (optional)"
        className={cn(
          size,
          "leading-tight",
          onPhoto ? "border-white/50 text-white/80 placeholder:text-white/50" : "text-muted-foreground",
        )}
      />
    </div>
  );
}
