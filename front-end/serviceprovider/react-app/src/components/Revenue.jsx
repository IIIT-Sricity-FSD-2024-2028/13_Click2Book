import React, { useState, useEffect } from 'react';
import { fetchRevenue } from '../services/api';

export default function Revenue({ provider }) {
  const [stats, setStats] = useState({ totalGross: 0, totalNet: 0, totalBookings: 0, totalSeats: 0 });
  const [rows, setRows] = useState([]);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(null); // backend earnings: { ledger, transfers, totals… } in paise

  const providerId = provider?.id
    || sessionStorage.getItem('c2b_loggedInId')
    || localStorage.getItem('c2b_loggedInId')
    || 'P001';

  useEffect(() => {
    const loadRevenue = () => {
      fetchRevenue(providerId).then(({ data, localBookings, localSchedules, isLive: live }) => {
        setIsLive(live);
        if (live && data) {
          setLive(data);
        } else {
          setLive(null);
          // Compute from localStorage
          const bookings  = localBookings  || JSON.parse(localStorage.getItem('c2b_bookings')       || '[]');
          const schedules = localSchedules || JSON.parse(localStorage.getItem('c2b_bus_schedules')  || '[]');
          const busMap = {};
          schedules.forEach((s) => {
            const key = s.id || s.tripId;
            busMap[key] = { ...s, gross: 0, bookingCount: 0, passengerCount: 0, seats: [] };
          });

          let totalGross = 0, totalBookings = 0, totalSeats = 0;
          const seenIds = new Set();
          bookings.forEach((b) => {
            if (!b?.bookingId || seenIds.has(b.bookingId) || b.status === 'CANCELLED' || b.booking_status === 'CANCELLED') return;
            seenIds.add(b.bookingId);
            const seatArr = Array.isArray(b.seat_list) ? b.seat_list : Array.isArray(b.seats) ? b.seats : typeof b.seats === 'string' ? b.seats.split(',') : [];
            const matchKey = Object.keys(busMap).find((k) =>
              (b.tripId && (k === b.tripId)) ||
              (b.busName && busMap[k]?.busName?.toLowerCase() === b.busName.toLowerCase()) ||
              (b.from && b.to && busMap[k]?.from?.toLowerCase() === b.from.toLowerCase() && busMap[k]?.to?.toLowerCase() === b.to.toLowerCase())
            );
            const amount = Number(b.total) || Number(b.amount) || Number(b.subtotal) || (b.fare ? b.fare * seatArr.length : 500);
            totalGross += amount; totalBookings += 1; totalSeats += seatArr.length;
            if (matchKey) {
              busMap[matchKey].gross += amount;
              busMap[matchKey].bookingCount += 1;
              busMap[matchKey].passengerCount += seatArr.length;
            }
          });

          const busList = Object.values(busMap);
          // Default fleet if no data
          const defaultRows = [
            { busName: 'Volvo A/C B12', route: 'SriCity → Chennai', gross: 16000, net: 14400, bookingCount: 8, passengerCount: 32 },
            { busName: 'Scania AC',     route: 'Tada → Vizag',      gross: 11200, net: 10080, bookingCount: 7, passengerCount: 28 },
            { busName: 'Sleeper Bus',   route: 'Pune → Mumbai',     gross:  7500, net:  6750, bookingCount: 5, passengerCount: 15 },
          ];

          const finalRows = busList.length > 0
            ? busList.map((b) => ({
                busName:        b.busName  || 'Express Bus',
                route:          b.from && b.to ? `${b.from} → ${b.to}` : 'Unknown',
                gross:          b.gross,
                net:            Math.round(b.gross * 0.9),
                bookingCount:   b.bookingCount,
                passengerCount: b.passengerCount,
              }))
            : defaultRows;

          const finalGross = totalGross || defaultRows.reduce((s, r) => s + r.gross, 0);
          setStats({
            totalGross:    finalGross,
            totalNet:      Math.round(finalGross * 0.9),
            totalBookings: totalBookings || defaultRows.reduce((s, r) => s + r.bookingCount, 0),
            totalSeats:    totalSeats    || defaultRows.reduce((s, r) => s + r.passengerCount, 0),
          });
          setRows(finalRows);
        }
        setLoading(false);
      });
    };

    loadRevenue();
    window.addEventListener('storage', loadRevenue);
    const interval = setInterval(loadRevenue, 4000);
    return () => {
      window.removeEventListener('storage', loadRevenue);
      clearInterval(interval);
    };
  }, [providerId]);

  if (loading) return <div className="empty-state" style={{ paddingTop: '4rem' }}><p>⏳ Loading revenue data…</p></div>;

  const fmtInr = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
  const fromPaise = (p) => `₹${(Number(p || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (live) return <LiveRevenue data={live} fromPaise={fromPaise} />;

  const statCards = [
    { label: 'Total Gross Revenue', value: fmtInr(stats.totalGross), color: '#f97316' },
    { label: 'Net Operator Revenue (90%)', value: fmtInr(stats.totalNet), color: '#22c55e' },
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
          <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>10% platform commission deducted</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>BUS / VEHICLE</th>
                <th>ROUTE</th>
                <th>BOOKINGS</th>
                <th>PASSENGERS</th>
                <th style={{ textAlign: 'right' }}>GROSS</th>
                <th style={{ textAlign: 'right' }}>NET (90%)</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>
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
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>{fmtInr(r.net)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/** Earnings from the backend ledger: every booking on this provider's trips, and what Click2Book has transferred. */
function LiveRevenue({ data, fromPaise }) {
  const active = data.ledger.filter((l) => l.status !== 'cancelled');
  const statCards = [
    { label: 'Total Gross Fare', value: fromPaise(data.totalBaseFare), color: '#f97316' },
    { label: 'Your Earnings (after commission)', value: fromPaise(data.totalOperatorPayout), color: '#22c55e' },
    { label: 'Received from Click2Book', value: fromPaise(data.totalPaidOut), color: '#3b82f6' },
    { label: 'Pending Transfer', value: fromPaise(data.totalPending), color: '#a855f7' },
  ];
  const cell = { textAlign: 'right' };

  return (
    <div className="revenue-page-wrap">
      <div className="page-header">
        <div>
          <h3>Provider Revenue &amp; Payouts</h3>
          <p>
            <span className="live-badge"><span className="live-dot" />Live data</span> · {active.length} active booking(s),{' '}
            {data.cancelledCount} cancelled
          </p>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        {statCards.map((sc) => (
          <div key={sc.label} className="stat-card" style={{ '--card-accent': sc.color }}>
            <div className="stat-value" style={{ fontSize: '1.5rem' }}>{sc.value}</div>
            <div className="stat-label">{sc.label}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3>Transfers Received</h3>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>TRANSFER</th>
                <th>DATE</th>
                <th>BOOKINGS</th>
                <th style={cell}>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {data.transfers.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>
                    No transfers yet. Click2Book transfers your pending earnings from the Super Admin console.
                  </td>
                </tr>
              ) : (
                data.transfers.map((t) => (
                  <tr key={t.transferId}>
                    <td className="font-medium">{t.transferId}</td>
                    <td className="text-muted">{t.createdAt.replace('T', ' ').slice(0, 16)}</td>
                    <td>{t.bookingCount}</td>
                    <td style={{ ...cell, fontWeight: 700, color: '#16a34a' }}>{fromPaise(t.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Bookings &amp; Payout Status</h3>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>BOOKING</th>
                <th>DATE</th>
                <th style={cell}>FARE</th>
                <th style={cell}>YOUR EARNING</th>
                <th>PAYOUT</th>
              </tr>
            </thead>
            <tbody>
              {data.ledger.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>
                    No bookings yet. Earnings appear here as soon as a customer books one of your trips.
                  </td>
                </tr>
              ) : (
                data.ledger.map((l) => (
                  <tr key={l.ledgerId}>
                    <td className="font-medium">{l.bookingId}</td>
                    <td className="text-muted">{l.createdAt.replace('T', ' ').slice(0, 16)}</td>
                    <td style={cell}>{fromPaise(l.baseFare)}</td>
                    <td style={{ ...cell, fontWeight: 700 }}>{l.status === 'cancelled' ? '—' : fromPaise(l.operatorPayout)}</td>
                    <td>
                      {l.status === 'cancelled'
                        ? 'Cancelled'
                        : l.payoutStatus === 'paid'
                          ? `Paid (${l.transferId})`
                          : 'Pending'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
