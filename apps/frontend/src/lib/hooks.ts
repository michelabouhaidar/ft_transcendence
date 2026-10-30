import { RefObject, useCallback, useEffect, useRef, useState } from "react";

// Runs an async action with a busy flag and an error message. 
// 'run' resolves to the action's result, or undefined when it threw (the message is then in 'error').
export function useAsync() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = useCallback(async <T,>(action: () => Promise<T>): Promise<T | undefined> => {
    setBusy(true);
    setError(null);
    try {
      return await action();
    } catch (err) {
      setError((err as Error).message);
      return undefined;
    } finally {
      setBusy(false);
    }
  }, []);
  return { busy, error, setError, run };
}

// Detects clicks outside an element, while enabled.
export function useClickOutside(refs: Array<RefObject<HTMLElement | null>>, onOutside: () => void, enabled = true) {
  const handler = useRef(onOutside);
  handler.current = onOutside;
  useEffect(() => {
    if (!enabled) return;
    const listener = (e: MouseEvent) => {
      if (!refs.some((r) => r.current?.contains(e.target as Node))) handler.current();
    };
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [enabled]);
}

// The value, once it stopped changing for ms.
export function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}
