import Link from "next/link";
import { logout } from "@/app/login/actions";
import { trip } from "@/content/trip";
import { getTripDateRange } from "@/lib/content";
import { formatShortDate } from "@/lib/format";
import { NavLinks } from "./nav-links";
import { SmallCaps } from "./typography";

/**
 * One nav, rendered once. The link row scrolls horizontally rather than being
 * duplicated into separate mobile and desktop lists, so the header keeps a
 * fixed height at every breakpoint. That height is `--header-h` in
 * globals.css, which the sticky chapter bar offsets against.
 */
export function SiteHeader() {
  const range = getTripDateRange();
  // The range is derived from the activities, so the year is too.
  const year = range ? range.end.slice(0, 4) : null;

  return (
    <header className="sticky top-0 z-40 h-(--header-h) border-b border-divider bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-full max-w-6xl items-center gap-4 px-6">
        <Link href="/" className="shrink-0 truncate leading-tight no-underline">
          <span className="block font-heading text-base font-semibold text-foreground sm:text-lg">
            {trip.title}
          </span>
          {range && (
            <SmallCaps className="block text-[11px] tracking-[0.18em]">
              {formatShortDate(range.start)} &ndash; {formatShortDate(range.end)}, {year}
            </SmallCaps>
          )}
        </Link>

        <nav
          aria-label="Main"
          className="flex flex-1 items-center gap-4 overflow-x-auto sm:justify-end sm:gap-6"
        >
          <NavLinks />
          <form action={logout} className="shrink-0">
            <button
              type="submit"
              className="font-heading text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-accent"
            >
              Log out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
