import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../lib/http';

const adminFetch = (path, opts) => apiRequest(path, { role: 'ADMIN', ...opts });
const inr = (r) => (Number(r) || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });

/** Recorded on the refund as the person who processed it. */
const SUPER_ADMIN_ID = 'SUPER_ADMIN';

const STATUSES = ['REQUESTED', 'PROCESSING', 'COMPLETED', 'REJECTED'];
const BADGE = { REQUESTED: 'pending', PROCESSING: 'refunded', COMPLETED: 'success', REJECTED: 'failed' };

/**
 * Customer refund requests: amounts and the Start / Pay out / Reject actions.
 * `onChange` runs after a refund changes (paying one out marks its payment refunded).
 */
export default function RefundsCard({ onChange }) {
  const [refunds, setRefunds] = useState(null);
  const [customerOf, setCustomerOf] = useState({});
  const [filter, setFilter] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [all, bookings, customers] = await Promise.all([adminFetch('/refunds'), adminFetch('/bookings'), adminFetch('/customers')]);
      const names = Object.fromEntries(customers.map((c) => [c.customerId, c.name]));
      setCustomerOf(Object.fromEntries(bookings.map((b) => [b.bookingId, names[b.customerId] || b.customerId])));
      setRefunds(all);
      setError('');
    } catch (err) {
      setError('Could not load refunds: ' + err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const process = async (r, status) => {
    if (status === 'REJECTED' && !window.confirm(`Reject the ${inr(r.refundAmount)} refund for ${r.bookingId}?`)) return;
    setBusy(r.bookingId);
    try {
      await adminFetch(`/refunds/booking/${r.bookingId}/process`, {
        method: 'PATCH',
        body: { adminId: SUPER_ADMIN_ID, refundStatus: status },
      });
      await load();
      onChange?.();
    } catch (err) {
      alert('Failed to update refund: ' + err.message);
    } finally {
      setBusy('');
    }
  };

  const all = refunds || [];
  const shown = filter ? all.filter((r) => r.refundStatus === filter) : all;
  const count = (status) => all.filter((r) => r.refundStatus === status).length;
  const refunded = all.filter((r) => r.refundStatus === 'COMPLETED').reduce((s, r) => s + (Number(r.refundAmount) || 0), 0);

  return (
    <div className="card" id="refundsCard">
      <div className="card-title">Refunds</div>
      <div className="card-sub">
        {inr(refunded)} refunded · {count('REQUESTED') + count('PROCESSING')} pending ({count('REQUESTED')} requested, {count('PROCESSING')}{' '}
        processing) · {count('REJECTED')} rejected. Paying out a refund marks its payment as refunded.
      </div>
      <div className="filter-bar">
        <select id="refundStatusFilter" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </option>
          ))}
        </select>{' '}
        <button className="btn btn-ghost btn-sm" id="refreshRefundsBtn" onClick={load}>
          Refresh
        </button>
      </div>
      {error && (
        <div className="warning-box" style={{ display: 'block', marginBottom: 14 }}>
          {error}
        </div>
      )}
      <div className="table-wrap">
        <table id="refundsTable">
          <thead>
            <tr>
              <th>Booking</th>
              <th>Customer</th>
              <th className="num">Amount</th>
              <th>Requested</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {refunds && shown.length === 0 && (
              <tr>
                <td colSpan={6} className="empty">
                  No refund requests.
                </td>
              </tr>
            )}
            {shown.map((r) => {
              const open = r.refundStatus === 'REQUESTED' || r.refundStatus === 'PROCESSING';
              return (
                <tr key={r.bookingId}>
                  <td className="mono">{r.bookingId}</td>
                  <td>{customerOf[r.bookingId] || '—'}</td>
                  <td className="num">{inr(r.refundAmount)}</td>
                  <td>{r.refundDate}</td>
                  <td>
                    <span className={`badge badge-${BADGE[r.refundStatus] || 'pending'}`}>{r.refundStatus}</span>
                  </td>
                  <td className="actions">
                    {r.refundStatus === 'REQUESTED' && (
                      <button className="btn btn-ghost btn-sm" disabled={busy === r.bookingId} onClick={() => process(r, 'PROCESSING')}>
                        Start
                      </button>
                    )}
                    {open && (
                      <>
                        <button className="btn btn-success btn-sm" disabled={busy === r.bookingId} onClick={() => process(r, 'COMPLETED')}>
                          Pay out
                        </button>
                        <button className="btn btn-danger btn-sm" disabled={busy === r.bookingId} onClick={() => process(r, 'REJECTED')}>
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
