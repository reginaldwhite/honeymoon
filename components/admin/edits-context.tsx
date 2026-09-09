"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { applyEdits, type EditValue } from "@/app/admin/itinerary/actions";

/**
 * The editor's working copy of every field the user has touched, keyed by
 * `${kind}:${id}:${field}`, held in client state for the life of the page.
 *
 * The page is server-rendered, and photo operations (assign, remove,
 * reorder) revalidate it, so fresh server data flows through the inputs all
 * the time. A field the user has typed in must not follow that data: once
 * touched, its value lives here and here only, and the server render is
 * merely where an untouched field reads its text from. Nothing is ever
 * handed back — so a save landing, or the page refreshing under it, cannot
 * make a field jump, and nothing typed while a save is in the air is lost.
 *
 * Persisting is separate and asynchronous. Each touched key is marked dirty
 * until a save carrying its current value succeeds; a save goes out a moment
 * after typing pauses, at once when a field is left or the tab is hidden, and
 * never twice at a time. After a failure the dirty keys are kept and nothing
 * more is sent until the user edits again or asks for a retry.
 */
interface EditsContextValue {
  /** The working value of a touched field, or undefined if untouched. */
  read: (key: string) => EditValue | undefined;
  set: (key: string, value: EditValue, initial: EditValue) => void;
  dirty: boolean;
  saving: boolean;
  status: { error?: string; success?: string } | null;
  /** Save now rather than after the pause. */
  save: () => void;
}

const EditsContext = createContext<EditsContextValue | null>(null);

const same = (a: EditValue, b: EditValue) => JSON.stringify(a) === JSON.stringify(b);

/** How long typing has to pause before dirty fields are saved. */
const AUTOSAVE_DELAY_MS = 1000;

export function EditsProvider({ children }: { children: ReactNode }) {
  // Working values of touched fields. Only ever grows.
  const [values, setValues] = useState<ReadonlyMap<string, EditValue>>(() => new Map());
  // Keys whose working value has not reached the file yet.
  const [dirtyKeys, setDirtyKeys] = useState<ReadonlySet<string>>(() => new Set());
  // What the file holds for each touched key, as far as this page knows:
  // the server value when first touched, then whatever was last saved.
  const persisted = useRef(new Map<string, EditValue>());
  const [status, setStatus] = useState<EditsContextValue["status"]>(null);
  const [saving, startSaving] = useTransition();
  const dirty = dirtyKeys.size > 0;

  // Latest state for event handlers, without re-binding them on every keystroke.
  const latest = useRef({ values, dirtyKeys });
  useEffect(() => {
    latest.current = { values, dirtyKeys };
  }, [values, dirtyKeys]);
  const inFlight = useRef(false);

  const read = useCallback((key: string) => values.get(key), [values]);

  const set = useCallback((key: string, value: EditValue, initial: EditValue) => {
    setStatus(null);
    if (!persisted.current.has(key)) persisted.current.set(key, initial);
    setValues((prev) => new Map(prev).set(key, value));
    setDirtyKeys((prev) => {
      const next = new Set(prev);
      if (same(value, persisted.current.get(key)!)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const save = useCallback(() => {
    if (inFlight.current) return; // the scheduler sends what's left once this one lands
    const { values: current, dirtyKeys: keys } = latest.current;
    if (keys.size === 0) return;
    const payload = [...keys].map((key) => ({ key, value: current.get(key)! }));
    inFlight.current = true;
    startSaving(async () => {
      const result = await applyEdits(payload);
      inFlight.current = false;
      if (result?.error) {
        setStatus({ error: result.error });
        return;
      }
      for (const { key, value } of payload) persisted.current.set(key, value);
      // A key typed into while the save was out stays dirty for the next one.
      setDirtyKeys((prev) => {
        const next = new Set(prev);
        for (const { key, value } of payload) {
          if (same(latest.current.values.get(key)!, value)) next.delete(key);
        }
        return next;
      });
      setStatus({ success: "Saved" });
    });
  }, []);

  // Save after typing pauses. Re-armed by every edit, and again when a save
  // lands with keys still dirty; parked after an error until the next edit.
  useEffect(() => {
    if (!dirty || saving || status?.error) return;
    const timer = window.setTimeout(save, AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [values, dirty, saving, status, save]);

  // Leaving a field, or the tab, saves at once.
  useEffect(() => {
    const onFocusOut = () => {
      if (latest.current.dirtyKeys.size > 0) save();
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") onFocusOut();
    };
    document.addEventListener("focusout", onFocusOut);
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onFocusOut);
    return () => {
      document.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onFocusOut);
    };
  }, [save]);

  // A save can still be in the air when the page is closed; ask first.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const value = useMemo(
    () => ({ read, set, dirty, saving, status, save }),
    [read, set, dirty, saving, status, save],
  );
  return <EditsContext.Provider value={value}>{children}</EditsContext.Provider>;
}

export function useEdits(): EditsContextValue {
  const context = useContext(EditsContext);
  if (!context) throw new Error("useEdits must be used inside an EditsProvider");
  return context;
}

/**
 * One editable field: its working value once touched, the server value until
 * then, and a setter.
 */
export function useEditField<T extends EditValue>(key: string, initial: T): [T, (value: T) => void] {
  const { read, set } = useEdits();
  const value = (read(key) ?? initial) as T;
  const update = useCallback((next: T) => set(key, next, initial), [set, key, initial]);
  return [value, update];
}
