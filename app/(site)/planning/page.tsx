import type { Metadata } from "next";
import { trip } from "@/content/trip";
import { getChapters, getNightTotals } from "@/content/chapters";
import { getMediaById, getTripDates } from "@/lib/content";
import { getTimeBudget } from "@/lib/time-budget";
import { MediaThumb } from "@/components/media-thumb";
import { NightsChart } from "@/components/nights-chart";
import { Reveal } from "@/components/reveal";
import { TimeBudgetChart } from "@/components/time-budget-chart";
import { Eyebrow } from "@/components/typography";

export const metadata: Metadata = {
  title: "How We Planned This Trip",
};

export default function PlanningPage() {
  const { headline, intro, nightsNote, timeBudgetNote, principles, tradeoffs } = trip.planning;
  const chapters = getChapters();
  const nights = getNightTotals();
  // Derived from the story's own activity durations, so the case study's
  // numbers can never disagree with the timeline they describe.
  const timeBudget = getTimeBudget(trip);
  const dayCount = getTripDates().length;

  return (
    <div className="pb-24">
      <section className="py-14 lg:py-24">
        <Eyebrow>How we planned it</Eyebrow>

        <h1 className="mt-4 max-w-[20ch] text-4xl font-normal leading-[1.02] text-balance sm:text-5xl lg:text-[4.5rem]">
          {headline || "How we planned it"}
        </h1>

        <hr className="hr mt-6" />

        {intro && (
          <p className="max-w-[44ch] font-heading text-xl leading-[1.4] text-pretty sm:text-2xl lg:text-[1.75rem]">
            {intro}
          </p>
        )}
      </section>

      {principles.length > 0 && (
        <section className="border-t border-divider">
          {principles.map((principle, index) => {
            const media = principle.mediaId ? getMediaById(principle.mediaId) : undefined;

            return (
              <Reveal
                as="article"
                key={principle.id}
                index={index}
                className="grid items-start gap-5 border-b border-divider py-10 lg:grid-cols-[80px_minmax(0,1fr)_minmax(0,1fr)] lg:gap-14 lg:py-14"
              >
                <span className="tnum font-heading text-4xl font-normal leading-[0.9] text-accent-300 lg:text-[3.375rem]">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <h2 className="max-w-[24ch] text-2xl font-normal leading-[1.14] lg:text-[2.125rem]">
                  {principle.title}
                </h2>

                <div className="flex flex-col gap-4">
                  <p className="max-w-[52ch] text-justify text-base leading-[1.75] hyphens-auto">
                    {principle.description}
                  </p>
                  {media && (
                    <MediaThumb
                      media={media}
                      fallbackAlt={principle.title}
                      className="plate h-[200px] lg:h-[240px]"
                      sizes="(min-width: 1024px) 380px, 100vw"
                    />
                  )}
                </div>
              </Reveal>
            );
          })}
        </section>
      )}

      {nights.total > 0 && (
        <section className="grid gap-8 py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.55fr)] lg:gap-22">
          <div className="flex flex-col gap-3">
            <Eyebrow>Where the days went</Eyebrow>
            <p className="max-w-[32ch] text-[15px] leading-[1.7] text-pretty">
              {nights.tent} nights in a tent, {nights.bed} in a bed, across {dayCount}{" "}
              days.{nightsNote && ` ${nightsNote}`}
            </p>
          </div>

          <NightsChart chapters={chapters} />
        </section>
      )}

      {timeBudget.length > 0 && (
        <section className="border-t border-divider py-16">
          <h2 className="text-3xl font-normal lg:text-4xl">Time budget</h2>
          {timeBudgetNote && (
            <p className="mt-3 max-w-[56ch] text-base leading-[1.75]">{timeBudgetNote}</p>
          )}
          <div className="mt-6 border border-divider p-5">
            <TimeBudgetChart data={timeBudget} />
          </div>
        </section>
      )}

      {tradeoffs.length > 0 && (
        <section className="border-t border-divider py-16">
          <h2 className="text-3xl font-normal lg:text-4xl">What we skipped, and why</h2>
          <div className="mt-8 flex flex-col gap-8">
            {tradeoffs.map((tradeoff, index) => (
              <Reveal
                as="blockquote"
                key={tradeoff.id}
                index={index}
                className="border-l border-accent pl-5"
              >
                <p className="font-heading text-xl leading-[1.4]">{tradeoff.decision}</p>
                <p className="mt-2 max-w-[56ch] text-base leading-[1.75]">{tradeoff.reasoning}</p>
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
