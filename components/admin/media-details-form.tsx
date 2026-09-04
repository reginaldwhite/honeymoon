"use client";

import { useActionState, useTransition } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  moveMediaToPosition,
  unassignMedia,
  updateMediaDetails,
} from "@/app/admin/itinerary/actions";
import { Button } from "@/components/ui/button";
import { Field, FormStatus, TextArea, TextInput } from "@/components/ui/field";
import { Lightbox } from "@/components/ui/lightbox";
import type { MediaRef } from "@/content/types";
import { rawMediaUrl } from "./raw-media-url";

/**
 * Alt text and caption for one assigned photo. Without this the public site had
 * no way to get either: alt fell back to the camera's filename, and `caption`
 * existed in the data model but could never be filled in.
 *
 * The move buttons are the keyboard-reachable equivalent of dragging a
 * thumbnail in the collapsed grid, which native drag-and-drop cannot offer.
 */
export function MediaDetailsForm({
  media,
  targetKey,
  index,
  total,
}: {
  media: MediaRef;
  targetKey: string;
  index: number;
  total: number;
}) {
  const [state, formAction, pending] = useActionState(updateMediaDetails, undefined);
  const [removeState, removeAction, removing] = useActionState(unassignMedia, undefined);
  const [moving, startMove] = useTransition();

  const thumbSrc = media.sourcePath ? rawMediaUrl(media.sourcePath, undefined, 480) : null;
  const fullSrc = media.sourcePath ? rawMediaUrl(media.sourcePath) : null;
  const needsAlt = !media.alt.trim();
  const description = media.alt.trim() || media.sourcePath || media.publicId;

  // moveMedia treats `index` as a position in the list *before* the photo is
  // pulled out, so stepping one place later is index + 2.
  const move = (nextIndex: number) =>
    startMove(async () => {
      await moveMediaToPosition({ mediaId: media.id, targetKey, index: nextIndex });
    });

  const frameClasses =
    "relative block aspect-square w-full overflow-hidden rounded-md border-2 border-border bg-secondary/40";

  return (
    <div className="flex flex-col gap-4 rounded-md border border-border bg-background/40 p-3 sm:flex-row">
      <div className="w-full shrink-0 sm:w-64 lg:w-80">
        {thumbSrc ? (
          <Lightbox
            label={description}
            triggerLabel={`View ${description} full size`}
            triggerClassName={`${frameClasses} transition-colors hover:border-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none`}
            trigger={
              /* eslint-disable-next-line @next/next/no-img-element -- local dev-only file stream */
              <img
                src={thumbSrc}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- full-resolution local original */}
            <img
              src={fullSrc ?? thumbSrc}
              alt={description}
              className="max-h-[90vh] max-w-[95vw] rounded-md object-contain"
            />
          </Lightbox>
        ) : (
          <span className={`${frameClasses} flex items-center justify-center`}>
            <span className="text-xs text-muted-foreground">{media.kind}</span>
          </span>
        )}

        {total > 1 && (
          <div className="mt-2 flex items-center gap-1">
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              disabled={moving || index === 0}
              aria-label="Move photo earlier"
              onClick={() => move(index - 1)}
            >
              <ArrowLeft aria-hidden />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              disabled={moving || index === total - 1}
              aria-label="Move photo later"
              onClick={() => move(index + 2)}
            >
              <ArrowRight aria-hidden />
            </Button>
            <span className="ml-1 text-[11px] text-muted-foreground">
              {index + 1} of {total}
            </span>
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="mediaId" value={media.id} />

          <Field
            label={
              <>
                Alt text
                {needsAlt && <span className="ml-1.5 text-destructive">needed</span>}
              </>
            }
            hint="What a screen reader announces. Describe what is in the photo."
          >
            <TextArea
              name="alt"
              defaultValue={media.alt}
              rows={2}
              aria-invalid={needsAlt || undefined}
              placeholder="e.g. Kalalau Trail cutting across a green sea cliff"
            />
          </Field>

          <Field label="Caption" hint="Optional. Shown under the photo when it is opened.">
            <TextInput name="caption" defaultValue={media.caption ?? ""} />
          </Field>

          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" variant="outline" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
            <FormStatus state={state} />
          </div>
        </form>

        <form action={removeAction} className="mt-auto flex items-center gap-3">
          <input type="hidden" name="mediaId" value={media.id} />
          <Button type="submit" size="xs" variant="destructive" disabled={removing}>
            {removing ? "Removing…" : "Remove photo"}
          </Button>
          <FormStatus state={removeState} />
        </form>
      </div>
    </div>
  );
}
