"use server";

import { revalidatePath } from "next/cache";
import { rejectInProduction } from "@/lib/dev-only";
import { newContentId, updatePlanning, withTrip } from "@/lib/trip-repository";
import type { PlanningPrinciple, Tradeoff } from "@/content/types";

export type StoryActionState = { error?: string; success?: string } | undefined;

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
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
    subtitle: text(formData, "subtitle"),
  }));

  revalidateStory();
  return { success: "Saved." };
}

export async function updatePlanningIntro(
  _prevState: StoryActionState,
  formData: FormData,
): Promise<StoryActionState> {
  const guard = rejectInProduction();
  if (guard) return guard;

  await withTrip((trip) => updatePlanning(trip, { intro: text(formData, "intro") }));

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
