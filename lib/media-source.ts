import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { copyFile, mkdir, rm } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import type { MediaKind } from "@/content/types";

/** Where staged local photos/videos live before being uploaded to Cloudinary. */
export const MEDIA_SOURCE_DIR = "media-source";

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".heic"];
const VIDEO_EXTENSIONS = [".mp4", ".mov", ".m4v", ".avi"];

/** Content-Type lookup for streaming media files back to the browser. */
export const MEDIA_MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".heic": "image/heic",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".m4v": "video/x-m4v",
  ".avi": "video/x-msvideo",
};

export function mediaKindForExtension(ext: string): MediaKind | null {
  const lower = ext.toLowerCase();
  if (IMAGE_EXTENSIONS.includes(lower)) return "image";
  if (VIDEO_EXTENSIONS.includes(lower)) return "video";
  return null;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Cloudinary public id for a library photo, derived only from its path within
 * PHOTO_SOURCE_DIR — deliberately NOT from the day/activity it is assigned to.
 * Reassigning a photo therefore reuses the same id and the same staged file
 * instead of stranding a duplicate copy in media-source/.
 *
 * The readable slug is truncated for legibility, so an 8-char digest of the
 * full path is appended to keep ids unique when two long paths share a prefix
 * (or two folders contain the same filename).
 */
export function publicIdForSourcePath(sourcePath: string): string {
  const withoutExtension = sourcePath.replace(/\.[^./]+$/, "");
  const digest = createHash("sha1").update(sourcePath).digest("hex").slice(0, 8);
  const slug = slugify(withoutExtension).slice(0, 48).replace(/-$/, "");
  return `honeymoon/${slug || "media"}-${digest}`;
}

/** Stable MediaRef id for a public id. */
export function mediaIdForPublicId(publicId: string): string {
  return `media-${publicId.replace(/\//g, "-")}`;
}

/** Finds the staged local file for a MediaRef's publicId, if one has been assigned yet. */
export function findMediaSourceFile(publicId: string, kind: MediaKind): string | null {
  const extensions = kind === "image" ? IMAGE_EXTENSIONS : VIDEO_EXTENSIONS;
  for (const ext of extensions) {
    const candidate = join(MEDIA_SOURCE_DIR, `${publicId}${ext}`);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

/** Copies a file from anywhere into media-source/<publicId><ext>, creating parent dirs. */
export async function stageMediaSourceFile(
  absoluteSourcePath: string,
  publicId: string,
  ext: string,
): Promise<string> {
  const destination = join(MEDIA_SOURCE_DIR, `${publicId}${ext}`);
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(absoluteSourcePath, destination);
  return destination;
}

/**
 * Deletes the staged copy for a publicId, if present. Called when a photo is
 * unassigned so media-source/ only ever holds files that are actually still
 * referenced by the itinerary (and so `npm run upload-media` stays accurate).
 */
export async function removeMediaSourceFile(publicId: string, kind: MediaKind): Promise<void> {
  const staged = findMediaSourceFile(publicId, kind);
  if (staged) await rm(staged, { force: true });
}

/** Extension for a source path, normalized to lower case. */
export function sourceExtension(sourcePath: string): string {
  return extname(sourcePath).toLowerCase();
}
