import { NextRequest, NextResponse } from "next/server";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname } from "node:path";
import { Readable } from "node:stream";
import sharp from "sharp";
import { isProductionRuntime } from "@/lib/dev-only";
import { resolveSafePath } from "@/lib/safe-path";
import { MEDIA_MIME_TYPES, mediaKindForExtension } from "@/lib/media-source";
import { RESPONSIVE_WIDTHS } from "@/lib/cloudinary";

/**
 * Streams a file out of PHOTO_SOURCE_DIR. Dev-only: it reads an arbitrary local
 * directory and sits outside the site's password gate.
 *
 * With `?w=`, images are resized on the fly with sharp and returned as WebP.
 * This is what stands in for Cloudinary's `fetch_format`/`quality` negotiation
 * while developing, and it is what makes serving the real library to the public
 * pages viable — the originals are multi-megabyte camera JPEGs.
 */

// Fixed set, so a caller can't ask the server to render arbitrary sizes.
const ALLOWED_WIDTHS = new Set([240, 480, ...RESPONSIVE_WIDTHS]);

export async function GET(request: NextRequest) {
  if (isProductionRuntime()) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const sourceDir = process.env.PHOTO_SOURCE_DIR;
  if (!sourceDir) {
    return NextResponse.json({ error: "PHOTO_SOURCE_DIR is not set" }, { status: 500 });
  }

  const { searchParams } = request.nextUrl;
  const relativePath = searchParams.get("path");
  if (!relativePath) {
    return NextResponse.json({ error: "Missing path" }, { status: 400 });
  }

  let filePath: string;
  try {
    filePath = resolveSafePath(sourceDir, relativePath);
  } catch {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  /*
   * Callers that pass `v` (the file's mtime) get an immutable response, because
   * editing the file changes the URL. Callers that don't must not be cached at
   * all — a rotation would otherwise keep serving the stale image from the
   * browser cache under the same URL.
   */
  const cacheControl = searchParams.has("v")
    ? "private, max-age=31536000, immutable"
    : "private, no-store";

  const extension = extname(filePath).toLowerCase();
  const widthParam = searchParams.get("w");

  if (widthParam) {
    const width = Number(widthParam);
    if (!ALLOWED_WIDTHS.has(width)) {
      return NextResponse.json({ error: "Unsupported width" }, { status: 400 });
    }
    if (mediaKindForExtension(extension) === "image") {
      try {
        const body = await sharp(filePath)
          // No-argument rotate applies the EXIF orientation, so phone photos
          // aren't served on their side.
          .rotate()
          .resize({ width, withoutEnlargement: true })
          .webp({ quality: 78 })
          .toBuffer();

        return new Response(new Uint8Array(body), {
          headers: { "Content-Type": "image/webp", "Cache-Control": cacheControl },
        });
      } catch {
        // Formats sharp can't decode (e.g. HEIC without libheif) fall through
        // to the original bytes rather than failing the request.
      }
    }
  }

  const contentType = MEDIA_MIME_TYPES[extension] ?? "application/octet-stream";
  const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;

  return new Response(stream, {
    headers: { "Content-Type": contentType, "Cache-Control": cacheControl },
  });
}
