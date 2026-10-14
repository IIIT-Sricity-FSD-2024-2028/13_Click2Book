/** Coloured pill for a status such as CONFIRMED, PENDING, COMPLETED or CANCELLED. The colour comes from the CSS class. */
export default function StatusBadge({ value }) {
  const cls = (value ?? 'none').replace(/\s/g, '_');
  return <span className={`c2b-badge c2b-badge-${cls}`}>{value ?? '—'}</span>;
}
