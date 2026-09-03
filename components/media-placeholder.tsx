import { Image as ImageIcon, Video } from "lucide-react";
import type { MediaRef } from "@/content/types";

/**
 * Dev-mode fallback shown when Cloudinary credentials aren't configured yet,
 * so pages remain reviewable before real media is uploaded.
 */
export function MediaPlaceholder({
  media,
  alt,
  className = "aspect-[3/2]",
}: {
  media: MediaRef;
  alt: string;
  className?: string;
}) {
  const Icon = media.kind === "video" ? Video : ImageIcon;
  return (
    <div
      className={`flex w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-md border border-dashed border-border bg-secondary/40 p-4 text-center ${className}`}
    >
      <Icon className="size-6 text-muted-foreground" aria-hidden />
      <p className="line-clamp-3 text-xs text-muted-foreground">{alt}</p>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70">
        Not uploaded yet
      </p>
    </div>
  );
}
