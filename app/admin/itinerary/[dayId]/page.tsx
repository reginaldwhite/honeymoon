import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllAssignmentOptions,
  getAssignmentsBySourcePath,
  readTrip,
} from "@/lib/trip-repository";
import { getLibraryEntries } from "@/lib/photo-library";
import { captureDateKey, isUncertainDate } from "@/lib/photo-dates";
import { formatDayDateWithYear } from "@/lib/format";
import { bookedHoursForDay } from "@/lib/time-budget";
import { DayDetailsForm } from "@/components/admin/day-details-form";
import { ActivityEditor } from "@/components/admin/activity-editor";
import { ActivityMediaList } from "@/components/admin/activity-media-list";
import { AddActivityButton } from "@/components/admin/add-activity-button";
import { DayPhotoProvider } from "@/components/admin/day-photo-context";
import { MediaDragProvider } from "@/components/admin/media-drag-context";

export default async function AdminItineraryDayPage({
  params,
}: {
  params: Promise<{ dayId: string }>;
}) {
  const { dayId } = await params;
  const trip = await readTrip();
  const dayIndex = trip.days.findIndex((d) => d.id === dayId);
  if (dayIndex === -1) notFound();
  const day = trip.days[dayIndex];

  const allPhotos = await getLibraryEntries();
  const photos = allPhotos.filter((entry) => captureDateKey(entry.takenAt) === day.date);
  const uncertainPhotos = allPhotos.filter((entry) =>
    isUncertainDate(captureDateKey(entry.takenAt)),
  );

  // Assignments are read across the whole trip, not just this day, so the
  // picker can tell you a photo is already in use somewhere else.
  const assignments = getAssignmentsBySourcePath(trip.days);
  const targetLabels = Object.fromEntries(
    getAllAssignmentOptions(trip).map((option) => [
      option.value,
      option.groupLabel ? `${option.groupLabel} · ${option.label}` : option.label,
    ]),
  );

  return (
    <DayPhotoProvider value={{ dayId: day.id, photos, uncertainPhotos, assignments, targetLabels }}>
      <MediaDragProvider>
      <div className="mx-auto mt-4 max-w-5xl pb-16">
        <Link
          href="/admin/itinerary"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← Back to itinerary
        </Link>

        <p className="mt-3 font-mono text-xs uppercase tracking-widest text-primary">
          Day {dayIndex + 1}
        </p>
        <h1 className="mt-1 font-display text-2xl italic text-foreground">
          {day.title || "Untitled day"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatDayDateWithYear(day.date)} · {photos.length} photo
          {photos.length === 1 ? "" : "s"} in the library from this day
        </p>

        <section className="mt-6">
          <h2 className="text-xs uppercase tracking-widest text-primary">Day details</h2>
          <div className="mt-3">
            <DayDetailsForm day={day} bookedHours={bookedHoursForDay(day)} />
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xs uppercase tracking-widest text-primary">Cover photo</h2>
          <div className="mt-1 rounded-md border border-border bg-card/50 p-4">
            <ActivityMediaList
              media={day.coverMedia ? [day.coverMedia] : []}
              dayId={day.id}
              targetKey={`${day.id}::cover`}
              targetName="Cover photo"
              reorderable={false}
              variant="half"
            />
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xs uppercase tracking-widest text-primary">Activities</h2>
            <AddActivityButton dayId={day.id} />
          </div>
          <div className="mt-3 flex flex-col gap-4">
            {day.activities.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No activities yet. Add one, then use its Add image button to attach photos.
              </p>
            )}
            {day.activities.map((activity) => (
              <ActivityEditor key={activity.id} dayId={day.id} activity={activity} />
            ))}
          </div>
        </section>
      </div>
      </MediaDragProvider>
    </DayPhotoProvider>
  );
}
