"use server";

import { rename, rm, stat } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { rejectInProduction } from "@/lib/dev-only";
import { resolveSafePath } from "@/lib/safe-path";
import { getLibraryEntries, invalidateLibraryCache } from "@/lib/photo-library";

export type LibraryActionState =
  | {
      error?: string;
      success?: string;
      /** New mtime of the rotated file, used by the tile as its cache-busting token. */
      version?: number;
    }
  | undefined;

export type RefreshLibraryState =
  | { error?: string; success?: string; total?: number }
  | undefined;

const ALLOWED_ROTATIONS = new Set([90, -90, 180]);

/**
 * Rotates a photo directly in the local library, in place. No confirmation
 * (unlike the staged-photo editor) — PHOTO_SOURCE_DIR is treated as a
 * disposable local working copy of the photo share, not the original.
 */
export async function rotateLibraryMedia(
  _prevState: LibraryActionState,
  formData: FormData,
): Promise<LibraryActionState> {
  const guard = rejectInProduction();
  if (guard) return guard;

  const relativePath = formData.get("path");
  const degreesRaw = formData.get("degrees");
  const sourceDir = process.env.PHOTO_SOURCE_DIR;

  if (typeof relativePath !== "string" || typeof degreesRaw !== "string") {
    return { error: "Missing path or degrees" };
  }
  if (!sourceDir) {
    return { error: "PHOTO_SOURCE_DIR is not set in .env.local" };
  }

  const degrees = Number(degreesRaw);
  if (!ALLOWED_ROTATIONS.has(degrees)) {
    return { error: "Unsupported rotation" };
  }

  let filePath: string;
  try {
    filePath = resolveSafePath(sourceDir, relativePath);
  } catch {
    return { error: "Invalid path" };
  }

  const tempPath = join(dirname(filePath), `.rotate-${randomUUID().slice(0, 8)}${extname(filePath)}`);
  try {
    await sharp(filePath).rotate(degrees).toFile(tempPath);
    await rename(tempPath, filePath);
  } catch (error) {
    await rm(tempPath, { force: true });
    return { error: error instanceof Error ? error.message : "Failed to rotate image" };
  }

  // The cached scan holds each file's mtime, which is also the cache-busting
  // token the thumbnails are requested with — so it has to be dropped here or
  // the grid keeps showing the pre-rotation image.
  invalidateLibraryCache();
  revalidatePath("/admin/library");
  revalidatePath("/admin/itinerary", "layout");

  // Handing the new mtime back lets the tile derive its next thumbnail URL from
  // the action result, with no effect needed to sync it.
  const { mtimeMs } = await stat(filePath);
  return { success: "Rotated.", version: Math.round(mtimeMs) };
}

/**
 * Forces a rescan of PHOTO_SOURCE_DIR, bypassing the few-minute cache. Useful
 * after adding files to the library outside the app.
 */
export async function refreshLibrary(): Promise<RefreshLibraryState> {
  const guard = rejectInProduction();
  if (guard) return guard;

  try {
    const entries = await getLibraryEntries({ forceRefresh: true });
    revalidatePath("/admin/library");
    return { success: `Rescanned — ${entries.length} files found.`, total: entries.length };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to read PHOTO_SOURCE_DIR",
    };
  }
}
