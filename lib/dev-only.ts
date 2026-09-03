/**
 * The admin tool reads and writes arbitrary local files (PHOTO_SOURCE_DIR,
 * content/trip-data.json, media-source/) and is deliberately not behind the
 * site's password gate, so every entry point into it — layout, page, route
 * handler, and server action — asserts that we are not running in production.
 */

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

export type DevOnlyRejection = { error: string };

/**
 * Returns a rejection state for server actions when running in production, or
 * null when the caller may proceed. Route handlers use `isProductionRuntime()`
 * directly since they return a Response instead.
 */
export function rejectInProduction(): DevOnlyRejection | null {
  return isProductionRuntime() ? { error: "Not available outside local development." } : null;
}
