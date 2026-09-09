"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { addActivity } from "@/app/admin/itinerary/actions";
import { Button } from "@/components/ui/button";
import { FormStatus } from "@/components/ui/field";

/**
 * Adds a blank activity to the chapter: at the end, or at the front, above
 * whatever is first now. The new one takes its neighbour's date so it lands
 * where the button is.
 */
export function AddActivityButton({
  chapterId,
  position = "end",
  size,
}: {
  chapterId: string;
  position?: "start" | "end";
  size?: "sm";
}) {
  const [state, formAction, pending] = useActionState(addActivity, undefined);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="chapterId" value={chapterId} />
      <input type="hidden" name="position" value={position} />
      <Button type="submit" variant="outline" size={size} disabled={pending}>
        <Plus aria-hidden />
        {pending ? "Adding…" : position === "start" ? "Add activity above" : "Add activity"}
      </Button>
      <FormStatus state={state} />
    </form>
  );
}
