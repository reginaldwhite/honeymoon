import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The two small-type voices the Classical pages speak in, so their exact
 * tracking and casing live in one place instead of being retyped on every
 * label.
 */

/** Gold, spaced small caps in the heading face — the line above a title. */
export function Eyebrow({
  as: Tag = "p",
  className,
  children,
}: {
  as?: "p" | "span";
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag className={cn("font-heading text-xs uppercase tracking-[0.2em] text-accent", className)}>
      {children}
    </Tag>
  );
}

/**
 * Muted, spaced small caps with tabular figures — dates, counts, and other
 * metadata that stands beside a title rather than above it.
 */
export function SmallCaps({
  as: Tag = "span",
  className,
  children,
}: {
  as?: "p" | "span";
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag
      className={cn(
        "tnum font-heading text-xs uppercase tracking-[0.16em] text-muted-foreground",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
