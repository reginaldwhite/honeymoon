"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { addActivity } from "@/app/admin/itinerary/actions";
import { Button } from "@/components/ui/button";
import { FormStatus } from "@/components/ui/field";

export function AddActivityButton({ dayId }: { dayId: string }) {
  const [state, formAction, pending] = useActionState(addActivity, undefined);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="dayId" value={dayId} />
      <Button type="submit" variant="outline" disabled={pending}>
        <Plus aria-hidden />
        {pending ? "Adding…" : "Add activity"}
      </Button>
      <FormStatus state={state} />
    </form>
  );
}
