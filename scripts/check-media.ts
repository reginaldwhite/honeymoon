import { existsSync } from "node:fs";
import { join } from "node:path";
import manifest from "../content/media-manifest.json";
import { getAllMedia } from "../lib/content";
import { DERIVATIVE_DIR, derivativeFile, type MediaManifest } from "../lib/media-manifest";

/**
 * Runs before `next build`, locally and in the cloud: the deployed site can
 * only show a photograph that was rendered by `npm run build-media` and
 * shipped with the deploy, so the build refuses to produce a site with holes.
 *
 * Fails when a referenced photograph is missing from the manifest (someone
 * assigned or rotated a photo and did not re-run build-media), or when a
 * manifest entry's files are missing on disk (the derivatives did not come
 * along — in the cloud, that means .vercelignore is wrong). Warns about
 * manifest entries nothing references any more.
 */

const entries = manifest as MediaManifest;
const referenced = new Set(
  getAllMedia()
    .filter((item) => item.kind === "image")
    .map((item) => item.publicId),
);

const missingFromManifest = [...referenced].filter((publicId) => !entries[publicId]);
const missingFiles: string[] = [];
for (const [publicId, entry] of Object.entries(entries)) {
  for (const width of entry.widths) {
    const file = join(DERIVATIVE_DIR, derivativeFile(publicId, entry.hash, width));
    if (!existsSync(file)) missingFiles.push(file);
  }
}
const unreferenced = Object.keys(entries).filter((publicId) => !referenced.has(publicId));

if (unreferenced.length > 0) {
  console.warn(`check-media: ${unreferenced.length} manifest entries are no longer referenced; run npm run build-media to prune them.`);
}
if (missingFromManifest.length > 0) {
  console.error(
    `check-media: ${missingFromManifest.length} referenced photographs are not in content/media-manifest.json — run npm run build-media and commit the manifest.\n  e.g. ${missingFromManifest.slice(0, 3).join(", ")}`,
  );
}
if (missingFiles.length > 0) {
  console.error(
    `check-media: ${missingFiles.length} derivative files listed in the manifest are missing from ${DERIVATIVE_DIR} — run npm run build-media (locally), or check .vercelignore (in a deploy).\n  e.g. ${missingFiles.slice(0, 3).join(", ")}`,
  );
}
if (missingFromManifest.length > 0 || missingFiles.length > 0) process.exit(1);

console.log(`check-media: ${referenced.size} photographs, all rendered and present.`);
