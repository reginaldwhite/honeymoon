"use client";

import type { PhotoRowColumns } from "@/content/types";
import { cn } from "@/lib/utils";
import { useEditField } from "./edits-context";

/**
 * Inputs that stand exactly where the text they edit stands on the public
 * page, wearing its typography. The only visible difference from the reader's
 * view is a dashed underline — enough to say "you can type here" without
 * reshaping the layout.
 */
const FIELD =
  "block w-full rounded-none border-0 border-b border-dashed border-primary/50 bg-transparent px-0 py-0 outline-none placeholder:text-muted-foreground/40 focus:border-primary";

export function InlineInput({
  k,
  initial,
  className,
  placeholder,
  type = "text",
}: {
  /** The overlay key, `${kind}:${id}:${field}`. */
  k: string;
  initial: string;
  className?: string;
  placeholder?: string;
  type?: "text" | "date" | "time";
}) {
  const [value, setValue] = useEditField(k, initial);
  return (
    <input
      type={type}
      value={value}
      onChange={(event) => setValue(event.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className={cn(FIELD, className)}
    />
  );
}

export function InlineTextarea({
  k,
  initial,
  className,
  placeholder,
}: {
  k: string;
  initial: string;
  className?: string;
  placeholder?: string;
}) {
  const [value, setValue] = useEditField(k, initial);
  return (
    <textarea
      value={value}
      onChange={(event) => setValue(event.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      rows={1}
      // Grows with its content, so a paragraph reads as a paragraph.
      className={cn(FIELD, "resize-none [field-sizing:content]", className)}
    />
  );
}

export function InlineNumber({
  k,
  initial,
  className,
  label,
  step = 1,
  min = 0,
}: {
  k: string;
  initial: number;
  className?: string;
  label: string;
  step?: number;
  min?: number;
}) {
  const [value, setValue] = useEditField(k, initial);
  return (
    <input
      type="number"
      value={value}
      step={step}
      min={min}
      onChange={(event) => setValue(Number(event.target.value) || 0)}
      aria-label={label}
      className={cn(FIELD, "w-16 text-right tabular-nums", className)}
    />
  );
}

export function InlineSelect<T extends string>({
  k,
  initial,
  options,
  className,
  label,
}: {
  k: string;
  initial: T;
  options: { value: T; label: string }[];
  className?: string;
  label: string;
}) {
  const [value, setValue] = useEditField(k, initial);
  return (
    <select
      value={value}
      onChange={(event) => setValue(event.target.value as T)}
      aria-label={label}
      className={cn(FIELD, "w-auto cursor-pointer", className)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

/** A set of on/off chips — the activity's interest tags. */
export function InlineToggles({
  k,
  initial,
  options,
  label,
}: {
  k: string;
  initial: string[];
  options: { value: string; label: string }[];
  label: string;
}) {
  const [value, setValue] = useEditField(k, initial);
  const selected = new Set(value);
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const on = selected.has(option.value);
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={on}
            onClick={() =>
              setValue(
                on
                  ? value.filter((slug) => slug !== option.value)
                  : [...value, option.value],
              )
            }
            className={cn(
              "cursor-pointer rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide transition-colors",
              on
                ? "border-accent bg-accent/10 text-accent-700"
                : "border-border text-muted-foreground hover:border-accent/60",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** The 1 / 2 / 3 choice for one photo row. */
export function ColumnsToggle({
  value,
  onChange,
  label,
}: {
  value: PhotoRowColumns;
  onChange: (columns: PhotoRowColumns) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-1">
      {([1, 2, 3] as const).map((columns) => (
        <button
          key={columns}
          type="button"
          aria-pressed={value === columns}
          onClick={() => onChange(columns)}
          title={`${columns} across`}
          className={cn(
            "flex size-7 cursor-pointer items-center justify-center rounded border font-mono text-[11px] transition-colors",
            value === columns
              ? "border-accent bg-accent text-white"
              : "border-border text-muted-foreground hover:border-accent",
          )}
        >
          {columns}
        </button>
      ))}
    </div>
  );
}
