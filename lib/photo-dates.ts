/**
 * Known-bad camera clock corrections: some photos were taken with a camera
 * whose date hadn't been set correctly, so their file timestamps land on the
 * wrong calendar day. Map the raw captured date (YYYY-MM-DD) to the real date
 * the photos were actually taken.
 */
export const DATE_CORRECTIONS: Record<string, string> = {
  "2009-01-01": "2009-06-01",
};

/** Applies known camera-clock corrections to a YYYY-MM-DD date string. */
export function correctCaptureDate(dateKey: string): string {
  return DATE_CORRECTIONS[dateKey] ?? dateKey;
}

/** Extracts the corrected YYYY-MM-DD date key from an ISO timestamp (e.g. file mtime). */
export function captureDateKey(isoString: string): string {
  return correctCaptureDate(isoString.slice(0, 10));
}

/**
 * Dates whose timestamp is known bad with no single correct replacement (trip
 * ended June 10 2009; these could belong to any day). Shown as a shared pool
 * on every day's editor instead of grouped under a specific day.
 */
export const UNCERTAIN_DATES = new Set(["2009-06-13"]);

export function isUncertainDate(dateKey: string): boolean {
  return UNCERTAIN_DATES.has(dateKey);
}
