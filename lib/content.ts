import { trip } from "@/content/trip";
import type { Activity, ChapterContent, MediaRef, Trip } from "@/content/types";
import { distinctDates } from "@/content/chapters";

/** Every activity in the trip, chapter by chapter, in authored order. */
export function getAllActivities(source: Trip = trip): Activity[] {
  return source.chapters.flatMap((chapter) => chapter.activities);
}

/** Every MediaRef in one chapter: its hero, then each activity's cover and rows. */
export function getChapterMedia(chapter: ChapterContent): MediaRef[] {
  const media: MediaRef[] = [];
  if (chapter.heroMedia) media.push(chapter.heroMedia);
  for (const activity of chapter.activities) {
    if (activity.coverMedia) media.push(activity.coverMedia);
    media.push(...activity.media);
  }
  return media;
}

/** Flat list of every MediaRef: the frontispiece, then every chapter's. */
export function getAllMedia(source: Trip = trip): MediaRef[] {
  return [
    ...(source.overview.frontispiece ? [source.overview.frontispiece] : []),
    ...source.chapters.flatMap(getChapterMedia),
  ];
}

/**
 * Lookup index for the build-time trip. Built once per module instance rather
 * than re-walking every chapter for each lookup — the planning page resolves
 * one media id per principle.
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

/** The distinct dates the trip's activities fall on, in order. */
export function getTripDates(source: Trip = trip): string[] {
  return distinctDates(getAllActivities(source));
}

/**
 * First and last dates of the trip, derived from the activities themselves.
 * Nothing stores these, so they cannot drift out of sync with the story.
 */
export function getTripDateRange(
  source: Trip = trip,
): { start: string; end: string } | null {
  const dates = getTripDates(source);
  if (dates.length === 0) return null;
  return { start: dates[0], end: dates[dates.length - 1] };
}
