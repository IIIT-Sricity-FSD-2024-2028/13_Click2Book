import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import { revenueRequest, useRevenueDemo } from './revenueMock';
import CanvasChart from './CanvasChart';
import { downloadCsv, lastDays, lastMonths } from './revenueUtils';
import PricingRulesCard from './PricingRulesCard';
import RefundsCard from './RefundsCard';
import './Revenue.css';

/** The revenue endpoints are ADMIN-role routes on the backend (demo data when it is offline). */
const adminFetch = (path, opts) => revenueRequest(path, { role: 'ADMIN', ...opts });

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

const WEIGHTS = [
  ['cancellation', 'Cancellation'],
  ['complaint', 'Complaint'],
  ['sos', 'SOS (always Rs.0)'],
  ['lost_and_found', 'Lost & Found'],
  ['dispute', 'Dispute'],
];

const EMPTY_CONFIG = { commissionPct: '', convenienceFee: '', gatewayFeePct: '', weights: {} };

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
 * Super Admin revenue page: gross revenue, the revenue-split config, checkout
 * fees and refund rules, operator payouts, the transaction ledger, payments,
 * refunds and support costs. Money lives only here — the Admin console does not show it.
 */
export default function Revenue() {
  usePageTitle('Revenue – Click2Book Super Admin');
  if (sessionStorage.getItem('superUserAuth') !== 'true') return <Navigate to="/super-admin/login" replace />;
  return <RevenueDashboard />;
}

function RevenueDashboard() {
  const [connected, setConnected] = useState(null); // null = connecting
  const demo = useRevenueDemo();
  const [config, setConfig] = useState(EMPTY_CONFIG);
  const [warning, setWarning] = useState('');
  const [stats, setStats] = useState([]);
  const [ledgerFilter, setLedgerFilter] = useState('');
  const [ledger, setLedger] = useState(null);
  const [ticketFilter, setTicketFilter] = useState('');
  const [tickets, setTickets] = useState(null);
  const [payments, setPayments] = useState(null);
  const [paymentFilter, setPaymentFilter] = useState('');
  const [payouts, setPayouts] = useState(null);
  const [trendMode, setTrendMode] = useState('daily');

  const loadSummaryStats = useCallback(async () => {
    const [summary, allTickets] = await Promise.all([adminFetch('/admin/ledger/summary'), adminFetch('/support-ticket')]);
    const openTickets = allTickets.filter((t) => t.status === 'open').length;
    setStats([
      { label: 'Total Bookings Ledgered', value: summary.count, accent: '#F97316' },
      { label: 'Total Operator Payout', value: rupees(summary.operatorPayout), accent: '#22c55e' },
      { label: 'Total Platform Commission', value: rupees(summary.platformCommission), accent: '#3b82f6' },
      { label: 'Total Gateway Fees', value: rupees(summary.gatewayFee), accent: '#64748b' },
      { label: 'Total Admin Net', value: rupees(summary.adminNet), accent: '#8b5cf6' },
      { label: 'Total Support Cost Drawn', value: rupees(summary.supportCost), accent: '#ef4444' },
      { label: 'Open Support Tickets', value: `${openTickets} / ${allTickets.length}`, accent: '#f59e0b' },
    ]);
  }, []);

  const renderLedger = useCallback(
    async (status) => setLedger(await adminFetch('/admin/ledger' + (status ? `?status=${status}` : ''))),
    [],
  );
  const loadPayments = useCallback(async () => setPayments(await adminFetch('/payments')), []);
  const renderTickets = useCallback(
    async (status) => setTickets(await adminFetch('/support-ticket' + (status ? `?status=${status}` : ''))),
    [],
  );

  useEffect(() => {
    (async () => {
      try {
        const cfg = await adminFetch('/admin/revenue-config');
        setConfig({
          commissionPct: cfg.commissionPct,
          convenienceFee: (cfg.convenienceFeeFlat / 100).toFixed(2),
          gatewayFeePct: cfg.gatewayFeePct,
          weights: Object.fromEntries(WEIGHTS.map(([c]) => [c, ((cfg.supportCostWeights[c] || 0) / 100).toFixed(2)])),
        });
        await loadSummaryStats();
        await renderLedger('');
        await renderTickets('');
        await loadPayments();
        setPayouts(await adminFetch('/admin/payouts/summary'));
        setConnected(true);
      } catch (err) {
        setConnected(false);
        console.error(err);
      }
    })();
  }, [loadSummaryStats, renderLedger, renderTickets, loadPayments]);

  const saveConfig = async (e) => {
    e.preventDefault();
    setWarning('');
    try {
      const supportCostWeights = {};
      for (const [c] of WEIGHTS) if (c !== 'sos') supportCostWeights[c] = Math.round(parseFloat(config.weights[c] || '0') * 100);
      const json = await adminFetch('/admin/revenue-config', {
        method: 'POST',
        raw: true,
        body: {
          commissionPct: parseFloat(config.commissionPct),
          convenienceFeeFlat: Math.round(parseFloat(config.convenienceFee) * 100),
          gatewayFeePct: parseFloat(config.gatewayFeePct),
          supportCostWeights,
        },
      });
      if (!json.success) throw new Error(json.message || 'Save failed');
      if (json.warning) setWarning('⚠ ' + json.warning);
      loadSummaryStats();
    } catch (err) {
      alert('Failed to save config: ' + err.message);
    }
  };

  const resolveTicket = async (ticketId) => {
    try {
      await adminFetch(`/support-ticket/${ticketId}/resolve`, { method: 'PATCH' });
      await renderTickets(ticketFilter);
      await loadSummaryStats();
    } catch (err) {
      alert('Failed to resolve ticket: ' + err.message);
    }
  };

  const setField = (key) => (e) => setConfig((c) => ({ ...c, [key]: e.target.value }));
  const setWeight = (key) => (e) => setConfig((c) => ({ ...c, weights: { ...c.weights, [key]: e.target.value } }));

  const allPayments = payments || [];
  const success = allPayments.filter(isSuccess);
  const cards = payments
    ? [
        {
          label: `Gross Revenue (${success.length} payments)`,
          value: inr(success.reduce((s, p) => s + net(p), 0)),
          accent: '#16a34a',
        },
        ...stats,
      ]
    : stats;
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
              <button className={trendMode === 'daily' ? 'on' : ''} id="dailyBtn" onClick={() => setTrendMode('daily')}>
                Daily (14 days)
              </button>
              <button className={trendMode === 'monthly' ? 'on' : ''} id="monthlyBtn" onClick={() => setTrendMode('monthly')}>
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
            Commission, convenience fee, gateway fee, and per-category support cost weights (all money in rupees — stored as paise).
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
            <div className="weights-title">Support cost weights (Rs. per ticket)</div>
            <div className="form-grid">
              {WEIGHTS.map(([key, label]) => (
                <div className="field" key={key}>
                  <label htmlFor={`w-${key}`}>{label}</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    id={`w-${key}`}
                    disabled={key === 'sos'}
                    value={config.weights[key] ?? ''}
                    onChange={setWeight(key)}
                  />
                </div>
              ))}
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
            What each operator is owed from the transaction ledger (fare minus platform commission, excluding cancelled bookings).
          </div>
          <div className="table-wrap">
            <table id="payoutsTable">
              <thead>
                <tr>
                  <th>Operator</th>
                  <th className="num">Bookings</th>
                  <th className="num">Payout Due</th>
                </tr>
              </thead>
              <tbody>
                {payouts?.length === 0 && (
                  <tr>
                    <td colSpan={3} className="empty">
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
                setLedgerFilter(e.target.value);
                renderLedger(e.target.value);
              }}
            >
              <option value="">All statuses</option>
              <option value="clean">Clean</option>
              <option value="cancelled">Cancelled</option>
              <option value="disputed">Disputed</option>
            </select>{' '}
            <button className="btn btn-ghost btn-sm" id="refreshLedgerBtn" onClick={() => renderLedger(ledgerFilter)}>
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
            <select id="paymentStatusFilter" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
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

        <RefundsCard onChange={loadPayments} />

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
                setTicketFilter(e.target.value);
                renderTickets(e.target.value);
              }}
            >
              <option value="">All statuses</option>
              <option value="open">Open</option>
              <option value="resolved">Resolved</option>
            </select>{' '}
            <button className="btn btn-ghost btn-sm" id="refreshTicketsBtn" onClick={() => renderTickets(ticketFilter)}>
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
