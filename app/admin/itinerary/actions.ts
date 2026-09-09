"use server";

import sharp from "sharp";
import { revalidatePath } from "next/cache";
import { rejectInProduction } from "@/lib/dev-only";
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
  assignMedia,
  coverTargetActivityId,
  findActivity,
  findChapter,
  findMedia,
  isSingleSlot,
  mediaInSlot,
  moveMedia,
  readTrip,
  removeActivity as removeActivityFromTrip,
  unassignMedia as unassignMediaFromTrip,
  updateActivity as updateActivityInTrip,
  updateChapter,
  updateMedia,
  withTrip,
} from "@/lib/trip-repository";
import { interests } from "@/content/interests";
import type { MediaRef, PhotoRowColumns, Trip } from "@/content/types";

export type ItineraryActionState = { error?: string; success?: string } | undefined;


function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}


export async function addActivity(
  _prevState: ItineraryActionState,
  formData: FormData,
): Promise<ItineraryActionState> {
  const guard = rejectInProduction();
  if (guard) return guard;

  const chapterId = text(formData, "chapterId");
  if (!chapterId) return { error: "Missing chapterId" };
  const position = text(formData, "position") === "start" ? "start" : "end";

  await withTrip((trip) => addActivityToTrip(trip, chapterId, position));

  revalidatePath("/admin/itinerary", "layout");
  return { success: "Activity added." };
}


export async function removeActivity(
  _prevState: ItineraryActionState,
  formData: FormData,
): Promise<ItineraryActionState> {
  const guard = rejectInProduction();
  if (guard) return guard;

  const activityId = text(formData, "activityId");
  if (!activityId) return { error: "Missing activityId" };

  // Photos attached to the activity go back to the unassigned pool rather than
  // disappearing with it, so their staged files are cleaned up too.
  const trip = await readTrip();
  const activity = findActivity(trip, activityId)?.activity;
  const orphaned = activity ? [...(activity.coverMedia ? [activity.coverMedia] : []), ...activity.media] : [];

  await withTrip((current) => removeActivityFromTrip(current, activityId));
  await Promise.all(orphaned.map((media) => removeMediaSourceFile(media.publicId, media.kind)));

  revalidatePath("/admin/itinerary", "layout");
  revalidatePath("/admin/library");
  return { success: "Activity removed." };
}


/**
 * Assigns a library photo to a slot — the frontispiece, a chapter hero, an
 * activity's cover or its rows: creates a MediaRef, reads its real dimensions
 * via sharp, and stages the file into media-source/ so `npm run upload-media`
 * can push it to Cloudinary.
 *
 * The public id is derived purely from the photo's path in the library, so
 * moving a photo between activities reuses the same id and the same staged
 * file instead of leaving an orphaned duplicate behind on every reassignment.
 *
 * `targetKey` is `${ownerId}::${target}` (see trip-repository) so the same
 * action works from the itinerary editor (slot fixed) and the media library
 * (slot chosen from a grouped select).
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
  const [ownerId, target] = targetKey.split("::");
  if (!ownerId || !target) return { error: "Invalid targetKey" };
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

  // Assigning into a single-photo slot (the frontispiece, a chapter hero or an
  // activity cover) that is already filled drops the previous photo from the
  // trip entirely, so its staged file has to go with it.
  const { result: displaced } = await withTrip<MediaRef | undefined>((trip) => {
    const previous = isSingleSlot(target) ? mediaInSlot(trip, ownerId, target) : undefined;
    return {
      trip: assignMedia(trip, ownerId, target, media),
      result: previous && previous.id !== media.id ? previous : undefined,
    };
  });
  if (displaced) await removeMediaSourceFile(displaced.publicId, displaced.kind);

  revalidatePath("/admin/library");
  revalidatePath("/admin/itinerary", "layout");
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

  const [chapterId, target] = input.targetKey.split("::");
  if (!chapterId || !target || coverTargetActivityId(target) || target === "hero") {
    return { error: "Invalid target" };
  }
  if (!Number.isInteger(input.index) || input.index < 0) return { error: "Invalid position" };

  await withTrip((trip) => moveMedia(trip, input.mediaId, target, input.index));

  revalidatePath("/admin/itinerary", "layout");
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

/*
 * ---------------------------------------------------------------------------
 * Saving.
 *
 * The editor keeps unsaved changes as an overlay of `${kind}:${id}:${field}`
 * keys; the auto-save sends them here and they are applied in one locked write.
 * Anything structural — adding a photograph or an activity — went through
 * its own action already, so this only ever touches fields.
 * ---------------------------------------------------------------------------
 */

export type EditValue = string | number | string[] | PhotoRowColumns[];
export interface Edit {
  key: string;
  value: EditValue;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const VALID_INTEREST_SLUGS_SET = new Set(interests.map((interest) => interest.slug));

const asString = (v: EditValue) => (typeof v === "string" ? v.trim() : String(v));
const asNumber = (v: EditValue) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};
const asCount = (v: EditValue) => Math.round(asNumber(v));
const asLayout = (v: EditValue): PhotoRowColumns[] =>
  Array.isArray(v) ? v.map(Number).filter((n): n is PhotoRowColumns => n === 1 || n === 2 || n === 3) : [];
const asTags = (v: EditValue) =>
  Array.isArray(v) ? v.map(String).filter((slug) => VALID_INTEREST_SLUGS_SET.has(slug)) : [];
const asParagraphs = (v: EditValue) =>
  asString(v)
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);

/** Applies one edit to the trip, or returns an error string for a key it does not understand. */
function applyEdit(trip: Trip, edit: Edit): Trip | string {
  const [kind, id, field] = edit.key.split(":");
  const v = edit.value;

  switch (kind) {
    case "trip":
      if (field === "title" && !asString(v)) return "The site name can't be empty.";
      if (["title", "headline", "subtitle", "place"].includes(field)) {
        return { ...trip, [field]: asString(v) };
      }
      break;
    case "overview":
      if (["lede", "mapCaption", "mapAlt"].includes(field)) {
        return { ...trip, overview: { ...trip.overview, [field]: asString(v) } };
      }
      if (field === "body") return { ...trip, overview: { ...trip.overview, body: asParagraphs(v) } };
      break;
    case "chapter": {
      const chapter = findChapter(trip, id);
      if (!chapter) return `No chapter ${id}`;
      if (["title", "chip", "note"].includes(field)) {
        return updateChapter(trip, id, { [field]: asString(v) });
      }
      if (field === "nightsTent") return updateChapter(trip, id, { nights: { ...chapter.nights, tent: asCount(v) } });
      if (field === "nightsBed") return updateChapter(trip, id, { nights: { ...chapter.nights, bed: asCount(v) } });
      break;
    }
    case "activity": {
      if (!findActivity(trip, id)) return `No activity ${id}`;
      if (field === "date") {
        const date = asString(v);
        if (date && !ISO_DATE.test(date)) return "Dates must be YYYY-MM-DD.";
        return updateActivityInTrip(trip, id, { date });
      }
      if (["title", "time", "description"].includes(field)) return updateActivityInTrip(trip, id, { [field]: asString(v) });
      if (field === "durationMinutes") return updateActivityInTrip(trip, id, { durationMinutes: asNumber(v) });
      if (field === "interestTags") return updateActivityInTrip(trip, id, { interestTags: asTags(v) });
      if (field === "layout") return updateActivityInTrip(trip, id, { layout: asLayout(v) });
      break;
    }
    case "media":
      if (!findMedia(trip, id)) return `No photograph ${id}`;
      if (field === "alt") return updateMedia(trip, id, { alt: asString(v) });
      if (field === "caption") return updateMedia(trip, id, { caption: asString(v) || undefined });
      break;
  }
  return `Unknown field ${edit.key}`;
}

export async function applyEdits(edits: Edit[]): Promise<ItineraryActionState> {
  const guard = rejectInProduction();
  if (guard) return guard;
  if (!Array.isArray(edits) || edits.length === 0) return { success: "Nothing to save." };

  let failure: string | null = null;
  await withTrip((trip) => {
    let next = trip;
    for (const edit of edits) {
      const result = applyEdit(next, edit);
      if (typeof result === "string") {
        failure = result;
        return trip; // apply nothing if any edit is invalid
      }
      next = result;
    }
    return next;
  });
  if (failure) return { error: failure };

  revalidatePath("/admin/itinerary", "layout");
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/planning");
  return { success: `Saved ${edits.length} change${edits.length === 1 ? "" : "s"}.` };
}
