import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Transient toast notification. `showToast(message, type)` replaces any
 * toast on screen, fades it in, and removes it after `duration` ms.
 * Render the returned toast with <Toast toast={toast} />.
 */
export default function useToast(duration = 3000) {
  const [toast, setToast] = useState(null); // { id, message, type, visible }
  const timers = useRef([]);

  const showToast = useCallback(
    (message, type = 'success') => {
      timers.current.forEach(clearTimeout);
      const id = Date.now() + Math.random();
      const update = (fn) => setToast((t) => (t && t.id === id ? fn(t) : t));
      setToast({ id, message, type, visible: false });
      timers.current = [
        setTimeout(() => update((t) => ({ ...t, visible: true })), 20),
        setTimeout(() => update((t) => ({ ...t, visible: false })), duration),
        setTimeout(() => update(() => null), duration + 400),
      ];
    },
    [duration],
  );

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  return [toast, showToast];
}
