import { NextRequest, NextResponse } from "next/server";
import { isProductionRuntime } from "@/lib/dev-only";
import {
  getLibraryEntries,
  getLibraryEntriesForDate,
  getLibraryGroups,
} from "@/lib/photo-library";

export type { LibraryEntry as BrowseEntry, LibraryGroupSummary } from "@/lib/photo-library";

const SEARCH_LIMIT = 300;

/**
 * Three shapes, so the browser never has to download the whole library at once:
 *
 *   (no params)   -> the capture-date index: one row per day plus a count
 *   ?date=YYYY-MM-DD -> that day's entries, fetched as the section scrolls in
 *   ?q=term       -> filename matches across the library, capped
 *
 * Previously this returned every entry in the library on page load.
 */
export async function GET(request: NextRequest) {
  if (isProductionRuntime()) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  if (!process.env.PHOTO_SOURCE_DIR) {
    return NextResponse.json(
      { error: "PHOTO_SOURCE_DIR is not set in .env.local" },
      { status: 500 },
    );
  }

  const { searchParams } = request.nextUrl;
  const forceRefresh = searchParams.get("refresh") === "1";
  const date = searchParams.get("date");
  const query = searchParams.get("q")?.trim().toLowerCase();

  try {
    if (date) {
      return NextResponse.json({ mode: "date", entries: await getLibraryEntriesForDate(date) });
    }

    if (query) {
      const all = await getLibraryEntries();
      const matches = all.filter((entry) => entry.name.toLowerCase().includes(query));
      return NextResponse.json({
        mode: "search",
        entries: matches.slice(0, SEARCH_LIMIT),
        total: matches.length,
        truncated: matches.length > SEARCH_LIMIT,
      });
    }

    const groups = await getLibraryGroups({ forceRefresh });
    return NextResponse.json({
      mode: "index",
      groups,
      total: groups.reduce((sum, group) => sum + group.count, 0),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to read PHOTO_SOURCE_DIR" },
      { status: 500 },
    );
  }
}
