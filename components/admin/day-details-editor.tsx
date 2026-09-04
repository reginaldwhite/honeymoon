import type { Day } from "@/content/types";
import { bookedHoursForDay } from "@/lib/time-budget";
import { ActivityMediaList } from "./activity-media-list";
import { DayDetailsForm } from "./day-details-form";

/** A day's own fields and its cover photograph, edited side by side. */
export function DayDetailsEditor({ day }: { day: Day }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div>
        <h4 className="text-xs uppercase tracking-widest text-primary">Day details</h4>
        <div className="mt-3">
          <DayDetailsForm day={day} bookedHours={bookedHoursForDay(day)} />
        </div>
      </div>
      <div>
        <h4 className="text-xs uppercase tracking-widest text-primary">Cover photo</h4>
        <div className="mt-3 rounded-md border border-border bg-card/50 p-4">
          <ActivityMediaList
            media={day.coverMedia ? [day.coverMedia] : []}
            targetKey={`${day.id}::cover`}
            targetName="Cover photo"
            reorderable={false}
            variant="half"
          />
        </div>
      </div>
    </div>
  );
}
