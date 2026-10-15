import React, { useEffect, useRef, useState } from 'react';
import { loadAdminRevenueData } from '../lib/api.js';
import { money } from '../lib/format.js';
import { DASHBOARD_PATH } from '../lib/session.js';
import MetricCard from '../components/MetricCard.jsx';
import DataTable from '../components/DataTable.jsx';
import '../styles/revenue-dashboard.css';

export default function RevenuePage({ onBack }) {
  const [revenueData, setRevenueData] = useState({ bookings: [], refunds: [] });
  const [error, setError] = useState('');
  const [lastSynced, setLastSynced] = useState(null);
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
          setLastSynced(new Date());
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
              {error || (lastSynced ? `Live Sync · Updated ${lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Connecting to live ledger…')}
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
          {refreshing ? 'Syncing…' : '↻ Refresh Ledger'}
        </button>
      </header>

      <main style={{ maxWidth: '1200px', margin: '28px auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {error && (
          <div style={{ padding: '14px 18px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#b91c1c', fontSize: '13px' }}>
            {error} Showing the last cached financial data.
          </div>
        )}

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          <MetricCard label="Net Platform Revenue" value={lastSynced ? money(revenueData.totalRevenue) : (refreshing ? 'Loading…' : '—')} accent="#16a34a" delta="Collected net of refunds" icon="₹" />
          <MetricCard label="Gross Ticket Sales" value={lastSynced ? money(revenueData.grossRevenue) : (refreshing ? 'Loading…' : '—')} accent="#2563eb" delta="All booking transactions" icon="📈" />
          <MetricCard label="Completed Refunds" value={lastSynced ? money(revenueData.totalRefunds) : (refreshing ? 'Loading…' : '—')} accent="#dc2626" delta="Returned to customers" icon="↻" />
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
          <DataTable headers={['Transaction ID', 'Booking ID', 'Customer', 'Type', 'Date', 'Amount', 'Status']} emptyText={!lastSynced && refreshing ? 'Loading revenue transactions…' : 'No completed payment or refund transactions found.'}>
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
