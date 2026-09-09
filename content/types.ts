/**
 * Content types for the trip timeline/itinerary and the planning case-study page.
 *
 * Photos/videos are NOT a separate gallery dataset — every MediaRef lives on the
 * Activity (its cover or its rows), the chapter (its hero) or the overview (the
 * frontispiece) it belongs to, so the story's structure itself is the primary
 * photo organization. The planning case study references a MediaRef
 * by `id` to pair a rationale with the photo that decision produced.
 *
 * The whole tree lives in content/trip-data.json and is authored through the
 * local admin tool (app/admin), so everything here must be JSON-serializable.
 */

import type { MapLabel, StopName } from "./kauai-geometry";

export type MediaKind = "image" | "video";

/**
 * Nights spent in a chapter, by kind. Authored on the chapter — a chapter is
 * a place we stayed, so it is the natural home for how many nights we stayed
 * there and in what. Trip totals are sums of these.
 */
export interface Nights {
  tent: number;
  bed: number;
}

export interface MediaRef {
  /** Stable id, unique across the whole trip. Referenced by PlanningPrinciple.mediaId. */
  id: string;
  kind: MediaKind;
  /** Cloudinary public id, e.g. "honeymoon/2009-05-27/img-0208-a1b2c3d4". */
  publicId: string;
  /** Human-written alternative text. Authored in the itinerary editor. */
  alt: string;
  /** Optional visible caption, shown under the photo in the lightbox. */
  caption?: string;
  width: number;
  height: number;
  /**
   * Path relative to PHOTO_SOURCE_DIR this was staged from, set by the
   * itinerary editor. Used to match library photos to already-assigned slots,
   * and — in development only — to serve the photo straight from the local
   * library instead of Cloudinary (see lib/media-delivery.ts).
   */
  sourcePath?: string;
}

/** How many photographs sit side by side in one row of an activity's grid. */
export type PhotoRowColumns = 1 | 2 | 3;

/**
 * One thing we did: the unit the story is told in, directly under its chapter.
 * Activities carry their own date, so a chapter's dates and day count are
 * derived from them rather than stored.
 */
export interface Activity {
  id: string;
  /** ISO date, e.g. "2009-05-29". Orders the activity within its chapter. */
  date: string;
  /** 24-hour "HH:MM", or "" if untimed. Orders activities on the same date. */
  time: string;
  title: string;
  description: string;
  /** Slugs into the shared interest taxonomy (see content/interests.ts). */
  interestTags: string[];
  durationMinutes: number;
  /**
   * The establishing shot, shown full width above the description. Assigned
   * through the same picker as everything else; like every photo it lives in
   * exactly one place.
   */
  coverMedia?: MediaRef;
  /** The activity's photographs, in display order. */
  media: MediaRef[];
  /**
   * The shape of the photo grid: one entry per row, giving that row's column
   * count. `media` fills the rows in order — a 2-column row takes the next two
   * photographs at 50% each, a 3-column row the next three at 33%. Photographs
   * beyond the authored rows flow into rows of three, which is also what an
   * activity with no layout at all gets.
   */
  layout?: PhotoRowColumns[];
}

/**
 * A chapter of the trip: a stretch grouped by where we were staying, holding
 * its activities directly. Its dates are derived from theirs.
 *
 * `stops` are places marked on the chapter's map, named against the projected
 * coordinates in kauai-geometry.ts. There is deliberately no route line — the
 * honest options are real track geometry or nothing, and straight lines
 * between waypoints are neither the trail nor the road.
 */
export interface ChapterContent {
  id: string;
  title: string;
  /** Short label, used where the full title won't fit (the nights chart). */
  chip: string;
  /**
   * The chapter's hero photograph. Assigned through the same picker as an
   * activity's cover, and like every photo it lives in exactly one place. When
   * unset, the first activity in the chapter with a cover supplies it.
   */
  heroMedia?: MediaRef;
  /** Why this stretch mattered. */
  note: string;
  /** Where we slept while here. Feeds the nights chart and the planning prose. */
  nights: Nights;
  /** What we did, in the order we did it. */
  activities: Activity[];
  /** Sub-rectangle of KAUAI_VIEWBOX to crop this chapter's map to. */
  mapView: string;
  /** Alt text for this chapter's map. */
  mapAlt: string;
  /** Marked places. `slept` gets a larger mark than a place we passed through. */
  stops: { at: StopName; slept?: boolean }[];
  /**
   * Explicit marks, when the chapter needs sizes `stops` can't give. A mark is
   * either a named stop or a raw projected coordinate (a point on a trail that
   * is not a stop). Takes precedence over `stops` when present.
   */
  mapMarks?: ChapterMapMark[];
  /** Walked routes to draw, by id from content/walked-routes.ts. Chapter maps only. */
  walks?: string[];
  /** Hand-placed labels for this map's crop. */
  mapLabels?: MapLabel[];
  /** CSS width for this chapter's map. Defaults to min(300px,46vw). */
  mapWidth?: string;
}

export type ChapterMapMark = ({ at: StopName } | { x: number; y: number }) & {
  r: number;
  /** Stroke width — tuned to the rendered size, not the viewBox. */
  w?: number;
};

/** The overview that opens the site, above the chapters. */
export interface OverviewContent {
  /** The large opening paragraph. */
  lede: string;
  /** Body paragraphs beneath the lede. */
  body: string[];
  /** Caption under the island map. */
  mapCaption: string;
  /** Alt text for the island map. */
  mapAlt: string;
  /**
   * The photograph that opens the site. Assigned through the same picker as a
   * chapter hero or an activity cover, and like every photo it lives in exactly
   * one place. When unset, the first activity cover no chapter is already using
   * as its hero stands in.
   */
  frontispiece?: MediaRef;
  /** Places marked on the overview map; `r` is the mark radius (emphasis). */
  mapStops: { at: StopName; r: number }[];
}

export interface PlanningPrinciple {
  id: string;
  title: string;
  description: string;
  /** MediaRef.id from anywhere in the trip, rendered next to this principle as evidence. */
  mediaId?: string;
}

export interface Tradeoff {
  id: string;
  decision: string;
  reasoning: string;
}

export interface PlanningContent {
  /** Display heading of the planning page. */
  headline: string;
  intro: string;
  /** Sentence beside the nights chart, after the derived counts. */
  nightsNote: string;
  /** Sentence introducing the time budget. */
  timeBudgetNote: string;
  principles: PlanningPrinciple[];
  tradeoffs: Tradeoff[];
}

export interface Trip {
  /** Site name — header and browser tab. */
  title: string;
  /** Display line that opens the site; falls back to `title` when empty. */
  headline: string;
  subtitle: string;
  /** "Kauaʻi, Hawaiʻi" — the eyebrow above the headline. */
  place: string;
  overview: OverviewContent;
  /**
   * The story, in order. Start/end dates and day counts are NOT stored — they
   * are derived from the activities' dates (see lib/content.ts) so they cannot
   * drift from the content.
   */
  chapters: ChapterContent[];
  planning: PlanningContent;
}
