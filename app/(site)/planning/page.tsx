import type { Metadata } from "next";
import { trip } from "@/content/trip";
import { getMediaById } from "@/lib/content";
import { getTimeBudget } from "@/lib/time-budget";
import { MediaThumb } from "@/components/media-thumb";
import { Reveal } from "@/components/reveal";
import { TimeBudgetChart } from "@/components/time-budget-chart";

export const metadata: Metadata = {
  title: "How I Planned This Trip",
};

export default function PlanningPage() {
  const { intro, principles, tradeoffs } = trip.planning;
  // Derived from the itinerary's own activity durations and buffer hours, so
  // the case study's numbers can never disagree with the timeline they describe.
  const timeBudget = getTimeBudget(trip);
  const isEmpty = !intro && principles.length === 0 && tradeoffs.length === 0 && timeBudget.length === 0;

  return (
    <div className="py-12">
      <p className="text-xs uppercase tracking-widest text-primary">The case study</p>
      <h1 className="mt-2 font-display text-4xl italic text-foreground">
        How I planned this trip
      </h1>
      {intro && (
        <Reveal>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">{intro}</p>
        </Reveal>
      )}

      {isEmpty && (
        <p className="mt-6 max-w-2xl text-sm text-muted-foreground">
          These planning notes haven&apos;t been written yet.
        </p>
      )}

      {timeBudget.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl italic text-foreground">Time budget</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Hours across the trip by category, totalled from the itinerary itself —
            the goal was a full trip with real unstructured time left in it, not a
            schedule with no room to breathe.
          </p>
          <div className="mt-6 rounded-md border border-border bg-card/50 p-5">
            <TimeBudgetChart data={timeBudget} />
          </div>
        </section>
      )}

      {principles.length > 0 && (
        <section className="mt-16 flex flex-col gap-14">
          <h2 className="font-display text-2xl italic text-foreground">Planning principles</h2>
          {principles.map((principle, index) => {
            const media = principle.mediaId ? getMediaById(principle.mediaId) : undefined;
            return (
              <Reveal key={principle.id} index={index}>
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center">
                  <div>
                    <h3 className="font-display text-xl text-foreground">{principle.title}</h3>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                      {principle.description}
                    </p>
                  </div>
                  {media && (
                    <MediaThumb
                      media={media}
                      fallbackAlt={principle.title}
                      className="aspect-[4/3]"
                      sizes="(min-width: 1024px) 280px, 100vw"
                    />
                  )}
                </div>
              </Reveal>
            );
          })}
        </section>
      )}

      {tradeoffs.length > 0 && (
        <section className="mt-16 pb-16">
          <h2 className="font-display text-2xl italic text-foreground">
            What we skipped, and why
          </h2>
          <div className="mt-6 flex flex-col gap-6">
            {tradeoffs.map((tradeoff, index) => (
              <Reveal key={tradeoff.id} index={index}>
                <blockquote className="border-l-2 border-primary/50 pl-5">
                  <p className="font-display text-lg italic text-foreground">
                    {tradeoff.decision}
                  </p>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {tradeoff.reasoning}
                  </p>
                </blockquote>
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
