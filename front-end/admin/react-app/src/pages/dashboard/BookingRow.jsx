import React from 'react';
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
    <tr style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
      <td style={{ padding: '14px 18px', fontSize: '13px', fontWeight: 700, color: '#0B2447' }}>
        {booking.id}
      </td>
      <td style={{ padding: '14px 18px', fontSize: '13px', color: '#1e293b', fontWeight: 500 }}>
        {booking.customer}
      </td>
      <td style={{ padding: '14px 18px', fontSize: '13px', color: '#475569' }}>
        {booking.route}
      </td>
      <td style={{ padding: '14px 18px', fontSize: '13px', color: '#64748b' }}>
        {displayDate(booking.date)}
      </td>
      {withActions && (
        <td style={{ padding: '14px 18px', fontSize: '13px', color: '#334155' }}>
          {booking.seats}
        </td>
      )}
      <td style={{ padding: '14px 18px' }}>
        <StatusBadge status={booking.status} />
      </td>
      <td style={{ padding: '14px 18px', fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
        {money(booking.amount)}
      </td>
      {withActions && (
        <td style={{ padding: '14px 18px' }}>
          {allowedUpdates.length > 0 ? (
            <select
              className="action-select"
              value=""
              disabled={busy}
              aria-label={`Update status for ${booking.id}`}
              onChange={(event) => event.target.value && onStatusChange(booking.id, event.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                background: '#fff',
                cursor: 'pointer',
                color: '#1e293b'
              }}
            >
              <option value="" disabled>Change status…</option>
              {allowedUpdates.map((status) => (
                <option key={status} value={status}>
                  {status === 'confirmed' ? 'Confirm Booking' : 'Cancel Booking'}
                </option>
              ))}
            </select>
          ) : (
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>—</span>
          )}
        </td>
      )}
    </tr>
  );
}
