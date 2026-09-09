import { trip } from "@/content/trip";
import type { Activity, ChapterContent, ChapterMapMark, MediaRef, Nights, Trip } from "@/content/types";
import { sortActivities } from "@/lib/activity-order";
import { STOPS, type MapMark } from "./kauai-geometry";
import { WALKED_ROUTES, type WalkedRoute } from "./walked-routes";

/**
 * The trip's chapters, resolved for display.
 *
 * The chapters and their activities are authored in trip-data.json; everything
 * here is derived from that — the chapter's ordinal, its dates and day count
 * (from its activities' dates), its lead photograph, and its map marks.
 */

export interface NightTotals extends Nights {
  total: number;
}

export interface ResolvedChapter extends ChapterContent {
  /** "Chapter one" — derived from position, so reordering never needs re-authoring. */
  ordinal: string;
  /** The chapter's activities in the order they happened. */
  activities: Activity[];
  /** First and last activity dates; undefined until the chapter has a dated activity. */
  start?: string;
  end?: string;
  /** Distinct dates the chapter's activities fall on. */
  dayCount: number;
  /**
   * The chapter's hero: its own `heroMedia` if assigned, else the first
   * activity cover in the chapter. Never a row photograph — a chapter with no
   * chosen hero opens on paper rather than on whichever photo comes first.
   */
  cover?: MediaRef;
  marks: MapMark[];
  /** The routes named in `walks`, resolved to their geometry. */
  routes: WalkedRoute[];
}

const ORDINAL_WORDS = [
  "one", "two", "three", "four", "five", "six",
  "seven", "eight", "nine", "ten", "eleven", "twelve",
];

function chapterOrdinal(position: number): string {
  return `Chapter ${ORDINAL_WORDS[position - 1] ?? position}`;
}

/** The distinct dates a set of activities falls on, in order. */
export function distinctDates(activities: Activity[]): string[] {
  return [...new Set(activities.map((activity) => activity.date).filter(Boolean))].sort();
}

export function getChapters(source: Trip = trip): ResolvedChapter[] {
  return source.chapters.map((chapter, index) => {
    const activities = sortActivities(chapter.activities);
    const dates = distinctDates(activities);
    return {
      ...chapter,
      ordinal: chapterOrdinal(index + 1),
      activities,
      start: dates[0],
      end: dates[dates.length - 1],
      dayCount: dates.length,
      cover: chapter.heroMedia ?? firstActivityCover(activities),
      marks: resolveMarks(chapter),
      routes: (chapter.walks ?? []).flatMap((id) => WALKED_ROUTES[id] ?? []),
    };
  });
}

/** Explicit `mapMarks` win; otherwise every stop is marked, larger where we slept. */
function resolveMarks(chapter: ChapterContent): MapMark[] {
  if (chapter.mapMarks) return chapter.mapMarks.map(resolveMark);
  return chapter.stops.map((stop) => ({ ...STOPS[stop.at], r: stop.slept ? 11 : 7 }));
}

function resolveMark(mark: ChapterMapMark): MapMark {
  const point = "at" in mark ? STOPS[mark.at] : { x: mark.x, y: mark.y };
  return { ...point, r: mark.r, w: mark.w };
}

function firstActivityCover(activities: Activity[]): MediaRef | undefined {
  return activities.find((activity) => activity.coverMedia)?.coverMedia;
}

/**
 * The photograph that opens the site: the overview's own `frontispiece` slot
 * if assigned. Otherwise an activity cover that no chapter is already using
 * as its opener, so the reader never meets the same plate twice a screen
 * apart — falling back to the first chapter's cover only if every cover is
 * spoken for.
 */
export function getFrontispiece(
  source: Trip,
  chapters: ResolvedChapter[],
): MediaRef | undefined {
  if (source.overview.frontispiece) return source.overview.frontispiece;
  const openerIds = new Set(chapters.map((chapter) => chapter.cover?.id));
  for (const chapter of chapters) {
    for (const activity of chapter.activities) {
      if (activity.coverMedia && !openerIds.has(activity.coverMedia.id)) {
        return activity.coverMedia;
      }
    }
  }
  return chapters[0]?.cover;
}

/** Night totals for the whole trip, summed from the chapters. The planning page prose reads from this. */
export function getNightTotals(source: Trip = trip): NightTotals {
  let tent = 0;
  let bed = 0;
  for (const chapter of source.chapters) {
    tent += chapter.nights.tent;
    bed += chapter.nights.bed;
  }
  return { tent, bed, total: tent + bed };
}
