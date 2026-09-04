import type { ChapterContent } from "@/content/types";

/**
 * Sticky chapter index. This replaces the old per-day chip row: sixteen dated
 * chips never fit and told you nothing, four place names do. Anchors are plain
 * links to the chapter sections, so it works without JavaScript.
 *
 * This bar pins directly below the site header, and the two must meet exactly
 * or page content flickers through the gap. Its offset and height both read
 * from the `--header-h` / `--chapter-bar-h` variables in globals.css, as does
 * the `scroll-mt-(--sticky-stack)` on each chapter section, so there is one
 * place to change them. No bottom rule: the bar spans the column, so a rule
 * here would read as a full-bleed line under the overview.
 */
export function ChapterNav({ chapters }: { chapters: Pick<ChapterContent, "id" | "chip">[] }) {
  if (chapters.length === 0) return null;

  return (
    <div className="sticky top-(--header-h) z-30 -mx-6 bg-background/90 px-6 backdrop-blur">
      <nav
        aria-label="Chapters"
        className="mx-auto flex h-(--chapter-bar-h) max-w-6xl items-center gap-2 overflow-x-auto"
      >
        {chapters.map((chapter) => (
          <a
            key={chapter.id}
            href={`#${chapter.id}`}
            className="tag tag-outline shrink-0 font-heading whitespace-nowrap uppercase tracking-[0.1em] no-underline transition-colors hover:bg-accent/10"
          >
            {chapter.chip}
          </a>
        ))}
      </nav>
    </div>
  );
}
