import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import sharp from "sharp";
import { getAllMedia } from "../lib/content";
import {
  DERIVATIVE_DIR,
  DERIVATIVE_QUALITY,
  DERIVATIVE_WIDTHS,
  PIPELINE_VERSION,
  derivativeFile,
  type MediaManifest,
} from "../lib/media-manifest";
import { findMediaSourceFile } from "../lib/media-source";

/**
 * Renders every photograph the site references into the WebP files the
 * deployed site serves, and writes content/media-manifest.json describing
 * them.
 *
 * Each photo gets every width in DERIVATIVE_WIDTHS below its own width, plus
 * one at its own width if that is smaller than the largest — named by the
 * actual pixel width, so srcset descriptors stay honest. Filenames carry a
 * hash of the source bytes and the pipeline version, so a rotated original
 * or a quality change renames its files and old ones are pruned.
 *
 * Safe to re-run: existing files are kept, missing ones rendered, and files
 * no longer expected are deleted. Videos are skipped (they fall through to
 * whatever else media-delivery can offer).
 *
 * The total is capped below the Vercel Hobby plan's 100 MB source upload.
 */

const MANIFEST_PATH = "content/media-manifest.json";
const MAX_TOTAL_BYTES = 90 * 1024 * 1024;

async function main() {
  const media = getAllMedia();
  const manifest: MediaManifest = {};
  const expected = new Set<string>();
  let rendered = 0;
  let kept = 0;
  let skipped = 0;

  await mkdir(DERIVATIVE_DIR, { recursive: true });

  // Every referenced photo appears once per slot it fills; render it once.
  const seen = new Set<string>();

  for (const item of media) {
    if (seen.has(item.publicId)) continue;
    seen.add(item.publicId);

    if (item.kind !== "image") {
      console.log(`○ ${item.publicId} is a video — skipped`);
      skipped++;
      continue;
    }
    const source = findMediaSourceFile(item.publicId, item.kind);
    if (!source) {
      console.log(`○ missing staged file for ${item.publicId} — skipped`);
      skipped++;
      continue;
    }

    const bytes = await readFile(source);
    const hash = createHash("sha1").update(bytes).update(PIPELINE_VERSION).digest("hex").slice(0, 8);
    const image = sharp(bytes).rotate();
    const { width: rawWidth, height: rawHeight, orientation } = await image.metadata();
    if (!rawWidth || !rawHeight) throw new Error(`Could not read dimensions of ${source}`);
    // After rotate(), a portrait-tagged landscape file is portrait.
    const sourceWidth = orientation && orientation >= 5 ? rawHeight : rawWidth;

    const largest = DERIVATIVE_WIDTHS[DERIVATIVE_WIDTHS.length - 1];
    const widths = [
      ...DERIVATIVE_WIDTHS.filter((width) => width < sourceWidth),
      ...(sourceWidth < largest ? [sourceWidth] : []),
    ].sort((a, b) => a - b);

    let renderedHere = 0;
    for (const width of widths) {
      const file = join(DERIVATIVE_DIR, derivativeFile(item.publicId, hash, width));
      expected.add(file);
      if (existsSync(file)) {
        kept++;
        continue;
      }
      await mkdir(dirname(file), { recursive: true });
      await sharp(bytes)
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: DERIVATIVE_QUALITY })
        .toFile(file);
      rendered++;
      renderedHere++;
    }
    manifest[item.publicId] = { hash, widths };
    console.log(
      `${renderedHere > 0 ? "✓" : "·"} ${item.publicId} ${sourceWidth}w → [${widths.join(", ")}]${renderedHere > 0 ? ` rendered ${renderedHere}` : " up to date"}`,
    );
  }

  // Prune anything the manifest no longer accounts for.
  let pruned = 0;
  for (const file of await listFiles(DERIVATIVE_DIR)) {
    if (!expected.has(file)) {
      await rm(file);
      pruned++;
    }
  }
  await removeEmptyDirs(DERIVATIVE_DIR);

  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(MANIFEST_PATH, JSON.stringify(sorted, null, 2) + "\n");

  let totalBytes = 0;
  for (const file of expected) totalBytes += (await stat(file)).size;
  const totalMb = totalBytes / 1024 / 1024;

  console.log(
    `\nDone. ${Object.keys(manifest).length} photographs, ${expected.size} files (${rendered} rendered, ${kept} kept, ${pruned} pruned, ${skipped} skipped). ${totalMb.toFixed(1)} MB in ${DERIVATIVE_DIR}; manifest at ${MANIFEST_PATH}.`,
  );
  if (totalBytes > MAX_TOTAL_BYTES) {
    console.error(
      `${DERIVATIVE_DIR} is over ${(MAX_TOTAL_BYTES / 1024 / 1024).toFixed(0)} MB, which will not fit a Vercel Hobby deploy. Lower DERIVATIVE_QUALITY or drop a width in lib/media-manifest.ts.`,
    );
    process.exit(1);
  }
}

async function listFiles(dir: string): Promise<string[]> {
  if (!existsSync(dir)) return [];
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(path)));
    else files.push(path);
  }
  return files;
}

async function removeEmptyDirs(dir: string): Promise<void> {
  if (!existsSync(dir)) return;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const path = join(dir, entry.name);
    await removeEmptyDirs(path);
    if ((await readdir(path)).length === 0 && relative(DERIVATIVE_DIR, path) !== "") await rm(path, { recursive: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
