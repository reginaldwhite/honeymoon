import type { ReactNode } from "react";
import type { ChapterWithDays } from "@/content/chapters";
import { formatShortDate } from "@/lib/format";
import { KauaiMap } from "./kauai-map";
import { MediaThumb } from "./media-thumb";
import { Eyebrow, SmallCaps } from "./typography";

/**
 * A chapter's title page.
 *
 * This has to read as a genuine section break, because it now sits in the same
 * scroll as the overview and the day spreads — hence the 2px ink rule over a
 * hairline, the large ghost numeral, and a title at roughly twice a day
 * title's size. Hairlines carry the structure; there is no filled band.
 *
 * No dark overlay and no text over the image: in this system a photograph is a
 * tipped-in plate, not a banner, so the type sits on the paper beside it.
 *
 * `action` is an optional slot the admin uses for an Edit button; the public
 * site passes nothing.
 */
export function ChapterOpener({
  chapter,
  number,
  action,
}: {
  chapter: ChapterWithDays;
  /** 1-based chapter position, shown as the ghost numeral. */
  number: number;
  action?: ReactNode;
}) {
  const dayCount = chapter.days.length;
  const numeral = String(number).padStart(2, "0");

  return (
    <div className="pt-14 pb-4 sm:pt-20 lg:pt-28">
      <div className="border-t-2 border-foreground">
        <div className="mt-[3px] border-t border-divider pt-7 sm:pt-10 lg:pt-12">
          <div className="grid items-end gap-8 lg:grid-cols-2 lg:gap-16">
            <div className="flex flex-col gap-3">
              {action && <div>{action}</div>}
              <div className="flex items-baseline gap-4">
                <span className="tnum font-heading text-[3.625rem] font-normal leading-[0.76] text-accent-200 sm:text-7xl lg:text-[7.75rem]">
                  {numeral}
                </span>
                <span className="flex flex-col gap-px">
                  <Eyebrow as="span">{chapter.ordinal}</Eyebrow>
                  <SmallCaps className="text-[11px]">
                    {formatShortDate(chapter.start)} &ndash; {formatShortDate(chapter.end)}{" "}
                    &middot; {dayCount} {dayCount === 1 ? "day" : "days"}
                  </SmallCaps>
                </span>
              </div>

              <h2 className="max-w-[20ch] text-4xl font-normal leading-[1.02] text-balance sm:text-5xl lg:text-[4.25rem]">
                {chapter.title}
              </h2>

              <p className="mt-1 max-w-[40ch] font-heading text-xl leading-[1.4] text-pretty sm:text-2xl lg:text-[1.625rem]">
                {chapter.note}
              </p>

              <KauaiMap
                marks={chapter.marks}
                view={chapter.mapView}
                className="mt-4 h-auto w-[168px] shrink-0"
              />
            </div>

            {chapter.cover && (
              <figure>
                <MediaThumb
                  media={chapter.cover}
                  fallbackAlt={`${chapter.title}, the opening photograph of this chapter`}
                  className="plate h-[250px] sm:h-[340px] lg:h-[430px]"
                  sizes="(min-width: 1024px) 560px, 100vw"
                />
              </figure>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
