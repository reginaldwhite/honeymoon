import Link from "next/link";
import { readTrip } from "@/lib/trip-repository";
import { formatDayDateWithYear } from "@/lib/format";
import { SyncDaysButton } from "@/components/admin/sync-days-button";

export default async function AdminItineraryPage() {
  const trip = await readTrip();

  return (
    <div className="mx-auto mt-4 max-w-5xl">
      <h1 className="font-display text-3xl italic text-foreground">Itinerary editor</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Days are generated from the dates your photos were taken. Click a day to edit its
        copy and choose which photos represent it.
      </p>

      <div className="mt-6">
        <SyncDaysButton />
      </div>

      <div className="mt-8 flex flex-col gap-2">
        {trip.days.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No days yet — sync from the photo library to get started.
          </p>
        )}
        {trip.days.map((day, index) => {
          const photoCount =
            (day.coverMedia ? 1 : 0) +
            day.activities.reduce((sum, a) => sum + a.media.length, 0);

          return (
            <Link
              key={day.id}
              href={`/admin/itinerary/${day.id}`}
              className="flex items-center justify-between gap-4 rounded-md border border-border px-4 py-3 text-sm transition-colors hover:border-primary"
            >
              <div className="min-w-0">
                <p className="truncate text-foreground">
                  Day {index + 1} · {day.title || <span className="text-muted-foreground">Untitled day</span>}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatDayDateWithYear(day.date)}
                </p>
              </div>
              <span className="shrink-0 text-right text-xs text-muted-foreground">
                {day.activities.length} activit{day.activities.length === 1 ? "y" : "ies"}
                <br />
                {photoCount} photo{photoCount === 1 ? "" : "s"}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
