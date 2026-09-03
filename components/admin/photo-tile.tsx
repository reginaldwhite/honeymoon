"use client";

import { useActionState } from "react";
import { Check, RotateCcw, RotateCw, Video } from "lucide-react";
import { rotateLibraryMedia } from "@/app/admin/library/actions";
import { assignLibraryPhotoToTarget, unassignMedia } from "@/app/admin/itinerary/actions";
import { Button } from "@/components/ui/button";
import { SelectInput } from "@/components/ui/field";
import { Lightbox } from "@/components/ui/lightbox";
import { cn } from "@/lib/utils";
import type { AssignmentOption } from "@/lib/trip-repository";
import type { LibraryEntry } from "@/lib/photo-library";
import { usePhotoSelection } from "./photo-selection-context";
import { rawMediaUrl } from "./raw-media-url";

/**
 * How this tile lets you assign the photo.
 *
 * "select" is the library browser, where any day's cover or activity is a valid
 * destination. "toggle" is the per-target picker opened from an Add image
 * button, where the destination is already known — so the tile itself is the
 * control and one click assigns or removes.
 */
export type PhotoTileAssign =
  | {
      mode: "select";
      options: AssignmentOption[];
      currentValue: string | null;
      currentMediaId: string | null;
    }
  | {
      mode: "toggle";
      targetKey: string;
      currentMediaId: string | null;
      assignedHere: boolean;
      /** Where this photo currently lives, if that is some other slot. */
      assignedElsewhere?: string;
    };

function groupOptions(options: AssignmentOption[]) {
  const groups = new Map<string, AssignmentOption[]>();
  const ungrouped: AssignmentOption[] = [];
  for (const option of options) {
    if (!option.groupLabel) {
      ungrouped.push(option);
      continue;
    }
    const list = groups.get(option.groupLabel);
    if (list) list.push(option);
    else groups.set(option.groupLabel, [option]);
  }
  return { groups, ungrouped };
}

export function PhotoTile({
  entry,
  assign,
}: {
  entry: LibraryEntry;
  assign?: PhotoTileAssign;
}) {
  const [rotateState, rotateAction, rotating] = useActionState(rotateLibraryMedia, undefined);
  const [assignState, assignAction, assigning] = useActionState(
    assignLibraryPhotoToTarget,
    undefined,
  );
  const [unassignState, unassignAction, unassigning] = useActionState(unassignMedia, undefined);
  const { selectedPath, select: selectPhoto } = usePhotoSelection();

  /*
   * The thumbnail URL carries a version so the browser can cache it hard, and
   * so a rotation actually shows up. `entry.version` is the file's mtime from
   * the server scan; a rotation performed here returns the file's new mtime,
   * which takes precedence because the library list is fetched client-side and
   * would otherwise keep handing back the pre-rotation URL.
   */
  const cacheKey = rotateState?.version ?? entry.version;

  const isSelected = selectedPath === entry.path;
  const busy = rotating || assigning || unassigning;
  const rawSrc = rawMediaUrl(entry.path, cacheKey, 480);
  const fullSrc = rawMediaUrl(entry.path, cacheKey);
  const error = rotateState?.error ?? assignState?.error ?? unassignState?.error;
  const assignedHere = assign?.mode === "toggle" && assign.assignedHere;

  const frameClasses = cn(
    "relative block aspect-square w-full overflow-hidden rounded-md border-2 bg-secondary/30 transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
    assignedHere ? "border-primary" : isSelected ? "border-primary/60" : "border-border",
    !assignedHere && "hover:border-primary",
    busy && "opacity-60",
  );

  const thumbnail =
    entry.kind === "image" ? (
      // eslint-disable-next-line @next/next/no-img-element -- local dev-only file stream, versioned by mtime
      <img
        src={rawSrc}
        alt={entry.name}
        width={240}
        height={240}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover"
      />
    ) : (
      <span className="flex h-full w-full items-center justify-center text-muted-foreground">
        <Video className="size-6" aria-hidden />
      </span>
    );

  const rotateControls = entry.kind === "image" && (
    <form action={rotateAction} className="flex gap-1">
      <input type="hidden" name="path" value={entry.path} />
      <Button
        type="submit"
        name="degrees"
        value="-90"
        size="icon-sm"
        variant="outline"
        disabled={busy}
        aria-label={`Rotate ${entry.name} left`}
        className="flex-1"
      >
        <RotateCcw aria-hidden />
      </Button>
      <Button
        type="submit"
        name="degrees"
        value="90"
        size="icon-sm"
        variant="outline"
        disabled={busy}
        aria-label={`Rotate ${entry.name} right`}
        className="flex-1"
      >
        <RotateCw aria-hidden />
      </Button>
    </form>
  );

  return (
    <div className="flex flex-col gap-1.5">
      {assign?.mode === "toggle" ? (
        // One click is the whole interaction: submit an assign, or an unassign
        // if this photo already fills the slot.
        <form action={assignedHere ? unassignAction : assignAction}>
          {assignedHere ? (
            <input type="hidden" name="mediaId" value={assign.currentMediaId ?? ""} />
          ) : (
            <>
              <input type="hidden" name="targetKey" value={assign.targetKey} />
              <input type="hidden" name="libraryPath" value={entry.path} />
              <input type="hidden" name="kind" value={entry.kind} />
            </>
          )}
          <button
            type="submit"
            disabled={busy}
            aria-pressed={assignedHere}
            aria-label={
              assignedHere ? `Remove ${entry.name} from this activity` : `Add ${entry.name}`
            }
            className={frameClasses}
          >
            {thumbnail}
            {assignedHere && (
              <span
                aria-hidden
                className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow"
              >
                <Check className="size-3" />
              </span>
            )}
          </button>
        </form>
      ) : entry.kind === "image" ? (
        <Lightbox
          label={entry.name}
          triggerLabel={`View ${entry.name} full size`}
          triggerClassName={frameClasses}
          trigger={thumbnail}
          onOpen={() => selectPhoto(entry.path)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- full-resolution local original */}
          <img
            src={fullSrc}
            alt={entry.name}
            className="max-h-[90vh] max-w-[95vw] rounded-md object-contain"
          />
        </Lightbox>
      ) : (
        <div className={frameClasses}>{thumbnail}</div>
      )}

      <p className="truncate text-[11px] text-muted-foreground" title={entry.name}>
        {entry.name}
      </p>

      {assign?.mode === "toggle" && assign.assignedElsewhere && !assignedHere && (
        <p className="truncate text-[10px] text-muted-foreground/80" title={assign.assignedElsewhere}>
          In use: {assign.assignedElsewhere}
        </p>
      )}

      {rotateControls}

      {assign?.mode === "select" && (
        <>
          <form action={assignAction} onChange={(event) => event.currentTarget.requestSubmit()}>
            <input type="hidden" name="libraryPath" value={entry.path} />
            <input type="hidden" name="kind" value={entry.kind} />
            <SelectInput
              // Re-key so the select re-syncs with the server value after the
              // assignment round-trips.
              key={assign.currentValue ?? "unassigned"}
              name="targetKey"
              defaultValue={assign.currentValue ?? ""}
              disabled={busy}
              aria-label={`Assign ${entry.name} to`}
              className="text-[11px]"
            >
              <option value="" disabled>
                Unassigned
              </option>
              {groupOptions(assign.options).ungrouped.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
              {[...groupOptions(assign.options).groups.entries()].map(([groupLabel, options]) => (
                <optgroup key={groupLabel} label={groupLabel}>
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </SelectInput>
          </form>

          {assign.currentMediaId && (
            <form action={unassignAction}>
              <input type="hidden" name="mediaId" value={assign.currentMediaId} />
              <Button type="submit" size="xs" variant="destructive" disabled={busy}>
                {unassigning ? "Removing…" : "Remove"}
              </Button>
            </form>
          )}
        </>
      )}

      {error && (
        <p role="alert" className="text-[10px] text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
