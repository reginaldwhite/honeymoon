import type { ReactNode } from "react";

/**
 * The LAYOUT of the site's opening, with no content of its own — the public
 * page and the editor both compose it. Opens like a book: display line,
 * hairline rule, frontispiece plate; then the island with the places we
 * stayed, and the overview copy beside it.
 */
export function TripOpeningFrame({
  eyebrow,
  headline,
  subtitle,
  meta,
  plate,
  mapEyebrow,
  map,
  mapCaption,
  lede,
  body,
  toolbar,
}: {
  eyebrow: ReactNode;
  headline: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  /** The frontispiece, or the editor's slot for it. */
  plate?: ReactNode;
  mapEyebrow: ReactNode;
  map?: ReactNode;
  mapCaption?: ReactNode;
  lede?: ReactNode;
  body?: ReactNode;
  toolbar?: ReactNode;
}) {
  const hasShape = Boolean(map || lede || body);

  return (
    <>
      <section className="grid items-end gap-8 py-14 lg:grid-cols-2 lg:gap-20 lg:py-24">
        <div className="pb-4">
          {toolbar && <div className="mb-6">{toolbar}</div>}
          {eyebrow}
          {headline}
          <hr className="hr mt-6" />
          {subtitle}
          {meta}
        </div>
        {plate && <figure>{plate}</figure>}
      </section>

      {hasShape && (
        <section className="grid gap-10 border-t border-divider py-16 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-24">
          {map && (
            <div className="lg:sticky lg:top-24 lg:self-start">
              {mapEyebrow}
              {map}
              {mapCaption}
            </div>
          )}
          {(lede || body) && (
            <div className="flex flex-col gap-5">
              {lede}
              {body}
            </div>
          )}
        </section>
      )}
    </>
  );
}

export const HEADLINE_CLASSES =
  "mt-4 max-w-[15ch] text-5xl font-normal leading-none tracking-[-0.02em] text-balance sm:text-6xl lg:text-[5.5rem]";
export const SUBTITLE_CLASSES =
  "max-w-[38ch] font-heading text-xl leading-[1.4] text-pretty sm:text-2xl lg:text-[1.75rem]";
export const LEDE_CLASSES =
  "font-heading text-2xl leading-[1.3] tracking-[-0.012em] text-pretty lg:text-[2.125rem]";
export const BODY_CLASSES = "max-w-[62ch] text-justify text-base leading-[1.75] hyphens-auto";
export const MAP_CAPTION_CLASSES = "mt-4 max-w-[32ch] text-[13px] leading-[1.6] text-muted-foreground";
export const PLATE_CLASSES = "plate h-[300px] sm:h-[400px] lg:h-[520px]";
export const PLATE_SIZES = "(min-width: 1024px) 560px, 100vw";
