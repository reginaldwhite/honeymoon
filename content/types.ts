/**
 * Content types for the trip timeline/itinerary and the planning case-study page.
 *
 * Photos/videos are NOT a separate gallery dataset — every MediaRef lives on the
 * Activity (or Day.coverMedia) it belongs to, so the schedule structure itself is
 * the primary photo organization. The planning case study references a MediaRef
 * by `id` to pair a rationale with the photo that decision produced.
 *
 * The whole tree lives in content/trip-data.json and is authored through the
 * local admin tool (app/admin), so everything here must be JSON-serializable.
 */

import type { StopName } from "./kauai-geometry";

export type MediaKind = "image" | "video";

/**
 * Where we slept at the END of a day. Night counts everywhere are sums of
 * this over days, so adding or deleting a day changes them by construction —
 * nothing stores a night total. The flight home is "none".
 */
export type NightKind = "tent" | "bed" | "none";

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

export interface Activity {
  id: string;
  /** 24-hour "HH:MM", or "" if untimed. Stored sortable, formatted for display. */
  time: string;
  title: string;
  description: string;
  /** Slugs into the shared interest taxonomy (see content/interests.ts). */
  interestTags: string[];
  durationMinutes: number;
  media: MediaRef[];
}

export interface DayPlanningNotes {
  /** Why this day was paced the way it was (buffer time, interest match, etc). */
  rationale: string;
  /**
   * Hours deliberately left unstructured. Booked hours are NOT stored — they are
   * derived from the day's activity durations so the two can never disagree.
   */
  bufferHours: number;
}

export interface Day {
  /** `day-YYYY-MM-DD`. Derived from the date so it is stable as days are added. */
  id: string;
  /** ISO date, e.g. "2009-05-27". */
  date: string;
  title: string;
  location: string;
  summary: string;
  coverMedia?: MediaRef;
  planningNotes: DayPlanningNotes;
  activities: Activity[];
  night: NightKind;
}

/**
 * A chapter of the trip: a stretch of days grouped by where we were staying.
 * Days are claimed by inclusive ISO date range, so a day added or removed in
 * the admin editor never needs re-filing as long as it falls inside a range.
 *
 * `stops` are places marked on the chapter's map, named against the projected
 * coordinates in kauai-geometry.ts. There is deliberately no route line — the
 * honest options are real track geometry or nothing, and straight lines
 * between waypoints are neither the trail nor the road.
 */
export interface ChapterContent {
  id: string;
  title: string;
  /** Short label for the sticky chapter nav. */
  chip: string;
  /** Why this stretch mattered. */
  note: string;
  /** Inclusive ISO date bounds. */
  start: string;
  end: string;
  /** Sub-rectangle of KAUAI_VIEWBOX to crop this chapter's map to. */
  mapView: string;
  /** Marked places. `slept` gets a larger mark than a place we passed through. */
  stops: { at: StopName; slept?: boolean }[];
}

/** The overview that opens the site, above the chapters. */
export interface OverviewContent {
  /** The large opening paragraph. */
  lede: string;
  /** Body paragraphs beneath the lede. */
  body: string[];
  /** Caption under the island map. */
  mapCaption: string;
  /** Places marked on the overview map; `r` is the mark radius (emphasis). */
  mapStops: { at: StopName; r: number }[];
}

export interface PlanningPrinciple {
  id: string;
  title: string;
  description: string;
  /** MediaRef.id from any day, rendered next to this principle as evidence. */
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
  chapters: ChapterContent[];
  /**
   * Start/end dates are NOT stored — they are derived from the days themselves
   * (see lib/content.ts `getTripDateRange`) so they cannot drift from the data.
   */
  days: Day[];
  planning: PlanningContent;
}
