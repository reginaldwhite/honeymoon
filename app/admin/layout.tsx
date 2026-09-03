import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { isProductionRuntime } from "@/lib/dev-only";

const adminNav = [
  { href: "/admin/itinerary", label: "Itinerary editor" },
  { href: "/admin/library", label: "Media library" },
  { href: "/admin/story", label: "Story & planning" },
];

/**
 * Local content-authoring tool — browses a local copy of the photo library and
 * stages photos/videos into media-source/. Reads an arbitrary local filesystem
 * path, so it must never be reachable outside local dev. This guard blocks it
 * at request time regardless of environment; proxy.ts also bypasses the site
 * login for /admin, so this check is the outermost gate (every route handler
 * and server action asserts it independently as well).
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  if (isProductionRuntime()) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin"
          className="text-xs uppercase tracking-widest text-primary hover:opacity-80"
        >
          Local admin — dev only
        </Link>
        <nav
          aria-label="Admin"
          className="flex gap-4 text-xs uppercase tracking-wide text-muted-foreground"
        >
          {adminNav.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
