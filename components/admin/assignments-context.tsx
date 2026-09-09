"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Assignment } from "@/lib/trip-repository";

interface AssignmentsContextValue {
  /** Every assignment across the whole trip, keyed by library path. */
  assignments: Record<string, Assignment>;
  /** `${ownerId}::${target}` -> readable name, for showing where a photo already lives. */
  targetLabels: Record<string, string>;
  /**
   * `${ownerId}::${target}` -> the path down to that slot on this page, for
   * the picker's heading: chapter, day, activity, slot. Only the slots on the
   * page being edited are here.
   */
  targetPaths: Record<string, string[]>;
  /**
   * The dates of the chapter being edited, if any. The picker shows the whole
   * library and highlights the days that fall in this range.
   */
  chapterDates: string[];
  /**
   * `${ownerId}::${target}` -> the date the picker should open on: an
   * activity's own date, a chapter's first day, the trip's first day for the
   * opening.
   */
  defaultDateByTarget: Record<string, string>;
}

const AssignmentsContext = createContext<AssignmentsContextValue | null>(null);

/**
 * The trip's photo assignments, held once for the whole itinerary editor.
 * Every "Add image" picker on the page reads from this, so a chapter's worth
 * of pickers don't each carry their own copy — and the photo *library* is not
 * here at all: the pickers fetch it once when the first one opens.
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
