import React, { useState } from 'react';
import DataTable from '../../components/DataTable.jsx';
import { humanize } from '../../lib/format.js';
import BookingRow from './BookingRow.jsx';
import { BOOKING_STATUSES } from './sections.js';

export default function BookingsSection({ bookings = [], search = '', onSearchChange, onStatusChange, busy = false }) {
  const [statusFilter, setStatusFilter] = useState('');
  const query = (search || '').toLowerCase();
  const filtered = bookings.filter((booking) => {
    const searchable = `${booking.id} ${booking.customer} ${booking.route}`.toLowerCase();
    return searchable.includes(query) && (!statusFilter || booking.status === statusFilter);
  });

  return (
    <section className="bookings-section" style={{ background: '#ffffff', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h2 className="section-title" style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>All Travel Bookings</h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Browse, filter, and manage customer tickets and statuses</p>
        </div>
        <div className="filter-bar" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              color: '#334155',
              background: '#fff',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="">All Statuses</option>
            {BOOKING_STATUSES.map((status) => (
              <option key={status} value={status}>
                {humanize(status)}
              </option>
            ))}
          </select>
          <input
            className="filter-input"
            placeholder="Search by customer or route…"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              minWidth: '240px',
              outline: 'none'
            }}
          />
        </div>
      </div>
      <DataTable headers={['Booking ID', 'Customer', 'Route', 'Travel Date', 'Seats', 'Status', 'Amount', 'Action']} emptyText="No bookings match your current filter.">
        {filtered.map((booking) => (
          <BookingRow key={booking.id} booking={booking} onStatusChange={onStatusChange} busy={busy} />
        ))}
      </DataTable>
    </section>
  );
}
