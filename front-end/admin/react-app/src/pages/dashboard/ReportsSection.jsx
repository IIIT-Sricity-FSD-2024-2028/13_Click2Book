import DataTable from '../../components/DataTable.jsx';
import MetricCard from '../../components/MetricCard.jsx';
import { humanize, money } from '../../lib/format.js';
import { BOOKING_STATUSES } from './sections.js';

export default function ReportsSection({ bookings, refunds, users, routes = [], totalRevenue = 0 }) {
  return (
    <>
      <section className="stats-grid" aria-label="Report summary">
        <MetricCard label="Total Bookings" value={bookings.length} delta="All records" />
        <MetricCard label="Total Revenue" value={money(totalRevenue)} accent="#22c55e" />
        <MetricCard label="Total Refunds" value={refunds.length} accent="#ef4444" />
        <MetricCard label="Total Users" value={users.length} accent="#3b82f6" />
      </section>
      <section className="bookings-section">
        <div className="section-header"><h2 className="section-title">Booking Status Distribution</h2></div>
        <div className="report-bars">
          {BOOKING_STATUSES.map((status) => {
            const count = bookings.filter((booking) => booking.status === status).length;
            const width = bookings.length ? (count / bookings.length) * 100 : 0;
            return (
              <div className="report-bar-row" key={status}>
                <span>{humanize(status)}</span>
                <div className="report-bar-track"><div className="report-bar-fill" style={{ width: `${width}%` }} /></div>
                <b>{count}</b>
              </div>
            );
          })}
        </div>
      </section>
      <section className="bookings-section">
        <div className="section-header"><h2 className="section-title">Route Analytics</h2></div>
        <DataTable headers={['Route ID', 'From', 'To', 'Distance', 'Duration', 'Active Buses']}>
          {routes.map((route) => (
            <tr key={route.routeId || route.route_id}>
              <td>{route.routeId || route.route_id}</td>
              <td>{route.source}</td>
              <td>{route.destination}</td>
              <td>{route.distance} km</td>
              <td>{route.duration || '—'}</td>
              <td>{route.activeBuses ?? 0}</td>
            </tr>
          ))}
        </DataTable>
      </section>
    </>
  );
}
