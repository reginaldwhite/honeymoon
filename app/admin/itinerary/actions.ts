"use server";

import sharp from "sharp";
import { revalidatePath } from "next/cache";
import { rejectInProduction } from "@/lib/dev-only";
import { getLibraryEntries } from "@/lib/photo-library";
import { captureDateKey } from "@/lib/photo-dates";
import { resolveSafePath } from "@/lib/safe-path";
import {
  mediaIdForPublicId,
  publicIdForSourcePath,
  removeMediaSourceFile,
  sourceExtension,
  stageMediaSourceFile,
} from "@/lib/media-source";
import {
  addActivity as addActivityToTrip,
  addMissingDays,
  assignMedia,
  findDay,
  findMedia,
  moveMedia,
  readTrip,
  removeActivity as removeActivityFromTrip,
  unassignMedia as unassignMediaFromTrip,
  updateActivity as updateActivityInTrip,
  updateDay,
  updateMedia,
  withTrip,
} from "@/lib/trip-repository";
import { interests } from "@/content/interests";
import type { MediaRef } from "@/content/types";

export type ItineraryActionState = { error?: string; success?: string } | undefined;

const VALID_INTEREST_SLUGS = new Set(interests.map((interest) => interest.slug));

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function nonNegativeNumber(formData: FormData, key: string): number {
  const value = Number(formData.get(key));
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/** Adds a blank Day for every distinct (camera-clock-corrected) capture date not already present. */
export async function syncDaysFromLibrary(): Promise<ItineraryActionState> {
  const guard = rejectInProduction();
  if (guard) return guard;

  const entries = await getLibraryEntries();
  const dates = entries.map((entry) => captureDateKey(entry.takenAt));

  let added = 0;
  await withTrip((trip) => {
    const updated = addMissingDays(trip, dates);
    added = updated.days.length - trip.days.length;
    return updated;
  });

  revalidatePath("/admin/itinerary");
  revalidatePath("/admin");
  return {
    success: added > 0 ? `Added ${added} new day(s) from the photo library.` : "No new dates found.",
  };
}

export async function updateDayDetails(
  _prevState: ItineraryActionState,
  formData: FormData,
): Promise<ItineraryActionState> {
  const guard = rejectInProduction();
  if (guard) return guard;

  const dayId = text(formData, "dayId");
  if (!dayId) return { error: "Missing dayId" };

  await withTrip((trip) =>
    updateDay(trip, dayId, {
      title: text(formData, "title"),
      location: text(formData, "location"),
      summary: text(formData, "summary"),
      planningNotes: {
        rationale: text(formData, "rationale"),
        // Booked hours are derived from activity durations, so only the
        // deliberately-unstructured time is authored here.
        bufferHours: nonNegativeNumber(formData, "bufferHours"),
      },
    }),
  );

  revalidatePath(`/admin/itinerary/${dayId}`);
  return { success: "Saved." };
}

export async function addActivity(
  _prevState: ItineraryActionState,
  formData: FormData,
): Promise<ItineraryActionState> {
  const guard = rejectInProduction();
  if (guard) return guard;

  const dayId = text(formData, "dayId");
  if (!dayId) return { error: "Missing dayId" };

  await withTrip((trip) => addActivityToTrip(trip, dayId));

  revalidatePath(`/admin/itinerary/${dayId}`);
  return { success: "Activity added." };
}

export async function updateActivity(
  _prevState: ItineraryActionState,
  formData: FormData,
): Promise<ItineraryActionState> {
  const guard = rejectInProduction();
  if (guard) return guard;

  const dayId = text(formData, "dayId");
  const activityId = text(formData, "activityId");
  if (!dayId || !activityId) return { error: "Missing dayId or activityId" };

  // Checkboxes from the shared taxonomy, filtered so a stale slug can never
  // reach the public site and render as a raw string.
  const interestTags = formData
    .getAll("interestTags")
    .filter((tag): tag is string => typeof tag === "string" && VALID_INTEREST_SLUGS.has(tag));

  await withTrip((trip) =>
    updateActivityInTrip(trip, dayId, activityId, {
      time: text(formData, "time"),
      title: text(formData, "title"),
      description: text(formData, "description"),
      durationMinutes: nonNegativeNumber(formData, "durationMinutes"),
      interestTags,
    }),
  );

  revalidatePath(`/admin/itinerary/${dayId}`);
  return { success: "Saved." };
}

export async function removeActivity(
  _prevState: ItineraryActionState,
  formData: FormData,
): Promise<ItineraryActionState> {
  const guard = rejectInProduction();
  if (guard) return guard;

  const dayId = text(formData, "dayId");
  const activityId = text(formData, "activityId");
  if (!dayId || !activityId) return { error: "Missing dayId or activityId" };

  // Photos attached to the activity go back to the unassigned pool rather than
  // disappearing with it, so their staged files are cleaned up too.
  const trip = await readTrip();
  const day = trip.days.find((d) => d.id === dayId);
  const orphaned = day?.activities.find((a) => a.id === activityId)?.media ?? [];

  await withTrip((current) => removeActivityFromTrip(current, dayId, activityId));
  await Promise.all(orphaned.map((media) => removeMediaSourceFile(media.publicId, media.kind)));

  revalidatePath(`/admin/itinerary/${dayId}`);
  revalidatePath("/admin/library");
  return { success: "Activity removed." };
}

/** Authored alt text and caption for one photo. */
export async function updateMediaDetails(
  _prevState: ItineraryActionState,
  formData: FormData,
): Promise<ItineraryActionState> {
  const guard = rejectInProduction();
  if (guard) return guard;

  const mediaId = text(formData, "mediaId");
  const dayId = text(formData, "dayId");
  if (!mediaId) return { error: "Missing mediaId" };

  const caption = text(formData, "caption");
  await withTrip((trip) =>
    updateMedia(trip, mediaId, {
      alt: text(formData, "alt"),
      caption: caption || undefined,
    }),
  );

  if (dayId) revalidatePath(`/admin/itinerary/${dayId}`);
  return { success: "Saved." };
}

/**
 * Assigns a library photo to a day's cover or one of its activities: creates a
 * MediaRef, reads its real dimensions via sharp, and stages the file into
 * media-source/ so `npm run upload-media` can push it to Cloudinary.
 *
 * The public id is derived purely from the photo's path in the library, so
 * moving a photo between activities reuses the same id and the same staged
 * file instead of leaving an orphaned duplicate behind on every reassignment.
 *
 * `targetKey` is `${dayId}::cover` or `${dayId}::${activityId}` so the same
 * action works from the itinerary editor (day fixed) and the media library
 * (day chosen from a grouped select).
 */
export async function assignLibraryPhotoToTarget(
  _prevState: ItineraryActionState,
  formData: FormData,
): Promise<ItineraryActionState> {
  const guard = rejectInProduction();
  if (guard) return guard;

  const targetKey = text(formData, "targetKey");
  const libraryPath = text(formData, "libraryPath");
  const kind = formData.get("kind");
  const sourceDir = process.env.PHOTO_SOURCE_DIR;

  if (!targetKey || !libraryPath || (kind !== "image" && kind !== "video")) {
    return { error: "Missing required fields" };
  }
  const [dayId, target] = targetKey.split("::");
  if (!dayId || !target) return { error: "Invalid targetKey" };
  if (!sourceDir) return { error: "PHOTO_SOURCE_DIR is not set in .env.local" };

  let absoluteSourcePath: string;
  try {
    absoluteSourcePath = resolveSafePath(sourceDir, libraryPath);
  } catch {
    return { error: "Invalid source path" };
  }

  const publicId = publicIdForSourcePath(libraryPath);

  let width = 1600;
  let height = 1200;
  if (kind === "image") {
    try {
      const metadata = await sharp(absoluteSourcePath).metadata();
      width = metadata.width ?? width;
      height = metadata.height ?? height;
    } catch {
      // Fall back to defaults if metadata can't be read.
    }
  }

  try {
    await stageMediaSourceFile(absoluteSourcePath, publicId, sourceExtension(libraryPath));
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not stage the source file",
    };
  }

  const media: MediaRef = {
    id: mediaIdForPublicId(publicId),
    kind,
    publicId,
    alt: "",
    width,
    height,
    sourcePath: libraryPath,
  };

  // Assigning to a cover slot that is already filled drops the previous photo
  // from the trip entirely, so its staged file has to go with it.
  const { result: displaced } = await withTrip<MediaRef | undefined>((trip) => {
    const previousCover = target === "cover" ? findDay(trip, dayId)?.coverMedia : undefined;
    return {
      trip: assignMedia(trip, dayId, target, media),
      result: previousCover && previousCover.id !== media.id ? previousCover : undefined,
    };
  });
  if (displaced) await removeMediaSourceFile(displaced.publicId, displaced.kind);

  revalidatePath("/admin/library");
  revalidatePath(`/admin/itinerary/${dayId}`);
  return { success: "Photo assigned." };
}

/**
 * Drag-and-drop target: reorder a photo inside an activity, or move it to a
 * different one. Takes plain arguments rather than FormData because it is
 * called from a drop handler, not a form submission.
 */
export async function moveMediaToPosition(input: {
  mediaId: string;
  targetKey: string;
  index: number;
}): Promise<ItineraryActionState> {
  const guard = rejectInProduction();
  if (guard) return guard;

  const [dayId, target] = input.targetKey.split("::");
  if (!dayId || !target) return { error: "Invalid target" };
  if (!Number.isInteger(input.index) || input.index < 0) return { error: "Invalid position" };

  await withTrip((trip) => moveMedia(trip, input.mediaId, dayId, target, input.index));

  revalidatePath(`/admin/itinerary/${dayId}`);
  revalidatePath("/admin/library");
  return { success: "Moved." };
}

export async function unassignMedia(
  _prevState: ItineraryActionState,
  formData: FormData,
): Promise<ItineraryActionState> {
  const guard = rejectInProduction();
  if (guard) return guard;

  const mediaId = text(formData, "mediaId");
  if (!mediaId) return { error: "Missing mediaId" };

  const { result } = await withTrip<MediaRef | undefined>((trip) => ({
    trip: unassignMediaFromTrip(trip, mediaId),
    result: findMedia(trip, mediaId),
  }));

  // Keep media-source/ holding only files the itinerary still references.
  if (result) await removeMediaSourceFile(result.publicId, result.kind);

  revalidatePath("/admin/library");
  revalidatePath("/admin/itinerary", "layout");
  return { success: "Photo unassigned." };
}
