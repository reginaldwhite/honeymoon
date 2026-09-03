import type { ReactNode } from "react";

/**
 * Scroll-triggered fade/rise-in wrapper.
 *
 * Entirely CSS (see the `.reveal` rules in globals.css) and therefore a Server
 * Component with no client JS at all. The content is visible by default and the
 * animation only ever adds to that, so it degrades cleanly in browsers without
 * scroll-driven animation support and is skipped for `prefers-reduced-motion`.
 *
 * `index` staggers siblings — a scroll-driven animation has no notion of a time
 * delay, so each sibling animates over a slightly later slice of scroll instead.
 */
export function Reveal({
  children,
  index = 0,
  className,
}: {
  children: ReactNode;
  index?: number;
  className?: string;
}) {
  const offset = Math.min(index * 6, 24);

  return (
    <div
      className={className ? `reveal ${className}` : "reveal"}
      style={offset ? ({ "--reveal-offset": `${offset}%` } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}
