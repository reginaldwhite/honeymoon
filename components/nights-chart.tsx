import type { ResolvedChapter } from "@/content/chapters";
import { SmallCaps } from "./typography";

/**
 * Nights per place, drawn as hairline bars.
 *
 * Reads each chapter's authored `nights` rather than its day count — a
 * chapter's days include the day we arrived and the day we left, which are
 * not nights spent there.
 *
 * Camping and lodging are distinguished by stroke — solid for a tent, dashed
 * for a bed — rather than by two accent colors, because this is a mono palette
 * and color here is a stroke, not a fill. A chapter with both (the trail, with
 * a bed either side of it) draws two segments end to end.
 */

const TENT_STROKE = {
  border: "1px solid var(--accent)",
  background: "color-mix(in srgb, var(--accent) 14%, transparent)",
} as const;

const BED_STROKE = { border: "1px dashed var(--accent)" } as const;

export function NightsChart({
  chapters,
}: {
  chapters: Pick<ResolvedChapter, "id" | "chip" | "nights">[];
}) {
  const max = Math.max(1, ...chapters.map((c) => c.nights.tent + c.nights.bed));

  return (
    <div className="flex flex-col">
      {chapters.map((chapter) => {
        const total = chapter.nights.tent + chapter.nights.bed;

        return (
          <div
            key={chapter.id}
            className="grid items-center gap-4 border-b border-divider py-3"
            style={{ gridTemplateColumns: "140px minmax(0,1fr) 72px" }}
          >
            <span className="text-sm">{chapter.chip}</span>

            <div
              role="img"
              aria-label={`${chapter.nights.tent} nights in a tent, ${chapter.nights.bed} in a bed`}
              className="relative h-6 border-b border-neutral-300"
            >
              <div
                className="absolute inset-y-0 left-0 flex"
                style={{ width: `${(total / max) * 100}%` }}
              >
                {chapter.nights.tent > 0 && (
                  <span className="block h-full" style={{ flex: chapter.nights.tent, ...TENT_STROKE }} />
                )}
                {chapter.nights.bed > 0 && (
                  <span className="block h-full" style={{ flex: chapter.nights.bed, ...BED_STROKE }} />
                )}
              </div>
            </div>

            <SmallCaps className="text-right tracking-[0.12em]">
              {total} {total === 1 ? "night" : "nights"}
            </SmallCaps>
          </div>
        );
      })}

      <div className="flex flex-wrap gap-6 pt-4">
        <SmallCaps className="flex items-center gap-2 tracking-[0.14em]">
          <span aria-hidden className="block h-3 w-4" style={TENT_STROKE} />
          Tent
        </SmallCaps>
        <SmallCaps className="flex items-center gap-2 tracking-[0.14em]">
          <span aria-hidden className="block h-3 w-4" style={BED_STROKE} />
          Bed
        </SmallCaps>
      </div>
    </div>
  );
}
