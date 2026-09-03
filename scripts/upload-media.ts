import { config } from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import { getAllMedia } from "../lib/content";
import { findMediaSourceFile, MEDIA_SOURCE_DIR } from "../lib/media-source";

config({ path: ".env.local" });


/**
 * Bulk-uploads real photos/videos to Cloudinary so their public IDs match what's
 * already referenced in content/trip.ts. Every asset is uploaded with delivery
 * type "authenticated" so it can only be viewed through this app's signed URLs.
 *
 * Usage:
 *   1. Put your real files under media-source/, using the exact same relative
 *      path (without extension) as each MediaRef's `publicId` in content/trip.ts.
 *      e.g. publicId "honeymoon/day-01/cover-north-shore" ->
 *           media-source/honeymoon/day-01/cover-north-shore.jpg
 *   2. Fill in CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET
 *      in .env.local
 *   3. Run: npm run upload-media
 *
 * Safe to re-run — already-uploaded files are skipped unless you pass --overwrite.
 */

const overwrite = process.argv.includes("--overwrite");

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name} in .env.local — see .env.example`);
    process.exit(1);
  }
  return value;
}

cloudinary.config({
  cloud_name: requireEnv("CLOUDINARY_CLOUD_NAME"),
  api_key: requireEnv("CLOUDINARY_API_KEY"),
  api_secret: requireEnv("CLOUDINARY_API_SECRET"),
  secure: true,
});

async function main() {
  const media = getAllMedia();
  let uploaded = 0;
  let skippedExisting = 0;
  let missing = 0;

  for (const item of media) {
    const sourcePath = findMediaSourceFile(item.publicId, item.kind);
    if (!sourcePath) {
      console.log(`○ missing source file for ${item.publicId} (${item.kind}) — skipped`);
      missing++;
      continue;
    }

    if (!overwrite) {
      const exists = await cloudinary.api
        .resource(item.publicId, { resource_type: item.kind, type: "authenticated" })
        .then(() => true)
        .catch(() => false);
      if (exists) {
        console.log(`· ${item.publicId} already uploaded — skipped (use --overwrite to replace)`);
        skippedExisting++;
        continue;
      }
    }

    await cloudinary.uploader.upload(sourcePath, {
      public_id: item.publicId,
      resource_type: item.kind,
      type: "authenticated",
      overwrite: true,
    });
    console.log(`✓ uploaded ${sourcePath} -> ${item.publicId}`);
    uploaded++;
  }

  console.log(
    `\nDone. ${uploaded} uploaded, ${skippedExisting} already present, ${missing} missing source files.`,
  );
  if (missing > 0) {
    console.log(
      `Add the missing files under ${MEDIA_SOURCE_DIR}/<publicId>.<ext> and re-run this script.`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
