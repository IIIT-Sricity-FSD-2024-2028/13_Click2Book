import { useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch } from '../lib/api.js';
import { money } from '../lib/format.js';

const EMPTY_FORM = {
  offerCode: '',
  description: '',
  discountType: 'percentage',
  discountValue: '',
  minFare: '0',
  maxDiscount: '',
  maxUsage: '',
  maxUsagePerCustomer: '',
  startDate: '',
  endDate: '',
};

function isExpired(coupon) {
  return coupon.endDate < new Date().toISOString().slice(0, 10);
}

function couponStatus(coupon) {
  if (isExpired(coupon)) return 'EXPIRED';
  return coupon.status;
}

function isCouponRecord(coupon) {
  return coupon && typeof coupon === 'object' &&
    typeof coupon.offerId === 'string' &&
    typeof coupon.offerCode === 'string' &&
    typeof coupon.startDate === 'string' &&
    typeof coupon.endDate === 'string' &&
    ['ACTIVE', 'INACTIVE', 'EXPIRED', 'SUSPENDED'].includes(coupon.status);
}

function couponPayload(form) {
  const payload = {
    offerCode: form.offerCode.trim().toUpperCase(),
    description: form.description.trim(),
    minFare: Number(form.minFare || 0),
    startDate: form.startDate,
    endDate: form.endDate,
  };
  payload[form.discountType === 'percentage' ? 'discountPercentage' : 'flatDiscount'] = Number(form.discountValue);
  if (form.discountType === 'percentage' && form.maxDiscount !== '') {
    payload.maxDiscount = Number(form.maxDiscount);
  }
  if (form.maxUsage !== '') payload.maxUsage = Number(form.maxUsage);
  if (form.maxUsagePerCustomer !== '') payload.maxUsagePerCustomer = Number(form.maxUsagePerCustomer);
  return payload;
}

function formFromCoupon(coupon) {
  const discountType = coupon.flatDiscount != null ? 'fixed' : 'percentage';
  return {
    offerCode: coupon.offerCode || '',
    description: coupon.description || '',
    discountType,
    discountValue: String(discountType === 'percentage' ? coupon.discountPercentage : coupon.flatDiscount),
    minFare: String(coupon.minFare ?? 0),
    maxDiscount: coupon.maxDiscount == null ? '' : String(coupon.maxDiscount),
    maxUsage: coupon.maxUsage == null ? '' : String(coupon.maxUsage),
    maxUsagePerCustomer: coupon.maxUsagePerCustomer == null ? '' : String(coupon.maxUsagePerCustomer),
    startDate: coupon.startDate || '',
    endDate: coupon.endDate || '',
  };
}

export default function CouponsSection({ onDataChange }) {
  const [coupons, setCoupons] = useState([]);
  const [summary, setSummary] = useState({});
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingOperations, setPendingOperations] = useState(() => new Set());
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const operationLock = useRef(new Set());

  const setOperationPending = (offerId, pending) => {
    setPendingOperations((current) => {
      const next = new Set(current);
      if (pending) next.add(offerId);
      else next.delete(offerId);
      return next;
    });
  };

  const requireCouponResponse = (response, offerId) => {
    if (!response || typeof response !== 'object' || response.offerId !== offerId ||
      typeof response.status !== 'string' || typeof response.offerCode !== 'string') {
      throw new Error('The server returned an invalid coupon update response. Refresh the list and try again.');
    }
    return response;
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const analytics = await apiFetch('/offers/analytics');
      if (!analytics || !Array.isArray(analytics.coupons) ||
        !analytics.coupons.every(isCouponRecord) ||
        !analytics.summary || typeof analytics.summary !== 'object') {
        throw new Error('The server returned invalid coupon data.');
      }
      setCoupons(analytics.coupons);
      setSummary(analytics.summary);
      return analytics;
    } catch (loadError) {
      setError(loadError.message || 'Could not load coupons.');
      throw loadError;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const visibleCoupons = useMemo(() => coupons.filter((coupon) => {
    const status = couponStatus(coupon);
    const matchesStatus = filter === 'all' || status.toLowerCase() === filter;
    return matchesStatus && coupon.offerCode.toLowerCase().includes(search.toLowerCase());
  }), [coupons, filter, search]);

  const beginCreate = () => {
    setEditing(null);
    setFormOpen(true);
    setForm({ ...EMPTY_FORM });
    setNotice('');
    setError('');
  };

  const beginEdit = (coupon) => {
    setEditing(coupon);
    setFormOpen(true);
    setForm(formFromCoupon(coupon));
    setNotice('');
    setError('');
  };

  const saveCoupon = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const payload = couponPayload(form);
      if (editing) {
        await apiFetch(`/offers/${editing.offerId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setNotice(`Coupon ${payload.offerCode} updated.`);
      } else {
        await apiFetch('/offers', {
          method: 'POST',
          body: JSON.stringify({ ...payload, providerId: 'ADMIN' }),
        });
        setNotice(`Coupon ${payload.offerCode} created.`);
      }
      setEditing(null);
      setFormOpen(false);
      setForm({ ...EMPTY_FORM });
      await load();
      onDataChange?.();
    } catch (saveError) {
      setError(saveError.message || 'Could not save coupon.');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (coupon) => {
    if (operationLock.current.has(coupon.offerId)) return;
    const currentStatus = String(coupon.status || '').toUpperCase();
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    if (nextStatus === 'ACTIVE' && isExpired(coupon)) {
      setError('An expired coupon cannot be activated. Edit its validity dates first.');
      setNotice('');
      return;
    }
    operationLock.current.add(coupon.offerId);
    setOperationPending(coupon.offerId, true);
    setError('');
    setNotice('');
    try {
      const updated = requireCouponResponse(await apiFetch(`/offers/${coupon.offerId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus }),
      }), coupon.offerId);
      setCoupons((current) => current.map((item) => item.offerId === coupon.offerId ? {
        ...item,
        ...updated,
      } : item));
      setNotice(`Coupon ${coupon.offerCode} is now ${nextStatus.toLowerCase()}.`);
      const analytics = await load();
      const refreshed = analytics.coupons.find((item) => item.offerId === coupon.offerId);
      if (!refreshed || refreshed.status !== nextStatus) {
        throw new Error('The coupon status did not persist. Refresh the list and try again.');
      }
      onDataChange?.();
    } catch (statusError) {
      setError(statusError.message || 'Could not update coupon status.');
      setNotice('');
      try {
        await load();
      } catch {
        // The load function presents its own error and leaves the current list intact.
      }
    } finally {
      operationLock.current.delete(coupon.offerId);
      setOperationPending(coupon.offerId, false);
    }
  };

  const archiveCoupon = async (coupon) => {
    if (operationLock.current.has(coupon.offerId)) return;
    if (!window.confirm(`Archive coupon ${coupon.offerCode}? Historical redemptions will be kept.`)) return;
    operationLock.current.add(coupon.offerId);
    setOperationPending(coupon.offerId, true);
    setError('');
    setNotice('');
    try {
      await apiFetch(`/offers/${coupon.offerId}`, { method: 'DELETE' });
      const analytics = await load();
      const archived = analytics.coupons.find((item) => item.offerId === coupon.offerId);
      if (!archived || archived.status !== 'INACTIVE') {
        throw new Error('The coupon was not archived. Refresh the list and try again.');
      }
      setNotice(`Coupon ${coupon.offerCode} archived.`);
      onDataChange?.();
    } catch (archiveError) {
      setError(archiveError.message || 'Could not archive coupon.');
      setNotice('');
      try {
        await load();
      } catch {
        // The load function presents its own error and leaves the current list intact.
      }
    } finally {
      operationLock.current.delete(coupon.offerId);
      setOperationPending(coupon.offerId, false);
    }
  };

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: 14 }}>
        {[
          ['Total coupons', summary.totalCoupons],
          ['Active', summary.activeCoupons],
          ['Inactive', summary.inactiveCoupons],
          ['Expired', summary.expiredCoupons],
          ['Successful redemptions', summary.totalRedemptions],
          ['Discounts given', money(summary.totalDiscount || 0)],
        ].map(([label, value]) => (
          <div key={label} style={{ padding: 18, background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <div style={{ color: '#64748b', fontSize: 13 }}>{label}</div>
            <strong style={{ display: 'block', marginTop: 8, color: '#0B2447', fontSize: 21 }}>{loading ? '…' : (value ?? 0)}</strong>
          </div>
        ))}
      </section>

      <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0, color: '#0B2447', fontSize: 19 }}>Coupon management</h2>
            <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: 13 }}>Manage discounts available to customers at checkout.</p>
          </div>
          <button type="button" onClick={beginCreate} style={buttonStyle('#f97316')}>+ Create coupon</button>
        </div>

        {(error || notice) && (
          <p role={error ? 'alert' : 'status'} style={{ marginTop: 14, color: error ? '#b91c1c' : '#166534' }}>
            {error || notice}
          </p>
        )}

        {formOpen && (
          <form onSubmit={saveCoupon} style={{ marginTop: 18, padding: 18, borderRadius: 10, background: '#f8fafc', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
            <label style={labelStyle}>Code
              <input required minLength="3" maxLength="20" pattern="[A-Za-z0-9_-]+" value={form.offerCode} onChange={(event) => updateForm('offerCode', event.target.value)} style={inputStyle} />
            </label>
            <label style={labelStyle}>Description
              <input maxLength="200" value={form.description} onChange={(event) => updateForm('description', event.target.value)} style={inputStyle} />
            </label>
            <label style={labelStyle}>Discount type
              <select value={form.discountType} onChange={(event) => updateForm('discountType', event.target.value)} style={inputStyle}>
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount (₹)</option>
              </select>
            </label>
            <label style={labelStyle}>{form.discountType === 'percentage' ? 'Discount (%)' : 'Discount (₹)'}
              <input required type="number" min="0.01" max={form.discountType === 'percentage' ? 100 : undefined} step="0.01" value={form.discountValue} onChange={(event) => updateForm('discountValue', event.target.value)} style={inputStyle} />
            </label>
            <label style={labelStyle}>Minimum fare (₹)
              <input type="number" min="0" step="0.01" value={form.minFare} onChange={(event) => updateForm('minFare', event.target.value)} style={inputStyle} />
            </label>
            {form.discountType === 'percentage' && (
              <label style={labelStyle}>Maximum discount (₹)
                <input type="number" min="0.01" step="0.01" value={form.maxDiscount} onChange={(event) => updateForm('maxDiscount', event.target.value)} style={inputStyle} />
              </label>
            )}
            <label style={labelStyle}>Maximum total uses
              <input type="number" min="1" step="1" value={form.maxUsage} onChange={(event) => updateForm('maxUsage', event.target.value)} style={inputStyle} />
            </label>
            <label style={labelStyle}>Uses per customer
              <input type="number" min="1" step="1" value={form.maxUsagePerCustomer} onChange={(event) => updateForm('maxUsagePerCustomer', event.target.value)} style={inputStyle} />
            </label>
            <label style={labelStyle}>Start date
              <input required type="date" value={form.startDate} onChange={(event) => updateForm('startDate', event.target.value)} style={inputStyle} />
            </label>
            <label style={labelStyle}>Expiry date
              <input required type="date" min={form.startDate} value={form.endDate} onChange={(event) => updateForm('endDate', event.target.value)} style={inputStyle} />
            </label>
            <div style={{ display: 'flex', alignItems: 'end', gap: 8 }}>
              <button type="submit" disabled={saving} style={buttonStyle('#0B2447')}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create coupon'}</button>
              <button type="button" onClick={() => { setEditing(null); setFormOpen(false); setForm({ ...EMPTY_FORM }); }} style={buttonStyle('#64748b')}>Cancel</button>
            </div>
          </form>
        )}

        <div style={{ display: 'flex', gap: 10, margin: '20px 0 12px', flexWrap: 'wrap' }}>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search coupon code" aria-label="Search coupon code" style={{ ...inputStyle, maxWidth: 250 }} />
          <select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter coupons by status" style={{ ...inputStyle, maxWidth: 180 }}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead><tr>{['Coupon', 'Discount', 'Validity', 'Uses', 'Discount given', 'Status', 'Actions'].map((head) => <th key={head} style={thStyle}>{head}</th>)}</tr></thead>
            <tbody>
              {visibleCoupons.map((coupon) => (
                <tr key={coupon.offerId}>
                  <td style={tdStyle}><strong>{coupon.offerCode}</strong><div style={{ color: '#64748b', fontSize: 12 }}>{coupon.description || '—'}</div></td>
                  <td style={tdStyle}>{coupon.flatDiscount != null ? money(coupon.flatDiscount) : `${coupon.discountPercentage}%`}</td>
                  <td style={tdStyle}>{coupon.startDate} – {coupon.endDate}</td>
                  <td style={tdStyle}>{coupon.redemptions || 0}{coupon.maxUsage ? ` / ${coupon.maxUsage}` : ''}</td>
                  <td style={tdStyle}>{money(coupon.discountTotal || 0)}</td>
                  <td style={tdStyle}><span style={{ color: couponStatus(coupon) === 'ACTIVE' ? '#15803d' : '#b91c1c', fontWeight: 700 }}>{couponStatus(coupon)}</span></td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" onClick={() => beginEdit(coupon)} style={smallButtonStyle}>Edit</button>
                      <button
                        type="button"
                        onClick={() => updateStatus(coupon)}
                        disabled={pendingOperations.has(coupon.offerId) || (isExpired(coupon) && coupon.status !== 'ACTIVE')}
                        style={smallButtonStyle}
                      >
                        {pendingOperations.has(coupon.offerId)
                          ? 'Updating…'
                          : coupon.status === 'ACTIVE' ? 'Deactivate' : isExpired(coupon) ? 'Expired' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        onClick={() => archiveCoupon(coupon)}
                        disabled={pendingOperations.has(coupon.offerId)}
                        style={{ ...smallButtonStyle, color: '#b91c1c' }}
                      >
                        {pendingOperations.has(coupon.offerId) ? 'Updating…' : 'Archive'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && visibleCoupons.length === 0 && <tr><td colSpan="7" style={{ ...tdStyle, textAlign: 'center', color: '#64748b' }}>No coupons match this filter.</td></tr>}
              {loading && <tr><td colSpan="7" style={{ ...tdStyle, textAlign: 'center', color: '#64748b' }}>Loading coupons…</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

const labelStyle = { display: 'flex', flexDirection: 'column', gap: 6, color: '#334155', fontSize: 13, fontWeight: 600 };
const inputStyle = { width: '100%', minHeight: 38, border: '1px solid #cbd5e1', borderRadius: 7, padding: '7px 10px', background: '#fff', color: '#0f172a' };
const buttonStyle = (background) => ({ background, color: '#fff', border: 0, borderRadius: 7, padding: '9px 13px', fontWeight: 700, whiteSpace: 'nowrap' });
const smallButtonStyle = { background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: 6, padding: '6px 8px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' };
const thStyle = { textAlign: 'left', padding: '10px 12px', background: '#f8fafc', color: '#475569', fontSize: 12, borderBottom: '1px solid #e2e8f0' };
const tdStyle = { padding: '12px', borderBottom: '1px solid #e2e8f0', color: '#334155', fontSize: 13, verticalAlign: 'top' };
