import { useState } from 'react';
import { Card, EmptyRow, KPI, Pill, Table, matches } from '../components/ui';
import { adminActions, downloadCsv, formatINR } from '../lib/adminData';

/** The ledger and revenue-split config store money in paise. */
const fromPaise = (p) => (Number(p) || 0) / 100;

const PAY_TONE = { SUCCESS: 'green', REFUNDED: 'blue', FAILED: 'red', PENDING: 'orange' };
const REFUND_TONE = { REQUESTED: 'orange', PROCESSING: 'blue', COMPLETED: 'green', REJECTED: 'red' };

function CommissionForm({ ctx }) {
  const cfg = ctx.data.revenueConfig;
  const [f, setF] = useState(() => ({
    commissionPct: cfg?.commissionPct ?? 10,
    convenienceFee: fromPaise(cfg?.convenienceFeeFlat ?? 2500),
    gatewayFeePct: cfg?.gatewayFeePct ?? 1.5,
  }));
  const [error, setError] = useState('');
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const save = () => {
    const commissionPct = Number(f.commissionPct);
    const convenience = Number(f.convenienceFee);
    const gatewayFeePct = Number(f.gatewayFeePct);
    if (!(commissionPct >= 0 && commissionPct <= 100)) return setError('Commission must be between 0 and 100%.');
    if (!(gatewayFeePct >= 0 && gatewayFeePct <= 100)) return setError('Gateway fee must be between 0 and 100%.');
    if (!(convenience >= 0)) return setError('Convenience fee cannot be negative.');
    setError('');
    ctx.act('commission', 'Commission settings saved — applies to new bookings.', () =>
      adminActions.saveRevenueConfig({ commissionPct, gatewayFeePct, convenienceFeeFlat: Math.round(convenience * 100) }),
    );
  };

  if (!cfg) return <p className="card-note">Commission settings need the backend.</p>;
  const example = 1000;
  const commission = (example * Number(f.commissionPct || 0)) / 100;
  return (
    <>
      <div className="form-grid three">
        <label>
          Platform commission (% of base fare)
          <input id="commissionPct" type="number" min="0" max="100" step="0.5" value={f.commissionPct} onChange={set('commissionPct')} />
        </label>
        <label>
          Convenience fee per booking (₹)
          <input id="convenienceFeeFlat" type="number" min="0" step="1" value={f.convenienceFee} onChange={set('convenienceFee')} />
        </label>
        <label>
          Payment gateway fee (% of base fare)
          <input id="gatewayFeePct" type="number" min="0" max="100" step="0.1" value={f.gatewayFeePct} onChange={set('gatewayFeePct')} />
        </label>
      </div>
      <p className="card-note">
        Example: on a {formatINR(example)} fare the platform keeps {formatINR(commission)} and the operator receives{' '}
        {formatINR(example - commission)}. Last changed{' '}
        {cfg.updatedAt?.startsWith('1970') ? 'never (defaults)' : cfg.updatedAt?.replace('T', ' ').slice(0, 16)}.
      </p>
      {error && <div className="form-error">⚠️ {error}</div>}
      <button className="action-btn btn-primary" id="saveCommissionBtn" onClick={save} disabled={ctx.busy === 'commission'}>
        Save commission settings
      </button>
    </>
  );
}

export default function Finance({ ctx }) {
  const { data, q, act, busy } = ctx;
  const s = data.stats;
  const ledger = data.ledgerSummary;
  const payments = data.rawPayments.filter((p) => matches(q, p.paymentId, p.bookingId, p.paymentMethod, p.paymentStatus));
  const refunds = data.refunds.filter((r) => matches(q, r.bookingId, r.refundStatus));
  const process = (r, status) =>
    act(
      `refund-${r.bookingId}`,
      `Refund for ${r.bookingId} marked ${status.toLowerCase()}.`,
      () => adminActions.processRefund(r.bookingId, status, ctx.adminId),
      status === 'REJECTED' ? `Reject the ${formatINR(r.refundAmount)} refund for ${r.bookingId}?` : undefined,
    );

  return (
    <>
      <div className="kpi-grid" id="financeKpis">
        <KPI label="Gross revenue" value={formatINR(s.revenue)} sub="successful payments" tone="green" />
        <KPI
          label="Platform commission"
          value={formatINR(s.commissionEstimate)}
          sub={s.commissionExact ? `from ledger · ${s.commissionPct}% on new bookings` : `estimate at ${s.commissionPct}%`}
          tone="green"
        />
        <KPI
          label="Refunded"
          value={formatINR(s.refunded)}
          sub={`${s.pendingRefunds} pending`}
          tone={s.pendingRefunds ? 'orange' : undefined}
        />
        <KPI
          label="Payments"
          value={data.rawPayments.length}
          sub={`${data.rawPayments.filter((p) => p.paymentStatus === 'SUCCESS').length} successful`}
        />
      </div>

      <Card title="Commission & Fees" id="commissionCard">
        <CommissionForm key={data.revenueConfig?.updatedAt} ctx={ctx} />
      </Card>

      <Card title="Refunds" count={refunds.length} id="refundsCard">
        <Table head={['Booking', 'Customer', 'Amount', 'Requested', 'Status', 'Action']} id="refundsTable">
          {refunds.length === 0 ? (
            <EmptyRow icon="↩️" message="No refund requests." />
          ) : (
            refunds.map((r) => {
              const b = data.bookings.find((x) => x.id === r.bookingId);
              const open = r.refundStatus === 'REQUESTED' || r.refundStatus === 'PROCESSING';
              return (
                <tr key={r.bookingId}>
                  <td className="booking-id">{r.bookingId}</td>
                  <td>{b?.customer || '—'}</td>
                  <td className="amount">{formatINR(r.refundAmount)}</td>
                  <td>{r.refundDate}</td>
                  <td>
                    <Pill tone={REFUND_TONE[r.refundStatus]}>{r.refundStatus}</Pill>
                  </td>
                  <td className="actions-cell">
                    {r.refundStatus === 'REQUESTED' && (
                      <button
                        className="action-btn btn-ghost"
                        disabled={busy === `refund-${r.bookingId}`}
                        onClick={() => process(r, 'PROCESSING')}
                      >
                        Start
                      </button>
                    )}{' '}
                    {open && (
                      <>
                        <button
                          className="action-btn btn-success"
                          disabled={busy === `refund-${r.bookingId}`}
                          onClick={() => process(r, 'COMPLETED')}
                        >
                          Pay out
                        </button>{' '}
                        <button
                          className="action-btn btn-danger"
                          disabled={busy === `refund-${r.bookingId}`}
                          onClick={() => process(r, 'REJECTED')}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {!open && <span className="muted">—</span>}
                  </td>
                </tr>
              );
            })
          )}
        </Table>
      </Card>

      <Card title="Provider Payouts" count={data.payouts.length} id="payoutsCard">
        <p className="card-note">
          What each operator is owed from the transaction ledger (fare minus platform commission, excluding cancelled bookings).
        </p>
        <Table head={['Operator', 'Bookings', 'Payout due']} id="payoutsTable">
          {data.payouts.length === 0 ? (
            <EmptyRow icon="🏦" message="No ledger entries yet — payouts appear once customers book through the backend." />
          ) : (
            data.payouts.map((p) => (
              <tr key={p.id}>
                <td>
                  <strong>{p.label}</strong> <span className="sub-line">{p.id}</span>
                </td>
                <td>{p.count}</td>
                <td className="amount">{formatINR(fromPaise(p.total))}</td>
              </tr>
            ))
          )}
        </Table>
      </Card>

      <Card title="Transaction Ledger" id="ledgerCard">
        {ledger && ledger.count > 0 ? (
          <div className="kpi-grid">
            <KPI label="Ledger rows" value={ledger.count} />
            <KPI label="Base fares" value={formatINR(fromPaise(ledger.baseFare))} />
            <KPI label="Operator payouts" value={formatINR(fromPaise(ledger.operatorPayout))} />
            <KPI label="Platform commission" value={formatINR(fromPaise(ledger.platformCommission))} tone="green" />
            <KPI label="Gateway fees" value={formatINR(fromPaise(ledger.gatewayFee))} />
            <KPI label="Support costs" value={formatINR(fromPaise(ledger.supportCost))} />
            <KPI label="Admin net" value={formatINR(fromPaise(ledger.adminNet))} tone="green" />
          </div>
        ) : (
          <p className="card-note">The ledger is empty. It records the exact fare split for every new booking made through the backend.</p>
        )}
      </Card>

      <Card
        title="Payments"
        count={payments.length}
        id="paymentsCard"
        actions={
          <button
            className="action-btn btn-ghost"
            onClick={() => downloadCsv('click2book-payments.csv', data.rawPayments)}
            disabled={!data.rawPayments.length}
          >
            ⬇ Export CSV
          </button>
        }
      >
        <Table head={['Payment', 'Booking', 'Method', 'Amount', 'Discount', 'Date', 'Status']} id="paymentsTable">
          {payments.length === 0 ? (
            <EmptyRow icon="💳" message="No payments match." />
          ) : (
            payments.map((p) => (
              <tr key={p.paymentId || p.bookingId}>
                <td className="booking-id">{p.paymentId || '—'}</td>
                <td>{p.bookingId}</td>
                <td>{p.paymentMethod || '—'}</td>
                <td className="amount">{formatINR(p.amount)}</td>
                <td>{p.discountAmount ? formatINR(p.discountAmount) : '—'}</td>
                <td>{p.paymentDate}</td>
                <td>
                  <Pill tone={PAY_TONE[p.paymentStatus] || 'grey'}>{p.paymentStatus}</Pill>
                </td>
              </tr>
            ))
          )}
        </Table>
      </Card>
    </>
  );
}
