import { useEffect, useRef } from 'react';

/** Call `handler` whenever Enter is pressed anywhere on the page. */
export default function useEnterKey(handler) {
  const latest = useRef(handler);
  latest.current = handler;
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter') latest.current(e);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
}
