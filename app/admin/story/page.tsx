import { readTrip } from "@/lib/trip-repository";
import { getTimeBudget } from "@/lib/time-budget";
import { TimeBudgetChart } from "@/components/time-budget-chart";
import {
  PlanningIntroForm,
  PrincipleEditor,
  TradeoffEditor,
  TripMetaForm,
  type MediaOption,
} from "@/components/admin/story-editors";
import type { Trip } from "@/content/types";

/** Every assigned photo, labelled by where it lives, for the evidence picker. */
function buildMediaOptions(trip: Trip): MediaOption[] {
  const options: MediaOption[] = [];

  trip.days.forEach((day, index) => {
    const dayLabel = `Day ${index + 1}${day.title ? ` · ${day.title}` : ""}`;
    const describe = (alt: string, sourcePath: string | undefined, context: string) =>
      `${dayLabel} · ${context} — ${alt || sourcePath || "untitled"}`;

    if (day.coverMedia) {
      options.push({
        value: day.coverMedia.id,
        label: describe(day.coverMedia.alt, day.coverMedia.sourcePath, "cover"),
      });
    }
    for (const activity of day.activities) {
      for (const media of activity.media) {
        options.push({
          value: media.id,
          label: describe(media.alt, media.sourcePath, activity.title || "activity"),
        });
      }
    }
  });

  return options;
}

export default async function AdminStoryPage() {
  const trip = await readTrip();
  const mediaOptions = buildMediaOptions(trip);
  const timeBudget = getTimeBudget(trip);

  return (
    <div className="mx-auto mt-4 max-w-3xl pb-16">
      <h1 className="font-display text-3xl italic text-foreground">Story &amp; planning</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The copy that frames the itinerary: what the trip is called, and the case study
        explaining how it was planned.
      </p>

      <section className="mt-8">
        <h2 className="text-xs uppercase tracking-widest text-primary">Trip details</h2>
        <div className="mt-3">
          <TripMetaForm title={trip.title} subtitle={trip.subtitle} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xs uppercase tracking-widest text-primary">Case-study intro</h2>
        <div className="mt-3">
          <PlanningIntroForm intro={trip.planning.intro} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xs uppercase tracking-widest text-primary">Time budget</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Calculated from your activity durations, interest tags, and each day&apos;s buffer
          hours — there is nothing to write here. Edit the numbers in the itinerary editor
          and this follows.
        </p>
        <div className="mt-3 rounded-md border border-border bg-card/50 p-4">
          {timeBudget.length > 0 ? (
            <TimeBudgetChart data={timeBudget} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Nothing to show yet — add activities with durations and interest tags.
            </p>
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xs uppercase tracking-widest text-primary">Planning principles</h2>
        <div className="mt-3 flex flex-col gap-4">
          {trip.planning.principles.map((principle) => (
            <PrincipleEditor
              key={principle.id}
              principle={principle}
              mediaOptions={mediaOptions}
            />
          ))}
          <PrincipleEditor key={`new-${trip.planning.principles.length}`} mediaOptions={mediaOptions} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xs uppercase tracking-widest text-primary">
          What you skipped, and why
        </h2>
        <div className="mt-3 flex flex-col gap-4">
          {trip.planning.tradeoffs.map((tradeoff) => (
            <TradeoffEditor key={tradeoff.id} tradeoff={tradeoff} />
          ))}
          <TradeoffEditor key={`new-${trip.planning.tradeoffs.length}`} />
        </div>
      </section>
    </div>
  );
}
