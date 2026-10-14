import StatusBadge from '../../components/StatusBadge.jsx';
import { displayDate, humanize, money } from '../../lib/format.js';

export default function BookingRow({ booking, onStatusChange, busy = false }) {
  const withActions = Boolean(onStatusChange);
  const allowedUpdates = booking.status === 'pending'
    ? ['confirmed']
    : booking.status === 'confirmed'
      ? ['cancelled']
      : [];
  return (
    <tr>
      <td><b>{booking.id}</b></td>
      <td>{booking.customer}</td>
      <td>{booking.route}</td>
      <td>{displayDate(booking.date)}</td>
      {withActions && <td>{booking.seats}</td>}
      <td><StatusBadge status={booking.status} /></td>
      <td>{money(booking.amount)}</td>
      {withActions && (
        <td>
          <select className="action-select" value="" disabled={busy || allowedUpdates.length === 0} aria-label={`Update status for ${booking.id}`} onChange={(event) => event.target.value && onStatusChange(booking.id, event.target.value)}>
            <option value="" disabled>{allowedUpdates.length ? 'Update status' : 'No updates available'}</option>
            {allowedUpdates.map((status) => <option key={status} value={status}>{humanize(status)}</option>)}
          </select>
        </td>
      )}
    </tr>
  );
}
