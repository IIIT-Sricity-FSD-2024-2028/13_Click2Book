import { humanize } from '../lib/format.js';

export default function StatusBadge({ status }) {
  const norm = String(status || '').toLowerCase().replace(/\s+/g, '-');
  return <span className={`badge badge-${norm}`}>{humanize(status || '—')}</span>;
}
