import type { ResolvedChapter } from "@/content/chapters";
import { ChapterMap } from "@/components/chapter-opener";
import {
  CHAPTER_NOTE_CLASSES,
  CHAPTER_TITLE_CLASSES,
  ChapterOpenerFrame,
  HERO_IMAGE_CLASSES,
} from "@/components/chapter-opener-frame";
import { Eyebrow } from "@/components/typography";
import { formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AddImageButton } from "./add-image-button";
import { InlineInput, InlineNumber, InlineTextarea } from "./inline-field";
import { MediaFields, PhotoSlot } from "./photo-slot";

/**
 * A chapter's title page in edit mode: the same ChapterOpenerFrame the public
 * page composes, with inputs where its text stands. The hero is a photo slot
 * at full bleed; when the chapter has no hero of its own but the public page
 * would fall back to an activity cover, that cover is shown with a note.
 */
export function ChapterOpenerEditor({ chapter }: { chapter: ResolvedChapter }) {
  const hero = chapter.heroMedia;
  const fallback = hero ? undefined : chapter.cover;
  const onPhoto = Boolean(hero ?? fallback);
  const dayCount = chapter.dayCount;
  const targetKey = `${chapter.id}::hero`;

  return (
    <ChapterOpenerFrame
      hero={
        onPhoto ? (
          <PhotoSlot
            media={hero}
            fallback={fallback}
            targetKey={targetKey}
            targetName="Hero photograph"
            imageClassName={HERO_IMAGE_CLASSES}
            fields={false}
          />
        ) : null
      }
      toolbar={!onPhoto && <AddImageButton targetKey={targetKey} targetName="Hero photograph" />}
      titleBlock={
        <>
          <Eyebrow as="span" className={cn("block text-sm", onPhoto && "text-accent-300")}>
            {chapter.ordinal}
          </Eyebrow>
          <InlineInput
            k={`chapter:${chapter.id}:title`}
            initial={chapter.title}
            placeholder="Chapter title"
            className={cn(
              CHAPTER_TITLE_CLASSES,
              onPhoto && "border-white/50 text-white placeholder:text-white/50",
            )}
          />
          <div
            className={cn(
              "tnum mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 font-heading text-[11px] uppercase tracking-[0.16em]",
              onPhoto ? "text-white/75" : "text-muted-foreground",
            )}
          >
            {chapter.start && chapter.end ? (
              <span>
                {formatShortDate(chapter.start)} &ndash; {formatShortDate(chapter.end)} &middot;{" "}
                {dayCount} {dayCount === 1 ? "day" : "days"}
              </span>
            ) : (
              <span>No dated activities yet</span>
            )}
            &middot;
            <label className="flex items-baseline gap-1">
              nights in a tent
              <InlineNumber
                k={`chapter:${chapter.id}:nightsTent`}
                initial={chapter.nights.tent}
                step={1}
                label="Nights in a tent"
                className={cn("text-[11px]", onPhoto && "border-white/50 text-white")}
              />
            </label>
            <label className="flex items-baseline gap-1">
              in a bed
              <InlineNumber
                k={`chapter:${chapter.id}:nightsBed`}
                initial={chapter.nights.bed}
                step={1}
                label="Nights in a bed"
                className={cn("text-[11px]", onPhoto && "border-white/50 text-white")}
              />
            </label>
            &middot;
            <label className="flex items-baseline gap-1">
              short label
              <InlineInput
                k={`chapter:${chapter.id}:chip`}
                initial={chapter.chip}
                placeholder="Short label"
                className={cn("w-40 text-[11px] normal-case tracking-normal", onPhoto && "border-white/50 text-white")}
              />
            </label>
          </div>
          {hero && (
            <div className="mt-3 max-w-[52ch]">
              <MediaFields media={hero} tone="photo" />
            </div>
          )}
        </>
      }
      note={
        <InlineTextarea
          k={`chapter:${chapter.id}:note`}
          initial={chapter.note}
          placeholder="Why this stretch mattered"
          className={cn(CHAPTER_NOTE_CLASSES, "flex-1")}
        />
      }
      map={<ChapterMap chapter={chapter} />}
    />
  );
}
