"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface PhotoSelectionContextValue {
  selectedPath: string | null;
  select: (path: string) => void;
}

const PhotoSelectionContext = createContext<PhotoSelectionContextValue | null>(null);

/** Tracks the single most-recently-opened photo across every PhotoTile on the page. */
export function PhotoSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  return (
    <PhotoSelectionContext.Provider value={{ selectedPath, select: setSelectedPath }}>
      {children}
    </PhotoSelectionContext.Provider>
  );
}

export function usePhotoSelection(): PhotoSelectionContextValue {
  const ctx = useContext(PhotoSelectionContext);
  // No-op fallback if a PhotoTile is ever rendered outside a provider.
  return ctx ?? { selectedPath: null, select: () => {} };
}
