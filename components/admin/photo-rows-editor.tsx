"use client";

import { useActionState, useState, useTransition } from "react";
import { GripVertical, Plus, Trash2, X } from "lucide-react";
import { moveMediaToPosition, unassignMedia } from "@/app/admin/itinerary/actions";
import { PhotoRowGrid } from "@/components/activity-spread-frame";
import { Button } from "@/components/ui/button";
import type { MediaRef, PhotoRowColumns } from "@/content/types";
import { DEFAULT_COLUMNS, flatIndex, photoRows } from "@/lib/photo-rows";
import { cn } from "@/lib/utils";
import { AddImageButton } from "./add-image-button";
import { useEditField } from "./edits-context";
import { ColumnsToggle } from "./inline-field";
import { useMediaDrag } from "./media-drag-context";
import { MediaFields } from "./photo-slot";
import { rawMediaUrl } from "./raw-media-url";

/**
 * An activity's photographs, laid out in exactly the rows the public page
 * shows, with the row shapes editable: each row has a 1 / 2 / 3 toggle, rows
 * can be added and removed, and photographs drag between cells — including
 * into another activity's grid — to change the order that fills the rows.
 *
 * The row SHAPES are an edit, saved with everything else on the page. Adding,
 * removing and reordering PHOTOGRAPHS are immediate server operations, as they
 * are everywhere in the admin, because they change which photo lives where.
 */
export function PhotoRowsEditor({
  activityId,
  targetKey,
  targetName,
  media,
  layout: savedLayout,
  className,
}: {
  activityId: string;
  targetKey: string;
  targetName: string;
  media: MediaRef[];
  layout: PhotoRowColumns[];
  className?: string;
}) {
  const [layout, setLayout] = useEditField<PhotoRowColumns[]>(
    `activity:${activityId}:layout`,
    savedLayout,
  );
  const rows = photoRows(media, layout);
  const { dragging, begin, end } = useMediaDrag();
  const [dropAt, setDropAt] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  // Row shapes: every row up to the edited one becomes authored; the rest
  // keep whatever they were (authored rows stay, implicit ones recompute).
  const setColumns = (rowIndex: number, columns: PhotoRowColumns) =>
    setLayout([
      ...rows.slice(0, rowIndex).map((row) => row.columns),
      columns,
      ...rows.slice(rowIndex + 1).filter((row) => !row.implicit).map((row) => row.columns),
    ]);
  const removeRow = (rowIndex: number) =>
    setLayout(rows.filter((row, index) => index !== rowIndex && !row.implicit).map((r) => r.columns));
  const addRow = () => setLayout([...rows.map((row) => row.columns), DEFAULT_COLUMNS]);

  const commitDrop = (index: number) => {
    if (!dragging) return;
    const payload = dragging;
    setDropAt(null);
    end();
    startTransition(async () => {
      await moveMediaToPosition({ mediaId: payload.mediaId, targetKey, index });
    });
  };

  return (
    <div className={cn("flex flex-col gap-3", pending && "opacity-60", className)}>
      <PhotoRowGrid
        rows={rows}
        renderCell={(row, rowIndex, cellIndex) => {
          const item = row.cells[cellIndex];
          const index = flatIndex(rows, rowIndex, cellIndex);
          return (
            <Cell
              media={item}
              index={index}
              isDropTarget={dropAt === index}
              isDragging={item !== null && dragging?.mediaId === item.id}
              onDragStart={(event) => {
                if (!item) return;
                begin({ mediaId: item.id, fromTargetKey: targetKey });
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", item.id);
              }}
              onDragEnd={() => {
                setDropAt(null);
                end();
              }}
              onDragOver={(event) => {
                if (!dragging) return;
                event.preventDefault();
                const box = event.currentTarget.getBoundingClientRect();
                setDropAt(event.clientX > box.left + box.width / 2 ? index + 1 : index);
              }}
              onDrop={(event) => {
                if (!dragging) return;
                event.preventDefault();
                const box = event.currentTarget.getBoundingClientRect();
                commitDrop(event.clientX > box.left + box.width / 2 ? index + 1 : index);
              }}
            />
          );
        }}
        aside={(row, rowIndex) => (
          <div className="flex h-full flex-col items-end justify-between py-0.5">
            <ColumnsToggle
              value={row.columns}
              onChange={(columns) => setColumns(rowIndex, columns)}
              label={`Row ${rowIndex + 1} columns`}
            />
            {!row.implicit && (
              <button
                type="button"
                onClick={() => removeRow(rowIndex)}
                aria-label={`Remove row ${rowIndex + 1} (its photographs flow into the next row)`}
                title="Remove row"
                className="flex size-7 cursor-pointer items-center justify-center rounded border border-border text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
              >
                <Trash2 className="size-3.5" aria-hidden />
              </button>
            )}
          </div>
        )}
      />

      <div className="flex flex-wrap items-center gap-2 pr-12">
        <AddImageButton targetKey={targetKey} targetName={targetName} />
        <Button type="button" size="sm" variant="outline" onClick={addRow}>
          <Plus aria-hidden />
          Add row
        </Button>
        {rows.some((row) => row.implicit) && (
          <span className="text-[11px] text-muted-foreground">
            Rows without a toggle setting are automatic threes — set one to author it.
          </span>
        )}
      </div>
    </div>
  );
}

function Cell({
  media,
  index,
  isDropTarget,
  isDragging,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  media: MediaRef | null;
  index: number;
  isDropTarget: boolean;
  isDragging: boolean;
  onDragStart: (event: React.DragEvent) => void;
  onDragEnd: () => void;
  onDragOver: (event: React.DragEvent) => void;
  onDrop: (event: React.DragEvent) => void;
}) {
  const [removeState, removeAction, removing] = useActionState(unassignMedia, undefined);

  return (
    <div className="relative h-full" onDragOver={onDragOver} onDrop={onDrop}>
      {isDropTarget && (
        <span aria-hidden className="absolute inset-y-0 -left-1.5 z-10 w-1 rounded-full bg-primary" />
      )}
      {media?.sourcePath ? (
        <div
          draggable
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          className={cn("h-full cursor-grab active:cursor-grabbing", (isDragging || removing) && "opacity-40")}
        >
          <div className="plate relative h-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element -- local dev-only file stream */}
            <img
              src={rawMediaUrl(media.sourcePath, undefined, 1200)}
              alt=""
              draggable={false}
              className="h-full w-full object-cover"
            />
            <span
              aria-hidden
              className="absolute top-1 right-1 flex size-5 items-center justify-center rounded bg-black/55 text-white/90"
            >
              <GripVertical className="size-3" />
            </span>
            {/* Alt text and caption sit over the foot of the frame, so the
                grid keeps exactly the public page's shape. */}
            <div className="absolute inset-x-0 bottom-0 bg-background/85 px-2 pb-1.5 backdrop-blur-sm">
              <MediaFields media={media} compact />
            </div>
          </div>
          <form action={removeAction} className="absolute top-2 left-2 z-10">
            <input type="hidden" name="mediaId" value={media.id} />
            <button
              type="submit"
              disabled={removing}
              aria-label={`Remove ${media.alt || media.sourcePath} from this activity`}
              title="Remove photo"
              className="flex size-6 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white shadow transition-colors hover:bg-destructive disabled:cursor-default"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </form>
          {removeState?.error && (
            <p role="alert" className="absolute inset-x-2 top-10 rounded bg-destructive px-1.5 py-0.5 text-[10px] text-white">
              {removeState.error}
            </p>
          )}
        </div>
      ) : (
        <div className="flex h-full items-center justify-center border border-dashed border-border text-[10px] uppercase tracking-wide text-muted-foreground">
          Empty cell {index + 1}
        </div>
      )}
    </div>
  );
}
