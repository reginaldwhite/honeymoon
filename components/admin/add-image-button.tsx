"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ImagePlus } from "lucide-react";
import type { LibraryDateGroup } from "@/app/admin/api/browse/route";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatWeekdayDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAssignments } from "./assignments-context";
import { PhotoTile } from "./photo-tile";
import type { LibraryEntry } from "@/lib/photo-library";

/** Wide panel, few columns — the picker is for recognising photos, not counting them. */
const PICKER_GRID = "mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5";

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; groups: LibraryDateGroup[] }
  | { status: "error"; message: string };

/**
 * The whole library is fetched once per page and shared by every picker on
 * it: it is a few hundred kilobytes of file paths, and a chapter has a dozen
 * or more Add image buttons that would otherwise each fetch it.
 */
let libraryPromise: Promise<LibraryDateGroup[]> | null = null;
function loadLibrary(): Promise<LibraryDateGroup[]> {
  libraryPromise ??= fetch("/admin/api/browse?all=1")
    .then((res) => res.json())
    .then((data) => {
      if (data.error) throw new Error(data.error);
      return data.groups as LibraryDateGroup[];
    })
    .catch((error: unknown) => {
      libraryPromise = null; // let the next open retry
      throw error;
    });
  return libraryPromise;
}

function groupLabel(group: LibraryDateGroup): string {
  if (group.date.endsWith("-01-01")) return "Unknown date — camera clock was never set (1/1)";
  if (group.uncertain) return `Unknown date — stamped ${formatWeekdayDate(group.date)}, after the trip`;
  return formatWeekdayDate(group.date);
}

/**
 * Rough height of one tile row (square thumbnail, name, rotate buttons) at
 * the picker's column widths. Only the placeholder height needs it, and the
 * scroller's anchoring absorbs the difference once real tiles are in.
 */
const TILE_ROW_ESTIMATE_PX = 340;
const COLUMNS_ESTIMATE = 4;

/**
 * One date's tiles, mounted only when the section scrolls within reach.
 *
 * The library is several hundred photographs, and a tile is not cheap: a
 * form, buttons, three action hooks. Mounting all of them on open froze the
 * page for a second or two. So each section starts as a placeholder of about
 * the right height — enough for the open-on-date scroll and the date chips to
 * land on the right spot — and fills in the first time it comes near the
 * viewport. It stays filled after that.
 */
function LazySection({
  id,
  className,
  count,
  heading,
  children,
}: {
  id: string;
  className?: string;
  count: number;
  heading: ReactNode;
  children: () => ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || mounted) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setMounted(true);
          observer.disconnect();
        }
      },
      // Fill in a screen ahead in both directions so scrolling meets tiles,
      // not placeholders.
      { root: el.closest(".overflow-y-auto"), rootMargin: "800px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [mounted]);

  const placeholderHeight = Math.ceil(count / COLUMNS_ESTIMATE) * TILE_ROW_ESTIMATE_PX;

  return (
    <section ref={ref} id={id} className={className}>
      {heading}
      {mounted ? (
        children()
      ) : (
        <div aria-hidden style={{ height: placeholderHeight }} className={PICKER_GRID}>
          {Array.from({ length: Math.min(count, COLUMNS_ESTIMATE) }, (_, i) => (
            <div key={i} className="aspect-square rounded-md bg-secondary/30" />
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * Opens the photo library in a modal, scoped to one destination — an
 * activity's rows or cover, a chapter hero, the frontispiece. Because the
 * destination is fixed, clicking a photo assigns it outright; clicking an
 * already-assigned one removes it.
 *
 * Every photograph in the library is here, grouped by the day it was taken,
 * with the days of the chapter being edited highlighted so the likely ones
 * are easy to find without hiding the rest. Files whose timestamp can't be
 * trusted come last, the reset-clock (1/1) files last of all.
 */
export function AddImageButton({
  targetKey,
  targetName,
  variant = "outline",
}: {
  /** `${ownerId}::${slot}` — see assignMedia. */
  targetKey: string;
  /** Human name for the destination, shown in the modal heading. */
  targetName: string;
  variant?: "default" | "outline";
}) {
  const [open, setOpen] = useState(false);
  const [load, setLoad] = useState<LoadState>({ status: "idle" });
  const { assignments, targetLabels, targetPaths, chapterDates, defaultDateByTarget } =
    useAssignments();
  // Where the photos are going, from the top down — chapter, day, activity,
  // slot — so the heading says which of the page's many slots this is.
  const targetPath = targetPaths[targetKey] ?? [targetName];
  const inChapter = new Set(chapterDates);
  const defaultDate = defaultDateByTarget[targetKey];
  const bodyRef = useRef<HTMLDivElement>(null);

  // Once the library is in, open on the date this slot belongs to — or the
  // next date that has photographs — so the likely ones are at the top and
  // everything else is a scroll away in either direction.
  useEffect(() => {
    if (!open || load.status !== "ready" || !defaultDate) return;
    const dated = load.groups.filter((group) => !group.uncertain);
    const target = dated.find((group) => group.date >= defaultDate) ?? dated[dated.length - 1];
    if (!target) return;
    // Scroll at the next frame, and again once the dialog's entry transition
    // has finished, so a cached library (ready in the same frame the dialog
    // opens) and a fetched one (ready seconds later) both land.
    const scroll = () =>
      bodyRef.current
        ?.querySelector(`[id="picker-${target.date}"]`)
        ?.scrollIntoView({ block: "start" });
    const frame = requestAnimationFrame(scroll);
    const settled = setTimeout(scroll, 260);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(settled);
    };
  }, [open, load, defaultDate]);

  const openPicker = () => {
    setOpen(true);
    if (load.status === "ready" || load.status === "loading") return;
    setLoad({ status: "loading" });
    loadLibrary()
      .then((groups) => setLoad({ status: "ready", groups }))
      .catch((error: unknown) =>
        setLoad({
          status: "error",
          message: error instanceof Error ? error.message : "Could not load the photo library",
        }),
      );
  };

  const assignedCount = Object.values(assignments).filter(
    (assignment) => `${assignment.ownerId}::${assignment.target}` === targetKey,
  ).length;

  const renderTile = (entry: LibraryEntry) => {
    const assignment = assignments[entry.path];
    const currentKey = assignment ? `${assignment.ownerId}::${assignment.target}` : null;
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

  // Instant, not smooth: sections fill in as they come into reach, and a
  // smooth scroll across the library is thrown off by their heights changing
  // under it.
  const jumpTo = (date: string) =>
    document.getElementById(`picker-${date}`)?.scrollIntoView({ block: "start" });

  return (
    <>
      <Button type="button" variant={variant} size="sm" onClick={openPicker}>
        <ImagePlus aria-hidden />
        Add image
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={["Add photos", ...targetPath].join(" — ")}
        description={
          <>
            Click a photo to add it. Click an added photo to remove it.
            {assignedCount > 0 && ` ${assignedCount} currently added.`}
            {chapterDates.length > 0 && " Days in this chapter are highlighted."}
            {defaultDate && ` Opens on ${formatWeekdayDate(defaultDate)}; scroll for other days.`}
          </>
        }
      >
        {load.status === "loading" || load.status === "idle" ? (
          <p className="py-6 text-sm text-muted-foreground">Loading photos…</p>
        ) : load.status === "error" ? (
          <p role="alert" className="py-6 text-sm text-destructive">
            {load.message}
          </p>
        ) : load.groups.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">The library is empty.</p>
        ) : (
          <>
            <nav aria-label="Jump to a date" className="flex flex-wrap gap-1.5">
              {load.groups.map((group) => (
                <button
                  key={group.date}
                  type="button"
                  onClick={() => jumpTo(group.date)}
                  className={cn(
                    "cursor-pointer rounded-full border px-2.5 py-1 text-[11px] transition-colors hover:border-primary hover:text-primary",
                    inChapter.has(group.date)
                      ? "border-accent bg-accent/10 text-accent-700"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {group.uncertain
                    ? group.date.endsWith("-01-01")
                      ? "1/1"
                      : "unknown"
                    : formatWeekdayDate(group.date)}{" "}
                  ({group.entries.length})
                </button>
              ))}
            </nav>

            <div ref={bodyRef} className="mt-6 flex flex-col gap-8">
              {load.groups.map((group) => {
                const highlighted = inChapter.has(group.date);
                return (
                  <LazySection
                    key={group.date}
                    id={`picker-${group.date}`}
                    count={group.entries.length}
                    className={cn(
                      "scroll-mt-2 rounded-md",
                      highlighted && "-mx-3 bg-accent/10 px-3 py-3",
                    )}
                    heading={
                      <h3 className="flex flex-wrap items-baseline gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                        <span className={cn(highlighted && "text-accent-700")}>{groupLabel(group)}</span>
                        <span>· {group.entries.length}</span>
                        {highlighted && (
                          <span className="rounded-full border border-accent px-2 py-0.5 text-[10px] text-accent-700">
                            this chapter
                          </span>
                        )}
                      </h3>
                    }
                  >
                    {() => <div className={PICKER_GRID}>{group.entries.map(renderTile)}</div>}
                  </LazySection>
                );
              })}
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
