"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Two views, not three. The itinerary is no longer its own page — the trip
 * opens with the overview and runs straight into the chapters, so a separate
 * "Timeline" link would point at the same scroll.
 */
const navLinks = [
  { href: "/", label: "The trip" },
  { href: "/planning", label: "How we planned it" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {navLinks.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              // An outlined pill, the way every other affordance in this theme
              // is drawn: the current view carries an accent hairline rather
              // than a filled tab.
              "shrink-0 rounded-md border px-3 py-2 font-heading text-sm no-underline transition-colors",
              isActive
                ? "border-accent text-accent"
                : "border-transparent text-foreground hover:text-accent",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}
