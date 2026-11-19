import React, { useEffect, useRef, useState } from 'react';
import { loadAdminRevenueData } from '../lib/api.js';
import { money } from '../lib/format.js';
import { DASHBOARD_PATH } from '../lib/session.js';
import MetricCard from '../components/MetricCard.jsx';
import DataTable from '../components/DataTable.jsx';
import '../styles/revenue-dashboard.css';

export default function RevenuePage({ onBack }) {
  const [revenueData, setRevenueData] = useState({ bookings: [], refunds: [] });
  const [couponFilter, setCouponFilter] = useState('all');
  const [couponSearch, setCouponSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [hasLoaded, setHasLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const requestRef = useRef(null);
  const refreshRef = useRef(() => {});

  useEffect(() => {
    let active = true;
    const load = () => {
      let request = requestRef.current;
      if (!request) {
        setRefreshing(true);
        request = loadAdminRevenueData();
        requestRef.current = request;
      }
      return request
        .then((data) => {
          if (!active) return;
          setRevenueData({
            bookings: data.bookings || [],
            refunds: data.refunds || [],
            totalRevenue: data.totalRevenue,
            grossRevenue: data.grossRevenue,
            totalRefunds: data.totalRefunds,
          });
          setError('');
          setHasLoaded(true);
        })
        .catch((loadError) => active && setError(`Live revenue unavailable: ${loadError.message}`))
        .finally(() => {
          if (requestRef.current === request) requestRef.current = null;
          if (active) setRefreshing(false);
        });
    };
    refreshRef.current = load;
    load();
    const timer = setInterval(load, 5000);
    const onFocus = () => load();
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') load();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  const completedRefunds = revenueData.refunds.filter((refund) => String(refund.status).toLowerCase() === 'refunded');
  const paidBookings = revenueData.bookings.filter((booking) => ['SUCCESS', 'REFUNDED'].includes(String(booking.paymentStatus).toUpperCase()));
  const couponBookings = paidBookings.filter((booking) => {
    if (!booking.offerId) return false;
    if (couponFilter !== 'all' && booking.offerCode !== couponFilter) return false;
    if (couponSearch && !String(booking.offerCode || '').toLowerCase().includes(couponSearch.toLowerCase())) return false;
    if (bookingStatusFilter !== 'all' && String(booking.bookingStatus).toUpperCase() !== bookingStatusFilter) return false;
    const date = String(booking.date || '').slice(0, 10);
    if (startDate && date < startDate) return false;
    if (endDate && date > endDate) return false;
    return true;
  });
  const couponRows = Object.values(couponBookings.reduce((groups, booking) => {
    const code = booking.offerCode || booking.offerId;
    if (!groups[code]) {
      groups[code] = {
        code,
        timesUsed: 0,
        discount: 0,
        gross: 0,
        net: 0,
        revenue: 0,
        bookingIds: [],
      };
    }
    groups[code].timesUsed += 1;
    groups[code].discount += booking.discountAmount;
    groups[code].gross += booking.grossBookingValue;
    groups[code].net += booking.netBookingValue;
    groups[code].revenue += booking.amount;
    groups[code].bookingIds.push(booking.id);
    return groups;
  }, {})).map((row) => ({
    ...row,
    refunds: completedRefunds
      .filter((refund) => row.bookingIds.includes(refund.bookingId))
      .reduce((sum, refund) => sum + refund.amount, 0),
  })).map((row) => ({ ...row, revenue: Math.max(0, row.revenue - row.refunds) }));
  const filteredCouponSummary = {
    redemptions: couponBookings.length,
    discount: couponBookings.reduce((sum, booking) => sum + booking.discountAmount, 0),
    gross: couponBookings.reduce((sum, booking) => sum + booking.grossBookingValue, 0),
    net: couponBookings.reduce((sum, booking) => sum + booking.netBookingValue, 0),
    collected: couponBookings.reduce((sum, booking) => sum + booking.amount, 0),
    revenue: Math.max(0, couponBookings.reduce((sum, booking) => sum + booking.amount, 0) -
      completedRefunds.filter((refund) => couponBookings.some((booking) => booking.id === refund.bookingId))
        .reduce((sum, refund) => sum + refund.amount, 0)),
  };
  const transactions = [
    ...paidBookings.map((booking) => ({
      id: booking.paymentId || `PAY-${booking.id}`,
      bookingId: booking.id,
      customer: booking.customer,
      type: 'Booking payment',
      date: booking.paymentDate || booking.date,
      amount: Number(booking.amount) || 0,
      status: 'Collected',
    })),
    ...completedRefunds.map((refund) => ({
      id: refund.id,
      bookingId: refund.bookingId,
      customer: refund.customer,
      type: 'Completed refund',
      date: refund.completedDate || refund.date,
      amount: -Math.abs(Number(refund.amount) || 0),
      status: 'Refunded',
    })),
  ].sort((a, b) => String(b.date).localeCompare(String(a.date)));

  return (
    <div className="revenue-dashboard" style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '40px' }}>
      <header
        style={{
          background: '#0B2447',
          color: '#ffffff',
          padding: '18px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button
            type="button"
            onClick={(e) => {
              if (onBack) {
                e.preventDefault();
                onBack();
              } else {
                location.href = DASHBOARD_PATH;
              }
            }}
            style={{
              background: 'rgba(255,255,255,0.12)',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '20px',
              padding: '6px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>&larr;</span> Back to Dashboard
          </button>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Platform Revenue & Financials</h1>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>
              {error || 'Payment and refund records'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => refreshRef.current()}
          disabled={refreshing}
          style={{
            background: '#f97316',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 18px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            opacity: refreshing ? 0.7 : 1
          }}
        >
          ↻ Refresh Ledger
        </button>
      </header>

      <main style={{ maxWidth: '1200px', margin: '28px auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {error && (
          <div style={{ padding: '14px 18px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#b91c1c', fontSize: '13px' }}>
          {error}
          </div>
        )}

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          <MetricCard label="Net Platform Revenue" value={hasLoaded ? money(revenueData.totalRevenue) : (refreshing ? 'Loading…' : '—')} accent="#16a34a" delta="Collected net of refunds" icon="₹" />
          <MetricCard label="Gross Booking Value" value={hasLoaded ? money(revenueData.grossRevenue) : (refreshing ? 'Loading…' : '—')} accent="#2563eb" delta="Includes applied discounts" icon="📈" />
          <MetricCard label="Completed Refunds" value={hasLoaded ? money(revenueData.totalRefunds) : (refreshing ? 'Loading…' : '—')} accent="#dc2626" delta="Returned to customers" icon="↻" />
          <MetricCard label="Cancelled Bookings" value={revenueData.bookings.filter((booking) => String(booking.bookingStatus).toUpperCase() === 'CANCELLED').length} accent="#b91c1c" delta="All booking records" icon="×" />
        </section>

        <section style={{ background: '#ffffff', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>Coupon Analytics</h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: 16 }}>
            Successful coupon bookings only. Gross booking value is recorded payment plus the validated discount; net booking value is the customer payment. Refunds are shown separately from platform commission.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
            <label style={filterLabel}>Search coupon
              <input aria-label="Search coupon code" type="search" value={couponSearch} onChange={(event) => setCouponSearch(event.target.value)} placeholder="Coupon code" style={filterInput} />
            </label>
            <label style={filterLabel}>From <input aria-label="Coupon analytics start date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} style={filterInput} /></label>
            <label style={filterLabel}>To <input aria-label="Coupon analytics end date" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} style={filterInput} /></label>
            <label style={filterLabel}>Coupon
              <select aria-label="Filter by coupon" value={couponFilter} onChange={(event) => setCouponFilter(event.target.value)} style={filterInput}>
                <option value="all">All coupons</option>
                {[...new Set(paidBookings.filter((booking) => booking.offerId).map((booking) => booking.offerCode || booking.offerId))].map((code) => <option key={code} value={code}>{code}</option>)}
              </select>
            </label>
            <label style={filterLabel}>Booking status
              <select aria-label="Filter coupon bookings by status" value={bookingStatusFilter} onChange={(event) => setBookingStatusFilter(event.target.value)} style={filterInput}>
                <option value="all">All statuses</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 18 }}>
            <MetricCard label="Total coupons" value={revenueData.couponAnalytics?.summary?.totalCoupons ?? 0} accent="#0B2447" delta="Created" icon="%" />
            <MetricCard label="Active coupons" value={revenueData.couponAnalytics?.summary?.activeCoupons ?? 0} accent="#16a34a" delta="Currently available" icon="✓" />
            <MetricCard label="Inactive coupons" value={revenueData.couponAnalytics?.summary?.inactiveCoupons ?? 0} accent="#64748b" delta="Disabled or archived" icon="Ⅱ" />
            <MetricCard label="Expired coupons" value={revenueData.couponAnalytics?.summary?.expiredCoupons ?? 0} accent="#64748b" delta="Past expiry date" icon="⌛" />
            <MetricCard label="Successful redemptions" value={filteredCouponSummary.redemptions} accent="#7c3aed" delta="Filtered bookings" icon="🎟" />
            <MetricCard label="Total discounts" value={money(filteredCouponSummary.discount)} accent="#dc2626" delta="Validated discounts" icon="−" />
            <MetricCard label="Coupon gross value" value={money(filteredCouponSummary.gross)} accent="#2563eb" delta="Before coupon discounts" icon="₹" />
            <MetricCard label="Coupon net booking value" value={money(filteredCouponSummary.net)} accent="#0891b2" delta="Before refunds" icon="₹" />
            <MetricCard label="Coupon-based collected revenue" value={money(filteredCouponSummary.collected)} accent="#0f766e" delta="Successful payments" icon="₹" />
            <MetricCard label="Coupon net revenue" value={money(filteredCouponSummary.revenue)} accent="#16a34a" delta="After completed refunds" icon="₹" />
            <MetricCard label="Coupon refunds" value={money(filteredCouponSummary.net - filteredCouponSummary.revenue)} accent="#dc2626" delta="Completed refunds" icon="↻" />
          </div>
          <DataTable headers={['Coupon Code', 'Times Used', 'Total Discount', 'Gross Booking Value', 'Net Booking Value', 'Net Revenue']} emptyText="No successful coupon bookings match these filters.">
            {couponRows.map((row) => (
              <tr key={row.code}>
                <td>{row.code}</td>
                <td>{row.timesUsed}</td>
                <td>{money(row.discount)}</td>
                <td>{money(row.gross)}</td>
                <td>{money(row.net)}</td>
                <td>{money(row.revenue)}</td>
              </tr>
            ))}
          </DataTable>
        </section>

        <section style={{ background: '#ffffff', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Revenue Calculation Policy</h2>
          <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, maxWidth: '800px' }}>
            Net collected revenue includes successful customer payments and subtracts completed refunds only. Failed or pending payments, pending or rejected refund requests, and provider commissions are excluded from these customer transaction totals.
          </p>
        </section>

        <section style={{ background: '#ffffff', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Revenue Transactions</h2>
          <p style={{ fontSize: '13px', color: '#64748b' }}>Successful booking payments and completed refunds from the live payment and refund records.</p>
          <DataTable headers={['Transaction ID', 'Booking ID', 'Customer', 'Type', 'Date', 'Amount', 'Status']} emptyText={!hasLoaded && refreshing ? 'Loading revenue transactions…' : 'No completed payment or refund transactions found.'}>
            {transactions.map((transaction) => (
              <tr key={`${transaction.type}-${transaction.id}`}>
                <td>{transaction.id}</td>
                <td>{transaction.bookingId}</td>
                <td>{transaction.customer}</td>
                <td>{transaction.type}</td>
                <td>{transaction.date}</td>
                <td style={{ color: transaction.amount < 0 ? '#dc2626' : '#15803d', fontWeight: 700 }}>{money(transaction.amount)}</td>
                <td>{transaction.status}</td>
              </tr>
            ))}
          </DataTable>
        </section>
      </main>
    </div>
  );
}

const filterLabel = { display: 'flex', flexDirection: 'column', gap: 5, color: '#475569', fontSize: 12, fontWeight: 700 };
const filterInput = { minHeight: 36, border: '1px solid #cbd5e1', borderRadius: 7, background: '#fff', padding: '6px 9px', color: '#0f172a' };
