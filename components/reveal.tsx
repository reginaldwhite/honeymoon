import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

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
 * `as` lets the revealed element be the semantic one (an article, a quote)
 * rather than a wrapper div around it, which matters when the element is also
 * a grid container.
 */
export function Reveal({
  as: Tag = "div",
  index = 0,
  className,
  children,
  ...rest
}: {
  as?: "div" | "article" | "section" | "blockquote";
  index?: number;
  className?: string;
  children: ReactNode;
  id?: string;
}) {
  const offset = Math.min(index, 4) * 3;
  const style = offset ? ({ "--reveal-offset": `${offset}%` } as CSSProperties) : undefined;

  return (
    <Tag className={cn("reveal", className)} style={style} {...rest}>
      {children}
    </Tag>
  );
}
