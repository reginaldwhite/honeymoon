"use client";

import { useState } from "react";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useDayPhotos } from "./day-photo-context";
import { PhotoTile } from "./photo-tile";
import type { LibraryEntry } from "@/lib/photo-library";

/** Wide panel, few columns — the picker is for recognising photos, not counting them. */
const PICKER_GRID = "mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5";

/**
 * Opens the day's photo library in a modal, scoped to one destination — a
 * specific activity, or the day's cover. Because the destination is fixed,
 * clicking a photo assigns it outright; clicking an already-assigned one
 * removes it.
 *
 * This replaces the two full-page photo grids that used to sit under the
 * editor, where you had to scroll past the whole library and then pick a target
 * from a dropdown on every tile.
 */
export function AddImageButton({
  targetKey,
  targetName,
  label = "Add image",
  variant = "outline",
}: {
  /** `${dayId}::cover` or `${dayId}::${activityId}`. */
  targetKey: string;
  /** Human name for the destination, shown in the modal heading. */
  targetName: string;
  label?: string;
  variant?: "default" | "outline";
}) {
  const [open, setOpen] = useState(false);
  const { photos, uncertainPhotos, assignments, targetLabels } = useDayPhotos();

  const assignedCount = Object.values(assignments).filter(
    (assignment) => `${assignment.dayId}::${assignment.target}` === targetKey,
  ).length;

  const renderTile = (entry: LibraryEntry) => {
    const assignment = assignments[entry.path];
    const currentKey = assignment ? `${assignment.dayId}::${assignment.target}` : null;
    const assignedHere = currentKey === targetKey;

    return (
      <PhotoTile
        key={entry.path}
        entry={entry}
        assign={{
          mode: "toggle",
          targetKey,
          currentMediaId: assignment?.mediaId ?? null,
          assignedHere,
          assignedElsewhere:
            currentKey && !assignedHere ? (targetLabels[currentKey] ?? "another slot") : undefined,
        }}
      />
    );
  };

  return (
    <>
      <Button type="button" variant={variant} size="sm" onClick={() => setOpen(true)}>
        <ImagePlus aria-hidden />
        {label}
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Add photos — ${targetName}`}
        description={
          <>
            Click a photo to add it. Click an added photo to remove it.
            {assignedCount > 0 && ` ${assignedCount} currently added.`}
          </>
        }
      >
        {photos.length === 0 && uncertainPhotos.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">
            No photos in the library are dated to this day yet.
          </p>
        ) : (
          <div className="flex flex-col gap-8">
            {photos.length > 0 && (
              <section>
                <h3 className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Taken this day ({photos.length})
                </h3>
                <div className={PICKER_GRID}>
                  {photos.map(renderTile)}
                </div>
              </section>
            )}

            {uncertainPhotos.length > 0 && (
              <section>
                <h3 className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Uncertain date ({uncertainPhotos.length})
                </h3>
                <p className="mt-1 text-[11px] text-muted-foreground/80">
                  These have a mistimestamped capture date and could belong to any day of the
                  trip, so they are offered on every day — assign them by content.
                </p>
                <div className={PICKER_GRID}>
                  {uncertainPhotos.map(renderTile)}
                </div>
              </section>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
