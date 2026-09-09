import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { isProductionRuntime } from "@/lib/dev-only";

const adminNav = [
  { href: "/admin/itinerary", label: "Itinerary editor" },
  { href: "/admin/library", label: "Media library" },
  { href: "/admin/story", label: "Planning page" },
];

/**
 * Local content-authoring tool — browses a local copy of the photo library and
 * stages photos/videos into media-source/. Reads an arbitrary local filesystem
 * path, so it must never be reachable outside local dev. This guard blocks it
 * at request time regardless of environment; proxy.ts also bypasses the site
 * login for /admin, so this check is the outermost gate (every route handler
 * and server action asserts it independently as well).
 *
 * The header is sticky at `--header-h`, the same height as the public site's,
 * so the itinerary editor's `scroll-mt-(--sticky-stack)` anchors land the
 * same way they do on the public page.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  if (isProductionRuntime()) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 h-(--header-h) border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-3 px-6">
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
      </header>
      <div className="px-6 py-10">{children}</div>
    </div>
  );
}
