import React from 'react';
import DataTable from '../../components/DataTable.jsx';
import MetricCard from '../../components/MetricCard.jsx';
import { humanize, money } from '../../lib/format.js';
import { BOOKING_STATUSES } from './sections.js';

export default function ReportsSection({ bookings = [], refunds = [], users = [], routes = [], totalRevenue = 0 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <section className="stats-grid" aria-label="Report summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
        <MetricCard label="Total Lifetime Bookings" value={bookings.length} delta="All records" icon="🎫" accent="#f97316" />
        <MetricCard label="Total Platform Revenue" value={money(totalRevenue)} accent="#16a34a" delta="Net collected" icon="₹" />
        <MetricCard label="Refund Claims Processed" value={refunds.length} accent="#dc2626" delta="Cancelled tickets" icon="↻" />
        <MetricCard label="Registered Users" value={users.length} accent="#2563eb" delta="All accounts" icon="👥" />
      </section>

      <section className="bookings-section" style={{ background: '#ffffff', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
        <div className="section-header" style={{ marginBottom: '20px' }}>
          <h2 className="section-title" style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Booking Status Breakdown</h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Current lifecycle distribution across all customer bookings</p>
        </div>
        <div className="report-bars" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {BOOKING_STATUSES.map((status) => {
            const count = bookings.filter((booking) => booking.status === status).length;
            const width = bookings.length ? Math.round((count / bookings.length) * 100) : 0;
            return (
              <div className="report-bar-row" key={status} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 60px', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>{humanize(status)}</span>
                <div className="report-bar-track" style={{ height: '10px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
                  <div
                    className="report-bar-fill"
                    style={{
                      height: '100%',
                      width: `${width}%`,
                      background: status === 'confirmed' ? '#16a34a' : status === 'pending' ? '#f97316' : '#ef4444',
                      borderRadius: '6px',
                      transition: 'width 0.4s'
                    }}
                  />
                </div>
                <b style={{ fontSize: '13px', color: '#0f172a', textAlign: 'right' }}>{count} ({width}%)</b>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bookings-section" style={{ background: '#ffffff', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
        <div className="section-header" style={{ marginBottom: '16px' }}>
          <h2 className="section-title" style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Route & Transit Analytics</h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Operating distance, estimated duration, and active vehicle allocations</p>
        </div>
        <DataTable headers={['Route Code', 'Source City', 'Destination City', 'Distance', 'Estimated Duration', 'Active Buses']} emptyText="No route data currently loaded.">
          {routes.map((route) => (
            <tr key={route.routeId || route.route_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '14px 18px', fontSize: '13px', fontWeight: 700, color: '#0B2447' }}>{route.routeId || route.route_id}</td>
              <td style={{ padding: '14px 18px', fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{route.source}</td>
              <td style={{ padding: '14px 18px', fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{route.destination}</td>
              <td style={{ padding: '14px 18px', fontSize: '13px', color: '#475569' }}>{route.distance} km</td>
              <td style={{ padding: '14px 18px', fontSize: '13px', color: '#64748b' }}>{route.duration || '—'}</td>
              <td style={{ padding: '14px 18px', fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{route.activeBuses ?? 0}</td>
            </tr>
          ))}
        </DataTable>
      </section>
    </div>
  );
}
