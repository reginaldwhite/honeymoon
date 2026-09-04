import { KAUAI_PATH, KAUAI_VIEWBOX } from "@/content/kauai-geometry";
import type { MapMark } from "@/content/chapters";

export interface MapLabel {
  x: number;
  y: number;
  text: string;
  anchor?: "start" | "end";
}

/**
 * Kauaʻi, drawn from real coastline geometry (see content/kauai-geometry.ts).
 *
 * `view` crops to a sub-rectangle of the island's 1000x720 projected space, so
 * a chapter map can zoom to its own stretch of coast while every mark stays in
 * the one coordinate system. The SVG's own overflow is left alone — the crop is
 * the viewBox, not a clip.
 */
export function KauaiMap({
  marks = [],
  view = KAUAI_VIEWBOX,
  labels = [],
  className,
  title,
}: {
  marks?: MapMark[];
  view?: string;
  labels?: MapLabel[];
  className?: string;
  /** Omit to render decoratively (aria-hidden). */
  title?: string;
}) {
  return (
    <svg
      viewBox={view}
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path d={KAUAI_PATH} fill="var(--surface)" stroke="var(--neutral-400)" strokeWidth="2" />
      {marks.map((mark) => (
        <circle
          key={`${mark.x}-${mark.y}`}
          cx={mark.x}
          cy={mark.y}
          r={mark.r}
          fill="var(--background)"
          stroke="var(--accent)"
          strokeWidth="4"
        />
      ))}
      {labels.map((label) => (
        <text
          key={label.text}
          x={label.x}
          y={label.y}
          textAnchor={label.anchor ?? "start"}
          fill="var(--neutral-800)"
          fontFamily="var(--font-lora)"
          fontSize="25"
        >
          {label.text}
        </text>
      ))}
    </svg>
  );
}
