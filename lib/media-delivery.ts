import "server-only";
import { statSync } from "node:fs";
import {
  RESPONSIVE_WIDTHS,
  getSignedMediaUrl,
  getSignedSrcSet,
  getSignedVideoPosterUrl,
  isCloudinaryConfigured,
} from "@/lib/cloudinary";
import { isProductionRuntime } from "@/lib/dev-only";
import { derivativePath, getManifestEntry, pickWidth } from "@/lib/media-manifest";
import { resolveSafePath } from "@/lib/safe-path";
import type { MediaRef } from "@/content/types";

export interface ResolvedMedia {
  /** Poster/thumbnail URL. Empty when a local video has no still frame. */
  thumbSrc: string;
  thumbSrcSet: string;
  /** Full-size image, or the video itself. */
  fullSrc: string;
}

/**
 * Locates a photo in the local library, for dev-mode delivery. Returns the
 * file's mtime alongside the path so the URL can be cached immutably and still
 * update the moment the file is rotated or replaced.
 */
function findLocalCopy(media: MediaRef): { path: string; version: number } | null {
  // Never in a production build: the route that serves these 404s there, and
  // the deployed site has no local library to read from.
  if (isProductionRuntime()) return null;

  const sourceDir = process.env.PHOTO_SOURCE_DIR;
  if (!sourceDir || !media.sourcePath) return null;

  try {
    const absolute = resolveSafePath(sourceDir, media.sourcePath);
    return { path: media.sourcePath, version: Math.round(statSync(absolute).mtimeMs) };
  } catch {
    // Missing file, or a path that escapes the library root.
    return null;
  }
}

function localUrl(path: string, version: number, width?: number): string {
  const params = new URLSearchParams({ path, v: String(version) });
  if (width !== undefined) params.set("w", String(width));
  return `/admin/api/raw?${params.toString()}`;
}

/**
 * Decides where a photo's bytes come from, in priority order:
 *
 *   1. The local library, in development. Lets the whole site be authored and
 *      reviewed with the real photos — the resize is done on demand by the
 *      raw route, standing in for the rendered files.
 *   2. The WebP derivatives shipped with the site, for any photograph in
 *      content/media-manifest.json (see lib/media-manifest.ts). This is what
 *      a deployed site uses; the files are static, behind the same gate as
 *      every page.
 *   3. Cloudinary signed URLs, whenever credentials are configured.
 *   4. Nothing, so the caller renders a placeholder.
 *
 * To preview the shipped derivatives while developing, unset PHOTO_SOURCE_DIR.
 */
export function resolveMedia(media: MediaRef): ResolvedMedia | null {
  const local = findLocalCopy(media);

  if (local) {
    if (media.kind === "video") {
      // sharp can't pull a still frame out of a video, so a locally served
      // video has no poster; the tile falls back to a play affordance.
      return { thumbSrc: "", thumbSrcSet: "", fullSrc: localUrl(local.path, local.version) };
    }
    return {
      thumbSrc: localUrl(local.path, local.version, 800),
      thumbSrcSet: RESPONSIVE_WIDTHS.map(
        (width) => `${localUrl(local.path, local.version, width)} ${width}w`,
      ).join(", "),
      fullSrc: localUrl(local.path, local.version, 2000),
    };
  }

  const shipped = media.kind === "image" ? getManifestEntry(media.publicId) : undefined;
  if (shipped) {
    const url = (width: number) => derivativePath(media.publicId, shipped.hash, width);
    return {
      thumbSrc: url(pickWidth(shipped.widths, 800)),
      thumbSrcSet: shipped.widths.map((width) => `${url(width)} ${width}w`).join(", "),
      fullSrc: url(Math.max(...shipped.widths)),
    };
  }

  if (!isCloudinaryConfigured()) return null;

  if (media.kind === "video") {
    return {
      thumbSrc: getSignedVideoPosterUrl(media.publicId, { width: 800, crop: "limit" }),
      thumbSrcSet: getSignedSrcSet(media.publicId, "video", { crop: "limit", asPoster: true }),
      fullSrc: getSignedMediaUrl(media.publicId, "video"),
    };
  }

  return {
    thumbSrc: getSignedMediaUrl(media.publicId, "image", { width: 800, crop: "limit" }),
    thumbSrcSet: getSignedSrcSet(media.publicId, "image", { crop: "limit" }),
    fullSrc: getSignedMediaUrl(media.publicId, "image", { width: 2000, crop: "limit" }),
  };
}
