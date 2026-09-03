"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { LibraryEntry } from "@/lib/photo-library";
import type { Assignment } from "@/lib/trip-repository";

interface DayPhotoContextValue {
  dayId: string;
  /** Library files whose capture date matches this day. */
  photos: LibraryEntry[];
  /** Files with a known-bad timestamp that could belong to any day. */
  uncertainPhotos: LibraryEntry[];
  /** Every assignment across the whole trip, keyed by library path. */
  assignments: Record<string, Assignment>;
  /** `${dayId}::${target}` -> readable name, for showing where a photo already lives. */
  targetLabels: Record<string, string>;
}

const DayPhotoContext = createContext<DayPhotoContextValue | null>(null);

/**
 * Holds the day's photo library once for the whole page. Each "Add image"
 * button opens a picker over this same data, so a day with several activities
 * doesn't serialize a separate copy of the file list per button.
 */
export function DayPhotoProvider({
  value,
  children,
}: {
  value: DayPhotoContextValue;
  children: ReactNode;
}) {
  return <DayPhotoContext.Provider value={value}>{children}</DayPhotoContext.Provider>;
}

export function useDayPhotos(): DayPhotoContextValue {
  const context = useContext(DayPhotoContext);
  if (!context) {
    throw new Error("useDayPhotos must be used inside a DayPhotoProvider");
  }
  return context;
}
