"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Check, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditGroupValue {
  isOpen: (id: string) => boolean;
  toggle: (id: string) => void;
}

const EditGroupContext = createContext<EditGroupValue | null>(null);

/**
 * Tracks which units of the itinerary have their editor open. The Edit button
 * for a unit lives INSIDE the real public component (passed through an action
 * slot) while its form renders somewhere else on the page, so the two need a
 * shared place to agree — this context, keyed by the unit's id.
 *
 * `defaultOpen` is consulted live rather than copied into state once: an
 * activity added mid-session arrives on the next render with an empty body,
 * and it should open for editing then, not only on the first page load. A
 * unit the user has closed stays closed even if it is still in `defaultOpen`.
 */
export function EditGroup({
  defaultOpen = [],
  children,
}: {
  defaultOpen?: string[];
  children: ReactNode;
}) {
  const [opened, setOpened] = useState<ReadonlySet<string>>(() => new Set());
  const [closed, setClosed] = useState<ReadonlySet<string>>(() => new Set());

  const isOpen = useCallback(
    (id: string) => opened.has(id) || (defaultOpen.includes(id) && !closed.has(id)),
    [opened, closed, defaultOpen],
  );

  const toggle = useCallback(
    (id: string) => {
      const currentlyOpen = opened.has(id) || (defaultOpen.includes(id) && !closed.has(id));
      if (currentlyOpen) {
        setOpened((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setClosed((prev) => new Set(prev).add(id));
      } else {
        setOpened((prev) => new Set(prev).add(id));
        setClosed((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [opened, closed, defaultOpen],
  );

  const value = useMemo(() => ({ isOpen, toggle }), [isOpen, toggle]);
  return <EditGroupContext.Provider value={value}>{children}</EditGroupContext.Provider>;
}

function useEditGroup(): EditGroupValue {
  const context = useContext(EditGroupContext);
  if (!context) throw new Error("EditToggle and EditPanel must be used inside an EditGroup");
  return context;
}

/** The Edit / Done button for one unit. Rendered inside the public component via its action slot. */
export function EditToggle({ id, label }: { id: string; label: string }) {
  const { isOpen, toggle } = useEditGroup();
  const open = isOpen(id);

  return (
    <Button
      type="button"
      size="xs"
      variant={open ? "default" : "outline"}
      onClick={() => toggle(id)}
      aria-pressed={open}
      aria-controls={`edit-${id}`}
      className="font-body normal-case tracking-normal"
    >
      {open ? <Check aria-hidden /> : <Pencil aria-hidden />}
      {open ? "Done" : `Edit ${label}`}
    </Button>
  );
}

/** A unit's editor, shown beneath its rendering while that unit is being edited. */
export function EditPanel({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  const { isOpen } = useEditGroup();
  if (!isOpen(id)) return null;

  return (
    <div
      id={`edit-${id}`}
      className="my-6 rounded-md border border-primary/40 bg-background p-4 font-body"
    >
      <p className="mb-3 text-[11px] uppercase tracking-widest text-primary">Editing {label}</p>
      {children}
    </div>
  );
}
