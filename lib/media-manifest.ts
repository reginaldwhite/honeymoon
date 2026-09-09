import manifest from "@/content/media-manifest.json";

/**
 * The photographs shipped with the deployed site, as pre-rendered WebP files
 * under public/media. `npm run build-media` renders them from the staged
 * originals and writes content/media-manifest.json, which is committed so a
 * cloud build knows exactly which files it should find. The files themselves
 * are not in git — they are uploaded with each `vercel` deploy.
 *
 * This module has no `server-only` marker because the build scripts import
 * it too.
 */

/** Widths rendered per photograph. The largest is capped at the original's width. */
export const DERIVATIVE_WIDTHS = [400, 800, 1600] as const;

/** Bump when the rendering changes (quality, widths), so every file is renamed and re-rendered. */
export const PIPELINE_VERSION = "webp-q78-v1";

export const DERIVATIVE_QUALITY = 78;

/** Where the files live, relative to the repo root, and their URL prefix. */
export const DERIVATIVE_DIR = "public/media";
export const DERIVATIVE_URL_PREFIX = "/media";

export interface ManifestEntry {
  /** Eight hex characters of the source file's content hash, part of every filename. */
  hash: string;
  /** Actual pixel widths rendered, ascending. */
  widths: number[];
}

export type MediaManifest = Record<string, ManifestEntry>;

/** Filename of one derivative, relative to the derivative dir or URL prefix. */
export function derivativeFile(publicId: string, hash: string, width: number): string {
  return `${publicId}.${hash}.${width}.webp`;
}

export function derivativePath(publicId: string, hash: string, width: number): string {
  return `${DERIVATIVE_URL_PREFIX}/${derivativeFile(publicId, hash, width)}`;
}

export function getManifestEntry(publicId: string): ManifestEntry | undefined {
  return (manifest as MediaManifest)[publicId];
}

/** The largest rendered width no wider than `target`, else the smallest available. */
export function pickWidth(widths: number[], target: number): number {
  const fitting = widths.filter((width) => width <= target);
  return fitting.length > 0 ? Math.max(...fitting) : Math.min(...widths);
}
