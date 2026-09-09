import { trip as buildTimeTrip } from "@/content/trip";
import { getTripDates } from "@/lib/content";
import { getFrontispiece, type ResolvedChapter } from "@/content/chapters";
import { STOPS, STOP_LABELS, type MapLabel } from "@/content/kauai-geometry";
import type { Trip } from "@/content/types";
import { KauaiMap } from "./kauai-map";
import { MediaThumb } from "./media-thumb";
import {
  BODY_CLASSES,
  HEADLINE_CLASSES,
  LEDE_CLASSES,
  MAP_CAPTION_CLASSES,
  PLATE_CLASSES,
  PLATE_SIZES,
  SUBTITLE_CLASSES,
  TripOpeningFrame,
} from "./trip-opening-frame";
import { Eyebrow, PlateCaption } from "./typography";

/**
 * How the site opens, as the reader sees it. Every word comes from
 * trip-data.json; TripOpeningFrame decides where it goes, and the editor
 * composes the same frame.
 */
export function TripOpening({
  trip = buildTimeTrip,
  chapters,
}: {
  trip?: Trip;
  chapters: ResolvedChapter[];
}) {
  const frontispiece = getFrontispiece(trip, chapters);
  const { overview } = trip;

  return (
    <TripOpeningFrame
      eyebrow={
        <Eyebrow className="tnum">
          {trip.place && <>{trip.place} &middot; </>}
          {getTripDates(trip).length} days
        </Eyebrow>
      }
      headline={<h1 className={HEADLINE_CLASSES}>{trip.headline || trip.title}</h1>}
      subtitle={trip.subtitle && <p className={SUBTITLE_CLASSES}>{trip.subtitle}</p>}
      // The header already carries the date range on every screen, so it is
      // not printed a second time here.
      plate={
        frontispiece && (
          <>
            <MediaThumb
              media={frontispiece}
              fallbackAlt="The opening photograph of the trip"
              className={PLATE_CLASSES}
              sizes={PLATE_SIZES}
              priority
            />
            {frontispiece.caption && <PlateCaption>{frontispiece.caption}</PlateCaption>}
          </>
        )
      }
      mapEyebrow={<Eyebrow>The shape of it</Eyebrow>}
      map={overview.mapStops.length > 0 && <OverviewMap trip={trip} />}
      mapCaption={overview.mapCaption && <p className={MAP_CAPTION_CLASSES}>{overview.mapCaption}</p>}
      lede={overview.lede && <p className={LEDE_CLASSES}>{overview.lede}</p>}
      body={overview.body.map((paragraph, index) => (
        <p key={index} className={BODY_CLASSES}>
          {paragraph}
        </p>
      ))}
    />
  );
}

/** The island overview map, shared by the public opening and the editor. */
export function OverviewMap({ trip }: { trip: Trip }) {
  const { overview } = trip;
  const marks = overview.mapStops.map((stop) => ({ ...STOPS[stop.at], r: stop.r }));
  const labels = overview.mapStops
    .map((stop) => STOP_LABELS[stop.at])
    .filter((label): label is MapLabel => label !== undefined);

  return (
    <KauaiMap
      title={overview.mapAlt || `Map of ${trip.place || "the island"}`}
      className="mt-4 w-full"
      // The ring road belongs on the island overview only; at this scale a
      // trail is a few pixels long and reads as a scratch.
      road
      marks={marks}
      labels={labels}
    />
  );
}
