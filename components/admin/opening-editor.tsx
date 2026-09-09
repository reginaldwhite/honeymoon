import { getTripDates } from "@/lib/content";
import { getFrontispiece, type ResolvedChapter } from "@/content/chapters";
import type { Trip } from "@/content/types";
import { OVERVIEW_OWNER_ID } from "@/lib/trip-repository";
import { OverviewMap } from "@/components/trip-opening";
import {
  BODY_CLASSES,
  HEADLINE_CLASSES,
  LEDE_CLASSES,
  MAP_CAPTION_CLASSES,
  PLATE_CLASSES,
  SUBTITLE_CLASSES,
  TripOpeningFrame,
} from "@/components/trip-opening-frame";
import { Eyebrow } from "@/components/typography";
import { InlineInput, InlineTextarea } from "./inline-field";
import { PhotoSlot } from "./photo-slot";

/**
 * The site's opening in edit mode: the same TripOpeningFrame the public page
 * composes, with inputs where its text stands, and the frontispiece as a
 * photo slot. The site name (the header and browser tab) has no place in the
 * opening itself, so it sits in the editor-only line above.
 */
export function OpeningEditor({ trip, chapters }: { trip: Trip; chapters: ResolvedChapter[] }) {
  const frontispiece = trip.overview.frontispiece;
  const fallback = frontispiece ? undefined : getFrontispiece(trip, chapters);

  return (
    <TripOpeningFrame
      toolbar={
        <label className="flex items-baseline gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
          Site name
          <InlineInput
            k="trip:trip:title"
            initial={trip.title}
            placeholder="Site name"
            className="w-64 text-sm normal-case tracking-normal"
          />
        </label>
      }
      eyebrow={
        <Eyebrow className="tnum flex items-baseline gap-2">
          <InlineInput
            k="trip:trip:place"
            initial={trip.place}
            placeholder="Place"
            className="w-48 text-xs uppercase tracking-[0.2em]"
          />
          &middot; {getTripDates(trip).length} days
        </Eyebrow>
      }
      headline={
        <InlineInput
          k="trip:trip:headline"
          initial={trip.headline}
          placeholder={trip.title}
          className={HEADLINE_CLASSES}
        />
      }
      subtitle={
        <InlineTextarea
          k="trip:trip:subtitle"
          initial={trip.subtitle}
          placeholder="Subtitle"
          className={SUBTITLE_CLASSES}
        />
      }
      plate={
        <PhotoSlot
          media={frontispiece}
          fallback={fallback}
          targetKey={`${OVERVIEW_OWNER_ID}::frontispiece`}
          targetName="Frontispiece"
          imageClassName={PLATE_CLASSES}
        />
      }
      mapEyebrow={<Eyebrow>The shape of it</Eyebrow>}
      map={
        <>
          <OverviewMap trip={trip} />
          <InlineInput
            k="overview:overview:mapAlt"
            initial={trip.overview.mapAlt}
            placeholder="Map alt text — what a screen reader announces"
            className="mt-2 text-[11px] text-muted-foreground"
          />
        </>
      }
      mapCaption={
        <InlineInput
          k="overview:overview:mapCaption"
          initial={trip.overview.mapCaption}
          placeholder="Map caption"
          className={MAP_CAPTION_CLASSES}
        />
      }
      lede={
        <InlineTextarea
          k="overview:overview:lede"
          initial={trip.overview.lede}
          placeholder="Lede — the large opening paragraph"
          className={LEDE_CLASSES}
        />
      }
      body={
        <InlineTextarea
          k="overview:overview:body"
          initial={trip.overview.body.join("\n\n")}
          placeholder="Body — leave a blank line between paragraphs"
          className={BODY_CLASSES}
        />
      }
    />
  );
}
