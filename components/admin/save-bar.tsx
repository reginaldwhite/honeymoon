"use client";

import Link from "next/link";
import { ArrowLeft, Check, CircleAlert, LoaderCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEdits } from "./edits-context";

/**
 * Pinned beneath the admin header: where you are, and whether what you've
 * typed has reached the file yet. Saving is automatic; the only control is a
 * retry, shown when a save has failed.
 */
export function SaveBar({ title, backHref }: { title: string; backHref: string }) {
  const { dirty, saving, status, save } = useEdits();

  const state = saving
    ? { icon: LoaderCircle, text: "Saving…", spin: true }
    : status?.error
      ? { icon: CircleAlert, text: status.error, tone: "text-destructive" }
      : dirty
        ? { icon: LoaderCircle, text: "Unsaved — saving shortly" }
        : { icon: Check, text: "All changes saved" };

  return (
    <div
      data-pinned
      className="sticky top-(--header-h) z-30 -mx-6 border-b border-border bg-background/95 px-6 backdrop-blur"
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4">
        <Link
          href={backHref}
          className="flex shrink-0 items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground no-underline hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Chapters
        </Link>
        <p className="min-w-0 flex-1 truncate font-display text-lg italic text-foreground">
          {title}
        </p>
        <p
          className={cn("flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground", state.tone)}
          aria-live="polite"
        >
          <state.icon className={cn("size-3.5", state.spin && "animate-spin")} aria-hidden />
          {state.text}
        </p>
        {status?.error && (
          <Button type="button" size="sm" variant="outline" onClick={save}>
            <RefreshCw aria-hidden />
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}
