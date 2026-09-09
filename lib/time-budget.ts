import { interests } from "@/content/interests";
import type { Trip } from "@/content/types";

export interface TimeBudgetCategory {
  category: string;
  hours: number;
}

const UNTAGGED_LABEL = "Other activities";

/**
 * The trip's time budget, derived from the story rather than hand-entered.
 *
 * An activity's duration is split evenly across the interests it is tagged
 * with, so a two-hour activity tagged "hiking" and "views" contributes an hour
 * to each and the categories still add up to the real booked total.
 */
export function getTimeBudget(trip: Trip): TimeBudgetCategory[] {
  const labelBySlug = new Map(interests.map((interest) => [interest.slug, interest.label]));
  const hoursByCategory = new Map<string, number>();

  const add = (category: string, hours: number) => {
    if (hours <= 0) return;
    hoursByCategory.set(category, (hoursByCategory.get(category) ?? 0) + hours);
  };

  for (const chapter of trip.chapters) {
    for (const activity of chapter.activities) {
      const hours = (activity.durationMinutes || 0) / 60;
      if (hours <= 0) continue;

      const tags = activity.interestTags.filter((slug) => labelBySlug.has(slug));
      if (tags.length === 0) {
        add(UNTAGGED_LABEL, hours);
        continue;
      }
      for (const slug of tags) {
        add(labelBySlug.get(slug)!, hours / tags.length);
      }
    }
  }

  return [...hoursByCategory.entries()]
    .map(([category, hours]) => ({ category, hours: Math.round(hours * 10) / 10 }))
    .sort((a, b) => b.hours - a.hours);
}
