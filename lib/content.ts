import { trip } from "@/content/trip";
import type { MediaRef, Trip } from "@/content/types";

/** Flat list of every MediaRef across all days/activities/cover images. */
export function getAllMedia(source: Trip = trip): MediaRef[] {
  const media: MediaRef[] = [];
  for (const day of source.days) {
    if (day.coverMedia) media.push(day.coverMedia);
    for (const activity of day.activities) {
      media.push(...activity.media);
    }
  }
  return media;
}

/**
 * Lookup index for the build-time trip. Built once per module instance rather
 * than re-walking every day for each lookup — the planning page resolves one
 * media id per principle.
 */
let mediaIndex: Map<string, MediaRef> | null = null;

function getMediaIndex(): Map<string, MediaRef> {
  mediaIndex ??= new Map(getAllMedia().map((media) => [media.id, media]));
  return mediaIndex;
}

/** Looks up a single MediaRef by id, e.g. for a planning principle's evidence photo. */
export function getMediaById(id: string): MediaRef | undefined {
  return getMediaIndex().get(id);
}

/**
 * First and last dates of the trip, derived from the days themselves. Nothing
 * stores these, so they cannot drift out of sync with the itinerary.
 * Days are persisted in date order, so the ends of the array are the range.
 */
export function getTripDateRange(
  source: Trip = trip,
): { start: string; end: string } | null {
  if (source.days.length === 0) return null;
  return {
    start: source.days[0].date,
    end: source.days[source.days.length - 1].date,
  };
}
