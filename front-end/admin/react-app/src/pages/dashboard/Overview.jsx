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

function asLocalDay(value) {
  if (!value) return null;
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default function Overview({ bookings, users, totalRevenue = 0, revenueByDay = [], activeBuses = 0, onViewAll }) {
  const weekStart = getWeekStart(new Date());
  const weeklyBookings = WEEKDAYS.map((_, index) => {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + index);
    return bookings.filter((booking) => {
      const bookingDay = asLocalDay(booking.date);
      return bookingDay && bookingDay.getTime() === day.getTime();
    }).length;
  });
  const maxWeeklyBookings = Math.max(1, ...weeklyBookings);
  const maxDailyRevenue = Math.max(1, ...revenueByDay.map((day) => day.amount));
  const currentDate = new Date();
  const today = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
  const todayBookings = bookings.filter((booking) => String(booking.date || '').slice(0, 10) === today).length;
  const recent = bookings.slice(0, 6);
  return (
    <>
      <section className="stats-grid" aria-label="Key metrics">
        <MetricCard label="Total Bookings Today" value={todayBookings} delta="Live records" />
        <MetricCard label="Total Revenue" value={money(totalRevenue)} accent="#22c55e" delta="After initiated and completed refunds" />
        <MetricCard label="Registered Users" value={users.length} accent="#3b82f6" delta="Customer, provider, admin and support accounts" />
        <MetricCard label="Active Buses" value={activeBuses} accent="#8b5cf6" delta="On scheduled or in progress trips" />
      </section>
      <section className="charts-row" aria-label="Analytics">
        <div className="chart-card">
          <h2 className="chart-title">Weekly Bookings</h2>
          <div className="chart-wrap chart-bars">
            {weeklyBookings.map((value, index) => (
              <div className="chart-column" key={WEEKDAYS[index]}>
                <span style={{ height: `${(value / maxWeeklyBookings) * 100}%` }} />
                <small>{WEEKDAYS[index]}</small>
              </div>
            ))}
          </div>
        </div>
        <div className="chart-card">
          <h2 className="chart-title">Revenue Trend</h2>
          <div className="revenue-trend" aria-label="Daily net revenue for the last seven days">
            {revenueByDay.map((day) => (
              <div className="revenue-day" key={day.date} title={`${day.date}: ${money(day.amount)}`}>
                <span className="revenue-day-amount">{money(day.amount)}</span>
                <span className="revenue-day-bar" style={{ height: `${Math.max(4, (day.amount / maxDailyRevenue) * 100)}%` }} />
                <small>{day.label}</small>
              </div>
            ))}
          </div>
          <p className="revenue-caption">Daily payments less refunds initiated or completed · last 7 days</p>
        </div>
      </section>
      <section className="bookings-section" aria-label="Recent bookings">
        <div className="section-header">
          <h2 className="section-title">Recent Bookings</h2>
          <button type="button" className="view-all-link" onClick={onViewAll}>View All ›</button>
        </div>
        <DataTable headers={['Booking ID', 'Customer', 'Route', 'Date', 'Status', 'Amount']}>
          {recent.map((booking) => <BookingRow key={booking.id} booking={booking} />)}
        </DataTable>
      </section>
    </>
  );
}
