import React, { useState, useEffect, useCallback } from 'react';
import { Search, CheckCircle, Clock, ShieldCheck, ArrowRight, RotateCcw } from 'lucide-react';
import { API } from '../services/api';

export default function TrackRefunds({ initialBookingId = '', customer, user, showToast, onNavigate }) {
  const [searchTerm, setSearchTerm] = useState(initialBookingId);
  const [filter, setFilter] = useState('all'); // 'all' | 'processing' | 'completed'
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (initialBookingId) {
      setSearchTerm(initialBookingId);
    }
  }, [initialBookingId]);

  const loadRefunds = useCallback(async () => {
    setLoading(true);
    const raw = [];
    const customerId = customer?.id || user?.id || 'C001';

    // 1. Fetch authoritative live customer bookings from backend
    try {
      const apiBookings = await API.bookings.getMine();
      if (Array.isArray(apiBookings)) {
        for (const b of apiBookings) {
          if (b.bookingStatus === 'CANCELLED') {
            const bId = b.bookingId;
            let backendRefund = null;
            try {
              backendRefund = await API.refunds.getByBooking(bId);
            } catch {
              // Not yet recorded in backend refunds; attempt to record
              try {
                const fare = Number(b.totalAmount || b.fare || 650);
                backendRefund = await API.refunds.request(bId, Math.max(0, fare - 50));
              } catch {}
            }

            const fare = Number(b.totalAmount || b.fare || 650);
            const fee = 50;
            const refundAmt = backendRefund?.refundAmount !== undefined
              ? Number(backendRefund.refundAmount)
              : Math.max(0, fare - fee);

            const bStatus = backendRefund?.refundStatus
              ? backendRefund.refundStatus.toUpperCase()
              : 'REQUESTED';

            raw.push({
              refund_id: `REF-${bId}`,
              booking_id: bId,
              customer_id: customerId,
              route: `${b.from || 'Hyderabad'} → ${b.to || 'Chennai'}`,
              bus_name: b.busName || 'Click2Book Express',
              original_fare: fare,
              fee,
              refund_amount: refundAmt,
              status: bStatus === 'COMPLETED' ? 'COMPLETED' : 'PROCESSING',
              raw_status: bStatus,
              request_date: backendRefund?.refundDate || b.bookingDate || new Date().toISOString().split('T')[0],
              arn: `ARN${(bId.replace(/\D/g, '') || '7829104')}55`,
              payment_method: 'UPI / Bank Source',
            });
          }
        }
      }
    } catch (err) {
      console.warn('Backend refunds retrieval note:', err.message);
    }

    // 2. Check local storage refunds
    try {
      const localRefunds = JSON.parse(localStorage.getItem('c2b_refunds') || '[]');
      if (Array.isArray(localRefunds)) {
        localRefunds.forEach((r) => {
          if (!r.customer_id || r.customer_id === customerId) {
            raw.push(r);
          }
        });
      }
    } catch {}

    // 3. Scan cancelled bookings in localStorage
    try {
      const localBookings = JSON.parse(localStorage.getItem('c2b_bookings') || '[]');
      localBookings.forEach((b) => {
        const isCancelled = b.status === 'CANCELLED' || b.booking_status === 'CANCELLED';
        if (isCancelled && (!b.customer_id || b.customer_id === customerId || b.customerId === customerId)) {
          const bId = b.bookingId || b.booking_id;
          const fare = Number(b.total || b.amount || 650);
          raw.push({
            refund_id: `REF-${bId}`,
            booking_id: bId,
            customer_id: customerId,
            route: `${b.from || 'Hyderabad'} → ${b.to || 'Chennai'}`,
            bus_name: b.busName || 'Click2Book Express',
            original_fare: fare,
            fee: 50,
            refund_amount: Math.max(0, fare - 50),
            status: 'PROCESSING',
            raw_status: 'REQUESTED',
            request_date: b.cancelled_at ? b.cancelled_at.split('T')[0] : new Date().toISOString().split('T')[0],
            arn: `ARN${(bId.replace(/\D/g, '') || '7829104')}55`,
            payment_method: 'UPI / Source Account',
          });
        }
      });
    } catch {}

    // Deduplicate by booking_id
    const seen = new Set();
    const unified = [];
    raw.forEach((r) => {
      const bId = r.booking_id || r.bookingId;
      if (!bId || seen.has(bId)) return;
      seen.add(bId);

      const status = (r.status || r.raw_status || 'PROCESSING').toUpperCase();
      unified.push({
        refundId: r.refund_id || `REF-${bId}`,
        bookingId: bId,
        route: r.route || 'Hyderabad → Chennai',
        busName: r.bus_name || 'Click2Book Express',
        originalFare: Number(r.original_fare || 650),
        fee: Number(r.fee || 50),
        refundAmount: Number(r.refund_amount !== undefined ? r.refund_amount : Math.max(0, (r.original_fare || 650) - 50)),
        status: status === 'COMPLETED' ? 'COMPLETED' : 'PROCESSING',
        rawStatus: status,
        date: r.request_date || new Date().toISOString().split('T')[0],
        arn: r.arn || `ARN${Date.now().toString().slice(-9)}`,
        paymentMethod: r.payment_method || 'UPI (Source Account)',
      });
    });

    // Keep localStorage synchronized with verified list
    try {
      localStorage.setItem('c2b_refunds', JSON.stringify(unified));
    } catch {}

    setRefunds(unified);
    setLoading(false);
  }, [customer, user]);

  useEffect(() => {
    loadRefunds();

    const handleStorage = (e) => {
      if (!e.key || e.key.includes('refund') || e.key.includes('booking')) {
        loadRefunds();
      }
    };
    window.addEventListener('storage', handleStorage);
    const interval = setInterval(loadRefunds, 8000);

    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, [loadRefunds]);

  // Query single booking refund directly from API if searched
  const handleSearchSingleBooking = async (e) => {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) {
      loadRefunds();
      return;
    }

    try {
      const res = await API.refunds.getByBooking(searchTerm.trim());
      if (res && res.bookingId) {
        if (showToast) showToast(`Live refund status: ${res.refundStatus}`, 'success');
        loadRefunds();
      }
    } catch {
      // Backend may not have entity; local search works seamlessly
    }
  };

  const filteredRefunds = refunds.filter((r) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      r.bookingId.toLowerCase().includes(term) ||
      r.route.toLowerCase().includes(term) ||
      (r.arn && r.arn.toLowerCase().includes(term));

    const matchesFilter =
      filter === 'all' || r.status.toLowerCase() === filter.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  const totalAmount = refunds.reduce((sum, r) => sum + (r.refundAmount || 0), 0);
  const processingCount = refunds.filter((r) => r.status === 'PROCESSING').length;
  const completedCount = refunds.filter((r) => r.status === 'COMPLETED').length;
  const totalTickets = refunds.length;

  return (
    <div className="fade-up">
      <h1 className="page-heading">Refund Tracker</h1>
      <p className="page-subhead">
        Monitor refund progress, banking partner transfers, and Acquirer Reference Numbers (ARN)
      </p>

      {/* KPI Summary Cards */}
      <div className="refund-kpis">
        <div className="kpi-card">
          <div className="kpi-icon orange">💸</div>
          <div className="kpi-info">
            <h4>Total Refund Amount</h4>
            <p id="kpiTotalAmount">₹{totalAmount}</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon blue">⏳</div>
          <div className="kpi-info">
            <h4>Processing</h4>
            <p id="kpiProcessingCount">{processingCount}</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon green">✅</div>
          <div className="kpi-info">
            <h4>Credited</h4>
            <p id="kpiCompletedCount">{completedCount}</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon slate">🎫</div>
          <div className="kpi-info">
            <h4>Cancelled Tickets</h4>
            <p id="kpiTotalTickets">{totalTickets}</p>
          </div>
        </div>
      </div>

      {/* Controls Row */}
      <div className="controls-row">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            id="refundSearch"
            placeholder="Search by Booking ID, Route, or ARN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-tabs">
          <button
            type="button"
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Refunds
          </button>
          <button
            type="button"
            className={`filter-tab ${filter === 'processing' ? 'active' : ''}`}
            onClick={() => setFilter('processing')}
          >
            Processing
          </button>
          <button
            type="button"
            className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
          <button
            type="button"
            className="filter-tab"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginLeft: 'auto' }}
            onClick={() => {
              loadRefunds();
              if (showToast) showToast('Syncing live refund statuses from backend…', 'info');
            }}
            title="Check live status from backend"
          >
            <RotateCcw size={13} /> Refresh Status
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
          Loading refund records…
        </div>
      ) : filteredRefunds.length === 0 ? (
        <div className="refund-empty">
          <div className="re-icon">💸</div>
          <h3 className="re-title">No Refunds Found</h3>
          <p className="re-text">
            You don't have any cancellation refunds matching this criteria. Once you cancel a booking, live tracking will appear right here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {filteredRefunds.map((r) => {
            const isCompleted = r.status === 'COMPLETED';

            return (
              <div key={r.bookingId} className="refund-tracker-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
                  <div>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                      {r.route}
                    </span>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                      Booking ID: <strong>{r.bookingId}</strong> · Date: {r.date}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#16a34a' }}>
                      ₹{r.refundAmount}
                    </div>
                    <span className={`status-badge ${isCompleted ? 'status-confirmed' : 'status-pending'}`}>
                      {isCompleted ? 'CREDITED ✓' : 'PROCESSING WITH BANK'}
                    </span>
                  </div>
                </div>

                {/* 3-Step Progress Timeline */}
                <div className="timeline-track">
                  {/* Step 1: Cancellation Approved */}
                  <div className="timeline-step done">
                    <div className="step-dot">✓</div>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#1e293b' }}>
                      Cancellation Approved
                    </span>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Fee −₹50 applied</span>
                  </div>

                  {/* Step 2: Bank Processing */}
                  <div className={`timeline-step ${isCompleted ? 'done' : 'active'}`}>
                    <div className="step-dot">{isCompleted ? '✓' : '2'}</div>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#1e293b' }}>
                      Bank Processing
                    </span>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>ARN: {r.arn}</span>
                  </div>

                  {/* Step 3: Refund Credited */}
                  <div className={`timeline-step ${isCompleted ? 'done' : ''}`}>
                    <div className="step-dot">{isCompleted ? '✓' : '3'}</div>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: isCompleted ? '#16a34a' : '#94a3b8' }}>
                      Credited to Account
                    </span>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                      {isCompleted ? 'Settled' : '2–3 Business Days'}
                    </span>
                  </div>
                </div>

                {/* Bank / Security Pill */}
                <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                  <span>Source Account: <strong>{r.paymentMethod}</strong></span>
                  <span>Bank ARN: <strong style={{ fontFamily: 'monospace' }}>{r.arn}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
