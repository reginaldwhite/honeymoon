import { getAllAssignmentOptions, getAssignmentsBySourcePath, readTrip } from "@/lib/trip-repository";
import { LibraryBrowser } from "@/components/admin/library-browser";

export default async function AdminLibraryPage() {
  const trip = await readTrip();

  return (
    <div className="mt-4">
      <h1 className="font-display text-3xl italic text-foreground">Media library</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Every photo/video in your local library, grouped by the day it was taken.
        Rotate directly here — the library is a disposable local working copy, so changes
        aren&apos;t confirmed before applying. Assign photos to a chapter hero or an activity
        from here, then write their alt text in the itinerary editor.
      </p>

      <LibraryBrowser
        options={getAllAssignmentOptions(trip)}
        assignments={getAssignmentsBySourcePath(trip)}
      />
    </div>
  );
}
