"use client";

import { useState } from "react";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useAssignments } from "./assignments-context";
import { PhotoTile } from "./photo-tile";
import type { LibraryEntry } from "@/lib/photo-library";

/** Wide panel, few columns — the picker is for recognising photos, not counting them. */
const PICKER_GRID = "mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5";

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; photos: LibraryEntry[]; uncertain: LibraryEntry[] }
  | { status: "error"; message: string };

async function fetchEntries(query: string): Promise<LibraryEntry[]> {
  const data = await fetch(`/admin/api/browse?${query}`).then((res) => res.json());
  if (data.error) throw new Error(data.error);
  return data.entries;
}

/**
 * Opens the day's photo library in a modal, scoped to one destination — a
 * specific activity, or the day's cover. Because the destination is fixed,
 * clicking a photo assigns it outright; clicking an already-assigned one
 * removes it.
 *
 * The day's files are fetched the first time the picker opens, not rendered
 * into the page: the itinerary editor is one long scroll of every day, and
 * serializing sixteen days of library listings up front would dwarf the page.
 */
export function AddImageButton({
  targetKey,
  targetName,
  variant = "outline",
}: {
  /** `${dayId}::cover` or `${dayId}::${activityId}`. */
  targetKey: string;
  /** Human name for the destination, shown in the modal heading. */
  targetName: string;
  variant?: "default" | "outline";
}) {
  const [open, setOpen] = useState(false);
  const [load, setLoad] = useState<LoadState>({ status: "idle" });
  const { assignments, targetLabels, dayDates } = useAssignments();

  const dayId = targetKey.split("::")[0];
  const date = dayDates[dayId];

  const openPicker = () => {
    setOpen(true);
    if (load.status !== "idle") return;
    setLoad({ status: "loading" });
    Promise.all([
      fetchEntries(`date=${encodeURIComponent(date)}`),
      fetchEntries("uncertain=1"),
    ])
      .then(([photos, uncertain]) => setLoad({ status: "ready", photos, uncertain }))
      .catch((error: unknown) =>
        setLoad({
          status: "error",
          message: error instanceof Error ? error.message : "Could not load the photo library",
        }),
      );
  };

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
      <Button type="button" variant={variant} size="sm" onClick={openPicker}>
        <ImagePlus aria-hidden />
        Add image
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
        {load.status === "loading" || load.status === "idle" ? (
          <p className="py-6 text-sm text-muted-foreground">Loading photos…</p>
        ) : load.status === "error" ? (
          <p role="alert" className="py-6 text-sm text-destructive">
            {load.message}
          </p>
        ) : load.photos.length === 0 && load.uncertain.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">
            No photos in the library are dated to this day yet.
          </p>
        ) : (
          <div className="flex flex-col gap-8">
            {load.photos.length > 0 && (
              <section>
                <h3 className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Taken this day ({load.photos.length})
                </h3>
                <div className={PICKER_GRID}>{load.photos.map(renderTile)}</div>
              </section>
            )}

            {load.uncertain.length > 0 && (
              <section>
                <h3 className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Uncertain date ({load.uncertain.length})
                </h3>
                <p className="mt-1 text-[11px] text-muted-foreground/80">
                  These have a mistimestamped capture date and could belong to any day of the
                  trip, so they are offered on every day — assign them by content.
                </p>
                <div className={PICKER_GRID}>{load.uncertain.map(renderTile)}</div>
              </section>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
