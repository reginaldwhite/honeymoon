import type { Trip } from "@/content/types";

export interface MediaOption {
  value: string;
  label: string;
}

/** Every assigned photo, labelled by where it lives, for a photo picker <select>. */
export function buildMediaOptions(trip: Trip): MediaOption[] {
  const options: MediaOption[] = [];
  const name = (alt: string, sourcePath: string | undefined) => alt || sourcePath || "untitled";

  if (trip.overview.frontispiece) {
    const media = trip.overview.frontispiece;
    options.push({ value: media.id, label: `Opening · frontispiece — ${name(media.alt, media.sourcePath)}` });
  }

  trip.chapters.forEach((chapter, index) => {
    const chapterLabel = `Chapter ${index + 1}${chapter.title ? ` · ${chapter.title}` : ""}`;
    const describe = (alt: string, sourcePath: string | undefined, context: string) =>
      `${chapterLabel} · ${context} — ${name(alt, sourcePath)}`;

    if (chapter.heroMedia) {
      options.push({
        value: chapter.heroMedia.id,
        label: describe(chapter.heroMedia.alt, chapter.heroMedia.sourcePath, "hero"),
      });
    }
    for (const activity of chapter.activities) {
      const context = activity.title || "activity";
      if (activity.coverMedia) {
        options.push({
          value: activity.coverMedia.id,
          label: describe(activity.coverMedia.alt, activity.coverMedia.sourcePath, `${context} cover`),
        });
      }
      for (const media of activity.media) {
        options.push({ value: media.id, label: describe(media.alt, media.sourcePath, context) });
      }
    }
  });

  return options;
}
