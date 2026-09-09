import { readTrip } from "@/lib/trip-repository";
import { getTimeBudget } from "@/lib/time-budget";
import { getChapters } from "@/content/chapters";
import { NightsChart } from "@/components/nights-chart";
import { TimeBudgetChart } from "@/components/time-budget-chart";
import {
  PlanningCopyForm,
  PrincipleEditor,
  TradeoffEditor,
} from "@/components/admin/story-editors";
import { buildMediaOptions } from "@/components/admin/media-options";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xs uppercase tracking-widest text-primary">{children}</h2>;
}

export default async function AdminStoryPage() {
  const trip = await readTrip();
  const mediaOptions = buildMediaOptions(trip);
  const timeBudget = getTimeBudget(trip);
  const chapters = getChapters(trip);

  return (
    <div className="mx-auto mt-4 max-w-3xl pb-16">
      <h1 className="font-display text-3xl italic text-foreground">Planning page</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The case study: how the trip was planned. The trip page itself — the opening,
        chapters and activities — is edited in the itinerary editor.
      </p>

      <section className="mt-8">
        <SectionHeading>Planning page copy</SectionHeading>
        <div className="mt-3">
          <PlanningCopyForm planning={trip.planning} />
        </div>
      </section>

      <section className="mt-10">
        <SectionHeading>Nights</SectionHeading>
        <p className="mt-1 text-xs text-muted-foreground">
          Each chapter&apos;s nights in a tent and in a bed, set in the chapter editor — nothing
          to write here.
        </p>
        <div className="mt-3 rounded-md border border-border bg-card/50 p-4">
          <NightsChart chapters={chapters} />
        </div>
      </section>

      <section className="mt-10">
        <SectionHeading>Time budget</SectionHeading>
        <p className="mt-1 text-xs text-muted-foreground">
          Calculated from your activity durations and interest tags — there is nothing to
          write here. Edit the numbers in the itinerary editor and this follows.
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
        <SectionHeading>Planning principles</SectionHeading>
        <div className="mt-3 flex flex-col gap-4">
          {trip.planning.principles.map((principle) => (
            <PrincipleEditor key={principle.id} principle={principle} mediaOptions={mediaOptions} />
          ))}
          <PrincipleEditor key={`new-${trip.planning.principles.length}`} mediaOptions={mediaOptions} />
        </div>
      </section>

      <section className="mt-10">
        <SectionHeading>What you skipped, and why</SectionHeading>
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
