/**
 * Shared interest taxonomy used to tag activities. Referenced by slug from
 * content/trip-data.json (Activity.interestTags); also drives the derived time
 * budget in lib/time-budget.ts.
 */
export interface Interest {
  slug: string;
  label: string;
}

export const interests: Interest[] = [
  { slug: "snorkeling-ocean", label: "Snorkeling & Ocean" },
  { slug: "hiking-nature", label: "Hiking & Nature" },
  { slug: "food-drink", label: "Food & Drink" },
  { slug: "culture-history", label: "Culture & History" },
  { slug: "relaxation", label: "Relaxation" },
  { slug: "sunset-views", label: "Sunset & Views" },
];
