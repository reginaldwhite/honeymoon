import type { ReactNode } from "react";
import { trip as buildTimeTrip } from "@/content/trip";
import { getFrontispiece, type ChapterWithDays } from "@/content/chapters";
import { STOPS, STOP_LABELS } from "@/content/kauai-geometry";
import type { Trip } from "@/content/types";
import { getTripDateRange } from "@/lib/content";
import { formatLongDate } from "@/lib/format";
import { KauaiMap, type MapLabel } from "./kauai-map";
import { MediaThumb } from "./media-thumb";
import { Eyebrow, SmallCaps } from "./typography";

/**
 * How the site opens — like a book rather than a website: display line,
 * hairline rule, frontispiece plate, then the island with the places we stayed
 * marked on it and the overview copy beside it. Every word comes from
 * trip-data.json; this decides where it goes.
 *
 * `action` is an optional slot the admin uses to place an Edit button. The
 * public site passes nothing, so its output is unchanged.
 */
export function TripOpening({
  trip = buildTimeTrip,
  chapters,
  action,
}: {
  trip?: Trip;
  chapters: ChapterWithDays[];
  action?: ReactNode;
}) {
  const range = getTripDateRange(trip);
  const frontispiece = getFrontispiece(chapters);
  const { overview } = trip;

  const marks = overview.mapStops.map((stop) => ({ ...STOPS[stop.at], r: stop.r }));
  const labels = overview.mapStops
    .map((stop) => STOP_LABELS[stop.at])
    .filter((label): label is MapLabel => label !== undefined);
  const hasOverviewCopy = overview.lede || overview.body.length > 0;

  return (
    <>
      <section className="grid items-end gap-8 py-14 lg:grid-cols-2 lg:gap-20 lg:py-24">
        <div className="pb-4">
          {action && <div className="mb-6">{action}</div>}

          <Eyebrow className="tnum">
            {trip.place && <>{trip.place} &middot; </>}
            {trip.days.length} days
          </Eyebrow>

          <h1 className="mt-4 max-w-[15ch] text-5xl font-normal leading-none tracking-[-0.02em] text-balance sm:text-6xl lg:text-[5.5rem]">
            {trip.headline || trip.title}
          </h1>

          <hr className="hr mt-6" />

          {trip.subtitle && (
            <p className="max-w-[38ch] font-heading text-xl leading-[1.4] text-pretty sm:text-2xl lg:text-[1.75rem]">
              {trip.subtitle}
            </p>
          )}

          {range && (
            <SmallCaps as="p" className="mt-6">
              {formatLongDate(range.start)} &ndash; {formatLongDate(range.end)}
            </SmallCaps>
          )}
        </div>

        {frontispiece && (
          <figure>
            <MediaThumb
              media={frontispiece}
              fallbackAlt="The opening photograph of the trip"
              className="plate h-[300px] sm:h-[400px] lg:h-[520px]"
              sizes="(min-width: 1024px) 560px, 100vw"
              priority
            />
          </figure>
        )}
      </section>

      {(marks.length > 0 || hasOverviewCopy) && (
        <section className="grid gap-10 border-t border-divider py-16 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-24">
          {marks.length > 0 && (
            <div className="lg:sticky lg:top-24 lg:self-start">
              <Eyebrow>The shape of it</Eyebrow>

              <KauaiMap
                title={`Map of ${trip.place || "the island"} showing where we stayed`}
                className="mt-4 h-auto w-full"
                marks={marks}
                labels={labels}
              />

              {overview.mapCaption && (
                <p className="mt-4 max-w-[32ch] text-[13px] leading-[1.6] text-muted-foreground">
                  {overview.mapCaption}
                </p>
              )}
            </div>
          )}

          {hasOverviewCopy && (
            <div className="flex flex-col gap-5">
              {overview.lede && (
                <p className="font-heading text-2xl leading-[1.3] tracking-[-0.012em] text-pretty lg:text-[2.125rem]">
                  {overview.lede}
                </p>
              )}
              {overview.body.map((paragraph, index) => (
                <p
                  key={index}
                  className="max-w-[62ch] text-justify text-base leading-[1.75] hyphens-auto"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          )}
        </section>
      )}
    </>
  );
}
