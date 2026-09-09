import type { CSSProperties } from "react";
import {
  KAUAI_PATH,
  KAUAI_ROAD,
  KAUAI_ROAD_SPUR,
  KAUAI_VIEWBOX,
  type MapLabel,
  type MapMark,
} from "@/content/kauai-geometry";
import type { WalkedRoute } from "@/content/walked-routes";
import { cn } from "@/lib/utils";

/**
 * Kauaʻi, drawn from real coastline geometry (see content/kauai-geometry.ts).
 *
 * `view` crops to a sub-rectangle of the island's 1000x720 projected space, so
 * a chapter map can zoom to its own stretch of coast while every mark stays in
 * the one coordinate system. The SVG's own overflow is left alone — the crop is
 * the viewBox, not a clip.
 *
 * `road` draws the ring road under the marks: a wide neutral casing with the
 * accent line on top, which is how a road reads at this scale without becoming
 * a solid fill. `walks` draws dashed footpaths — only ever on a chapter map,
 * since at island scale a trail is a few pixels long.
 *
 * LABELS ARE HTML, NOT SVG <text>. Two reasons: label type then sets at a real
 * px size instead of scaling with however tightly the viewBox is cropped, and
 * SVG text cannot carry interpolated content in every renderer. They are
 * positioned as percentages of the map's own box, so each one tracks its mark.
 */
export function KauaiMap({
  marks = [],
  view = KAUAI_VIEWBOX,
  labels = [],
  walks = [],
  road = false,
  className,
  style,
  title,
}: {
  marks?: MapMark[];
  view?: string;
  labels?: MapLabel[];
  walks?: WalkedRoute[];
  /** Draw the ring road and the Poʻip\u016b spur. */
  road?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Omit to render decoratively (aria-hidden). */
  title?: string;
}) {
  const [vx, vy, vw, vh] = view.split(" ").map(Number);
  const pct = (x: number, y: number) => ({
    left: `${(((x - vx) / vw) * 100).toFixed(2)}%`,
    top: `${(((y - vy) / vh) * 100).toFixed(2)}%`,
  });

  return (
    <div className={cn("relative", className)} style={style}>
      <svg
        viewBox={view}
        className="block h-auto w-full"
        role={title ? "img" : undefined}
        aria-label={title}
        aria-hidden={title ? undefined : true}
      >
        <path
          d={KAUAI_PATH}
          fill="var(--surface)"
          stroke="var(--neutral-400)"
          strokeWidth={road ? 2 : 3}
        />

        {road && (
          <>
            {[KAUAI_ROAD, KAUAI_ROAD_SPUR].map((d, i) => (
              <path
                key={`casing-${i}`}
                d={d}
                fill="none"
                stroke="var(--neutral-500)"
                strokeWidth="9"
                strokeLinecap="round"
                opacity="0.28"
              />
            ))}
            {[KAUAI_ROAD, KAUAI_ROAD_SPUR].map((d, i) => (
              <path
                key={`road-${i}`}
                d={d}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="4"
                strokeLinecap="round"
              />
            ))}
          </>
        )}

        {walks.map((walk) => (
          <path
            key={walk.id}
            d={walk.d}
            fill="none"
            stroke="var(--neutral-700)"
            strokeWidth={walks.length > 1 ? 2.2 : 3}
            strokeLinecap="round"
            strokeDasharray={walks.length > 1 ? "6 5" : "8 6"}
          >
            <title>{walk.label}</title>
          </path>
        ))}

        {marks.map((mark) => (
          <circle
            key={`${mark.x}-${mark.y}`}
            cx={mark.x}
            cy={mark.y}
            r={mark.r}
            fill="var(--background)"
            stroke="var(--accent)"
            strokeWidth={mark.w ?? (road ? 5 : 4)}
          />
        ))}
      </svg>

      {labels.map((label) => (
        <span
          key={label.text}
          className="pointer-events-none absolute whitespace-nowrap text-xs leading-tight text-neutral-800"
          style={{
            ...pct(label.x, label.y),
            transform: `translate(${
              label.anchor === "end" ? "-100%" : label.anchor === "middle" ? "-50%" : "0"
            }, -50%)`,
          }}
        >
          {label.text}
        </span>
      ))}
    </div>
  );
}
