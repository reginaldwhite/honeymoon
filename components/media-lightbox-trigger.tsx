"use client";

import { Play } from "lucide-react";
import type { MediaKind } from "@/content/types";
import { Lightbox } from "@/components/ui/lightbox";

/*
 * eslint-disable @next/next/no-img-element -- These are signed, already
 * format- and quality-negotiated Cloudinary URLs delivered with an explicit
 * srcset. Routing them through next/image would either strip the srcset (it
 * emits none for `unoptimized` sources) or proxy signed URLs through a second
 * optimizer, doubling egress for no benefit.
 */

interface MediaLightboxTriggerProps {
  kind: MediaKind;
  thumbSrc: string;
  thumbSrcSet: string;
  sizes: string;
  fullSrc: string;
  alt: string;
  caption?: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
}

export function MediaLightboxTrigger({
  kind,
  thumbSrc,
  thumbSrcSet,
  sizes,
  fullSrc,
  alt,
  caption,
  width,
  height,
  className = "",
  priority = false,
}: MediaLightboxTriggerProps) {
  return (
    <Lightbox
      label={alt}
      triggerLabel={kind === "video" ? `Play video: ${alt}` : `View larger: ${alt}`}
      triggerClassName={`group relative block w-full overflow-hidden rounded-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none ${className}`}
      trigger={
        <>
          {thumbSrc ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={thumbSrc}
            srcSet={thumbSrcSet}
            sizes={sizes}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 motion-reduce:transition-none group-hover:scale-[1.03]"
          />
          ) : (
            // A video served from the local library has no poster frame.
            <span className="flex aspect-video w-full items-center justify-center bg-secondary/40" />
          )}
          {kind === "video" && (
            <span
              aria-hidden
              className="absolute inset-0 flex items-center justify-center bg-black/25 transition-opacity group-hover:bg-black/40"
            >
              <span className="flex size-11 items-center justify-center rounded-full border border-white/70 bg-black/30 text-white backdrop-blur-sm">
                <Play className="size-4 translate-x-px fill-current" />
              </span>
            </span>
          )}
        </>
      }
    >
      <figure className="m-0">
        {kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fullSrc}
            alt={alt}
            width={width}
            height={height}
            decoding="async"
            className="max-h-[85vh] w-auto rounded-md object-contain"
          />
        ) : (
          <video
            src={fullSrc}
            controls
            autoPlay
            playsInline
            aria-label={alt}
            className="max-h-[85vh] w-auto rounded-md"
          />
        )}
        {caption && (
          <figcaption className="mt-3 max-w-2xl text-center text-sm text-white/70">
            {caption}
          </figcaption>
        )}
      </figure>
    </Lightbox>
  );
}
