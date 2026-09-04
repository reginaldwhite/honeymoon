import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Form primitives for the admin editors. These exist because the same ~120
 * character Tailwind string was previously repeated on a dozen inputs across
 * four files, which made the forms drift apart visually as they were edited.
 */

const controlClasses =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground normal-case outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/30 disabled:opacity-50";

/** A label wrapping its control, so clicking the caption focuses the field. */
export function Field({
  label,
  hint,
  className,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-muted-foreground/80">{hint}</span>}
    </label>
  );
}

export function TextInput({ className, ...props }: React.ComponentProps<"input">) {
  return <input {...props} className={cn(controlClasses, className)} />;
}

export function TextArea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea {...props} className={cn(controlClasses, "resize-y", className)} />;
}

export function SelectInput({ className, ...props }: React.ComponentProps<"select">) {
  return <select {...props} className={cn(controlClasses, "py-1.5", className)} />;
}

/** Inline save/error feedback shared by every admin form. */
export function FormStatus({ state }: { state?: { error?: string; success?: string } }) {
  if (state?.error) {
    return (
      <p role="alert" className="text-xs text-destructive">
        {state.error}
      </p>
    );
  }
  if (state?.success) {
    return (
      <p role="status" className="text-xs text-muted-foreground">
        {state.success}
      </p>
    );
  }
  return null;
}
