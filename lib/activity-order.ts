import type { Activity } from "@/content/types";

/**
 * Activities in the order they happened: by date, then timed ones in clock
 * order, then untimed ones in author order. An activity with no date yet
 * sorts last, where the editor will show it needs one.
 *
 * Applied both when writing trip-data.json and when rendering, so a hand-edited
 * file still shows a chapter in the order it actually happened.
 */
export function sortActivities(activities: Activity[]): Activity[] {
  return [...activities].sort((a, b) => {
    if (a.date !== b.date) {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date.localeCompare(b.date);
    }
    if (!a.time && !b.time) return 0;
    if (!a.time) return 1;
    if (!b.time) return -1;
    return a.time.localeCompare(b.time);
  });
}
