"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { refreshLibrary } from "@/app/admin/library/actions";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ui/field";
import { formatLongDate, formatShortDate } from "@/lib/format";
import type { AssignmentOption, Assignment } from "@/lib/trip-repository";
import type { BrowseEntry, LibraryGroupSummary } from "@/app/admin/api/browse/route";
import { PhotoSelectionProvider } from "./photo-selection-context";
import { PhotoTile, type PhotoTileAssign } from "./photo-tile";
import { PhotoGridSection } from "./photo-grid-section";

interface LibraryIndex {
  groups: LibraryGroupSummary[];
  total: number;
}

interface SearchResult {
  /** The query these results answer, so a stale response can't be shown. */
  query: string;
  entries: BrowseEntry[];
  total: number;
  truncated: boolean;
}

export function LibraryBrowser({
  options,
  assignments,
}: {
  options: AssignmentOption[];
  assignments: Record<string, Assignment>;
}) {
  const [index, setIndex] = useState<LibraryIndex | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);

  const [refreshing, startRefresh] = useTransition();
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  // Only the capture-date index is fetched up front — a few hundred bytes
  // rather than one entry for every file in the library. Each day's files are
  // loaded by its own section as it scrolls into view.
  useEffect(() => {
    const controller = new AbortController();
    fetch("/admin/api/browse", { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else {
          setError(null);
          setIndex({ groups: data.groups, total: data.total });
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setError("Failed to load photo library");
      });
    return () => controller.abort();
  }, [reloadToken]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery) return;
    const controller = new AbortController();
    fetch(`/admin/api/browse?q=${encodeURIComponent(debouncedQuery)}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setSearchResult({
            query: debouncedQuery,
            entries: data.entries,
            total: data.total,
            truncated: data.truncated,
          });
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [debouncedQuery]);

  const handleRefresh = () => {
    startRefresh(async () => {
      const result = await refreshLibrary();
      setRefreshMessage(result?.error ?? result?.success ?? null);
      if (!result?.error) setReloadToken((token) => token + 1);
    });
  };

  const assignFor = useMemo(
    () =>
      (entry: BrowseEntry): PhotoTileAssign => {
        const assignment = assignments[entry.path];
        return {
          mode: "select",
          options,
          currentValue: assignment ? `${assignment.ownerId}::${assignment.target}` : null,
          currentMediaId: assignment?.mediaId ?? null,
        };
      },
    [assignments, options],
  );

  // Derived rather than cleared in an effect, so results can never outlive the
  // query that produced them.
  const activeSearch = debouncedQuery && searchResult?.query === debouncedQuery ? searchResult : null;
  const searching = Boolean(debouncedQuery) && !activeSearch;

  if (error) {
    return (
      <p role="alert" className="mt-6 text-sm text-destructive">
        {error}
      </p>
    );
  }

  return (
    <PhotoSelectionProvider>
      <div className="mt-6">
        <div className="flex flex-wrap items-center gap-3">
          <TextInput
            type="search"
            placeholder="Filter by filename…"
            aria-label="Filter by filename"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="max-w-sm"
          />
          <Button type="button" variant="outline" size="lg" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw aria-hidden className={refreshing ? "animate-spin" : undefined} />
            {refreshing ? "Rescanning…" : "Rescan library"}
          </Button>
          {refreshMessage && (
            <p role="status" className="text-xs text-muted-foreground">
              {refreshMessage}
            </p>
          )}
        </div>

        {!index ? (
          <p className="mt-6 text-sm text-muted-foreground">Loading photo library…</p>
        ) : debouncedQuery ? (
          <div className="mt-6">
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {searching
                ? "Searching…"
                : `${activeSearch?.total ?? 0} match${activeSearch?.total === 1 ? "" : "es"}${
                    activeSearch?.truncated
                      ? ` — showing the first ${activeSearch.entries.length}`
                      : ""
                  }`}
            </p>
            <div className="-mx-6 mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-6">
              {activeSearch?.entries.map((entry) => (
                <PhotoTile key={entry.path} entry={entry} assign={assignFor(entry)} />
              ))}
            </div>
          </div>
        ) : (
          <>
            <p className="mt-2 text-xs text-muted-foreground">
              {index.total} files across {index.groups.length} day
              {index.groups.length === 1 ? "" : "s"}
            </p>

            {index.groups.length > 1 && (
              <nav aria-label="Jump to a capture date" className="mt-4 flex flex-wrap gap-1.5">
                {index.groups.map((group) => (
                  <a
                    key={group.date}
                    href={`#library-${group.date}`}
                    className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    {formatShortDate(group.date)} ({group.count})
                  </a>
                ))}
              </nav>
            )}

            <div className="mt-6 flex flex-col gap-10">
              {index.groups.map((group) => (
                <PhotoGridSection
                  key={`${group.date}-${reloadToken}`}
                  id={`library-${group.date}`}
                  heading={formatLongDate(group.date)}
                  count={group.count}
                  date={group.date}
                  renderTile={(entry) => (
                    <PhotoTile key={entry.path} entry={entry} assign={assignFor(entry)} />
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </PhotoSelectionProvider>
  );
}
