"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface MediaDragPayload {
  mediaId: string;
  /** The list the drag started from, so a grid knows whether it is the source. */
  fromTargetKey: string;
}

interface MediaDragContextValue {
  dragging: MediaDragPayload | null;
  begin: (payload: MediaDragPayload) => void;
  end: () => void;
}

const MediaDragContext = createContext<MediaDragContextValue | null>(null);

/**
 * Tracks the photo currently being dragged, shared across every list on the day.
 *
 * The HTML drag-and-drop API deliberately hides `dataTransfer` contents during
 * `dragover` — you can only read them on `drop`. A grid therefore can't inspect
 * the payload to decide whether to accept the drag, so the in-flight item is
 * kept here instead.
 */
export function MediaDragProvider({ children }: { children: ReactNode }) {
  const [dragging, setDragging] = useState<MediaDragPayload | null>(null);

  const begin = useCallback((payload: MediaDragPayload) => setDragging(payload), []);
  const end = useCallback(() => setDragging(null), []);
  const value = useMemo(() => ({ dragging, begin, end }), [dragging, begin, end]);

  return <MediaDragContext.Provider value={value}>{children}</MediaDragContext.Provider>;
}

export function useMediaDrag(): MediaDragContextValue {
  const context = useContext(MediaDragContext);
  // Lists rendered outside a provider simply aren't draggable.
  return context ?? { dragging: null, begin: () => {}, end: () => {} };
}
