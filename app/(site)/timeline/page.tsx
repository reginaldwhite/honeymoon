import type { Metadata } from "next";
import { trip } from "@/content/trip";
import { Timeline } from "@/components/timeline";

export const metadata: Metadata = {
  title: "Timeline",
};

export default function TimelinePage() {
  return (
    <div className="py-12">
      <p className="text-xs uppercase tracking-widest text-primary">The itinerary</p>
      <h1 className="mt-2 font-display text-4xl italic text-foreground">Day by day</h1>
      <p className="mt-3 mb-6 max-w-2xl text-muted-foreground">
        {trip.days.length} days{trip.subtitle && `, ${trip.subtitle.toLowerCase()}`}.
      </p>

      <Timeline />
    </div>
  );
}
