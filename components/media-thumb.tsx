import { resolveMedia } from "@/lib/media-delivery";
import type { MediaRef } from "@/content/types";
import { MediaPlaceholder } from "./media-placeholder";
import { MediaLightboxTrigger } from "./media-lightbox-trigger";

/**
 * Renders a single photo/video attached to an Activity or Day.
 *
 * Where the bytes come from is decided server-side by resolveMedia — the local
 * library in development, signed Cloudinary URLs otherwise — so
 * CLOUDINARY_API_SECRET never reaches the client either way.
 */
export function MediaThumb({
  media,
  fallbackAlt,
  className,
  sizes = "(min-width: 1024px) 320px, (min-width: 640px) 33vw, 50vw",
  priority = false,
}: {
  media: MediaRef;
  /**
   * Used when this photo has no authored alt text yet. Describing it by the
   * activity it belongs to is far more useful to a screen reader than the
   * camera's filename.
   */
  fallbackAlt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const alt = media.alt.trim() || fallbackAlt;
  const resolved = resolveMedia(media);

  if (!resolved) {
    return <MediaPlaceholder media={media} alt={alt} className={className} />;
  }

  return (
    <MediaLightboxTrigger
      kind={media.kind}
      thumbSrc={resolved.thumbSrc}
      thumbSrcSet={resolved.thumbSrcSet}
      sizes={sizes}
      fullSrc={resolved.fullSrc}
      alt={alt}
      caption={media.caption}
      width={media.width}
      height={media.height}
      className={className}
      priority={priority}
    />
  );
}
