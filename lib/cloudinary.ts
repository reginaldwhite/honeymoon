import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { cache } from "react";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/** True once real Cloudinary credentials are set (vs. the empty .env.local placeholders). */
export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

export interface DeliveryOptions {
  width?: number;
  height?: number;
  crop?: "fill" | "fit" | "limit";
  /** Render a video's still frame instead of the video itself (for a poster). */
  asPoster?: boolean;
}

/**
 * React.cache() compares arguments by reference, so an options *object* built
 * fresh at each call site would never produce a cache hit. Memoizing on a
 * serialized key keeps the deduplication real — the timeline renders the same
 * photo at the same size in more than one place.
 */
const signedUrlForKey = cache(function signedUrlForKey(
  publicId: string,
  resourceType: "image" | "video",
  optionsKey: string,
): string {
  const { asPoster, ...transform } = JSON.parse(optionsKey) as DeliveryOptions;

  return cloudinary.url(publicId, {
    type: "authenticated",
    sign_url: true,
    secure: true,
    resource_type: resourceType,
    fetch_format: "auto",
    quality: "auto",
    ...(asPoster ? { format: "jpg" } : {}),
    ...transform,
  });
});

/**
 * Signed delivery URL for a Cloudinary asset uploaded with delivery type
 * "authenticated" — only resolves with a valid signature computed server-side
 * from CLOUDINARY_API_SECRET, so it can't be hotlinked outside this app. Only
 * call this from Server Components/actions after the proxy auth check has
 * already run for the request.
 */
export function getSignedMediaUrl(
  publicId: string,
  resourceType: "image" | "video",
  options: DeliveryOptions = {},
): string {
  return signedUrlForKey(publicId, resourceType, JSON.stringify(options));
}

/** Signed still-frame thumbnail for a video asset (for use as a <video> poster). */
export function getSignedVideoPosterUrl(
  publicId: string,
  options: DeliveryOptions = {},
): string {
  return getSignedMediaUrl(publicId, "video", { ...options, asPoster: true });
}

/**
 * Widths offered to the browser for a responsive photo. Cloudinary renders each
 * on demand, so this costs nothing until a viewport actually asks for one.
 */
export const RESPONSIVE_WIDTHS = [400, 640, 800, 1200, 1600, 2000];

/**
 * A `srcset` of signed URLs. Next's image optimizer is deliberately not in the
 * path here: these URLs are already format- and quality-negotiated by
 * Cloudinary (`fetch_format: auto`, `quality: auto`), and proxying signed URLs
 * through a second optimizer would double the egress for no gain.
 */
export function getSignedSrcSet(
  publicId: string,
  resourceType: "image" | "video",
  options: Omit<DeliveryOptions, "width"> = {},
  widths: number[] = RESPONSIVE_WIDTHS,
): string {
  return widths
    .map((width) => `${getSignedMediaUrl(publicId, resourceType, { ...options, width })} ${width}w`)
    .join(", ");
}
