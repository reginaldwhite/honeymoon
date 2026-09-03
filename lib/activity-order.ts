import type { Activity } from "@/content/types";
/**
 * Timed activities in clock order first, untimed ones last in author order.
 *
 * Applied both when writing trip-data.json and when rendering, so a hand-edited
 * file still shows a day in the order it actually happened.
 */
export function sortActivities(activities: Activity[]): Activity[] {
  return [...activities].sort((a, b) => {
    if (!a.time && !b.time) return 0;
    if (!a.time) return 1;
    if (!b.time) return -1;
    return a.time.localeCompare(b.time);
  });
}
