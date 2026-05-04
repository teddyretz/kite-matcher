'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Local-state-with-debounced-commit. Useful for slider inputs that need to
 * stay responsive during a drag while pushing the final value to a more
 * expensive sink (URL state, API calls, persistent storage).
 *
 *   const [local, setLocal] = useDebouncedNumber(filters.style, (v) => setFilters({ style: v }));
 *   <input type="range" value={local} onChange={(e) => setLocal(Number(e.target.value))} />
 *
 * - The slider tracks `local`, which updates synchronously on every event.
 * - 250ms after the last change, `onCommit(local)` fires. Each new change
 *   resets the timer.
 * - If `value` changes externally (browser back/forward, another component
 *   updating URL state), `local` resyncs to it.
 *
 * Pass an unstable `onCommit` freely — the implementation routes through a
 * ref so it doesn't reset the debounce on every parent render.
 */
export function useDebouncedNumber(
  value: number,
  onCommit: (v: number) => void,
  delay = 250,
): readonly [number, (v: number) => void] {
  const [local, setLocal] = useState(value);

  const onCommitRef = useRef(onCommit);
  useEffect(() => {
    onCommitRef.current = onCommit;
  });

  // Resync when external value changes (e.g. browser nav).
  useEffect(() => {
    setLocal(value);
  }, [value]);

  // Debounced commit.
  useEffect(() => {
    if (local === value) return;
    const t = setTimeout(() => onCommitRef.current(local), delay);
    return () => clearTimeout(t);
  }, [local, value, delay]);

  return [local, setLocal] as const;
}
