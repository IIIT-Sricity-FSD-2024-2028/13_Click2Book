import { useEffect, useState } from 'react';

const TONES = {
  live: { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' },
  offline: { background: '#fef9c3', color: '#854d0e', border: '1px solid #fde047' },
  error: { background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' },
};

/** Small bottom-left status pill (e.g. "🟢 Live — 3 trips") that fades after a few seconds. */
export default function SourceBadge({ tone = 'live', children }) {
  const [faded, setFaded] = useState(false);
  useEffect(() => {
    setFaded(false);
    const t = setTimeout(() => setFaded(true), 5000);
    return () => clearTimeout(t);
  }, [tone, children]);
  if (!children) return null;
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 12,
        left: 12,
        zIndex: 900,
        padding: '4px 12px',
        borderRadius: 20,
        fontSize: 14,
        fontWeight: 600,
        opacity: faded ? 0 : 1,
        transition: 'opacity 0.4s',
        pointerEvents: 'none',
        ...TONES[tone],
      }}
    >
      {children}
    </div>
  );
}
