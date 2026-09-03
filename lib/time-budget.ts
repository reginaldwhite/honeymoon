import { interests } from "@/content/interests";
import type { Day, Trip } from "@/content/types";

export interface TimeBudgetCategory {
  category: string;
  hours: number;
}

const UNTAGGED_LABEL = "Other activities";
const BUFFER_LABEL = "Unstructured buffer";

/** Hours actually booked on a day, summed from its activity durations. */
export function bookedHoursForDay(day: Day): number {
  const minutes = day.activities.reduce((total, a) => total + (a.durationMinutes || 0), 0);
  return minutes / 60;
}

/**
 * The trip's time budget, derived from the itinerary rather than hand-entered.
 *
 * An activity's duration is split evenly across the interests it is tagged
 * with, so a two-hour activity tagged "hiking" and "views" contributes an hour
 * to each and the categories still add up to the real booked total. Days
 * contribute their unstructured buffer hours to a final category, which is the
 * number the case study is actually about.
 */
export function getTimeBudget(trip: Trip): TimeBudgetCategory[] {
  const labelBySlug = new Map(interests.map((interest) => [interest.slug, interest.label]));
  const hoursByCategory = new Map<string, number>();

  const add = (category: string, hours: number) => {
    if (hours <= 0) return;
    hoursByCategory.set(category, (hoursByCategory.get(category) ?? 0) + hours);
  };

  let bufferHours = 0;

  for (const day of trip.days) {
    bufferHours += day.planningNotes.bufferHours || 0;

    for (const activity of day.activities) {
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

  const categories = [...hoursByCategory.entries()]
    .map(([category, hours]) => ({ category, hours: Math.round(hours * 10) / 10 }))
    .sort((a, b) => b.hours - a.hours);

  // Buffer is always last regardless of size — it is the baseline the other
  // categories are being compared against, not just another activity type.
  if (bufferHours > 0) {
    categories.push({ category: BUFFER_LABEL, hours: Math.round(bufferHours * 10) / 10 });
  }

  return categories;
}
