import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRevenue } from '../services/api';
import { memStorage } from '../store/memoryBridge';
import { navigateTabThunk, showToastThunk } from '../store/actions';

export default function Revenue() {
  const dispatch = useDispatch();
  const provider = useSelector((state) => state.auth.provider);
  const onNavigate = (tab) => dispatch(navigateTabThunk(tab));
  const showToast = (msg, type = 'info') => dispatch(showToastThunk(msg, type));

  const [stats, setStats] = useState({ totalGross: 0, totalDiscount: 0, totalAfterCoupon: 0, totalNet: 0, totalBookings: 0, totalSeats: 0 });
  const [rows, setRows] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);

  const providerId = provider?.id || 'P001';

  useEffect(() => {
    const loadRevenue = () => {
      fetchRevenue(providerId).then(({ data, localBookings, localSchedules, isLive: live }) => {
        setIsLive(live);

        const bookings  = localBookings  || JSON.parse(memStorage.getItem('c2b_bookings')       || '[]');
        const schedules = localSchedules || JSON.parse(memStorage.getItem('c2b_bus_schedules')  || '[]');

        if (live && data) {
          // Use API data shape
          setStats({
            totalGross: data.totalGross || 0,
            totalDiscount: data.totalDiscount || 0,
            totalAfterCoupon: data.totalAfterCoupon || 0,
            totalNet:   data.totalNet   || 0,
            totalBookings: data.totalBookings || 0,
            totalSeats: data.totalSeats || 0,
          });
          setRows(data.breakdown || []);
        } else {
          // Compute from localStorage
          const busMap = {};
          schedules.forEach((s) => {
            const key = s.id || s.tripId;
            busMap[key] = { ...s, gross: 0, discount: 0, afterCoupon: 0, bookingCount: 0, passengerCount: 0, seats: [] };
          });

          let totalGross = 0, totalDiscount = 0, totalAfterCoupon = 0, totalBookings = 0, totalSeats = 0;
          const seenIds = new Set();
          bookings.forEach((b) => {
            if (!b?.bookingId || seenIds.has(b.bookingId) || b.status === 'CANCELLED' || b.booking_status === 'CANCELLED' || b.bookingStatus === 'CANCELLED') return;
            seenIds.add(b.bookingId);
            const seatArr = Array.isArray(b.seat_list) ? b.seat_list : Array.isArray(b.seats) ? b.seats : typeof b.seats === 'string' ? b.seats.split(',') : [];
            let matchKey = Object.keys(busMap).find((k) =>
              (b.tripId && (k === b.tripId)) ||
              (b.busName && busMap[k]?.busName && (busMap[k].busName.toLowerCase() === b.busName.toLowerCase() || busMap[k].busName.toLowerCase().includes(b.busName.toLowerCase()) || b.busName.toLowerCase().includes(busMap[k].busName.toLowerCase()))) ||
              (b.from && b.to && busMap[k]?.from && busMap[k]?.to && busMap[k].from.toLowerCase() === b.from.toLowerCase() && busMap[k].to.toLowerCase() === b.to.toLowerCase())
            );
            const amount = Number(b.grossFare) || Number(b.subtotal) || Number(b.fare ? b.fare * (seatArr.length || 1) : 0) || Number(b.total) || 500;
            const discount = Number(b.couponDiscount || b.discount || 0);
            const afterCoupon = Math.max(0, amount - discount);
            totalGross += amount; totalDiscount += discount; totalAfterCoupon += afterCoupon; totalBookings += 1; totalSeats += (seatArr.length || 1);
            if (!matchKey) {
              matchKey = b.tripId || `trip_${b.busName || 'bus'}_${b.from || ''}_${b.to || ''}`;
              busMap[matchKey] = {
                id: matchKey,
                tripId: matchKey,
                busName: b.busName || 'Express Bus',
                from: b.from || 'Origin',
                to: b.to || 'Destination',
                gross: 0,
                discount: 0,
                afterCoupon: 0,
                bookingCount: 0,
                passengerCount: 0,
                seats: [],
              };
            }
            busMap[matchKey].gross += amount;
            busMap[matchKey].discount += discount;
            busMap[matchKey].afterCoupon += afterCoupon;
            busMap[matchKey].bookingCount += 1;
            busMap[matchKey].passengerCount += (seatArr.length || 1);
          });

          const busList = Object.values(busMap);
          const finalRows = busList.map((b) => ({
                busName:        b.busName  || 'Express Bus',
                route:          b.from && b.to ? `${b.from} → ${b.to}` : 'Unknown',
                gross:          b.gross,
                discount:       b.discount || 0,
                afterCoupon:    b.afterCoupon || Math.max(0, b.gross - (b.discount || 0)),
                net:            b.net ?? Math.round((b.afterCoupon || Math.max(0, b.gross - (b.discount || 0))) * 0.9),
                bookingCount:   b.bookingCount,
                passengerCount: b.passengerCount,
              }));

          const finalGross = totalGross;
          const finalNet = busList.reduce(
            (sum, b) => sum + (Number(b.net) || Math.round(Number(b.afterCoupon ?? (Number(b.gross || 0) - Number(b.discount || 0))) * 0.9)),
            0,
          );
          setStats({
            totalGross:    finalGross,
            totalDiscount,
            totalAfterCoupon,
            totalNet:      finalNet,
            totalBookings,
            totalSeats,
          });
          setRows(finalRows);
        }

        // Build detailed ledger transactions across all bookings
        const seenTx = new Set();
        const txList = [];
        bookings.forEach((b) => {
          const bId = b?.bookingId || b?.booking_id;
          if (!bId || seenTx.has(bId)) return;
          seenTx.add(bId);

          const seatArr = Array.isArray(b.seat_list) ? b.seat_list : Array.isArray(b.seats) ? b.seats : typeof b.seats === 'string' ? b.seats.split(',').map((s) => s.trim()).filter(Boolean) : [];
          const seatCount = seatArr.length || 1;
          const isCancelled = b.status === 'CANCELLED' || b.booking_status === 'CANCELLED' || b.bookingStatus === 'CANCELLED';

          const customerName = b.customerName || b.passengerName || (Array.isArray(b.passengers) && b.passengers[0]?.name) || 'Customer';
          const couponCode = b.couponCode && b.couponCode !== 'NONE' ? b.couponCode : (b.offerCode || null);
          const couponDiscount = Number(b.discount || b.couponDiscount || 0);

          const grossFare = Number(b.grossFare || b.subtotal || (b.fare ? b.fare * seatCount : 0) || (b.total ? Math.max(0, b.total - 25 - Math.round((b.total - 25) * 0.18 / 1.18) + couponDiscount) : 500));
          const fareAfterCoupon = Number(b.fareAfterCoupon ?? Math.max(0, grossFare - couponDiscount));
          const gst = Number(b.gst || Math.round(grossFare * 0.18));
          const platformFee = Number(b.platformFee || 25);
          const platformCommission = isCancelled ? 0 : Number(b.platformCommission || Math.round(grossFare * 0.10));
          const operatorPayout = isCancelled ? 0 : Number(b.operatorPayout || (grossFare - platformCommission));

          txList.push({
            bookingId: bId,
            customerName,
            passengers: Array.isArray(b.passengers) ? b.passengers : [],
            busName: b.busName || 'Express Bus',
            route: (b.from && b.to) ? `${b.from} → ${b.to}` : 'Route',
            seats: seatArr.join(', ') || `Seat ${b.seatNumber || 1}`,
            seatCount,
            grossFare,
            gst,
            platformFee,
            couponCode,
            couponDiscount,
            fareAfterCoupon,
            platformCommission,
            operatorPayout,
            status: isCancelled ? 'CANCELLED' : (b.status || 'CONFIRMED'),
            date: b.date || b.journeyDate || (b.createdAt ? b.createdAt.split('T')[0] : 'Today'),
          });
        });
        setTransactions(txList);

        setLoading(false);
      });
    };

    loadRevenue();
    window.addEventListener('storage', loadRevenue);
    window.addEventListener('c2b_sync', loadRevenue);
    return () => {
      window.removeEventListener('storage', loadRevenue);
      window.removeEventListener('c2b_sync', loadRevenue);
    };
  }, [providerId]);

  if (loading && rows.length === 0) return <div className="empty-state" style={{ paddingTop: '4rem' }}><p>⏳ Loading revenue data…</p></div>;

  const fmtInr = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

  const statCards = [
    { label: 'Ticket Fare (excl. GST)', value: fmtInr(stats.totalGross), color: '#f97316' },
    { label: 'Coupon Discounts', value: `−${fmtInr(stats.totalDiscount)}`, color: '#b45309' },
    { label: 'Fare After Coupon (excl. GST)', value: fmtInr(stats.totalAfterCoupon), color: '#2563eb' },
    { label: 'Net Operator Payout', value: fmtInr(stats.totalNet), color: '#22c55e' },
    { label: 'Total Bookings', value: stats.totalBookings, color: '#3b82f6' },
    { label: 'Total Passengers', value: stats.totalSeats, color: '#a855f7' },
  ];

  return (
    <div className="revenue-page-wrap">
      <div className="page-header">
        <div>
          <h3>Provider Revenue &amp; Fleet Performance</h3>
          <p>
            {isLive
              ? <span className="live-badge"><span className="live-dot" />Live data</span>
              : <span className="offline-badge">🟡 Computed from local bookings</span>}
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        {statCards.map((sc) => (
          <div key={sc.label} className="stat-card" style={{ '--card-accent': sc.color }}>
            <div className="stat-value" style={{ fontSize: '1.5rem' }}>{sc.value}</div>
            <div className="stat-label">{sc.label}</div>
          </div>
        ))}
      </div>

      {/* Revenue Breakdown Table */}
      <div className="card">
        <div className="card-header">
          <h3>Revenue Breakdown per Bus</h3>
          <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>Ticket fare and coupon totals exclude GST</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>BUS / VEHICLE</th>
                <th>ROUTE</th>
                <th>BOOKINGS</th>
                <th>PASSENGERS</th>
                <th style={{ textAlign: 'right' }}>TICKET FARE (excl. GST)</th>
                <th style={{ textAlign: 'right' }}>COUPON SAVED</th>
                <th style={{ textAlign: 'right' }}>AFTER COUPON (excl. GST)</th>
                <th style={{ textAlign: 'right' }}>OPERATOR PAYOUT</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>
                    No revenue data available yet. Add schedules and bookings to see earnings.
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={i}>
                    <td className="font-medium">{r.busName}</td>
                    <td className="text-muted">{r.route}</td>
                    <td>{r.bookingCount}</td>
                    <td>{r.passengerCount}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmtInr(r.gross)}</td>
                    <td style={{ textAlign: 'right', color: '#b45309' }}>−{fmtInr(r.discount || 0)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#2563eb' }}>{fmtInr(r.afterCoupon ?? Math.max(0, r.gross - (r.discount || 0)))}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>{fmtInr(r.net)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Transactions & Payouts Ledger Table */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-header">
          <div>
            <h3>📜 Booking Transactions &amp; Payouts Ledger</h3>
            <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>
              Individual bookings with customer details, coupon discounts, platform charges, and net operator payout
            </span>
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f97316' }}>
            {transactions.length} Total Transaction{transactions.length === 1 ? '' : 's'}
          </span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>BOOKING ID / DATE</th>
                <th>CUSTOMER &amp; PASSENGERS</th>
                <th>BUS / ROUTE</th>
                <th>SEATS</th>
                <th style={{ textAlign: 'right' }}>TICKET FARE (excl. GST)</th>
                <th style={{ textAlign: 'center' }}>COUPON / DISCOUNT</th>
                <th style={{ textAlign: 'right' }}>AFTER COUPON (excl. GST)</th>
                <th style={{ textAlign: 'right' }}>TAXES &amp; FEES</th>
                <th style={{ textAlign: 'right' }}>PLATFORM COMM. (10%)</th>
                <th style={{ textAlign: 'right' }}>NET OPERATOR PAYOUT</th>
                <th style={{ textAlign: 'center' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>
                    No booking transactions recorded yet. Once customers book seats, financial breakdowns and payouts will appear here.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const isCanc = tx.status === 'CANCELLED';
                  return (
                    <tr key={tx.bookingId}>
                      <td>
                        <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.82rem', color: '#0f172a' }}>{tx.bookingId}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{tx.date}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{tx.customerName}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {tx.passengers.length > 0
                            ? tx.passengers.map((p) => p.name || 'Pax').join(', ')
                            : `${tx.seatCount} Passenger${tx.seatCount > 1 ? 's' : ''}`}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{tx.busName}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{tx.route}</div>
                      </td>
                      <td>
                        <span className="badge" style={{ background: '#eff6ff', color: '#2563eb', fontWeight: 700, border: '1px solid #bfdbfe', fontSize: '0.72rem' }}>
                          {tx.seats}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        {isCanc ? (
                          <span style={{ textDecoration: 'line-through', color: '#9ca3af' }}>{fmtInr(tx.grossFare)}</span>
                        ) : (
                          fmtInr(tx.grossFare)
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {tx.couponCode ? (
                          <span className="badge" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', fontWeight: 700, fontSize: '0.72rem' }}>
                            {tx.couponCode} (−₹{tx.couponDiscount})
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>None</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#2563eb' }}>
                        {isCanc ? fmtInr(0) : fmtInr(tx.fareAfterCoupon)}
                      </td>
                      <td style={{ textAlign: 'right', fontSize: '0.75rem', color: '#64748b' }}>
                        <div>GST: ₹{tx.gst}</div>
                        <div>Fee: ₹{tx.platformFee}</div>
                      </td>
                      <td style={{ textAlign: 'right', color: isCanc ? '#9ca3af' : '#dc2626', fontWeight: 600 }}>
                        {isCanc ? '₹0' : `−${fmtInr(tx.platformCommission)}`}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: isCanc ? '#9ca3af' : '#16a34a', fontSize: '0.95rem' }}>
                        {isCanc ? (
                          <span style={{ textDecoration: 'line-through', color: '#9ca3af' }}>₹0</span>
                        ) : (
                          fmtInr(tx.operatorPayout)
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${isCanc ? 'badge-danger' : 'badge-success'}`} style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '20px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          background: isCanc ? '#fee2e2' : '#dcfce7',
                          color: isCanc ? '#dc2626' : '#15803d',
                          border: isCanc ? '1px solid #fecaca' : '1px solid #bbf7d0',
                        }}>
                          {isCanc ? 'Cancelled' : 'Confirmed'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
