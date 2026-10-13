import { useNavigate } from 'react-router-dom';
import CanvasChart from '../components/CanvasChart';
import { EmptyRow, Table, matches } from '../components/ui';
import { StatusBadge } from '../lib/dashboardData';
import { formatINR } from '../lib/adminData';

function StatCard({ color, light, icon, value, label, sub, onClick, id }) {
  return (
    <button
      type="button"
      className="stat-card stat-card-btn"
      id={id}
      style={{ '--accent': color, '--accent-light': light }}
      onClick={onClick}
    >
      <div className="stat-icon-wrap" style={{ background: 'var(--accent-light)' }}>
        {icon}
      </div>
      <div className="stat-body">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
      <div className="stat-decorator" style={{ background: 'var(--accent-light)' }} />
    </button>
  );
}

const svg = (stroke, children) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round">
    {children}
  </svg>
);

export default function Overview({ ctx }) {
  const navigate = useNavigate();
  const { data, q, open, can } = ctx;
  const s = data.stats;
  const recent = data.bookings.filter((b) => matches(q, b.id, b.customer, b.route)).slice(0, 8);
  const go = (section) => () => can(section) && open(section);

  return (
    <>
      <section className="stats-grid" aria-label="Key metrics">
        <StatCard
          id="stat-bookings"
          color="#F97316"
          light="#FFF4EC"
          value={s.totalBookings}
          label="Total Bookings"
          sub={`${s.bookingsToday} today · ${s.confirmed} confirmed · ${s.cancelled} cancelled`}
          onClick={go('bookings')}
          icon={svg('#F97316', [<rect key="a" x="2" y="7" width="20" height="14" rx="2" />, <path key="b" d="M16 3H8l-2 4h12l-2-4z" />])}
        />
        <StatCard
          id="stat-revenue"
          color="#22c55e"
          light="#F0FDF4"
          value={formatINR(s.revenue)}
          label="Total Revenue"
          sub={`${formatINR(s.revenueToday)} today · ${formatINR(s.commissionEstimate)} commission`}
          onClick={go('finance')}
          icon={svg('#22c55e', [
            <path key="a" d="M6 3h12M6 8h12M6 13h8.5l-5 8M6 13h3" />,
            <path key="b" d="M9 13c6.667 0 6.667-10 0-10" />,
          ])}
        />
        <StatCard
          id="stat-users"
          color="#3b82f6"
          light="#EFF6FF"
          value={ctx.live ? s.customers : (data.offlineUsers ?? 0)}
          label="Customers"
          sub={`${s.activeCustomers} with active bookings`}
          onClick={go('customers')}
          icon={svg('#3b82f6', [
            <path key="a" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />,
            <circle key="b" cx="9" cy="7" r="4" />,
            <path key="c" d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />,
          ])}
        />
        <StatCard
          id="stat-buses"
          color="#8b5cf6"
          light="#F5F3FF"
          value={s.activeBuses}
          label="Active Buses"
          sub={`${s.approvedProviders} operators · ${data.counts.trips} trips · ${data.counts.routes} routes`}
          onClick={go('buses')}
          icon={svg('#8b5cf6', [<rect key="a" x="1" y="3" width="22" height="13" rx="2" />, <path key="b" d="M5 20h14M8 17v3M16 17v3" />])}
        />
      </section>

      {(s.pendingProviders > 0 || s.openEmergencies > 0 || s.openRequests > 0 || s.pendingRefunds > 0) && (
        <section className="attention-row" id="attentionRow">
          {s.openEmergencies > 0 && (
            <button className="attention danger" onClick={go('support')}>
              🚨 {s.openEmergencies} open SOS alert{s.openEmergencies > 1 ? 's' : ''}
            </button>
          )}
          {s.escalated > 0 && (
            <button className="attention danger" onClick={go('support')}>
              ⬆️ {s.escalated} escalated complaint{s.escalated > 1 ? 's' : ''}
            </button>
          )}
          {s.pendingProviders > 0 && (
            <button className="attention warn" onClick={go('providers')}>
              🚌 {s.pendingProviders} provider{s.pendingProviders > 1 ? 's' : ''} awaiting approval
            </button>
          )}
          {s.pendingRefunds > 0 && (
            <button className="attention warn" onClick={go('finance')}>
              ↩️ {s.pendingRefunds} refund{s.pendingRefunds > 1 ? 's' : ''} to process
            </button>
          )}
          {s.openRequests > 0 && (
            <button className="attention info" onClick={go('support')}>
              💬 {s.openRequests} unresolved complaint{s.openRequests > 1 ? 's' : ''}
            </button>
          )}
        </section>
      )}

      <section className="charts-row" aria-label="Analytics">
        <div className="chart-card">
          <h2 className="chart-title">Bookings by Weekday</h2>
          <p className="chart-sub">All {s.totalBookings} bookings, grouped by booking date</p>
          <div className="chart-wrap">
            <CanvasChart id="weeklyBookingsChart" type="bar" labels={data.weekly.labels} values={data.weekly.values} color="#F97316" />
          </div>
        </div>
        <div className="chart-card">
          <h2 className="chart-title">Revenue — Last 6 Months</h2>
          <p className="chart-sub">Successful payments per month</p>
          <div className="chart-wrap">
            <CanvasChart
              id="revenueTrendChart"
              type="line"
              labels={data.trend.labels}
              values={data.trend.values}
              color="#1e40af"
              fill="rgba(30,64,175,0.06)"
            />
          </div>
        </div>
      </section>

      <section className="bookings-section" aria-label="Recent bookings">
        <div className="section-header">
          <h2 className="section-title">Recent Bookings</h2>
          {can('bookings') && (
            <button className="view-all-link link-btn" id="viewAllLink" onClick={go('bookings')}>
              View All <span>›</span>
            </button>
          )}
          {!can('bookings') && can('reports') && (
            <button className="view-all-link link-btn" onClick={() => navigate('/admin/revenue-dashboard')}>
              Revenue dashboard ›
            </button>
          )}
        </div>
        <Table head={['Booking ID', 'Customer', 'Route', 'Date', 'Status', 'Amount']} id="recentBookingsTable">
          {recent.length === 0 ? (
            <EmptyRow icon="📭" message="No bookings found." />
          ) : (
            recent.map((b) => (
              <tr key={b.id}>
                <td className="booking-id">{b.id}</td>
                <td>{b.customer}</td>
                <td>{b.route}</td>
                <td>{b.date}</td>
                <td>
                  <StatusBadge status={b.status} />
                </td>
                <td className="amount">{formatINR(b.amount)}</td>
              </tr>
            ))
          )}
        </Table>
      </section>
    </>
  );
}
