import { trip } from "@/content/trip";
import { DaySection } from "./day-section";
import { DayJumpNav } from "./day-jump-nav";

export function Timeline() {
  if (trip.days.length === 0) {
    return (
      <p className="mt-10 text-sm text-muted-foreground">
        No days have been added yet.
      </p>
    );
  }

  return (
    <>
      <DayJumpNav days={trip.days} />
      <div className="divide-y divide-border">
        {trip.days.map((day, index) => (
          <DaySection key={day.id} day={day} index={index} />
        ))}
      </div>
    </>
  );
}
