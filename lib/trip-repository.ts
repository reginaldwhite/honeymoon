import "server-only";
import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { sortActivities } from "@/lib/activity-order";
import type { Activity, Day, MediaRef, Trip } from "@/content/types";

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
    days: trip.days ?? [],
    planning: {
      intro: trip.planning?.intro ?? "",
      principles: trip.planning?.principles ?? [],
      tradeoffs: trip.planning?.tradeoffs ?? [],
    },
  };
}

function sortTrip(trip: Trip): Trip {
  return {
    ...trip,
    days: [...trip.days]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((day) => ({ ...day, activities: sortActivities(day.activities) })),
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

/** `day-YYYY-MM-DD` — stable as days are added, unlike a sequential number. */
export function dayIdForDate(date: string): string {
  return `day-${date}`;
}

/** Adds a blank Day for every distinct date not already present. */
export function addMissingDays(trip: Trip, dates: string[]): Trip {
  const existingDates = new Set(trip.days.map((d) => d.date));
  const newDays: Day[] = [];

  for (const date of [...new Set(dates)].sort()) {
    if (existingDates.has(date)) continue;
    newDays.push({
      id: dayIdForDate(date),
      date,
      title: "",
      location: "",
      summary: "",
      planningNotes: { rationale: "", bufferHours: 0 },
      activities: [],
    });
  }

  return { ...trip, days: [...trip.days, ...newDays] };
}

export function findDay(trip: Trip, dayId: string): Day | undefined {
  return trip.days.find((d) => d.id === dayId);
}

export function updateDay(trip: Trip, dayId: string, patch: Partial<Day>): Trip {
  return {
    ...trip,
    days: trip.days.map((d) => (d.id === dayId ? { ...d, ...patch } : d)),
  };
}

export function addActivity(trip: Trip, dayId: string): Trip {
  const day = findDay(trip, dayId);
  if (!day) return trip;
  const newActivity: Activity = {
    id: `${dayId}-activity-${randomUUID().slice(0, 8)}`,
    time: "",
    title: "",
    description: "",
    interestTags: [],
    durationMinutes: 60,
    media: [],
  };
  return updateDay(trip, dayId, { activities: [...day.activities, newActivity] });
}

export function updateActivity(
  trip: Trip,
  dayId: string,
  activityId: string,
  patch: Partial<Activity>,
): Trip {
  const day = findDay(trip, dayId);
  if (!day) return trip;
  return updateDay(trip, dayId, {
    activities: day.activities.map((a) => (a.id === activityId ? { ...a, ...patch } : a)),
  });
}

export function removeActivity(trip: Trip, dayId: string, activityId: string): Trip {
  const day = findDay(trip, dayId);
  if (!day) return trip;
  return updateDay(trip, dayId, {
    activities: day.activities.filter((a) => a.id !== activityId),
  });
}

/** Finds a MediaRef anywhere in the trip by its id. */
export function findMedia(trip: Trip, mediaId: string): MediaRef | undefined {
  for (const day of trip.days) {
    if (day.coverMedia?.id === mediaId) return day.coverMedia;
    for (const activity of day.activities) {
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
    days: trip.days.map((day) => ({
      ...day,
      coverMedia: day.coverMedia ? apply(day.coverMedia) : undefined,
      activities: day.activities.map((a) => ({ ...a, media: a.media.map(apply) })),
    })),
  };
}

function clearMediaEverywhere(trip: Trip, mediaId: string): Trip {
  return {
    ...trip,
    days: trip.days.map((day) => ({
      ...day,
      coverMedia: day.coverMedia?.id === mediaId ? undefined : day.coverMedia,
      activities: day.activities.map((a) => ({
        ...a,
        media: a.media.filter((m) => m.id !== mediaId),
      })),
    })),
  };
}

/**
 * Assigns a MediaRef to a day's cover or one of its activities, removing it
 * from wherever else it currently lives across the WHOLE trip first (a photo
 * only lives in one place at a time, and reassigning can move it between days).
 *
 * Any alt text or caption already authored for this photo is carried over —
 * moving a photo to a different activity must not silently discard its copy.
 */
export function assignMedia(
  trip: Trip,
  dayId: string,
  target: "cover" | string,
  media: MediaRef,
): Trip {
  const existing = findMedia(trip, media.id);
  const merged: MediaRef = existing
    ? { ...media, alt: existing.alt || media.alt, caption: existing.caption }
    : media;

  const cleared = clearMediaEverywhere(trip, media.id);
  const day = findDay(cleared, dayId);
  if (!day) return trip;

  const updated: Day =
    target === "cover"
      ? { ...day, coverMedia: merged }
      : {
          ...day,
          activities: day.activities.map((a) =>
            a.id === target ? { ...a, media: [...a.media, merged] } : a,
          ),
        };

  return updateDay(cleared, dayId, updated);
}

/**
 * Moves a photo to a position within an activity, from anywhere else in the
 * trip. Reordering inside one activity and dragging between two activities are
 * the same operation: pull the media out, then splice it back in at `index`.
 *
 * Alt text and caption ride along, because they describe the photo rather than
 * the slot it sits in.
 */
export function moveMedia(
  trip: Trip,
  mediaId: string,
  dayId: string,
  target: "cover" | string,
  index: number,
): Trip {
  const media = findMedia(trip, mediaId);
  if (!media) return trip;

  // When a photo moves later within its own activity, every position after it
  // shifts back by one once it is removed.
  const targetActivity = findDay(trip, dayId)?.activities.find((a) => a.id === target);
  const currentIndex = targetActivity?.media.findIndex((m) => m.id === mediaId) ?? -1;
  const insertAt = currentIndex !== -1 && currentIndex < index ? index - 1 : index;

  const cleared = clearMediaEverywhere(trip, mediaId);
  const day = findDay(cleared, dayId);
  if (!day) return trip;

  if (target === "cover") {
    return updateDay(cleared, dayId, { coverMedia: media });
  }

  return updateDay(cleared, dayId, {
    activities: day.activities.map((activity) => {
      if (activity.id !== target) return activity;
      const next = [...activity.media];
      next.splice(Math.max(0, Math.min(insertAt, next.length)), 0, media);
      return { ...activity, media: next };
    }),
  });
}

/** Removes a MediaRef from wherever it currently lives (mediaId is globally unique). */
export function unassignMedia(trip: Trip, mediaId: string): Trip {
  return clearMediaEverywhere(trip, mediaId);
}

export interface AssignmentOption {
  /** `${dayId}::cover` or `${dayId}::${activityId}` — unambiguous across the whole trip. */
  value: string;
  label: string;
  /** Day heading this option belongs to; used to build <optgroup>s. */
  groupLabel?: string;
}

/**
 * The cover + activity slots for a single day. `withGroupLabel` is set on the
 * library page (where every day's slots are offered at once and need an
 * <optgroup> heading) and omitted in the itinerary editor, where the day is
 * already fixed by context.
 */
export function getDayAssignmentOptions(
  day: Day,
  index: number,
  withGroupLabel: boolean,
): AssignmentOption[] {
  const groupLabel = withGroupLabel ? formatDayOptionLabel(day, index) : undefined;
  return [
    { value: `${day.id}::cover`, label: "Cover photo", groupLabel },
    ...sortActivities(day.activities).map((a) => ({
      value: `${day.id}::${a.id}`,
      label: a.title || "Untitled activity",
      groupLabel,
    })),
  ];
}

export function formatDayOptionLabel(day: Day, index: number): string {
  return `Day ${index + 1} · ${day.title || "Untitled day"}`;
}

/** Every day's cover + activity slots as one flat, grouped option list. */
export function getAllAssignmentOptions(trip: Trip): AssignmentOption[] {
  return trip.days.flatMap((day, index) => getDayAssignmentOptions(day, index, true));
}

export interface Assignment {
  dayId: string;
  /** "cover" or an activity id. */
  target: string;
  mediaId: string;
}

/**
 * Maps each staged photo's sourcePath to wherever it's currently assigned.
 * Pass a single day to scope it to that day's editor, or the whole trip for
 * the cross-day library browser.
 */
export function getAssignmentsBySourcePath(days: Day[]): Record<string, Assignment> {
  const map: Record<string, Assignment> = {};
  for (const day of days) {
    if (day.coverMedia?.sourcePath) {
      map[day.coverMedia.sourcePath] = {
        dayId: day.id,
        target: "cover",
        mediaId: day.coverMedia.id,
      };
    }
    for (const activity of day.activities) {
      for (const media of activity.media) {
        if (media.sourcePath) {
          map[media.sourcePath] = {
            dayId: day.id,
            target: activity.id,
            mediaId: media.id,
          };
        }
      }
    }
  }
  return map;
}

/** Patches the planning case-study content (intro, principles, tradeoffs). */
export function updatePlanning(trip: Trip, patch: Partial<Trip["planning"]>): Trip {
  return { ...trip, planning: { ...trip.planning, ...patch } };
}

/** A fresh id for a planning principle or tradeoff. */
export function newContentId(prefix: string): string {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}
