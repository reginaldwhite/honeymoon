import Link from "next/link";
import { trip } from "@/content/trip";
import { getTripDateRange } from "@/lib/content";
import { formatLongDate } from "@/lib/format";
import { MediaThumb } from "@/components/media-thumb";
import { Reveal } from "@/components/reveal";

export default function HomePage() {
  const firstDay = trip.days[0];
  const totalDays = trip.days.length;
  const range = getTripDateRange();
  const hasPlanningNotes =
    trip.planning.intro || trip.planning.principles.length > 0 || trip.planning.tradeoffs.length > 0;

  return (
    <>
      <section className="grid gap-10 py-16 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center">
        <Reveal>
          {range && (
            <p className="text-sm uppercase tracking-[0.3em] text-primary">
              {formatLongDate(range.start)} — {formatLongDate(range.end)}
            </p>
          )}
          <h1 className="mt-4 font-display text-5xl italic leading-[1.05] text-foreground sm:text-6xl">
            {trip.title}
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
            {trip.subtitle && `${trip.subtitle} — `}
            {totalDays} days, planned around what we actually wanted to do and how
            much of it we could enjoy without burning out.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/timeline"
              className="rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              View the itinerary
            </Link>
            <Link
              href="/planning"
              className="rounded-md border border-border px-5 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary"
            >
              How I planned this trip
            </Link>
          </div>
        </Reveal>

        {firstDay?.coverMedia && (
          <Reveal index={1}>
            <MediaThumb
              media={firstDay.coverMedia}
              fallbackAlt={`${firstDay.title || "The first day"}, the opening day of the trip`}
              className="aspect-[4/5]"
              sizes="(min-width: 1024px) 380px, 100vw"
              priority
            />
          </Reveal>
        )}
      </section>

      <section className="grid gap-6 border-t border-border py-16 sm:grid-cols-2">
        <Reveal>
          <p className="text-xs uppercase tracking-widest text-primary">Day by day</p>
          <h2 className="mt-2 font-display text-2xl italic text-foreground">The timeline</h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            Every activity, photo, and video in the order it actually happened —
            scroll through the full {totalDays}-day itinerary.
          </p>
          <Link
            href="/timeline"
            className="mt-4 inline-block text-sm font-medium text-primary underline underline-offset-4"
          >
            Open the timeline →
          </Link>
        </Reveal>

        <Reveal index={1}>
          <p className="text-xs uppercase tracking-widest text-primary">The case study</p>
          <h2 className="mt-2 font-display text-2xl italic text-foreground">
            How I planned this trip
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            {hasPlanningNotes
              ? "The pacing decisions, trade-offs, and time-budgeting behind the itinerary — the same skills I'd bring to planning someone else's trip."
              : "The time budget behind the itinerary — how the days were paced, and how much unstructured time was protected."}
          </p>
          <Link
            href="/planning"
            className="mt-4 inline-block text-sm font-medium text-primary underline underline-offset-4"
          >
            Read the planning notes →
          </Link>
        </Reveal>
      </section>
    </>
  );
}
