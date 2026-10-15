import React from 'react';
import DataTable from '../../components/DataTable.jsx';
import MetricCard from '../../components/MetricCard.jsx';
import { money } from '../../lib/format.js';
import BookingRow from './BookingRow.jsx';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getWeekStart(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const weekday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - weekday);
  return start;
}

function toDateStr(date) {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function Overview({
  bookings = [],
  users = [],
  totalRevenue = 0,
  revenueByDay = [],
  activeBuses = 0,
  onViewAll,
}) {
  const currentDate = new Date();
  const todayLocal = toDateStr(currentDate);
  const todayIso = currentDate.toISOString().split('T')[0];
  const weekStart = getWeekStart(currentDate);

  const weeklyBookings = WEEKDAYS.map((_, index) => {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + index);
    const dayStr = toDateStr(day);
    return bookings.filter((booking) => {
      const d = String(booking.date || '').slice(0, 10);
      return d === dayStr;
    }).length;
  });
  const maxWeeklyBookings = Math.max(1, ...weeklyBookings);
  const maxDailyRevenue = Math.max(1, ...revenueByDay.map((day) => day.amount));
  const todayBookings = bookings.filter((booking) => {
    const d = String(booking.date || '').slice(0, 10);
    return d === todayLocal || d === todayIso;
  }).length;
  const activeAccounts = users.filter((user) => String(user.status || '').toLowerCase() === 'active').length;
  const recent = bookings.slice(0, 6);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <section className="stats-grid" aria-label="Key metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
        <MetricCard label="Total Bookings Today" value={todayBookings} delta="Today's reservations" icon="🎫" accent="#f97316" />
        <MetricCard label="Total Revenue" value={money(totalRevenue)} accent="#16a34a" delta="Net platform revenue" icon="₹" />
        <MetricCard label="Registered Users" value={activeAccounts} accent="#2563eb" delta="Active accounts" icon="👥" />
        <MetricCard label="Active Buses" value={activeBuses} accent="#9333ea" delta="Live on route" icon="🚌" />
      </section>

      <section className="charts-row" aria-label="Analytics" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        <div className="chart-card" style={{ background: '#ffffff', borderRadius: '14px', padding: '22px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
          <h2 className="chart-title" style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>Weekly Bookings</h2>
          <div className="chart-wrap chart-bars" style={{ height: '170px', display: 'flex', alignItems: 'flex-end', gap: '14px', paddingTop: '10px' }}>
            {weeklyBookings.map((value, index) => (
              <div className="chart-column" key={WEEKDAYS[index]} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <span style={{
                  width: '100%',
                  maxWidth: '34px',
                  height: `${Math.max(6, (value / maxWeeklyBookings) * 100)}%`,
                  background: '#f97316',
                  borderRadius: '6px 6px 2px 2px',
                  display: 'block',
                  transition: 'height 0.3s'
                }} />
                <small style={{ fontSize: '11px', color: '#64748b', marginTop: '8px', fontWeight: 600 }}>{WEEKDAYS[index]}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card" style={{ background: '#ffffff', borderRadius: '14px', padding: '22px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
          <h2 className="chart-title" style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>Revenue Trend (Last 7 Days)</h2>
          <div className="revenue-trend" aria-label="Daily net revenue for the last seven days" style={{ height: '170px', display: 'flex', alignItems: 'flex-end', gap: '12px', paddingTop: '10px' }}>
            {revenueByDay.map((day) => (
              <div className="revenue-day" key={day.date} title={`${day.date}: ${money(day.amount)}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <span className="revenue-day-amount" style={{ fontSize: '10px', color: '#16a34a', fontWeight: 700, marginBottom: '4px' }}>{money(day.amount)}</span>
                <span className="revenue-day-bar" style={{
                  width: '100%',
                  maxWidth: '30px',
                  height: `${Math.max(8, (day.amount / maxDailyRevenue) * 100)}%`,
                  background: 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)',
                  borderRadius: '6px 6px 2px 2px',
                  display: 'block'
                }} />
                <small style={{ fontSize: '11px', color: '#64748b', marginTop: '8px', fontWeight: 600 }}>{day.label}</small>
              </div>
            ))}
          </div>
          <p className="revenue-caption" style={{ fontSize: '12px', color: '#94a3b8', marginTop: '12px', textAlign: 'center' }}>Daily successful ticket receipts less initiated or completed refunds</p>
        </div>
      </section>

      <section className="bookings-section" aria-label="Recent bookings" style={{ background: '#ffffff', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 className="section-title" style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Recent Bookings</h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Latest customer travel reservations across all routes</p>
          </div>
          <button
            type="button"
            className="view-all-link"
            onClick={onViewAll}
            style={{
              background: '#fff7ed',
              color: '#ea580c',
              border: '1px solid #fed7aa',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            View All Bookings &rsaquo;
          </button>
        </div>
        <DataTable headers={['Booking ID', 'Customer', 'Route', 'Date', 'Status', 'Amount']}>
          {recent.map((booking) => (
            <BookingRow key={booking.id} booking={booking} />
          ))}
        </DataTable>
      </section>
    </div>
  );
}
