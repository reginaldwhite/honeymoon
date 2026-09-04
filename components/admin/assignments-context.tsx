"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Assignment } from "@/lib/trip-repository";

interface AssignmentsContextValue {
  /** Every assignment across the whole trip, keyed by library path. */
  assignments: Record<string, Assignment>;
  /** `${dayId}::${target}` -> readable name, for showing where a photo already lives. */
  targetLabels: Record<string, string>;
  /** dayId -> ISO date, so a picker can fetch the right day's photos from its target key. */
  dayDates: Record<string, string>;
}

const AssignmentsContext = createContext<AssignmentsContextValue | null>(null);

/**
 * The trip's photo assignments, held once for the whole itinerary editor.
 * Every "Add image" picker on the page reads from this, so sixteen days'
 * worth of pickers don't each carry their own copy — and the photo *library*
 * is not here at all: each picker fetches its day's files when it opens.
 */
export function AssignmentsProvider({
  value,
  children,
}: {
  value: AssignmentsContextValue;
  children: ReactNode;
}) {
  return <AssignmentsContext.Provider value={value}>{children}</AssignmentsContext.Provider>;
}

export function useAssignments(): AssignmentsContextValue {
  const context = useContext(AssignmentsContext);
  if (!context) {
    throw new Error("useAssignments must be used inside an AssignmentsProvider");
  }
  return context;
}
