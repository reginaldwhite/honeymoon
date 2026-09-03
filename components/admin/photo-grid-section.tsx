"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { BrowseEntry } from "@/app/admin/api/browse/route";

/**
 * One capture date's grid. The entries are fetched the first time the section
 * comes near the viewport, so opening the library costs one small request
 * instead of the entire file list.
 */
export function PhotoGridSection({
  id,
  heading,
  count,
  date,
  renderTile,
}: {
  id: string;
  heading: string;
  count: number;
  date: string;
  renderTile: (entry: BrowseEntry) => ReactNode;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const [entries, setEntries] = useState<BrowseEntry[] | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "600px" },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || entries) return;
    const controller = new AbortController();
    fetch(`/admin/api/browse?date=${encodeURIComponent(date)}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setEntries(data.entries);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [visible, entries, date]);

  return (
    <section
      ref={sectionRef}
      id={id}
      className="scroll-mt-6"
      style={{ contentVisibility: "auto", containIntrinsicSize: "0 800px" }}
    >
      <h3 className="text-sm font-medium text-foreground">
        {heading}
        <span className="ml-2 text-xs font-normal text-muted-foreground">
          {count} file{count === 1 ? "" : "s"}
        </span>
      </h3>
      {entries ? (
        <div className="-mx-6 mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-6">
          {entries.map(renderTile)}
        </div>
      ) : (
        <div className="-mx-6 mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-6">
          {Array.from({ length: Math.min(count, 12) }, (_, index) => (
            <div key={index} className="aspect-square animate-pulse rounded-md bg-secondary/40" />
          ))}
        </div>
      )}
    </section>
  );
}
