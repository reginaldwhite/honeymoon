import { trip } from "@/content/trip";
import type { ChapterContent, Day, MediaRef, Trip } from "@/content/types";
import { STOPS } from "./kauai-geometry";

/**
 * The trip's chapters, resolved against its days.
 *
 * The chapters themselves are authored in trip-data.json (title, note, date
 * range, map stops); everything here is derived from that and the days —
 * which days a chapter owns, its lead photograph, its map marks, and how many
 * nights were spent in a tent versus a bed.
 */

/** A place on the map, in KAUAI_VIEWBOX coordinates, with its mark radius. */
export interface MapMark {
  x: number;
  y: number;
  r: number;
}

export interface NightTotals {
  tent: number;
  bed: number;
  total: number;
}

export interface ChapterWithDays extends ChapterContent {
  /** "Chapter one" — derived from position, so reordering never needs re-authoring. */
  ordinal: string;
  days: Day[];
  /** The chapter's lead photograph: its first day's cover, else its first photo. */
  cover?: MediaRef;
  marks: MapMark[];
  /** Summed from the chapter's days, so a deleted day is simply a night fewer. */
  nights: NightTotals;
}

const ORDINAL_WORDS = [
  "one", "two", "three", "four", "five", "six",
  "seven", "eight", "nine", "ten", "eleven", "twelve",
];

function chapterOrdinal(position: number): string {
  return `Chapter ${ORDINAL_WORDS[position - 1] ?? position}`;
}

/** Nights across a set of days, by where each day ended. */
function nightTotals(days: Day[]): NightTotals {
  let tent = 0;
  let bed = 0;
  for (const day of days) {
    if (day.night === "tent") tent += 1;
    else if (day.night === "bed") bed += 1;
  }
  return { tent, bed, total: tent + bed };
}

/**
 * Chapters with their days attached. Any day whose date falls outside every
 * range is appended to the last chapter rather than dropped, so content can
 * never silently disappear from the site.
 */
export function getChaptersWithDays(source: Trip = trip): ChapterWithDays[] {
  const assigned = new Set<string>();

  const built = source.chapters.map((chapter, index) => {
    const days = source.days.filter((day) => {
      const inRange = day.date >= chapter.start && day.date <= chapter.end;
      if (inRange) assigned.add(day.id);
      return inRange;
    });

    return {
      ...chapter,
      ordinal: chapterOrdinal(index + 1),
      days,
      cover: findCover(days),
      marks: chapter.stops.map((stop) => ({ ...STOPS[stop.at], r: stop.slept ? 11 : 7 })),
      nights: nightTotals(days),
    };
  });

  const orphans = source.days.filter((day) => !assigned.has(day.id));
  if (orphans.length > 0 && built.length > 0) {
    const last = built[built.length - 1];
    last.days = [...last.days, ...orphans];
    last.cover ??= findCover(last.days);
    last.nights = nightTotals(last.days);
  }

  return built;
}

function findCover(days: Day[]): MediaRef | undefined {
  for (const day of days) {
    if (day.coverMedia) return day.coverMedia;
  }
  for (const day of days) {
    for (const activity of day.activities) {
      if (activity.media.length > 0) return activity.media[0];
    }
  }
  return undefined;
}

/**
 * The photograph that opens the site. Prefers a day cover that no chapter is
 * already using as its opener, so the reader never meets the same plate twice
 * a screen apart; falls back to the first chapter's cover only if every cover
 * is spoken for.
 */
export function getFrontispiece(chapters: ChapterWithDays[]): MediaRef | undefined {
  const openerIds = new Set(chapters.map((chapter) => chapter.cover?.id));
  for (const chapter of chapters) {
    for (const day of chapter.days) {
      if (day.coverMedia && !openerIds.has(day.coverMedia.id)) return day.coverMedia;
    }
  }
  return chapters[0]?.cover;
}

/** Night totals for the whole trip. The planning page prose reads from this. */
export function getNightTotals(source: Trip = trip): NightTotals {
  return nightTotals(source.days);
}
