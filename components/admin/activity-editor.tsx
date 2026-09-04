"use client";

import { useActionState } from "react";
import { removeActivity, updateActivity } from "@/app/admin/itinerary/actions";
import { Button } from "@/components/ui/button";
import { Field, FormStatus, TextArea, TextInput } from "@/components/ui/field";
import { interests } from "@/content/interests";
import type { Activity } from "@/content/types";
import { ActivityMediaList } from "./activity-media-list";

export function ActivityEditor({ dayId, activity }: { dayId: string; activity: Activity }) {
  const [updateState, updateFormAction, updatePending] = useActionState(updateActivity, undefined);
  const [removeState, removeFormAction, removePending] = useActionState(removeActivity, undefined);
  const selectedTags = new Set(activity.interestTags);

  return (
    <div className="flex flex-col gap-4 rounded-md border border-border bg-card/50 p-4">
      <form action={updateFormAction} className="flex flex-col gap-3">
        <input type="hidden" name="dayId" value={dayId} />
        <input type="hidden" name="activityId" value={activity.id} />

        <div className="grid gap-3 sm:grid-cols-[130px_1fr_130px]">
          <Field label="Time" hint="Orders the day">
            {/* Stored as 24-hour HH:MM so activities sort correctly; the public
                site formats it for display. */}
            <TextInput type="time" name="time" defaultValue={activity.time} />
          </Field>
          <Field label="Title">
            <TextInput name="title" defaultValue={activity.title} placeholder="What you did" />
          </Field>
          <Field label="Duration (min)">
            <TextInput
              type="number"
              min="0"
              step="15"
              name="durationMinutes"
              defaultValue={activity.durationMinutes}
            />
          </Field>
        </div>

        <Field label="Description">
          <TextArea name="description" defaultValue={activity.description} rows={2} />
        </Field>

        <fieldset className="flex flex-col gap-1.5">
          <legend className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Interests
          </legend>
          <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
            {interests.map((interest) => (
              <label
                key={interest.slug}
                className="flex cursor-pointer items-center gap-1.5 text-xs text-foreground"
              >
                <input
                  type="checkbox"
                  name="interestTags"
                  value={interest.slug}
                  defaultChecked={selectedTags.has(interest.slug)}
                  className="size-3.5 accent-[var(--primary)]"
                />
                {interest.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex items-center gap-3">
          <Button type="submit" variant="outline" disabled={updatePending}>
            {updatePending ? "Saving…" : "Save activity"}
          </Button>
          <FormStatus state={updateState} />
        </div>
      </form>

      <ActivityMediaList
        media={activity.media}
        targetKey={`${dayId}::${activity.id}`}
        targetName={activity.title || "Untitled activity"}
        className="border-t border-border pt-3"
      />

      <form action={removeFormAction} className="flex items-center gap-3 border-t border-border pt-3">
        <input type="hidden" name="dayId" value={dayId} />
        <input type="hidden" name="activityId" value={activity.id} />
        <Button type="submit" size="sm" variant="destructive" disabled={removePending}>
          {removePending ? "Deleting…" : "Delete activity"}
        </Button>
        <FormStatus state={removeState} />
      </form>
    </div>
  );
}
