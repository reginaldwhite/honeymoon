import { getChaptersWithDays } from "@/content/chapters";
import type { Activity, Day } from "@/content/types";
import {
  getAllAssignmentOptions,
  getAssignmentsBySourcePath,
  readTrip,
} from "@/lib/trip-repository";
import { Timeline } from "@/components/timeline";
import { TripOpening } from "@/components/trip-opening";
import { ActivityEditor } from "@/components/admin/activity-editor";
import { AddActivityButton } from "@/components/admin/add-activity-button";
import { AssignmentsProvider } from "@/components/admin/assignments-context";
import { DayDetailsEditor } from "@/components/admin/day-details-editor";
import { EditGroup, EditPanel, EditToggle } from "@/components/admin/edit-group";
import { MediaDragProvider } from "@/components/admin/media-drag-context";
import { ChapterEditor, OverviewForm, TripMetaForm } from "@/components/admin/story-editors";
import { SyncDaysButton } from "@/components/admin/sync-days-button";

/**
 * The itinerary editor IS the trip page. It renders the same components the
 * reader sees — TripOpening, ChapterOpener, DaySpread — from the live
 * trip-data.json, with one difference: each unit carries an Edit button, and
 * clicking it opens that unit's form directly beneath its rendering. The
 * rendering stays on screen while you edit, so after a save you see exactly
 * how the new copy sits — where it runs long, where it needs more.
 *
 * One drag context spans the page, so a photograph can be dragged between two
 * activities being edited, across days.
 */

const isEmptyActivity = (activity: Activity) =>
  !activity.title && !activity.description && activity.media.length === 0;

export default async function AdminItineraryPage() {
  const trip = await readTrip();
  const chapters = getChaptersWithDays(trip);

  const assignments = getAssignmentsBySourcePath(trip.days);
  const targetLabels = Object.fromEntries(
    getAllAssignmentOptions(trip).map((option) => [
      option.value,
      option.groupLabel ? `${option.groupLabel} · ${option.label}` : option.label,
    ]),
  );
  const dayDates = Object.fromEntries(trip.days.map((day) => [day.id, day.date]));

  // A just-added activity has nothing to display, so it opens for editing.
  const emptyActivityIds = trip.days.flatMap((day) =>
    day.activities.filter(isEmptyActivity).map((activity) => activity.id),
  );

  const unfiled = trip.days.filter(
    (day) => !trip.chapters.some((c) => day.date >= c.start && day.date <= c.end),
  );

  const dayEditor = (day: Day) => (
    <>
      <EditPanel id={day.id} label={`day ${day.title ? `— ${day.title}` : ""}`.trim()}>
        <DayDetailsEditor day={day} />
      </EditPanel>
      {day.activities.map((activity) => (
        <EditPanel
          key={activity.id}
          id={activity.id}
          label={`activity ${activity.title ? `— ${activity.title}` : ""}`.trim()}
        >
          <ActivityEditor dayId={day.id} activity={activity} />
        </EditPanel>
      ))}
      <div className="mb-8 font-body">
        <AddActivityButton dayId={day.id} />
      </div>
    </>
  );

  return (
    <AssignmentsProvider value={{ assignments, targetLabels, dayDates }}>
      <MediaDragProvider>
        <EditGroup defaultOpen={emptyActivityIds}>
          <div className="mx-auto max-w-6xl pb-24">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
              <div>
                <h1 className="font-display text-3xl italic text-foreground">Itinerary editor</h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  This is the trip page exactly as the reader sees it. Click Edit on the
                  overview, a chapter, a day, or an activity to open its form beneath it;
                  the page updates as you save. Days are generated from the dates your
                  photos were taken and filed into chapters by date.
                </p>
                {unfiled.length > 0 && (
                  <p className="mt-2 text-xs text-destructive">
                    {unfiled.length} day{unfiled.length === 1 ? "" : "s"} fall outside every
                    chapter&apos;s dates and are shown under the last chapter. Widen a
                    chapter&apos;s range to file them.
                  </p>
                )}
              </div>
              <SyncDaysButton />
            </div>

            {trip.days.length === 0 && (
              <p className="mt-8 text-sm text-muted-foreground">
                No days yet — sync from the photo library to get started.
              </p>
            )}

            <TripOpening
              trip={trip}
              chapters={chapters}
              action={<EditToggle id="overview" label="overview" />}
            />
            <EditPanel id="overview" label="overview">
              <div className="flex flex-col gap-4">
                <TripMetaForm trip={trip} />
                <OverviewForm overview={trip.overview} />
              </div>
            </EditPanel>

            <Timeline
              source={trip}
              chapterAction={(chapter) => <EditToggle id={chapter.id} label="chapter" />}
              afterChapterOpener={(chapter) => (
                <EditPanel id={chapter.id} label={`chapter — ${chapter.title}`}>
                  <ChapterEditor
                    chapter={chapter}
                    position={chapters.findIndex((c) => c.id === chapter.id) + 1}
                  />
                </EditPanel>
              )}
              dayAction={(day) => <EditToggle id={day.id} label="day" />}
              activityAction={(activity) => <EditToggle id={activity.id} label="activity" />}
              afterDay={dayEditor}
            />
          </div>
        </EditGroup>
      </MediaDragProvider>
    </AssignmentsProvider>
  );
}
