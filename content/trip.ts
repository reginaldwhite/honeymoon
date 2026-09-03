import type { Trip } from "./types";
import tripData from "./trip-data.json";

/**
 * All trip content — days, activities, media and the planning case study —
 * lives in trip-data.json rather than hand-written TypeScript, so the local
 * admin tool (app/admin) can read and write it as plain JSON without risking
 * hand-formatted source. This file just re-exports it with the proper type.
 *
 * It is imported statically, so the public site is built from a snapshot of
 * this file: edit in the admin tool locally, then rebuild and redeploy.
 */
export const trip: Trip = tripData as Trip;
