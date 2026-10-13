import { useState } from 'react';
import { Card, EmptyRow, Table, matches } from '../components/ui';
import { StatusBadge } from '../lib/dashboardData';
import { adminActions, downloadCsv, formatINR } from '../lib/adminData';

export default function Bookings({ ctx }) {
  const { data, q, act, busy } = ctx;
  const [status, setStatus] = useState('all');
  const bookings = data.bookings.filter(
    (b) => (status === 'all' || b.status === status) && matches(q, b.id, b.customer, b.route, b.provider, b.date),
  );

  return (
    <Card
      title="All Bookings"
      count={bookings.length}
      id="bookingsCard"
      actions={
        <>
          <select className="filter-select" id="bookingStatusFilter" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            className="action-btn btn-ghost"
            onClick={() => downloadCsv('click2book-bookings.csv', bookings)}
            disabled={!bookings.length}
          >
            ⬇ Export CSV
          </button>
        </>
      }
    >
      <Table head={['Booking ID', 'Customer', 'Route', 'Operator', 'Seat', 'Date', 'Status', 'Amount', 'Action']} id="bookingsTable">
        {bookings.length === 0 ? (
          <EmptyRow icon="📭" message="No bookings match." />
        ) : (
          bookings.map((b) => (
            <tr key={b.id}>
              <td className="booking-id">{b.id}</td>
              <td>{b.customer}</td>
              <td>{b.route}</td>
              <td>{b.provider}</td>
              <td>{b.seat ?? '—'}</td>
              <td>{b.date}</td>
              <td>
                <StatusBadge status={b.status} />
              </td>
              <td className="amount">{formatINR(b.amount)}</td>
              <td className="actions-cell">
                {b.status === 'pending' && (
                  <button
                    className="action-btn btn-success"
                    disabled={busy === b.id}
                    onClick={() => act(b.id, `Booking ${b.id} confirmed.`, () => adminActions.confirmBooking(b.id))}
                  >
                    Confirm
                  </button>
                )}{' '}
                {(b.status === 'confirmed' || b.status === 'pending') && (
                  <button
                    className="action-btn btn-danger"
                    disabled={busy === b.id}
                    onClick={() =>
                      act(
                        b.id,
                        `Booking ${b.id} cancelled.`,
                        () => adminActions.cancelBooking(b.id),
                        `Cancel booking ${b.id} for ${b.customer}?`,
                      )
                    }
                  >
                    Cancel
                  </button>
                )}
                {b.status === 'cancelled' && <span className="muted">—</span>}
              </td>
            </tr>
          ))
        )}
      </Table>
    </Card>
  );
}
