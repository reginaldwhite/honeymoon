import "server-only";
import { readdir, stat } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import { mediaKindForExtension } from "@/lib/media-source";
import { captureDateKey } from "@/lib/photo-dates";
import { resolveSafePath } from "@/lib/safe-path";

const MAX_RESULTS = 20000;
const STAT_CONCURRENCY = 32;
const CACHE_TTL_MS = 5 * 60 * 1000;

export interface LibraryEntry {
  /** Path relative to PHOTO_SOURCE_DIR, used as the identifier for /raw and assignment. */
  path: string;
  name: string;
  kind: "image" | "video";
  /** File mtime as an ISO string — reflects the actual capture date for untouched camera files. */
  takenAt: string;
  /** Cache-busting token: changes whenever the file is modified (e.g. rotated). */
  version: number;
}

/** One capture date's worth of files, for the library browser's index. */
export interface LibraryGroupSummary {
  /** Camera-clock-corrected YYYY-MM-DD. */
  date: string;
  count: number;
}

interface Candidate {
  fullPath: string;
  relativePath: string;
  name: string;
  kind: "image" | "video";
}

// Module-level cache — a full recursive walk + stat pass over the library is
// comparatively expensive, and this is a local-only dev tool, so results are
// cached for a few minutes instead of rescanning on every navigation. Not an
// LRU (single entry) since there's only ever one PHOTO_SOURCE_DIR per server.
let cache: { entries: LibraryEntry[]; expiresAt: number } | null = null;

/** Drops the cached scan — called after any action that modifies a library file. */
export function invalidateLibraryCache(): void {
  cache = null;
}

async function walk(dir: string, root: string, results: Candidate[]) {
  if (results.length >= MAX_RESULTS) return;

  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (results.length >= MAX_RESULTS) return;
    if (entry.name.startsWith(".")) continue; // skip dotfiles, AppleDouble (._*), .picasaoriginals, etc.
    if (entry.name === "Thumbs.db") continue;

    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      await walk(fullPath, root, results);
      continue;
    }

    const kind = mediaKindForExtension(extname(entry.name));
    if (!kind) continue;

    results.push({ fullPath, relativePath: relative(root, fullPath), name: entry.name, kind });
  }
}

/**
 * Runs `stat` for every candidate with bounded concurrency instead of one at a
 * time. A file that disappears or can't be read mid-scan is skipped rather than
 * failing the whole scan.
 */
async function statAll(candidates: Candidate[]): Promise<LibraryEntry[]> {
  const results: (LibraryEntry | null)[] = new Array(candidates.length).fill(null);
  let next = 0;

  async function worker() {
    while (true) {
      const index = next++;
      if (index >= candidates.length) return;
      const candidate = candidates[index];
      try {
        const { mtime, mtimeMs } = await stat(candidate.fullPath);
        results[index] = {
          path: candidate.relativePath,
          name: candidate.name,
          kind: candidate.kind,
          takenAt: mtime.toISOString(),
          version: Math.round(mtimeMs),
        };
      } catch {
        // Unreadable or removed since the walk — leave it out of the library.
      }
    }
  }

  await Promise.all(Array.from({ length: STAT_CONCURRENCY }, worker));
  return results.filter((entry): entry is LibraryEntry => entry !== null);
}

/** Recursively scans PHOTO_SOURCE_DIR for image/video files, cached for a few minutes. */
export async function getLibraryEntries(options?: {
  forceRefresh?: boolean;
}): Promise<LibraryEntry[]> {
  const sourceDir = process.env.PHOTO_SOURCE_DIR;
  if (!sourceDir) {
    throw new Error("PHOTO_SOURCE_DIR is not set in .env.local");
  }

  if (!options?.forceRefresh && cache && cache.expiresAt > Date.now()) {
    return cache.entries;
  }

  const root = resolveSafePath(sourceDir, ".");
  const candidates: Candidate[] = [];
  await walk(root, root, candidates);
  const entries = await statAll(candidates);
  entries.sort((a, b) => a.path.localeCompare(b.path));

  cache = { entries, expiresAt: Date.now() + CACHE_TTL_MS };
  return entries;
}

/**
 * Just the capture-date index: one row per day with a file count. The browser
 * loads this first so opening the library costs a few hundred bytes instead of
 * the whole file list, then pulls each day's entries in as it scrolls.
 */
export async function getLibraryGroups(options?: {
  forceRefresh?: boolean;
}): Promise<LibraryGroupSummary[]> {
  const entries = await getLibraryEntries(options);
  const counts = new Map<string, number>();
  for (const entry of entries) {
    const date = captureDateKey(entry.takenAt);
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));
}

/** Every file whose (corrected) capture date matches `date`. */
export async function getLibraryEntriesForDate(date: string): Promise<LibraryEntry[]> {
  const entries = await getLibraryEntries();
  return entries.filter((entry) => captureDateKey(entry.takenAt) === date);
}
