import Link from "next/link";
import { logout } from "@/app/login/actions";
import { trip } from "@/content/trip";
import { NavLinks } from "./nav-links";

/**
 * One nav, rendered once. The link row scrolls horizontally rather than being
 * duplicated into separate mobile and desktop lists, so the header keeps a
 * fixed height at every breakpoint (which the timeline's sticky day index
 * offsets against).
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 h-14 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-full max-w-5xl items-center gap-4 px-6">
        <Link
          href="/"
          className="shrink-0 truncate font-display text-base italic text-foreground sm:text-lg"
        >
          {trip.title}
        </Link>

        <nav
          aria-label="Main"
          className="flex flex-1 items-center gap-4 overflow-x-auto sm:justify-end sm:gap-6"
        >
          <NavLinks />
          <form action={logout} className="shrink-0">
            <button
              type="submit"
              className="text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
            >
              Log out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
