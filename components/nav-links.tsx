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
              "shrink-0 font-heading text-xs uppercase tracking-wide no-underline transition-colors sm:text-sm",
              isActive ? "text-accent" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}
