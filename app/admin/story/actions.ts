"use server";

import { revalidatePath } from "next/cache";
import { rejectInProduction } from "@/lib/dev-only";
import {
  newContentId,
  updateChapter,
  updateOverview,
  updatePlanning,
  withTrip,
} from "@/lib/trip-repository";
import type { PlanningPrinciple, Tradeoff } from "@/content/types";

export type StoryActionState = { error?: string; success?: string } | undefined;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** A textarea of prose becomes one paragraph per blank line. */
function paragraphs(formData: FormData, key: string): string[] {
  return text(formData, key)
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function revalidateStory() {
  revalidatePath("/admin/story");
  revalidatePath("/planning");
  revalidatePath("/");
}

export async function updateTripMeta(
  _prevState: StoryActionState,
  formData: FormData,
): Promise<StoryActionState> {
  const guard = rejectInProduction();
  if (guard) return guard;

  const title = text(formData, "title");
  if (!title) return { error: "The trip needs a title — it's used as the site name." };

  await withTrip((trip) => ({
    ...trip,
    title,
    headline: text(formData, "headline"),
    subtitle: text(formData, "subtitle"),
    place: text(formData, "place"),
  }));

  revalidateStory();
  return { success: "Saved." };
}

export async function updateOverviewCopy(
  _prevState: StoryActionState,
  formData: FormData,
): Promise<StoryActionState> {
  const guard = rejectInProduction();
  if (guard) return guard;

  await withTrip((trip) =>
    updateOverview(trip, {
      lede: text(formData, "lede"),
      body: paragraphs(formData, "body"),
      mapCaption: text(formData, "mapCaption"),
    }),
  );

  revalidateStory();
  return { success: "Saved." };
}

export async function updatePlanningCopy(
  _prevState: StoryActionState,
  formData: FormData,
): Promise<StoryActionState> {
  const guard = rejectInProduction();
  if (guard) return guard;

  await withTrip((trip) =>
    updatePlanning(trip, {
      headline: text(formData, "headline"),
      intro: text(formData, "intro"),
      nightsNote: text(formData, "nightsNote"),
      timeBudgetNote: text(formData, "timeBudgetNote"),
    }),
  );

  revalidateStory();
  return { success: "Saved." };
}

/**
 * A chapter's copy and date range. Chapters are not created or deleted here —
 * each carries map geometry (a viewBox crop and named stops) that needs
 * coordinates, so that part is still edited in trip-data.json directly.
 */
export async function saveChapter(
  _prevState: StoryActionState,
  formData: FormData,
): Promise<StoryActionState> {
  const guard = rejectInProduction();
  if (guard) return guard;

  const chapterId = text(formData, "chapterId");
  const title = text(formData, "title");
  const chip = text(formData, "chip");
  const start = text(formData, "start");
  const end = text(formData, "end");

  if (!chapterId) return { error: "Missing chapter id" };
  if (!title) return { error: "Give the chapter a title." };
  if (!chip) return { error: "Give the chapter a short label for the chapter bar." };
  if (!ISO_DATE.test(start) || !ISO_DATE.test(end)) {
    return { error: "Dates must be YYYY-MM-DD." };
  }
  if (start > end) return { error: "The chapter can't end before it starts." };

  await withTrip((trip) =>
    updateChapter(trip, chapterId, { title, chip, note: text(formData, "note"), start, end }),
  );

  revalidateStory();
  return { success: "Saved." };
}

export async function savePrinciple(
  _prevState: StoryActionState,
  formData: FormData,
): Promise<StoryActionState> {
  const guard = rejectInProduction();
  if (guard) return guard;

  const id = text(formData, "principleId");
  const title = text(formData, "title");
  if (!title) return { error: "Give the principle a title." };

  const mediaId = text(formData, "mediaId");
  const principle: PlanningPrinciple = {
    id: id || newContentId("principle"),
    title,
    description: text(formData, "description"),
    mediaId: mediaId || undefined,
  };

  await withTrip((trip) => {
    const exists = trip.planning.principles.some((p) => p.id === principle.id);
    return updatePlanning(trip, {
      principles: exists
        ? trip.planning.principles.map((p) => (p.id === principle.id ? principle : p))
        : [...trip.planning.principles, principle],
    });
  });

  revalidateStory();
  return { success: id ? "Saved." : "Principle added." };
}

export async function removePrinciple(
  _prevState: StoryActionState,
  formData: FormData,
): Promise<StoryActionState> {
  const guard = rejectInProduction();
  if (guard) return guard;

  const id = text(formData, "principleId");
  if (!id) return { error: "Missing principle id" };

  await withTrip((trip) =>
    updatePlanning(trip, {
      principles: trip.planning.principles.filter((p) => p.id !== id),
    }),
  );

  revalidateStory();
  return { success: "Removed." };
}

export async function saveTradeoff(
  _prevState: StoryActionState,
  formData: FormData,
): Promise<StoryActionState> {
  const guard = rejectInProduction();
  if (guard) return guard;

  const id = text(formData, "tradeoffId");
  const decision = text(formData, "decision");
  if (!decision) return { error: "Describe what was skipped." };

  const tradeoff: Tradeoff = {
    id: id || newContentId("tradeoff"),
    decision,
    reasoning: text(formData, "reasoning"),
  };

  await withTrip((trip) => {
    const exists = trip.planning.tradeoffs.some((t) => t.id === tradeoff.id);
    return updatePlanning(trip, {
      tradeoffs: exists
        ? trip.planning.tradeoffs.map((t) => (t.id === tradeoff.id ? tradeoff : t))
        : [...trip.planning.tradeoffs, tradeoff],
    });
  });

  revalidateStory();
  return { success: id ? "Saved." : "Trade-off added." };
}

export async function removeTradeoff(
  _prevState: StoryActionState,
  formData: FormData,
): Promise<StoryActionState> {
  const guard = rejectInProduction();
  if (guard) return guard;

  const id = text(formData, "tradeoffId");
  if (!id) return { error: "Missing tradeoff id" };

  await withTrip((trip) =>
    updatePlanning(trip, {
      tradeoffs: trip.planning.tradeoffs.filter((t) => t.id !== id),
    }),
  );

  revalidateStory();
  return { success: "Removed." };
}
