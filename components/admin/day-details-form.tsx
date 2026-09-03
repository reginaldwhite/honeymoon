"use client";

import { useActionState } from "react";
import { updateDayDetails } from "@/app/admin/itinerary/actions";
import { Button } from "@/components/ui/button";
import { Field, FormStatus, TextArea, TextInput } from "@/components/ui/field";
import { formatHours } from "@/lib/format";
import type { Day } from "@/content/types";

export function DayDetailsForm({ day, bookedHours }: { day: Day; bookedHours: number }) {
  const [state, formAction, pending] = useActionState(updateDayDetails, undefined);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-md border border-border bg-card/50 p-4"
    >
      <input type="hidden" name="dayId" value={day.id} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title">
          <TextInput name="title" defaultValue={day.title} placeholder="What this day was" />
        </Field>
        <Field label="Location">
          <TextInput name="location" defaultValue={day.location} placeholder="Where you were" />
        </Field>
      </div>

      <Field label="Summary">
        <TextArea
          name="summary"
          defaultValue={day.summary}
          rows={2}
          placeholder="A sentence or two about the day, shown under the title on the timeline."
        />
      </Field>

      <Field
        label="Planning rationale"
        hint="Why the day was paced this way — shown in the “How this day was paced” panel."
      >
        <TextArea name="rationale" defaultValue={day.planningNotes.rationale} rows={2} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Unstructured buffer hours"
          hint="Time deliberately left open. Feeds the trip's time budget."
        >
          <TextInput
            type="number"
            step="0.5"
            min="0"
            name="bufferHours"
            defaultValue={day.planningNotes.bufferHours}
          />
        </Field>
        <Field label="Booked hours" hint="Totalled from this day's activity durations.">
          <p className="rounded-md border border-dashed border-border bg-background/50 px-3 py-2 font-mono text-sm text-muted-foreground">
            {formatHours(bookedHours)}
          </p>
        </Field>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving…" : "Save details"}
        </Button>
        <FormStatus state={state} />
      </div>
    </form>
  );
}
