"use client";

import { useActionState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  removePrinciple,
  removeTradeoff,
  saveChapter,
  savePrinciple,
  saveTradeoff,
  updateOverviewCopy,
  updatePlanningCopy,
  updateTripMeta,
} from "@/app/admin/story/actions";
import { Button } from "@/components/ui/button";
import { Field, FormStatus, SelectInput, TextArea, TextInput } from "@/components/ui/field";
import type {
  ChapterContent,
  OverviewContent,
  PlanningContent,
  PlanningPrinciple,
  Tradeoff,
  Trip,
} from "@/content/types";

export interface MediaOption {
  value: string;
  label: string;
}

export function TripMetaForm({
  trip,
}: {
  trip: Pick<Trip, "title" | "headline" | "subtitle" | "place">;
}) {
  const [state, formAction, pending] = useActionState(updateTripMeta, undefined);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-md border border-border bg-card/50 p-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Site name" hint="The header and the browser tab.">
          <TextInput name="title" defaultValue={trip.title} required />
        </Field>
        <Field label="Place" hint="The eyebrow above the headline, e.g. Kauaʻi, Hawaiʻi.">
          <TextInput name="place" defaultValue={trip.place} />
        </Field>
      </div>
      <Field label="Headline" hint="The display line that opens the site. Falls back to the site name.">
        <TextInput name="headline" defaultValue={trip.headline} />
      </Field>
      <Field label="Subtitle" hint="One line under the headline.">
        <TextArea name="subtitle" defaultValue={trip.subtitle} rows={2} />
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving…" : "Save trip details"}
        </Button>
        <FormStatus state={state} />
      </div>
    </form>
  );
}

export function OverviewForm({ overview }: { overview: OverviewContent }) {
  const [state, formAction, pending] = useActionState(updateOverviewCopy, undefined);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-md border border-border bg-card/50 p-4"
    >
      <Field label="Lede" hint="The large opening paragraph beside the map.">
        <TextArea name="lede" defaultValue={overview.lede} rows={3} />
      </Field>
      <Field label="Body" hint="Leave a blank line between paragraphs.">
        <TextArea name="body" defaultValue={overview.body.join("\n\n")} rows={8} />
      </Field>
      <Field label="Map caption">
        <TextInput name="mapCaption" defaultValue={overview.mapCaption} />
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving…" : "Save overview"}
        </Button>
        <FormStatus state={state} />
      </div>
    </form>
  );
}

export function ChapterEditor({ chapter, position }: { chapter: ChapterContent; position: number }) {
  const [state, formAction, pending] = useActionState(saveChapter, undefined);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-md border border-border bg-card/50 p-4"
    >
      <input type="hidden" name="chapterId" value={chapter.id} />
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        Chapter {position}
      </p>
      <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
        <Field label="Title">
          <TextInput name="title" defaultValue={chapter.title} required />
        </Field>
        <Field label="Chapter-bar label" hint="Short — it has to fit in a chip.">
          <TextInput name="chip" defaultValue={chapter.chip} required />
        </Field>
      </div>
      <Field label="Note" hint="Why this stretch mattered. Shown under the chapter title.">
        <TextArea name="note" defaultValue={chapter.note} rows={2} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="First day" hint="Days are filed into chapters by date.">
          <TextInput type="date" name="start" defaultValue={chapter.start} required />
        </Field>
        <Field label="Last day">
          <TextInput type="date" name="end" defaultValue={chapter.end} required />
        </Field>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Saving…" : "Save chapter"}
        </Button>
        <FormStatus state={state} />
      </div>
    </form>
  );
}

export function PlanningCopyForm({
  planning,
}: {
  planning: Pick<PlanningContent, "headline" | "intro" | "nightsNote" | "timeBudgetNote">;
}) {
  const [state, formAction, pending] = useActionState(updatePlanningCopy, undefined);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-md border border-border bg-card/50 p-4"
    >
      <Field label="Headline" hint="The display line at the top of the planning page.">
        <TextInput name="headline" defaultValue={planning.headline} />
      </Field>
      <Field label="Intro" hint="The opening paragraph. Leave blank to hide it.">
        <TextArea name="intro" defaultValue={planning.intro} rows={3} />
      </Field>
      <Field
        label="Nights note"
        hint="Follows the derived sentence “N nights in a tent, M in a bed, across D days.”"
      >
        <TextInput name="nightsNote" defaultValue={planning.nightsNote} />
      </Field>
      <Field label="Time budget note" hint="Introduces the time-budget chart.">
        <TextArea name="timeBudgetNote" defaultValue={planning.timeBudgetNote} rows={2} />
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving…" : "Save planning copy"}
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
