import { useState } from 'react';
import DataTable from '../../components/DataTable.jsx';
import { humanize } from '../../lib/format.js';
import BookingRow from './BookingRow.jsx';
import { BOOKING_STATUSES } from './sections.js';

export default function BookingsSection({ bookings, search, onSearchChange, onStatusChange, busy = false }) {
  const [statusFilter, setStatusFilter] = useState('');
  const query = search.toLowerCase();
  const filtered = bookings.filter((booking) => {
    const searchable = `${booking.id} ${booking.customer} ${booking.route}`.toLowerCase();
    return searchable.includes(query) && (!statusFilter || booking.status === statusFilter);
  });

  return (
    <section className="bookings-section">
      <div className="section-header">
        <h2 className="section-title">All Bookings</h2>
        <div className="filter-bar">
          <select className="filter-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All Status</option>
            {BOOKING_STATUSES.map((status) => <option key={status} value={status}>{humanize(status)}</option>)}
          </select>
          <input className="filter-input" placeholder="Search customer / route…" value={search} onChange={(event) => onSearchChange(event.target.value)} />
        </div>
      </div>
      <DataTable headers={['Booking ID', 'Customer', 'Route', 'Date', 'Seats', 'Status', 'Amount', 'Action']}>
        {filtered.map((booking) => <BookingRow key={booking.id} booking={booking} onStatusChange={onStatusChange} busy={busy} />)}
      </DataTable>
    </section>
  );
}
