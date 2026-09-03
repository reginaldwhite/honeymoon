"use client";

import { useActionState } from "react";
import { CalendarPlus } from "lucide-react";
import { syncDaysFromLibrary } from "@/app/admin/itinerary/actions";
import { Button } from "@/components/ui/button";
import { FormStatus } from "@/components/ui/field";

export function SyncDaysButton() {
  const [state, formAction, pending] = useActionState(syncDaysFromLibrary, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <Button type="submit" size="lg" disabled={pending}>
        <CalendarPlus aria-hidden />
        {pending ? "Scanning library…" : "Sync days from photo library"}
      </Button>
      <FormStatus state={state} />
    </form>
  );
}
