import "server-only";
import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { sortActivities } from "@/lib/activity-order";
import type { Activity, ChapterContent, MediaRef, Trip } from "@/content/types";

const TRIP_DATA_PATH = path.join(process.cwd(), "content", "trip-data.json");

/**
 * Every mutation is a read-modify-write of one JSON file, and the admin UI can
 * fire several at once (each photo tile submits its own assignment as soon as
 * its select changes). Without serialization, two overlapping actions would
 * both read the same snapshot and the second write would silently drop the
 * first one's change. This promise chain is the write lock.
 */
let writeQueue: Promise<unknown> = Promise.resolve();

export async function readTrip(): Promise<Trip> {
  const raw = await readFile(TRIP_DATA_PATH, "utf-8");
  return normalizeTrip(JSON.parse(raw) as Trip);
}

/** Fills in anything an older/hand-edited trip-data.json might be missing. */
function normalizeTrip(trip: Trip): Trip {
  return {
    ...trip,
    headline: trip.headline ?? "",
    place: trip.place ?? "",
    overview: {
      lede: trip.overview?.lede ?? "",
      body: trip.overview?.body ?? [],
      mapCaption: trip.overview?.mapCaption ?? "",
      mapAlt: trip.overview?.mapAlt ?? "",
      frontispiece: trip.overview?.frontispiece,
      mapStops: trip.overview?.mapStops ?? [],
    },
    chapters: (trip.chapters ?? []).map((chapter) => ({
      ...chapter,
      mapAlt: chapter.mapAlt ?? "",
      nights: { tent: chapter.nights?.tent ?? 0, bed: chapter.nights?.bed ?? 0 },
      activities: (chapter.activities ?? []).map((activity) => ({
        ...activity,
        date: activity.date ?? "",
      })),
    })),
    planning: {
      headline: trip.planning?.headline ?? "",
      intro: trip.planning?.intro ?? "",
      nightsNote: trip.planning?.nightsNote ?? "",
      timeBudgetNote: trip.planning?.timeBudgetNote ?? "",
      principles: trip.planning?.principles ?? [],
      tradeoffs: trip.planning?.tradeoffs ?? [],
    },
  };
}

function sortTrip(trip: Trip): Trip {
  return {
    ...trip,
    chapters: trip.chapters.map((chapter) => ({
      ...chapter,
      activities: sortActivities(chapter.activities),
    })),
  };
}

/**
 * Writes atomically (temp file + rename) so an interrupted write can never
 * leave a half-serialized trip-data.json behind.
 */
async function persist(trip: Trip): Promise<void> {
  const tempPath = `${TRIP_DATA_PATH}.${randomUUID().slice(0, 8)}.tmp`;
  await writeFile(tempPath, JSON.stringify(sortTrip(trip), null, 2) + "\n", "utf-8");
  await rename(tempPath, TRIP_DATA_PATH);
}

/**
 * Runs `mutate` against a freshly-read trip and persists the result, with all
 * callers serialized against each other. Return the unchanged trip to write
 * nothing meaningful; the mutator may also return extra data to the caller.
 */
export async function withTrip<T>(
  mutate: (trip: Trip) => Trip | { trip: Trip; result: T },
): Promise<{ trip: Trip; result: T | undefined }> {
  const run = writeQueue.then(async () => {
    const current = await readTrip();
    const outcome = mutate(current);
    const next = "trip" in outcome ? outcome.trip : outcome;
    const result = "trip" in outcome ? outcome.result : undefined;
    await persist(next);
    return { trip: next, result };
  });

  // Keep the queue alive even if this mutation throws, so one failed action
  // can't wedge every later one.
  writeQueue = run.catch(() => undefined);
  return run;
}

export interface ActivityLocation {
  chapter: ChapterContent;
  activity: Activity;
}

/** Finds an activity anywhere in the trip; ids are unique across chapters. */
export function findActivity(trip: Trip, activityId: string): ActivityLocation | undefined {
  for (const chapter of trip.chapters) {
    const activity = chapter.activities.find((a) => a.id === activityId);
    if (activity) return { chapter, activity };
  }
  return undefined;
}

/**
 * Adds a blank activity to a chapter, at the end or at the front.
 *
 * Activities are ordered by date and time, so the new one takes its
 * neighbour's date to land where it was asked for: at the end, the last
 * activity's date (the usual case is "another thing that day") or, in an empty
 * chapter, the day after the previous chapter ends; at the front, the first
 * activity's date and time, and it goes before it in author order, which is
 * what breaks the tie.
 */
export function addActivity(trip: Trip, chapterId: string, position: "start" | "end" = "end"): Trip {
  const index = trip.chapters.findIndex((c) => c.id === chapterId);
  if (index === -1) return trip;
  const chapter = trip.chapters[index];
  const sorted = sortActivities(chapter.activities);
  const first = sorted[0];
  const lastDate = sorted.map((a) => a.date).filter(Boolean).pop();
  const previousEnd = trip.chapters
    .slice(0, index)
    .flatMap((c) => c.activities.map((a) => a.date))
    .filter(Boolean)
    .sort()
    .pop();
  const fallbackDate = lastDate ?? (previousEnd ? nextDate(previousEnd) : "");
  const atStart = position === "start" && first !== undefined;

  const newActivity: Activity = {
    id: `activity-${randomUUID().slice(0, 8)}`,
    date: atStart ? first.date : fallbackDate,
    time: atStart ? first.time : "",
    title: "",
    description: "",
    interestTags: [],
    durationMinutes: 60,
    media: [],
  };
  return updateChapter(trip, chapterId, {
    activities: atStart ? [newActivity, ...sorted] : [...chapter.activities, newActivity],
  });
}

function nextDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function updateActivity(trip: Trip, activityId: string, patch: Partial<Activity>): Trip {
  return {
    ...trip,
    chapters: trip.chapters.map((chapter) => ({
      ...chapter,
      activities: chapter.activities.map((a) => (a.id === activityId ? { ...a, ...patch } : a)),
    })),
  };
}

export function removeActivity(trip: Trip, activityId: string): Trip {
  return {
    ...trip,
    chapters: trip.chapters.map((chapter) => ({
      ...chapter,
      activities: chapter.activities.filter((a) => a.id !== activityId),
    })),
  };
}

export function findChapter(trip: Trip, chapterId: string): ChapterContent | undefined {
  return trip.chapters.find((c) => c.id === chapterId);
}

/** Finds a MediaRef anywhere in the trip by its id. */
export function findMedia(trip: Trip, mediaId: string): MediaRef | undefined {
  if (trip.overview.frontispiece?.id === mediaId) return trip.overview.frontispiece;
  for (const chapter of trip.chapters) {
    if (chapter.heroMedia?.id === mediaId) return chapter.heroMedia;
  }
  for (const chapter of trip.chapters) {
    for (const activity of chapter.activities) {
      if (activity.coverMedia?.id === mediaId) return activity.coverMedia;
      const match = activity.media.find((m) => m.id === mediaId);
      if (match) return match;
    }
  }
  return undefined;
}

/** Applies a patch to a MediaRef wherever it currently lives (alt/caption editing). */
export function updateMedia(trip: Trip, mediaId: string, patch: Partial<MediaRef>): Trip {
  const apply = (media: MediaRef): MediaRef =>
    media.id === mediaId ? { ...media, ...patch } : media;

  return {
    ...trip,
    overview: {
      ...trip.overview,
      frontispiece: trip.overview.frontispiece ? apply(trip.overview.frontispiece) : undefined,
    },
    chapters: trip.chapters.map((chapter) => ({
      ...chapter,
      heroMedia: chapter.heroMedia ? apply(chapter.heroMedia) : undefined,
      activities: chapter.activities.map((a) => ({
        ...a,
        coverMedia: a.coverMedia ? apply(a.coverMedia) : undefined,
        media: a.media.map(apply),
      })),
    })),
  };
}

function clearMediaEverywhere(trip: Trip, mediaId: string): Trip {
  return {
    ...trip,
    overview: {
      ...trip.overview,
      frontispiece:
        trip.overview.frontispiece?.id === mediaId ? undefined : trip.overview.frontispiece,
    },
    chapters: trip.chapters.map((chapter) => ({
      ...chapter,
      heroMedia: chapter.heroMedia?.id === mediaId ? undefined : chapter.heroMedia,
      activities: chapter.activities.map((a) => ({
        ...a,
        coverMedia: a.coverMedia?.id === mediaId ? undefined : a.coverMedia,
        media: a.media.filter((m) => m.id !== mediaId),
      })),
    })),
  };
}

/**
 * Slots are addressed as `${ownerId}::${target}`. The owner is "overview" for
 * the frontispiece and otherwise a chapter id; the target is "frontispiece",
 * "hero", `cover:${activityId}` for an activity's cover, or an activity id
 * for its rows.
 */
export const COVER_TARGET_PREFIX = "cover:";

export function coverTarget(activityId: string): string {
  return `${COVER_TARGET_PREFIX}${activityId}`;
}

/** The activity id a cover target names, or undefined for any other target. */
export function coverTargetActivityId(target: string): string | undefined {
  return target.startsWith(COVER_TARGET_PREFIX)
    ? target.slice(COVER_TARGET_PREFIX.length)
    : undefined;
}

/** Whether a target names a single-photograph slot, which a new photo displaces from. */
export function isSingleSlot(target: string): boolean {
  return target === "frontispiece" || target === "hero" || target.startsWith(COVER_TARGET_PREFIX);
}

/** The photograph currently in a single-photograph slot, if any. */
export function mediaInSlot(trip: Trip, ownerId: string, target: string): MediaRef | undefined {
  if (target === "frontispiece") return trip.overview.frontispiece;
  if (target === "hero") return findChapter(trip, ownerId)?.heroMedia;
  const activityId = coverTargetActivityId(target);
  return activityId ? findActivity(trip, activityId)?.activity.coverMedia : undefined;
}

/**
 * Assigns a MediaRef to a slot — the overview's frontispiece, a chapter's
 * hero, an activity's cover, or an activity's rows — removing it from
 * wherever else it currently lives across the WHOLE trip first. A photo only
 * lives in one place at a time, and reassigning can move it anywhere.
 *
 * Any alt text or caption already authored for this photo is carried over —
 * moving a photo must not silently discard its copy.
 */
export function assignMedia(trip: Trip, ownerId: string, target: string, media: MediaRef): Trip {
  const existing = findMedia(trip, media.id);
  const merged: MediaRef = existing
    ? { ...media, alt: existing.alt || media.alt, caption: existing.caption }
    : media;

  const cleared = clearMediaEverywhere(trip, media.id);

  if (target === "frontispiece") {
    if (ownerId !== OVERVIEW_OWNER_ID) return trip;
    return { ...cleared, overview: { ...cleared.overview, frontispiece: merged } };
  }

  if (target === "hero") {
    if (!findChapter(cleared, ownerId)) return trip;
    return updateChapter(cleared, ownerId, { heroMedia: merged });
  }

  const coverOf = coverTargetActivityId(target);
  const activityId = coverOf ?? target;
  const found = findActivity(cleared, activityId);
  if (!found || found.chapter.id !== ownerId) return trip;

  return updateActivity(
    cleared,
    activityId,
    coverOf ? { coverMedia: merged } : { media: [...found.activity.media, merged] },
  );
}

/**
 * Moves a photo to a position within an activity's rows, from anywhere else
 * in the trip. Reordering inside one activity and dragging between two are
 * the same operation: pull the media out, then splice it back in at `index`.
 *
 * Alt text and caption ride along, because they describe the photo rather than
 * the slot it sits in.
 */
export function moveMedia(trip: Trip, mediaId: string, activityId: string, index: number): Trip {
  const media = findMedia(trip, mediaId);
  if (!media) return trip;

  // When a photo moves later within its own activity, every position after it
  // shifts back by one once it is removed.
  const currentIndex =
    findActivity(trip, activityId)?.activity.media.findIndex((m) => m.id === mediaId) ?? -1;
  const insertAt = currentIndex !== -1 && currentIndex < index ? index - 1 : index;

  const cleared = clearMediaEverywhere(trip, mediaId);
  const found = findActivity(cleared, activityId);
  if (!found) return trip;

  const next = [...found.activity.media];
  next.splice(Math.max(0, Math.min(insertAt, next.length)), 0, media);
  return updateActivity(cleared, activityId, { media: next });
}

/** Removes a MediaRef from wherever it currently lives (mediaId is globally unique). */
export function unassignMedia(trip: Trip, mediaId: string): Trip {
  return clearMediaEverywhere(trip, mediaId);
}

/** The owner id the frontispiece slot is keyed under; there is only one overview. */
export const OVERVIEW_OWNER_ID = "overview";

export interface AssignmentOption {
  /** `${ownerId}::${target}` — unambiguous across the trip. */
  value: string;
  label: string;
  /** Chapter heading this option belongs to; used to build <optgroup>s. */
  groupLabel?: string;
}

function chapterGroupLabel(chapter: ChapterContent, index: number): string {
  return `Chapter ${index + 1} · ${chapter.title || "Untitled chapter"}`;
}

/** Every frontispiece, hero, cover and activity slot as one flat, grouped option list. */
export function getAllAssignmentOptions(trip: Trip): AssignmentOption[] {
  const frontispiece = {
    value: `${OVERVIEW_OWNER_ID}::frontispiece`,
    label: "Frontispiece",
    groupLabel: "Overview",
  };
  return [
    frontispiece,
    ...trip.chapters.flatMap((chapter, index) => {
      const groupLabel = chapterGroupLabel(chapter, index);
      return [
        { value: `${chapter.id}::hero`, label: "Hero photograph", groupLabel },
        ...sortActivities(chapter.activities).flatMap((activity) => {
          const name = activity.title || "Untitled activity";
          return [
            { value: `${chapter.id}::${coverTarget(activity.id)}`, label: `${name} — cover`, groupLabel },
            { value: `${chapter.id}::${activity.id}`, label: name, groupLabel },
          ];
        }),
      ];
    }),
  ];
}

export interface Assignment {
  /** "overview" for the frontispiece, otherwise a chapter id. */
  ownerId: string;
  /** "frontispiece", "hero", `cover:${activityId}` or an activity id. */
  target: string;
  mediaId: string;
}

/** Maps each staged photo's sourcePath to wherever it's currently assigned, across the whole trip. */
export function getAssignmentsBySourcePath(trip: Trip): Record<string, Assignment> {
  const map: Record<string, Assignment> = {};
  const put = (media: MediaRef | undefined, ownerId: string, target: string) => {
    if (media?.sourcePath) map[media.sourcePath] = { ownerId, target, mediaId: media.id };
  };
  put(trip.overview.frontispiece, OVERVIEW_OWNER_ID, "frontispiece");
  for (const chapter of trip.chapters) {
    put(chapter.heroMedia, chapter.id, "hero");
    for (const activity of chapter.activities) {
      put(activity.coverMedia, chapter.id, coverTarget(activity.id));
      for (const media of activity.media) put(media, chapter.id, activity.id);
    }
  }
  return map;
}

/** Patches the overview copy that opens the site. */
export function updateOverview(trip: Trip, patch: Partial<Trip["overview"]>): Trip {
  return { ...trip, overview: { ...trip.overview, ...patch } };
}

/** Patches one chapter. Chapters are not added or removed here. */
export function updateChapter(trip: Trip, chapterId: string, patch: Partial<ChapterContent>): Trip {
  return {
    ...trip,
    chapters: trip.chapters.map((c) => (c.id === chapterId ? { ...c, ...patch } : c)),
  };
}

/** Patches the planning case-study content (headline, intro, notes, principles, tradeoffs). */
export function updatePlanning(trip: Trip, patch: Partial<Trip["planning"]>): Trip {
  return { ...trip, planning: { ...trip.planning, ...patch } };
}

/** A fresh id for a planning principle or tradeoff. */
export function newContentId(prefix: string): string {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}
