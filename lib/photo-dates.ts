/**
 * Which calendar day a library file belongs to, from its timestamp.
 *
 * Two kinds of timestamp are known to be wrong and are treated as UNKNOWN
 * rather than corrected: a camera whose clock was never set stamps everything
 * 1 January, and one batch is stamped 13 June, after the trip ended. Neither
 * has a single right answer, so those files are offered as a pool at the end
 * of the picker instead of being filed under a guessed day.
 */

/** The YYYY-MM-DD date key from an ISO timestamp (e.g. a file's mtime). */
export function captureDateKey(isoString: string): string {
  return isoString.slice(0, 10);
}

const UNCERTAIN_DATES = new Set(["2009-06-13"]);

/** A date the timestamp cannot be trusted for: a reset camera clock (1/1) or a known-bad batch. */
export function isUncertainDate(dateKey: string): boolean {
  return dateKey.endsWith("-01-01") || UNCERTAIN_DATES.has(dateKey);
}

/** Order for the unknown-date pools: the 1/1 files always come last. */
export function uncertainOrder(dateKey: string): number {
  return dateKey.endsWith("-01-01") ? 1 : 0;
}
