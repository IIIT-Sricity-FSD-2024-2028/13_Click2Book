import { useState } from 'react';
import CanvasChart from '../components/CanvasChart';
import { Card, EmptyRow, KPI, Table, matches } from '../components/ui';
import { adminActions, downloadCsv, formatINR, lastDays, lastMonths } from '../lib/adminData';
import { localISODate } from '../../lib/dates';

const isSuccess = (p) => String(p.paymentStatus).toUpperCase() === 'SUCCESS';
const net = (p) => (Number(p.amount) || 0) - (Number(p.discountAmount) || 0);

/** Group bookings + revenue into periods (`keyOf` maps a YYYY-MM-DD date to a period key). */
function series(periods, bookings, payments, keyOf) {
  const rows = Object.fromEntries(periods.map((p) => [p.key, { period: p.label, key: p.key, bookings: 0, cancelled: 0, revenue: 0 }]));
  bookings.forEach((b) => {
    const r = rows[keyOf(String(b.date))];
    if (!r) return;
    r.bookings += 1;
    if (b.status === 'cancelled') r.cancelled += 1;
  });
  payments.filter(isSuccess).forEach((p) => {
    const r = rows[keyOf(String(p.paymentDate))];
    if (r) r.revenue += net(p);
  });
  return periods.map((p) => rows[p.key]);
}

export default function Reports({ ctx }) {
  const { data, act, q } = ctx;
  const s = data.stats;
  const [mode, setMode] = useState('daily');
  const [reportDate, setReportDate] = useState(localISODate());

  const daily = series(lastDays(14), data.bookings, data.rawPayments, (d) => d.slice(0, 10));
  const monthly = series(lastMonths(12), data.bookings, data.rawPayments, (d) => d.slice(0, 7));
  const rows = mode === 'daily' ? daily : monthly;
  const adminName = (id) => data.admins.find((a) => a.adminId === id)?.name || id;
  const reports = data.reports.filter((r) => matches(q, r.reportDate, adminName(r.adminId)));
  const cancelRate = s.totalBookings ? Math.round((s.cancelled / s.totalBookings) * 100) : 0;

  const generate = () => act('report', `Report generated for ${reportDate}.`, () => adminActions.generateReport(ctx.adminId, reportDate));

  return (
    <>
      <div className="kpi-grid" id="reportKpis">
        <KPI label="Total bookings" value={s.totalBookings} sub={`${s.confirmed} confirmed`} />
        <KPI label="Cancellations" value={s.cancelled} sub={`${cancelRate}% of bookings`} tone={cancelRate > 25 ? 'red' : undefined} />
        <KPI label="Gross revenue" value={formatINR(s.revenue)} sub="successful payments, after discounts" tone="green" />
        <KPI
          label="Platform commission"
          value={formatINR(s.commissionEstimate)}
          sub={s.commissionExact ? `from ledger · ${s.commissionPct}% on new bookings` : `estimate at ${s.commissionPct}%`}
          tone="green"
        />
        <KPI label="Active customers" value={s.activeCustomers} sub={`of ${s.customers} registered`} />
        <KPI label="Active buses" value={s.activeBuses} sub={`of ${s.totalBuses} registered`} />
        <KPI label="Service providers" value={s.approvedProviders} sub={`${s.pendingProviders} pending approval`} />
        <KPI
          label="Refunded"
          value={formatINR(s.refunded)}
          sub={`${s.pendingRefunds} refunds pending`}
          tone={s.pendingRefunds ? 'orange' : undefined}
        />
      </div>

      <Card
        title="Performance"
        id="performanceReport"
        actions={
          <>
            <div className="seg">
              <button className={mode === 'daily' ? 'on' : ''} id="dailyBtn" onClick={() => setMode('daily')}>
                Daily (14 days)
              </button>
              <button className={mode === 'monthly' ? 'on' : ''} id="monthlyBtn" onClick={() => setMode('monthly')}>
                Monthly (12 months)
              </button>
            </div>
            <button
              className="action-btn btn-ghost"
              id="exportPerfBtn"
              onClick={() =>
                downloadCsv(
                  `click2book-${mode}-performance.csv`,
                  rows.map(({ key, ...r }) => ({ date: key, ...r })),
                )
              }
            >
              ⬇ Export CSV
            </button>
          </>
        }
      >
        <div className="charts-row compact">
          <div className="chart-card flat">
            <h3 className="chart-title">Bookings</h3>
            <div className="chart-wrap">
              <CanvasChart
                key={mode + 'b'}
                id={`${mode}BookingsChart`}
                type="bar"
                labels={rows.map((r) => r.period)}
                values={rows.map((r) => r.bookings)}
                color="#F97316"
              />
            </div>
          </div>
          <div className="chart-card flat">
            <h3 className="chart-title">Revenue</h3>
            <div className="chart-wrap">
              <CanvasChart
                key={mode + 'r'}
                id={`${mode}RevenueChart`}
                type="line"
                labels={rows.map((r) => r.period)}
                values={rows.map((r) => r.revenue)}
                color="#16a34a"
                fill="rgba(22,163,74,0.08)"
              />
            </div>
          </div>
        </div>
        <Table head={['Period', 'Bookings', 'Cancelled', 'Revenue']} id="periodTable">
          {[...rows].reverse().map((r) => (
            <tr key={r.key}>
              <td>{r.period}</td>
              <td>{r.bookings}</td>
              <td>{r.cancelled}</td>
              <td className="amount">{formatINR(r.revenue)}</td>
            </tr>
          ))}
        </Table>
      </Card>

      <Card
        title="Saved Daily Reports"
        count={reports.length}
        id="savedReports"
        actions={
          <>
            <input
              type="date"
              className="filter-input"
              id="reportDate"
              value={reportDate}
              max={localISODate()}
              onChange={(e) => setReportDate(e.target.value)}
            />
            <button className="action-btn btn-primary" id="generateReportBtn" onClick={generate} disabled={!reportDate}>
              Generate report
            </button>
            <button
              className="action-btn btn-ghost"
              onClick={() => downloadCsv('click2book-bookings.csv', data.bookings)}
              disabled={!data.bookings.length}
            >
              ⬇ All bookings CSV
            </button>
          </>
        }
      >
        <p className="card-note">
          A saved report snapshots the bookings and revenue recorded on one date, so the figures can be reviewed later.
        </p>
        <Table head={['Date', 'Bookings', 'Revenue', 'Generated by']} id="reportsTable">
          {reports.length === 0 ? (
            <EmptyRow
              icon="🗂️"
              message={q ? 'No saved reports match your search.' : 'No reports generated yet. Pick a date and click “Generate report”.'}
            />
          ) : (
            [...reports]
              .sort((a, b) => b.reportDate.localeCompare(a.reportDate))
              .map((r) => (
                <tr key={`${r.adminId}-${r.reportDate}`}>
                  <td className="booking-id">{r.reportDate}</td>
                  <td>{r.totalBookings}</td>
                  <td className="amount">{formatINR(r.totalRevenue)}</td>
                  <td>{adminName(r.adminId)}</td>
                </tr>
              ))
          )}
        </Table>
      </Card>
    </>
  );
}
