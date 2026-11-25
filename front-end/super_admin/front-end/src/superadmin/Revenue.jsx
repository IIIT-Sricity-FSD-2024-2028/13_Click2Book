import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Navigate } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import { useRevenueDemo } from './revenueMock';
import CanvasChart from './CanvasChart';
import { downloadCsv, lastDays, lastMonths } from './revenueUtils';
import PricingRulesCard from './PricingRulesCard';
import RefundsCard from './RefundsCard';
import {
  fetchLedgerThunk,
  fetchPaymentsThunk,
  fetchSupportTicketsThunk,
  initRevenueDashboardThunk,
  refreshRevenueDashboardThunk,
  resolveSupportTicketThunk,
  saveRevenueConfigThunk,
  setLedgerFilter,
  setPaymentFilter,
  setTicketFilter,
  setTrendMode,
  transferPayoutThunk,
} from '../store/actions';
import './Revenue.css';

/** Backend money values are paise. */
const rupees = (paise) => (paise / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
/** Payments are stored in rupees. */
const inr = (r) => rupees((Number(r) || 0) * 100);

const isSuccess = (p) => String(p.paymentStatus).toUpperCase() === 'SUCCESS';
const net = (p) => (Number(p.amount) || 0) - (Number(p.discountAmount) || 0);

/** Successful payments grouped into periods (`keyOf` maps a YYYY-MM-DD date to a period key). */
function revenueSeries(periods, payments, keyOf) {
  const rows = Object.fromEntries(periods.map((p) => [p.key, { period: p.label, key: p.key, payments: 0, revenue: 0 }]));
  payments.filter(isSuccess).forEach((p) => {
    const r = rows[keyOf(String(p.paymentDate))];
    if (!r) return;
    r.payments += 1;
    r.revenue += net(p);
  });
  return periods.map((p) => rows[p.key]);
}

/** "lost_and_found" → "Lost and found" */
const humanize = (v) =>
  v
    ? String(v)
        .replace(/_/g, ' ')
        .replace(/^./, (c) => c.toUpperCase())
    : '—';

function StatusBadge({ status, ticket }) {
  const cls = ticket ? (status === 'open' ? 'badge-open' : 'badge-resolved') : 'badge-' + status;
  return <span className={`badge ${cls}`}>{humanize(status)}</span>;
}

/**
 * Super Admin revenue page backed by Redux Toolkit store.
 */
export default function Revenue() {
  usePageTitle('Revenue – Click2Book Super Admin');
  const isAuthenticated = useSelector((state) => state.auth.superUserAuth);
  if (!isAuthenticated) return <Navigate to="/super-admin/login" replace />;
  return <RevenueDashboard />;
}

function RevenueDashboard() {
  const dispatch = useDispatch();
  const demo = useRevenueDemo();
  const {
    connected,
    config: storeConfig,
    warning,
    stats,
    ledger,
    tickets,
    payments,
    payouts,
    transfers,
    transferring,
  } = useSelector((state) => state.revenue);
  const { ledgerFilter, ticketFilter, paymentFilter, trendMode } = useSelector((state) => state.ui);

  const [config, setConfig] = useState(storeConfig);

  useEffect(() => {
    setConfig(storeConfig);
  }, [storeConfig]);

  useEffect(() => {
    dispatch(initRevenueDashboardThunk());
  }, [dispatch]);

  // Pick up new customer bookings and payments without a manual reload.
  useEffect(() => {
    if (!connected || demo) return undefined;
    const timer = setInterval(() => {
      dispatch(refreshRevenueDashboardThunk(ledgerFilter));
    }, 5000);
    return () => clearInterval(timer);
  }, [connected, demo, ledgerFilter, dispatch]);

  const saveConfig = async (e) => {
    e.preventDefault();
    const res = await dispatch(saveRevenueConfigThunk(config));
    if (!res?.success) {
      alert('Failed to save config: ' + res?.error);
    }
  };

  const transferTo = async (p) => {
    if (!window.confirm(`Transfer ${rupees(p.total)} to ${p.label} for ${p.count} booking(s)?`)) return;
    const res = await dispatch(transferPayoutThunk(p.id, ledgerFilter));
    if (!res?.success) {
      alert('Transfer failed: ' + res?.error);
    }
  };

  const resolveTicket = async (ticketId) => {
    const res = await dispatch(resolveSupportTicketThunk(ticketId, ticketFilter));
    if (!res?.success) {
      alert('Failed to resolve ticket: ' + res?.error);
    }
  };

  const setField = (key) => (e) => setConfig((c) => ({ ...c, [key]: e.target.value }));

  const allPayments = payments || [];
  const success = allPayments.filter(isSuccess);
  const paidTotal = success.reduce((s, p) => s + net(p), 0);
  const cards = [
    ...(payments
      ? [
          { label: `Gross Revenue (${success.length} payments)`, value: inr(paidTotal), accent: '#16a34a' },
          { label: `Total Booking Amount (${success.length} bookings)`, value: inr(paidTotal), accent: '#F97316' },
        ]
      : []),
    ...(stats
      ? [
          // The platform's commission is what it collects as gateway fees.
          { label: 'Total Platform Commission', value: rupees(stats.summary.gatewayFee), accent: '#3b82f6' },
          { label: 'Total Gateway Fees', value: rupees(stats.summary.gatewayFee), accent: '#64748b' },
        ]
      : []),
  ];
  const trend =
    trendMode === 'daily'
      ? revenueSeries(lastDays(14), allPayments, (d) => d.slice(0, 10))
      : revenueSeries(lastMonths(12), allPayments, (d) => d.slice(0, 7));
  const shownPayments = paymentFilter ? allPayments.filter((p) => p.paymentStatus === paymentFilter) : allPayments;

  return (
    <div className="pg-superadmin-revenue">
      <div className="topbar">
        <div className="topbar-left">
          <Link to="/super-admin" className="back-link">
            ← Super Admin
          </Link>
          <div>
            <div className="page-title">Revenue</div>
            <div className="page-sub">Gross revenue, commission, fees, payouts, payments, refunds and support costs</div>
          </div>
        </div>
        <span
          id="connBadge"
          title={demo ? 'The backend (port 3000) is not running, so this page shows demo data. Changes last until you reload.' : undefined}
          style={connected === null ? undefined : { background: demo ? '#f59e0b' : connected ? '#22c55e' : '#ef4444', color: '#fff' }}
        >
          {connected === null ? 'Connecting…' : demo ? '● Demo data (backend offline)' : connected ? '● API Connected' : '● API Offline'}
        </span>
      </div>

      <div className="wrap">
        <section className="stats-grid" id="summaryStats">
          {cards.map((s) => (
            <div className="stat-card" key={s.label} style={{ '--accent': s.accent }}>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </section>

        <div className="card">
          <div className="card-title">Revenue Trend</div>
          <div className="card-sub">Successful payments after discounts, by payment date.</div>
          <div className="filter-bar">
            <div className="seg">
              <button className={trendMode === 'daily' ? 'on' : ''} id="dailyBtn" onClick={() => dispatch(setTrendMode('daily'))}>
                Daily (14 days)
              </button>
              <button className={trendMode === 'monthly' ? 'on' : ''} id="monthlyBtn" onClick={() => dispatch(setTrendMode('monthly'))}>
                Monthly (12 months)
              </button>
            </div>{' '}
            <button
              className="btn btn-ghost btn-sm"
              id="exportTrendBtn"
              onClick={() =>
                downloadCsv(
                  `click2book-${trendMode}-revenue.csv`,
                  trend.map(({ key, ...r }) => ({ date: key, ...r })),
                )
              }
            >
              ⬇ Export CSV
            </button>
          </div>
          <div className="chart-wrap">
            <CanvasChart
              key={trendMode}
              id={`${trendMode}RevenueChart`}
              type="line"
              labels={trend.map((r) => r.period)}
              values={trend.map((r) => r.revenue)}
              color="#16a34a"
              fill="rgba(22,163,74,0.08)"
            />
          </div>
          <div className="table-wrap">
            <table id="trendTable">
              <thead>
                <tr>
                  <th>Period</th>
                  <th className="num">Payments</th>
                  <th className="num">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {[...trend].reverse().map((r) => (
                  <tr key={r.key}>
                    <td>{r.period}</td>
                    <td className="num">{r.payments}</td>
                    <td className="num">{inr(r.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Revenue Split Configuration</div>
          <div className="card-sub">
            Commission, convenience fee and gateway fee (money in rupees — stored as paise).
          </div>
          <form id="configForm" onSubmit={saveConfig}>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="commissionPct">Commission %</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  id="commissionPct"
                  required
                  value={config.commissionPct}
                  onChange={setField('commissionPct')}
                />
              </div>
              <div className="field">
                <label htmlFor="convenienceFee">Convenience Fee (Rs.)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  id="convenienceFee"
                  required
                  value={config.convenienceFee}
                  onChange={setField('convenienceFee')}
                />
              </div>
              <div className="field">
                <label htmlFor="gatewayFeePct">Gateway Fee %</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  id="gatewayFeePct"
                  required
                  value={config.gatewayFeePct}
                  onChange={setField('gatewayFeePct')}
                />
              </div>
            </div>
            <button className="btn btn-primary" type="submit">
              Save Configuration
            </button>
            <div className="warning-box" id="configWarning" style={warning ? { display: 'block' } : undefined}>
              {warning}
            </div>
          </form>
        </div>

        <PricingRulesCard />

        <div className="card">
          <div className="card-title">Operator Payouts</div>
          <div className="card-sub">
            Each booking's fare minus platform commission is owed to the operator that runs the trip (cancelled bookings excluded).
            Transfer sends an operator everything still due and marks those bookings as paid out.
          </div>
          <div className="table-wrap">
            <table id="payoutsTable">
              <thead>
                <tr>
                  <th>Operator</th>
                  <th className="num">Bookings Due</th>
                  <th className="num">Payout Due</th>
                  <th className="num">Paid Out</th>
                  <th className="num">Action</th>
                </tr>
              </thead>
              <tbody>
                {payouts?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="empty">
                      No ledger entries yet — payouts appear once customers book through the backend.
                    </td>
                  </tr>
                )}
                {payouts?.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.label}</strong> <span className="mono muted">{p.id}</span>
                    </td>
                    <td className="num">{p.count}</td>
                    <td className="num">{rupees(p.total)}</td>
                    <td className="num">
                      {rupees(p.paidTotal || 0)} <span className="muted">({p.paidCount || 0})</span>
                    </td>
                    <td className="num">
                      {p.total > 0 && !demo ? (
                        <button className="btn btn-primary btn-sm" disabled={transferring === p.id} onClick={() => transferTo(p)}>
                          {transferring === p.id ? 'Transferring…' : 'Transfer'}
                        </button>
                      ) : (
                        <span className="muted">{p.total > 0 ? '—' : 'Settled'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Payout Transfers</div>
          <div className="card-sub">Every transfer made to an operator, newest first.</div>
          <div className="table-wrap">
            <table id="transfersTable">
              <thead>
                <tr>
                  <th>Transfer</th>
                  <th>Operator</th>
                  <th className="num">Bookings</th>
                  <th className="num">Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {transfers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="empty">
                      No transfers yet.
                    </td>
                  </tr>
                )}
                {transfers.map((t) => (
                  <tr key={t.transferId}>
                    <td className="mono">{t.transferId}</td>
                    <td>
                      <strong>{t.providerName}</strong> <span className="mono muted">{t.providerId}</span>
                    </td>
                    <td className="num">{t.bookingCount}</td>
                    <td className="num">{rupees(t.amount)}</td>
                    <td>{t.createdAt.replace('T', ' ').slice(0, 16)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Transaction Ledger</div>
          <div className="card-sub">One row per booking. Base fare and operator payout are locked at booking time.</div>
          <div className="filter-bar">
            <select
              id="ledgerStatusFilter"
              value={ledgerFilter}
              onChange={(e) => {
                dispatch(setLedgerFilter(e.target.value));
                dispatch(fetchLedgerThunk(e.target.value));
              }}
            >
              <option value="">All statuses</option>
              <option value="clean">Clean</option>
              <option value="cancelled">Cancelled</option>
              <option value="disputed">Disputed</option>
            </select>{' '}
            <button className="btn btn-ghost btn-sm" id="refreshLedgerBtn" onClick={() => dispatch(fetchLedgerThunk(ledgerFilter))}>
              Refresh
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Booking</th>
                  <th className="num">Base Fare</th>
                  <th className="num">Commission</th>
                  <th className="num">Operator Payout</th>
                  <th className="num">Gateway Fee</th>
                  <th className="num">Support Cost</th>
                  <th className="num">Admin Net</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody id="ledgerTbody">
                {ledger?.length === 0 && (
                  <tr>
                    <td colSpan={8} className="empty">
                      No ledger rows yet — book a trip to see one appear.
                    </td>
                  </tr>
                )}
                {ledger?.map((r) => (
                  <tr key={r.bookingId}>
                    <td className="mono">{r.bookingId}</td>
                    <td className="num">{rupees(r.baseFare)}</td>
                    <td className="num">{rupees(r.platformCommission)}</td>
                    <td className="num">{rupees(r.operatorPayout)}</td>
                    <td className="num">{rupees(r.gatewayFee)}</td>
                    <td className="num">{rupees(r.supportCost)}</td>
                    <td className="num">{rupees(r.adminNet)}</td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Payments</div>
          <div className="card-sub">Every customer payment. Gross revenue counts successful payments after discounts.</div>
          <div className="filter-bar">
            <select id="paymentStatusFilter" value={paymentFilter} onChange={(e) => dispatch(setPaymentFilter(e.target.value))}>
              <option value="">All statuses</option>
              <option value="SUCCESS">Success</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>{' '}
            <button
              className="btn btn-ghost btn-sm"
              id="exportPaymentsBtn"
              onClick={() => downloadCsv('click2book-payments.csv', allPayments)}
              disabled={!allPayments.length}
            >
              ⬇ Export CSV
            </button>
          </div>
          <div className="table-wrap">
            <table id="paymentsTable">
              <thead>
                <tr>
                  <th>Payment</th>
                  <th>Booking</th>
                  <th>Method</th>
                  <th className="num">Amount</th>
                  <th className="num">Discount</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments && shownPayments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="empty">
                      No payments match.
                    </td>
                  </tr>
                )}
                {shownPayments.map((p) => (
                  <tr key={p.paymentId || p.bookingId}>
                    <td className="mono">{p.paymentId || '—'}</td>
                    <td className="mono">{p.bookingId}</td>
                    <td>{p.paymentMethod || '—'}</td>
                    <td className="num">{inr(p.amount)}</td>
                    <td className="num">{p.discountAmount ? inr(p.discountAmount) : '—'}</td>
                    <td>{p.paymentDate}</td>
                    <td>
                      <StatusBadge status={String(p.paymentStatus).toLowerCase()} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <RefundsCard onChange={() => dispatch(fetchPaymentsThunk())} />

        <div className="card">
          <div className="card-title">Support Tickets</div>
          <div className="card-sub">
            Every ticket wraps a cancellation, complaint, SOS, lost-item, or dispute and draws its cost from the booking's ledger.
          </div>
          <div className="filter-bar">
            <select
              id="ticketStatusFilter"
              value={ticketFilter}
              onChange={(e) => {
                dispatch(setTicketFilter(e.target.value));
                dispatch(fetchSupportTicketsThunk(e.target.value));
              }}
            >
              <option value="">All statuses</option>
              <option value="open">Open</option>
              <option value="resolved">Resolved</option>
            </select>{' '}
            <button className="btn btn-ghost btn-sm" id="refreshTicketsBtn" onClick={() => dispatch(fetchSupportTicketsThunk(ticketFilter))}>
              Refresh
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Booking</th>
                  <th>Category</th>
                  <th>Source</th>
                  <th className="num">Cost Applied</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody id="ticketsTbody">
                {tickets?.length === 0 && (
                  <tr>
                    <td colSpan={7} className="empty">
                      No support tickets yet.
                    </td>
                  </tr>
                )}
                {tickets?.map((t) => (
                  <tr key={t.ticketId}>
                    <td className="mono">{t.ticketId}</td>
                    <td className="mono">{t.bookingId}</td>
                    <td>{humanize(t.category)}</td>
                    <td>{humanize(t.sourceModule)}</td>
                    <td className="num">{rupees(t.costApplied)}</td>
                    <td>
                      <StatusBadge status={t.status} ticket />
                    </td>
                    <td>
                      {t.status === 'open' && (
                        <button className="btn btn-ghost btn-sm" onClick={() => resolveTicket(t.ticketId)}>
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
