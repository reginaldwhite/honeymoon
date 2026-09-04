"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A modal built on the native <dialog> element, which provides the focus trap,
 * Escape-to-close, background inerting and dialog semantics that a hand-rolled
 * fixed-position overlay has to reimplement (and previously didn't). Backdrop
 * appearance, scroll lock and transitions live in globals.css.
 *
 * The content is only mounted while open, so a grid of hundreds of thumbnails
 * doesn't also request every full-resolution original up front.
 */
export function Lightbox({
  label,
  triggerLabel,
  triggerClassName,
  trigger,
  onOpen,
  children,
}: {
  /** Accessible name for the dialog itself. */
  label: string;
  /** Accessible name for the button that opens it. */
  triggerLabel: string;
  triggerClassName?: string;
  trigger: ReactNode;
  /** Fired when the dialog is opened, for callers that track a selection. */
  onOpen?: () => void;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          onOpen?.();
        }}
        aria-label={triggerLabel}
        aria-haspopup="dialog"
        // A hand cursor is the only hint a photograph gives that it opens larger.
        className={cn("cursor-pointer", triggerClassName)}
      >
        {trigger}
      </button>

      <dialog
        ref={dialogRef}
        aria-label={label}
        onClose={() => setOpen(false)}
        // Clicking the dialog itself means clicking the area around the
        // content, which sits in its own element below.
        onClick={(event) => {
          if (event.target === dialogRef.current) setOpen(false);
        }}
      >
        {open && (
          <div className="flex h-full w-full items-center justify-center p-4 sm:p-10">
            <div className="relative max-h-full">
              {children}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="absolute -top-3 -right-3 flex size-9 cursor-pointer items-center justify-center rounded-full bg-white text-black shadow-lg transition-transform hover:scale-105 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
