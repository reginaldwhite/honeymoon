"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

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
 * Tracks the photo currently being dragged, shared across every list on the
 * page, and scrolls the page while the drag is near its top or bottom edge.
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

  useEffect(() => {
    if (!dragging) return;
    return autoScrollWhileDragging();
  }, [dragging]);

  return <MediaDragContext.Provider value={value}>{children}</MediaDragContext.Provider>;
}

export function useMediaDrag(): MediaDragContextValue {
  const context = useContext(MediaDragContext);
  // Lists rendered outside a provider simply aren't draggable.
  return context ?? { dragging: null, begin: () => {}, end: () => {} };
}

/** How far from an edge the page starts to scroll, and how fast at the edge itself. */
const SCROLL_BAND_PX = 160;
const MAX_SCROLL_PX_PER_FRAME = 24;

/**
 * Scrolls the window while a native drag hovers near its top or bottom edge.
 *
 * The browser's own edge scrolling is a thin strip and a crawl, which is not
 * enough to carry a photograph past a full-width row. Here the band is wide
 * and the speed rises towards the edge. The top band starts beneath the
 * pinned header and save bar, since a pointer under those is at the edge of
 * what can be seen. `dragover` keeps firing while the pointer is still, so
 * the loop runs on frames and reads the last known pointer position.
 *
 * Returns the teardown for the effect that starts it.
 */
function autoScrollWhileDragging(): () => void {
  let pointerY: number | null = null;
  let frame = 0;

  const pinnedBottom = () =>
    Math.max(
      0,
      ...[...document.querySelectorAll<HTMLElement>("header, [data-pinned]")].map(
        (el) => el.getBoundingClientRect().bottom,
      ),
    );

  const onDragOver = (event: DragEvent) => {
    pointerY = event.clientY;
  };

  const tick = () => {
    frame = requestAnimationFrame(tick);
    if (pointerY === null) return;
    const top = pinnedBottom();
    const bottom = window.innerHeight;
    let delta = 0;
    if (pointerY < top + SCROLL_BAND_PX) {
      delta = -speed(top + SCROLL_BAND_PX - pointerY);
    } else if (pointerY > bottom - SCROLL_BAND_PX) {
      delta = speed(pointerY - (bottom - SCROLL_BAND_PX));
    }
    if (delta !== 0) window.scrollBy(0, delta);
  };

  document.addEventListener("dragover", onDragOver);
  frame = requestAnimationFrame(tick);
  return () => {
    document.removeEventListener("dragover", onDragOver);
    cancelAnimationFrame(frame);
  };
}

/** Pixels per frame for a pointer `depth` px into the band: eases in, capped at the edge. */
function speed(depth: number): number {
  const t = Math.min(1, Math.max(0, depth / SCROLL_BAND_PX));
  return Math.ceil(MAX_SCROLL_PX_PER_FRAME * t * t);
}
