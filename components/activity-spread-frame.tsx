import type { ReactNode } from "react";
import type { PhotoRow } from "@/lib/photo-rows";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

/** The content column at the widest breakpoint, for working out `sizes`. */
export const CONTENT_PX = 1104;

/**
 * The LAYOUT of an activity, with no content of its own. The public page
 * fills it with text; the editor fills it with inputs — so the two cannot
 * drift.
 *
 * The order is fixed and the same for every activity, so a chapter of them
 * reads as one document: a metadata line and the title, the establishing
 * shot full width, the body copy, then the photographs in their rows.
 */
export function ActivitySpreadFrame({
  id,
  index,
  isLast = false,
  titleBlock,
  hero,
  description,
  children,
}: {
  id: string;
  /** Position within the chapter — staggers the scroll reveal. */
  index: number;
  /** Last in its chapter: drops the bottom rule, since the next chapter's hero follows. */
  isLast?: boolean;
  /** Meta line and title. */
  titleBlock: ReactNode;
  /** The establishing shot (or the editor's slot for it). */
  hero?: ReactNode;
  description?: ReactNode;
  /** The photograph rows and anything hung beneath them. */
  children?: ReactNode;
}) {
  return (
    <Reveal
      as="article"
      id={id}
      index={index}
      className={cn(
        "scroll-mt-(--sticky-stack) pt-14 pb-11 lg:pt-23 lg:pb-18",
        !isLast && "border-b border-divider",
      )}
    >
      <div className="min-w-0">{titleBlock}</div>

      {hero}

      {description && <div className="mt-7 lg:mt-10">{description}</div>}

      {children}
    </Reveal>
  );
}

export const ACTIVITY_TITLE_CLASSES =
  "mt-2 text-[1.75rem] font-normal leading-[1.06] tracking-[-0.01em] text-balance sm:text-4xl lg:text-[2.75rem]";
export const DESCRIPTION_CLASSES = "max-w-[64ch] text-justify text-base leading-[1.75] hyphens-auto";

/**
 * The establishing shot. A landscape photograph is cropped to 3:2 across the
 * full column — every activity's lead frame is then the same shape, which is
 * what makes the spreads read as a series. A portrait cannot be cropped that
 * far without losing the picture, so it keeps its own ratio at a narrow
 * measure instead. `ratio` is width / height.
 */
export function ActivityHeroFrame({
  ratio,
  children,
  caption,
  className,
}: {
  ratio: number;
  children: ReactNode;
  caption?: ReactNode;
  className?: string;
}) {
  const portrait = ratio < 1;
  return (
    <figure className={cn("mt-6 lg:mt-10", portrait && "w-[min(46%,380px)]", className)}>
      <div className="w-full" style={{ aspectRatio: portrait ? ratio : 3 / 2 }}>
        {children}
      </div>
      {caption}
    </figure>
  );
}
export const heroSizes = (ratio: number) =>
  ratio < 1 ? "(min-width: 1024px) 380px, 46vw" : "(min-width: 1024px) 1104px, 100vw";

/**
 * An activity's photographs as authored rows of 1, 2 or 3 equal frames. The
 * frames in a row share the row's ratio, so a row of three lines up with
 * every other row of three and every row reaches both margins. A lone
 * portrait is held to a narrow measure — alone at full width it would tower
 * over the column. `aside` lets the editor hang controls off a row's end.
 */
export function PhotoRowGrid({
  rows,
  renderCell,
  aside,
  className,
}: {
  rows: PhotoRow[];
  renderCell: (row: PhotoRow, rowIndex: number, cellIndex: number) => ReactNode;
  aside?: (row: PhotoRow, rowIndex: number) => ReactNode;
  className?: string;
}) {
  if (rows.length === 0) return null;

  return (
    <div className={className}>
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className={cn("relative mt-3", aside && "pr-12")}>
          <div
            className={cn(
              "flex gap-2",
              row.portrait && row.columns === 1 && "max-w-[44%]",
            )}
          >
            {row.cells.map((_, cellIndex) => (
              <div key={cellIndex} className="min-w-0 flex-1" style={{ aspectRatio: row.ratio }}>
                {renderCell(row, rowIndex, cellIndex)}
              </div>
            ))}
          </div>
          {aside && <div className="absolute top-0 right-0 h-full w-10">{aside(row, rowIndex)}</div>}
        </div>
      ))}
    </div>
  );
}

/** `sizes` for a frame in a row of `columns`. */
export const cellSizes = (columns: number) =>
  `(min-width: 1024px) ${Math.round(CONTENT_PX / columns)}px, ${Math.round(100 / columns)}vw`;
