"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { removeActivity } from "@/app/admin/itinerary/actions";
import { interests } from "@/content/interests";
import type { Activity } from "@/content/types";
import { InlineInput, InlineToggles } from "./inline-field";

const INTEREST_OPTIONS = interests.map((interest) => ({ value: interest.slug, label: interest.label }));

/**
 * The parts of an activity the public page does not print but the trip's
 * numbers depend on: its time of day, which orders it among the same day's
 * activities, and its interests, which feed the time budget. Editor-only, set
 * in the muted voice of a metadata line so it reads as an annotation on the
 * layout, not part of it.
 */
export function ActivityMeta({ activity }: { activity: Activity }) {
  const [removeState, removeAction, removing] = useActionState(removeActivity, undefined);

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
      <label className="flex items-center gap-1.5">
        <span className="uppercase tracking-wide">Time</span>
        <InlineInput
          k={`activity:${activity.id}:time`}
          initial={activity.time}
          type="time"
          className="w-auto text-[11px]"
          placeholder="Time of day"
        />
      </label>
      <InlineToggles
        k={`activity:${activity.id}:interestTags`}
        initial={activity.interestTags}
        options={INTEREST_OPTIONS}
        label="Interests"
      />
      <form action={removeAction} className="ml-auto">
        <input type="hidden" name="activityId" value={activity.id} />
        <button
          type="submit"
          disabled={removing}
          className="flex cursor-pointer items-center gap-1 text-[11px] uppercase tracking-wide text-destructive/80 transition-colors hover:text-destructive disabled:cursor-default"
        >
          <Trash2 className="size-3" aria-hidden />
          {removing ? "Removing…" : "Delete activity"}
        </button>
        {removeState?.error && <p className="text-destructive">{removeState.error}</p>}
      </form>
    </div>
  );
}
