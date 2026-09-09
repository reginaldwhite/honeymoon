import type { MediaRef, PhotoRowColumns } from "@/content/types";

/** The default row shape, used for photographs beyond the authored layout. */
export const DEFAULT_COLUMNS: PhotoRowColumns = 3;
/** A photograph with no stored dimensions is treated as a 3:2 landscape. */
const FALLBACK_RATIO = 1.5;

export interface PhotoRow {
  columns: PhotoRowColumns;
  /** Exactly `columns` cells; `null` is an authored cell with no photograph yet. */
  cells: (MediaRef | null)[];
  /** True for rows the layout did not author — overflow photographs in threes. */
  implicit: boolean;
  /**
   * One aspect ratio shared by every frame in the row, so a row of three lines
   * up with every other row of three: the mean of its photographs' ratios.
   * The ratio goes on the frame, not the row, so the gaps cost nothing in crop.
   */
  ratio: number;
  /** Every photograph in the row is portrait; a lone one gets a narrow measure. */
  portrait: boolean;
}

export function ratioOf(media: MediaRef): number {
  return media.width && media.height ? media.width / media.height : FALLBACK_RATIO;
}

function shape(cells: (MediaRef | null)[]): { ratio: number; portrait: boolean } {
  const filled = cells.filter((cell): cell is MediaRef => cell !== null);
  if (filled.length === 0) return { ratio: FALLBACK_RATIO, portrait: false };
  const ratio = filled.reduce((total, item) => total + ratioOf(item), 0) / filled.length;
  return { ratio: Number(ratio.toFixed(4)), portrait: filled.every((item) => ratioOf(item) < 1) };
}

/**
 * Lays an activity's photographs into rows. The authored `layout` lists row
 * shapes; photographs fill them in order, so a 2-column row takes the next
 * two at half width and a 3-column row the next three at a third. Anything
 * left over flows into rows of three.
 *
 * Authored rows keep their shape even when there are not enough photographs
 * to fill them (the empty cells are `null`), so the editor can show the shape
 * that is waiting to be filled. Implicit rows are never padded.
 */
export function photoRows(media: MediaRef[], layout: PhotoRowColumns[] = []): PhotoRow[] {
  const rows: PhotoRow[] = [];
  let next = 0;

  for (const columns of layout) {
    const cells = Array.from({ length: columns }, (_, cell) => media[next + cell] ?? null);
    rows.push({ columns, cells, implicit: false, ...shape(cells) });
    next += columns;
  }

  while (next < media.length) {
    const cells = media.slice(next, next + DEFAULT_COLUMNS);
    rows.push({ columns: DEFAULT_COLUMNS, cells, implicit: true, ...shape(cells) });
    next += DEFAULT_COLUMNS;
  }

  return rows;
}

/** The position in the flat `media` list that a given cell shows. */
export function flatIndex(rows: PhotoRow[], rowIndex: number, cellIndex: number): number {
  return rows.slice(0, rowIndex).reduce((sum, row) => sum + row.columns, 0) + cellIndex;
}
