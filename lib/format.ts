/**
 * Every date/time formatter in the app. All trip dates are plain calendar dates
 * ("2009-05-27") with no timezone meaning, so every formatter here parses them
 * as UTC and formats in UTC — otherwise the same date renders as a different
 * day either side of midnight depending on the viewer's offset.
 */

function utcDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`);
}

const shortDayFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const monthDayYearFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/** "May 27" */
export function formatShortDate(isoDate: string): string {
  return shortDayFormatter.format(utcDate(isoDate));
}

/** "May 27, 2009" */
export function formatLongDate(isoDate: string): string {
  return monthDayYearFormatter.format(utcDate(isoDate));
}

/**
 * Formats a stored 24-hour "HH:MM" as "9:00 AM". Returns "" for an untimed
 * activity and passes through anything that isn't in HH:MM form.
 */
export function formatTimeOfDay(time: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return time.trim();

  const hours = Number(match[1]);
  const minutes = match[2];
  if (hours > 23 || Number(minutes) > 59) return time.trim();

  const period = hours < 12 ? "AM" : "PM";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHour}:${minutes} ${period}`;
}

/** "6h", "1.5h", "45m" — compact duration for the pacing summaries. */
export function formatHours(hours: number): string {
  if (hours <= 0) return "0h";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  return `${Number(hours.toFixed(1))}h`;
}
