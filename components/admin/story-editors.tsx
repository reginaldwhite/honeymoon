"use client";

import { useActionState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  removePrinciple,
  removeTradeoff,
  savePrinciple,
  saveTradeoff,
  updatePlanningIntro,
  updateTripMeta,
} from "@/app/admin/story/actions";
import { Button } from "@/components/ui/button";
import { Field, FormStatus, SelectInput, TextArea, TextInput } from "@/components/ui/field";
import type { PlanningPrinciple, Tradeoff } from "@/content/types";

export interface MediaOption {
  value: string;
  label: string;
}

export function TripMetaForm({ title, subtitle }: { title: string; subtitle: string }) {
  const [state, formAction, pending] = useActionState(updateTripMeta, undefined);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-md border border-border bg-card/50 p-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Trip title" hint="Used as the site name and in the browser tab.">
          <TextInput name="title" defaultValue={title} required />
        </Field>
        <Field label="Subtitle" hint="One line under the title on the overview page.">
          <TextInput
            name="subtitle"
            defaultValue={subtitle}
            placeholder="e.g. Our honeymoon itinerary, two weeks on Kauaʻi"
          />
        </Field>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving…" : "Save trip details"}
        </Button>
        <FormStatus state={state} />
      </div>
    </form>
  );
}

export function PlanningIntroForm({ intro }: { intro: string }) {
  const [state, formAction, pending] = useActionState(updatePlanningIntro, undefined);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-md border border-border bg-card/50 p-4"
    >
      <Field
        label="Case-study intro"
        hint="The opening paragraph of “How I planned this trip”. Leave blank to hide it."
      >
        <TextArea name="intro" defaultValue={intro} rows={4} />
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving…" : "Save intro"}
        </Button>
        <FormStatus state={state} />
      </div>
    </form>
  );
}

export function PrincipleEditor({
  principle,
  mediaOptions,
}: {
  /** Omitted when this is the "add a new one" form. */
  principle?: PlanningPrinciple;
  mediaOptions: MediaOption[];
}) {
  const [state, formAction, pending] = useActionState(savePrinciple, undefined);
  const [removeState, removeAction, removing] = useActionState(removePrinciple, undefined);
  const isNew = !principle;

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-card/50 p-4">
      <form action={formAction} className="flex flex-col gap-3">
        {principle && <input type="hidden" name="principleId" value={principle.id} />}

        <Field label="Principle">
          <TextInput
            name="title"
            defaultValue={principle?.title ?? ""}
            placeholder="e.g. Book time-sensitive things first, plan around them"
            required
          />
        </Field>

        <Field label="Explanation">
          <TextArea
            name="description"
            defaultValue={principle?.description ?? ""}
            rows={3}
            placeholder="What decision this drove, and what it looked like in practice."
          />
        </Field>

        <Field label="Evidence photo" hint="Optional. Shown beside the principle.">
          <SelectInput name="mediaId" defaultValue={principle?.mediaId ?? ""}>
            <option value="">No photo</option>
            {mediaOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>
        </Field>

        <div className="flex items-center gap-3">
          <Button type="submit" variant={isNew ? "default" : "outline"} disabled={pending}>
            {isNew && <Plus aria-hidden />}
            {pending ? "Saving…" : isNew ? "Add principle" : "Save"}
          </Button>
          <FormStatus state={state} />
        </div>
      </form>

      {principle && (
        <form action={removeAction} className="flex items-center gap-3">
          <input type="hidden" name="principleId" value={principle.id} />
          <Button type="submit" size="xs" variant="destructive" disabled={removing}>
            <Trash2 aria-hidden />
            {removing ? "Removing…" : "Remove"}
          </Button>
          <FormStatus state={removeState} />
        </form>
      )}
    </div>
  );
}

export function TradeoffEditor({ tradeoff }: { tradeoff?: Tradeoff }) {
  const [state, formAction, pending] = useActionState(saveTradeoff, undefined);
  const [removeState, removeAction, removing] = useActionState(removeTradeoff, undefined);
  const isNew = !tradeoff;

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-card/50 p-4">
      <form action={formAction} className="flex flex-col gap-3">
        {tradeoff && <input type="hidden" name="tradeoffId" value={tradeoff.id} />}

        <Field label="What you skipped">
          <TextInput
            name="decision"
            defaultValue={tradeoff?.decision ?? ""}
            placeholder="e.g. Skipped a second hike on the Waimea Canyon day"
            required
          />
        </Field>

        <Field label="Why">
          <TextArea name="reasoning" defaultValue={tradeoff?.reasoning ?? ""} rows={3} />
        </Field>

        <div className="flex items-center gap-3">
          <Button type="submit" variant={isNew ? "default" : "outline"} disabled={pending}>
            {isNew && <Plus aria-hidden />}
            {pending ? "Saving…" : isNew ? "Add trade-off" : "Save"}
          </Button>
          <FormStatus state={state} />
        </div>
      </form>

      {tradeoff && (
        <form action={removeAction} className="flex items-center gap-3">
          <input type="hidden" name="tradeoffId" value={tradeoff.id} />
          <Button type="submit" size="xs" variant="destructive" disabled={removing}>
            <Trash2 aria-hidden />
            {removing ? "Removing…" : "Remove"}
          </Button>
          <FormStatus state={removeState} />
        </form>
      )}
    </div>
  );
}
