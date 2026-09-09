import type { ReactNode } from "react";

/**
 * The LAYOUT of a chapter's title page, with no content of its own: the
 * public page and the editor both compose it, so they cannot drift.
 *
 * With a hero, the photograph bleeds past the page column — it is the section
 * break — while the title block sits over its lower edge, inside the column
 * so it lines up with everything above and below. A gradient at the foot of
 * the image keeps the title legible; the image stays clickable underneath
 * because the overlay lets pointer events through. Without a hero, the same
 * title block sits on paper under a rule.
 *
 * `toolbar` is an editor-only slot pinned to the top of the hero area.
 */
export function ChapterOpenerFrame({
  hero,
  titleBlock,
  note,
  map,
  toolbar,
}: {
  /** The full-bleed photograph, or null for the paper fallback. */
  hero: ReactNode | null;
  /** Ordinal, title and dates. */
  titleBlock: ReactNode;
  note: ReactNode;
  map: ReactNode;
  toolbar?: ReactNode;
}) {
  return (
    <div className="pt-14 pb-4 sm:pt-20 lg:pt-24">
      {hero ? (
        <div className="full-bleed relative">
          {hero}
          {toolbar && (
            <div className="absolute inset-x-0 top-0">
              <div className="mx-auto flex max-w-6xl justify-end px-6 pt-4">{toolbar}</div>
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-neutral-900/75 via-neutral-900/35 to-transparent pt-40">
            <div className="mx-auto max-w-6xl px-6 pb-8 text-white sm:pb-10 lg:pb-12 [&_input]:pointer-events-auto [&_button]:pointer-events-auto">
              {titleBlock}
            </div>
          </div>
        </div>
      ) : (
        <div className="border-t-2 border-foreground pt-7 sm:pt-10">
          {toolbar && <div className="mb-4">{toolbar}</div>}
          {titleBlock}
        </div>
      )}

      {/* Note and map sit together as a pair, centred on each other. */}
      <div className="mt-8 flex flex-col items-start gap-8 lg:mt-12 lg:flex-row lg:items-center lg:gap-12">
        {note}
        {map}
      </div>
    </div>
  );
}

export const HERO_IMAGE_CLASSES = "grade h-[360px] rounded-none sm:h-[460px] lg:h-[600px]";
export const CHAPTER_TITLE_CLASSES =
  "mt-2 max-w-[20ch] text-4xl font-normal leading-[1.02] text-balance sm:text-5xl lg:text-[4.25rem]";
export const CHAPTER_NOTE_CLASSES =
  "max-w-[40ch] font-heading text-xl leading-[1.4] text-pretty sm:text-2xl lg:text-[1.625rem]";
