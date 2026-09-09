/**
 * Walked routes, in the same projected 1000x720 space as the coastline.
 *
 * These are smooth tracings through real coordinates, not surveyed tracks —
 * enough to show where a walk went and how the walks relate to each other.
 * They are only drawn on CHAPTER maps: on the island overview each one is a
 * few pixels long and reads as a scratch.
 */
export interface WalkedRoute {
  id: string;
  label: string;
  d: string;
}

/** The Kalalau Trail: Keʻe to Kalalau Beach, via Hanakāpīʻai. */
export const KALALAU_TRAIL: WalkedRoute = {
  id: "kalalauTrail",
  label: "The Kalalau Trail",
  d: "M427.1,38.9C425.5,39.8 420.5,41.5 417.6,44.5C414.7,47.5 412.3,52.7 409.8,56.8C407.3,60.9 406.5,65.6 402.7,69C399,72.4 391.6,74.9 387.3,77.4C383,79.9 381.5,79.7 376.9,83.9C372.3,88.1 365.5,97.3 359.6,102.6C353.7,107.9 347.1,111.8 341.5,115.7C335.9,119.6 329.8,124 325.9,125.9C322,127.8 319.5,126.7 318.2,126.9",
};

/**
 * The three days of walking off the Kōkeʻe campsite, as they were actually
 * done — one line per day rather than a spoke per destination:
 *
 *   Day one   the Alakaʻi, out and back on the same line
 *   Day two   a west-rim loop: Kalalau Lookout, Awaʻawapuhi, the Nuʻalolo
 *             Cliff trail, then back to camp
 *   Day three down into Waimea Canyon
 */
export const KOKEE_WALKS: WalkedRoute[] = [
  { id: "day1Alakai", label: "Day one: the Alakaʻi, out and back", d: "M366.3,206.5C369.4,204.3 379.3,198.4 384.7,193.1C390.1,187.8 394.7,179.6 398.5,174.5C402.3,169.5 406,164.8 407.5,162.8" },
  {
    id: "day2WestRim",
    label:
      "Day two: Kalalau Lookout, Awaʻawapuhi, the Nuʻalolo Cliff trail, back to camp",
    d: "M366.3,206.5C362.2,203.7 349.6,194.9 341.5,189.4C333.5,183.9 327.2,177.5 318,173.4C308.8,169.4 296.1,165.9 286.2,165.1C276.3,164.3 264.5,166.3 258.7,168.5C252.9,170.7 253.4,175.1 251.6,178.2C249.8,181.3 242.8,183.1 248,186.8C253.2,190.5 269.4,196.4 282.7,200.6C296,204.8 313.8,210.8 327.7,211.8C341.6,212.8 359.9,207.4 366.3,206.5",
  },
  { id: "day3Canyon", label: "Day three: down into Waimea Canyon", d: "M366.3,206.5C362.2,208.6 351.4,214.7 341.5,219.3C331.6,223.9 317.4,229.2 306.9,234.2C296.4,239.2 283.2,247 278.5,249.5" },
];

/**
 * Every route by id. Chapters in trip-data.json list the routes they draw by
 * these ids, since a JSON file cannot hold a reference to a constant.
 */
export const WALKED_ROUTES: Record<string, WalkedRoute> = Object.fromEntries(
  [KALALAU_TRAIL, ...KOKEE_WALKS].map((route) => [route.id, route]),
);
