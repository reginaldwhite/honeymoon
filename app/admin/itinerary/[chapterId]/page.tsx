import { notFound } from "next/navigation";
import { formatWeekdayDate } from "@/lib/format";
import { getChapters } from "@/content/chapters";
import { getTripDateRange } from "@/lib/content";
import {
  OVERVIEW_OWNER_ID,
  coverTarget,
  getAllAssignmentOptions,
  getAssignmentsBySourcePath,
  readTrip,
} from "@/lib/trip-repository";
import { ActivitySpreadEditor } from "@/components/admin/activity-spread-editor";
import { AddActivityButton } from "@/components/admin/add-activity-button";
import { AssignmentsProvider } from "@/components/admin/assignments-context";
import { ChapterOpenerEditor } from "@/components/admin/chapter-opener-editor";
import { EditsProvider } from "@/components/admin/edits-context";
import { MediaDragProvider } from "@/components/admin/media-drag-context";
import { OpeningEditor } from "@/components/admin/opening-editor";
import { SaveBar } from "@/components/admin/save-bar";

/**
 * One chapter (or the opening) with every field in edit mode, laid out
 * exactly as the reader sees it, saving as you type.
 *
 * Text edits accumulate as an overlay and are written in locked saves a
 * moment after typing pauses.
 * Photographs — add, remove, reorder — are immediate, as they are everywhere
 * in the admin: they change where a photo lives, and the page refreshes
 * around the unsaved text without disturbing it. One drag context spans the
 * chapter, so a photograph can move between its activities.
 */
export default async function ChapterEditorPage({
  params,
}: {
  params: Promise<{ chapterId: string }>;
}) {
  const { chapterId } = await params;
  const trip = await readTrip();
  const chapters = getChapters(trip);
  const isOpening = chapterId === OVERVIEW_OWNER_ID;
  const chapter = isOpening ? undefined : chapters.find((c) => c.id === chapterId);
  if (!isOpening && !chapter) notFound();

  const assignments = getAssignmentsBySourcePath(trip);
  const targetLabels = Object.fromEntries(
    getAllAssignmentOptions(trip).map((option) => [
      option.value,
      option.groupLabel ? `${option.groupLabel} · ${option.label}` : option.label,
    ]),
  );
  const tripStart = getTripDateRange(trip)?.start ?? "";

  // For every picker on this page: the dates to highlight, the date to open
  // on, and what the photos are going into, from the top down.
  const chapterDates = chapter ? [...new Set(chapter.activities.map((a) => a.date))] : [];
  const defaultDateByTarget: Record<string, string> = {};
  const targetPaths: Record<string, string[]> = {};
  if (isOpening) {
    const key = `${OVERVIEW_OWNER_ID}::frontispiece`;
    defaultDateByTarget[key] = tripStart;
    targetPaths[key] = ["The opening", "Frontispiece"];
  } else {
    const chapterPath = [chapter!.ordinal, chapter!.title || "Untitled chapter"];
    const heroKey = `${chapter!.id}::hero`;
    defaultDateByTarget[heroKey] = chapter!.start ?? tripStart;
    targetPaths[heroKey] = [...chapterPath, "Hero photograph"];
    for (const activity of chapter!.activities) {
      const name = activity.title || "Untitled activity";
      const activityPath = [
        ...chapterPath,
        activity.date ? `${name} · ${formatWeekdayDate(activity.date)}` : name,
      ];
      const date = activity.date || chapter!.start || tripStart;
      const coverKey = `${chapter!.id}::${coverTarget(activity.id)}`;
      const rowsKey = `${chapter!.id}::${activity.id}`;
      defaultDateByTarget[coverKey] = date;
      defaultDateByTarget[rowsKey] = date;
      targetPaths[coverKey] = [...activityPath, "Cover photo"];
      targetPaths[rowsKey] = [...activityPath, "Photographs"];
    }
  }

  return (
    <AssignmentsProvider
      value={{ assignments, targetLabels, targetPaths, chapterDates, defaultDateByTarget }}
    >
      <MediaDragProvider>
        <EditsProvider>
          <SaveBar
            title={isOpening ? "The opening" : `${chapter!.ordinal} — ${chapter!.title}`}
            backHref="/admin/itinerary"
          />
          <div className="mx-auto max-w-6xl pb-24">
            {isOpening ? (
              <OpeningEditor trip={trip} chapters={chapters} />
            ) : (
              <>
                <ChapterOpenerEditor chapter={chapter!} />
                {chapter!.activities.length > 0 && (
                  <div className="mt-10 flex items-center gap-3 border-b border-divider pb-6">
                    <AddActivityButton chapterId={chapter!.id} position="start" size="sm" />
                    <span className="text-xs text-muted-foreground">
                      Goes above {chapter!.activities[0].title || "the first activity"}.
                    </span>
                  </div>
                )}
                {chapter!.activities.map((activity, index) => (
                  <ActivitySpreadEditor
                    key={activity.id}
                    chapterId={chapter!.id}
                    activity={activity}
                    index={index}
                    isLast={index === chapter!.activities.length - 1}
                    omitMediaId={chapter!.cover?.id}
                  />
                ))}
                <div className="mt-10 flex items-center gap-3">
                  <AddActivityButton chapterId={chapter!.id} />
                  {chapter!.activities.length === 0 && (
                    <span className="text-sm text-muted-foreground">
                      No activities yet — add one and its photographs.
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </EditsProvider>
      </MediaDragProvider>
    </AssignmentsProvider>
  );
}
