"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

/**
 * A general-purpose modal on the native <dialog> element, which supplies the
 * focus trap, Escape-to-close, background inerting and dialog semantics.
 * Backdrop, scroll lock and transitions live in globals.css.
 *
 * Controlled by the caller so the trigger can be any button, and the body is
 * only mounted while open — a picker holding a few hundred photo tiles must not
 * exist in the DOM for every closed modal on the page.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-label={title}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
    >
      {open && (
        <div className="flex h-full w-full items-center justify-center p-4 sm:p-8">
          <div className="flex max-h-full w-full max-w-7xl flex-col overflow-hidden rounded-lg border border-border bg-surface text-foreground shadow-2xl">
            <div className="flex items-start gap-4 border-b border-border px-5 py-4">
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-lg italic text-foreground">{title}</h2>
                {description && (
                  <div className="mt-1 text-xs text-muted-foreground">{description}</div>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
          </div>
        </div>
      )}
    </dialog>
  );
}
