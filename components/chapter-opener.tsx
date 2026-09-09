import type { ResolvedChapter } from "@/content/chapters";
import { formatShortDate } from "@/lib/format";
import {
  CHAPTER_NOTE_CLASSES,
  CHAPTER_TITLE_CLASSES,
  ChapterOpenerFrame,
  HERO_IMAGE_CLASSES,
} from "./chapter-opener-frame";
import { KauaiMap } from "./kauai-map";
import { MediaThumb } from "./media-thumb";
import { Eyebrow, SmallCaps } from "./typography";

/**
 * A chapter's title page as the reader sees it. Composes ChapterOpenerFrame —
 * the editor composes the same frame with inputs.
 */
export function ChapterOpener({ chapter }: { chapter: ResolvedChapter }) {
  const dayCount = chapter.dayCount;
  const onPhoto = Boolean(chapter.cover);

  return (
    <ChapterOpenerFrame
      hero={
        chapter.cover ? (
          <MediaThumb
            media={chapter.cover}
            fallbackAlt={`${chapter.title}, the opening photograph of this chapter`}
            className={HERO_IMAGE_CLASSES}
            sizes="100vw"
          />
        ) : null
      }
      titleBlock={
        <>
          <Eyebrow as="span" className={onPhoto ? "block text-sm text-accent-300" : "block text-sm"}>
            {chapter.ordinal}
          </Eyebrow>
          <h2 className={CHAPTER_TITLE_CLASSES}>{chapter.title}</h2>
          {chapter.start && chapter.end && (
            <SmallCaps className={onPhoto ? "mt-3 block text-[11px] text-white/75" : "mt-3 block text-[11px]"}>
              {formatShortDate(chapter.start)} &ndash; {formatShortDate(chapter.end)} &middot;{" "}
              {dayCount} {dayCount === 1 ? "day" : "days"}
            </SmallCaps>
          )}
        </>
      }
      note={<p className={CHAPTER_NOTE_CLASSES}>{chapter.note}</p>}
      map={<ChapterMap chapter={chapter} />}
    />
  );
}

/** The chapter's map, shared by the public opener and the editor. */
export function ChapterMap({ chapter }: { chapter: ResolvedChapter }) {
  return (
    <KauaiMap
      title={chapter.mapAlt || undefined}
      marks={chapter.marks}
      view={chapter.mapView}
      walks={chapter.routes}
      labels={chapter.mapLabels}
      className="shrink-0"
      // One size does not suit crops this different; chapter three needs the
      // room to carry its own labels.
      style={{ width: chapter.mapWidth ?? "min(300px,46vw)" }}
    />
  );
}
