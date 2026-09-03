import Link from "next/link";
import { readTrip } from "@/lib/trip-repository";
import { getAllMedia } from "@/lib/content";
import { findMediaSourceFile } from "@/lib/media-source";

export default async function AdminHomePage() {
  const trip = await readTrip();
  const days = trip.days;
  const daysWithTitle = days.filter((d) => d.title).length;
  const daysWithActivities = days.filter((d) => d.activities.length > 0).length;

  const media = getAllMedia(trip);
  const staged = media.filter((m) => findMediaSourceFile(m.publicId, m.kind)).length;
  const missingAlt = media.filter((m) => !m.alt.trim()).length;

  const { intro, principles, tradeoffs } = trip.planning;
  const planningPieces = (intro ? 1 : 0) + principles.length + tradeoffs.length;

  const cards = [
    {
      href: "/admin/itinerary",
      title: "Itinerary editor",
      description:
        "Edit day copy, activities, alt text, and choose which photos represent each day.",
      stat: `${days.length} days · ${daysWithTitle} titled · ${daysWithActivities} with activities`,
    },
    {
      href: "/admin/library",
      title: "Media library",
      description: "Browse every photo/video in your local library, rotate, and assign it.",
      stat: `${media.length} assigned · ${staged} staged for upload`,
      warning: missingAlt > 0 ? `${missingAlt} still need alt text` : undefined,
    },
    {
      href: "/admin/story",
      title: "Story & planning",
      description:
        "The trip's name, the case-study intro, planning principles, and the trade-offs behind them.",
      stat:
        planningPieces > 0
          ? `${principles.length} principles · ${tradeoffs.length} trade-offs`
          : "Not written yet",
    },
  ];

  return (
    <div className="mt-4">
      <h1 className="font-display text-3xl italic text-foreground">Admin</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Local content-authoring tools for the honeymoon site — dev only, never deployed.
        Changes are written to <code className="font-mono text-xs">content/trip-data.json</code>,
        so rebuild and redeploy to publish them.
      </p>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-md border border-border p-5 transition-colors hover:border-primary"
          >
            <h2 className="font-display text-xl italic text-foreground">{card.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{card.description}</p>
            <p className="mt-4 text-xs uppercase tracking-wide text-primary">{card.stat}</p>
            {card.warning && (
              <p className="mt-1 text-xs uppercase tracking-wide text-destructive">
                {card.warning}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
