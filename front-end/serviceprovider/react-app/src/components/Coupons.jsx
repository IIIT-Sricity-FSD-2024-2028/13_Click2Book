import React, { useState, useEffect, useMemo } from 'react';
import {
  getProviderCoupons,
  createProviderCoupon,
  toggleCouponStatus,
  deleteProviderCoupon,
  simulateCustomerRedemption,
  getApprovedCities,
} from '../services/api';

export default function Coupons({ provider, showToast, onNavigate }) {
  const [coupons, setCoupons] = useState([]);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'TICKET_COUNT' | 'REGULAR_CUSTOMER' | 'ANY_BOOKING' | 'EXHAUSTED'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCouponForManifest, setSelectedCouponForManifest] = useState(null);

  // Form State
  const [form, setForm] = useState({
    code: '',
    title: '',
    ruleType: 'TICKET_COUNT', // TICKET_COUNT | REGULAR_CUSTOMER | ANY_BOOKING
    minTicketCount: '3',
    regularCustomerMinTrips: '2',
    discountType: 'PERCENTAGE', // PERCENTAGE | FLAT
    discountValue: '20',
    maxDiscountAmount: '250',
    minBookingFare: '400',
    maxQuota: '20',
    corridor: 'ALL',
    expiryDate: (() => {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      return d.toISOString().split('T')[0];
    })(),
  });

  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const approvedCities = useMemo(() => getApprovedCities(), []);

  const loadCoupons = () => {
    setCoupons(getProviderCoupons());
  };

  useEffect(() => {
    loadCoupons();
    const handleSync = () => loadCoupons();
    window.addEventListener('storage', handleSync);
    return () => window.removeEventListener('storage', handleSync);
  }, []);

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      const newCoupon = await createProviderCoupon({
        code: form.code,
        title: form.title,
        ruleType: form.ruleType,
        minTicketCount: form.minTicketCount,
        regularCustomerMinTrips: form.regularCustomerMinTrips,
        discountType: form.discountType,
        discountValue: form.discountValue,
        maxDiscountAmount: form.maxDiscountAmount,
        minBookingFare: form.minBookingFare,
        maxQuota: form.maxQuota,
        corridor: form.corridor,
        expiryDate: form.expiryDate,
      });

      loadCoupons();
      setShowCreateModal(false);
      showToast(`🎟️ Coupon "${newCoupon.code}" created successfully! Limited to first ${newCoupon.maxQuota} users.`, 'success');

      // Reset form
      setForm({
        code: '',
        title: '',
        ruleType: 'TICKET_COUNT',
        minTicketCount: '3',
        regularCustomerMinTrips: '2',
        discountType: 'PERCENTAGE',
        discountValue: '20',
        maxDiscountAmount: '250',
        minBookingFare: '400',
        maxQuota: '20',
        corridor: 'ALL',
        expiryDate: (() => {
          const d = new Date();
          d.setMonth(d.getMonth() + 1);
          return d.toISOString().split('T')[0];
        })(),
      });
    } catch (err) {
      setFormError(err.message || 'Failed to create coupon.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggle = (couponId) => {
    try {
      const updated = toggleCouponStatus(couponId);
      loadCoupons();
      showToast(`Coupon "${updated.code}" is now ${updated.status}.`, 'info');
    } catch (err) {
      showToast(err.message || 'Could not update status', 'error');
    }
  };

  const handleDelete = (coupon) => {
    if (!window.confirm(`Are you sure you want to delete coupon "${coupon.code}"? It will be removed from customer access immediately.`)) {
      return;
    }
    deleteProviderCoupon(coupon.id);
    loadCoupons();
    showToast(`Coupon "${coupon.code}" deleted.`, 'info');
  };

  /* ── Interactive simulation of customer accessing and redeeming token ── */
  const handleSimulateRedemption = (coupon) => {
    try {
      const result = awaitSimulate(coupon.id);
      loadCoupons();
      if (result.exhausted) {
        showToast(
          `🔒 Limit reached! ${result.redemption.customerName} redeemed "${coupon.code}". Maximum quota (${coupon.maxQuota}) fulfilled — Token is now REMOVED from customer end!`,
          'warn'
        );
      } else {
        showToast(
          `✅ Redemption simulated! ${result.redemption.customerName} applied "${coupon.code}" (Saved ₹${result.redemption.discountAmount}). (${result.coupon.usedCount}/${result.coupon.maxQuota} accessed)`,
          'success'
        );
      }
    } catch (err) {
      showToast(err.message || 'Redemption failed', 'error');
    }
  };

  const awaitSimulate = (couponId) => {
    return simulateCustomerRedemption(couponId);
  };

  // Filtered List
  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      if (activeFilter === 'ALL') return true;
      if (activeFilter === 'EXHAUSTED') return c.status === 'EXHAUSTED' || c.usedCount >= c.maxQuota;
      return c.ruleType === activeFilter;
    });
  }, [coupons, activeFilter]);

  // Aggregate Stats
  const stats = useMemo(() => {
    const totalCoupons = coupons.length;
    const activeCoupons = coupons.filter((c) => c.status === 'ACTIVE' && c.usedCount < c.maxQuota).length;
    const exhaustedCoupons = coupons.filter((c) => c.status === 'EXHAUSTED' || c.usedCount >= c.maxQuota).length;
    const totalRedemptions = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);
    const totalDiscountGranted = coupons.reduce((sum, c) => {
      const redList = c.redemptions || [];
      return sum + redList.reduce((acc, r) => acc + (r.discountAmount || 0), 0);
    }, 0);

    return { totalCoupons, activeCoupons, exhaustedCoupons, totalRedemptions, totalDiscountGranted };
  }, [coupons]);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3>Coupons &amp; Promotional Tokens</h3>
          <p>Provide tailored discounts for bulk bookings, loyal regular commuters, or limited-quota vouchers.</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create Promo Token
        </button>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card orange">
          <div className="stat-header">
            <div className="stat-icon orange">🏷️</div>
            <span className="stat-trend">Live Tokens</span>
          </div>
          <div className="stat-value">{stats.activeCoupons}</div>
          <div className="stat-label">Active Customer Coupons</div>
        </div>

        <div className="stat-card green">
          <div className="stat-header">
            <div className="stat-icon green">👥</div>
            <span className="stat-trend">Access Volume</span>
          </div>
          <div className="stat-value">{stats.totalRedemptions}</div>
          <div className="stat-label">Total People Accessed Tokens</div>
        </div>

        <div className="stat-card blue">
          <div className="stat-header">
            <div className="stat-icon blue">🔒</div>
            <span className="stat-trend">Quota Fulfilled</span>
          </div>
          <div className="stat-value">{stats.exhaustedCoupons}</div>
          <div className="stat-label">Tokens Auto-Removed from Customer End</div>
        </div>

        <div className="stat-card purple">
          <div className="stat-header">
            <div className="stat-icon purple">💰</div>
            <span className="stat-trend">Customer Benefit</span>
          </div>
          <div className="stat-value">₹{stats.totalDiscountGranted.toLocaleString('en-IN')}</div>
          <div className="stat-label">Total Discount Granted</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
          background: '#fff',
          padding: '10px 14px',
          borderRadius: 8,
          border: '1px solid #e2e8f0',
          marginBottom: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className={`btn ${activeFilter === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '6px 14px', fontSize: '0.82rem', fontWeight: 600 }}
            onClick={() => setActiveFilter('ALL')}
          >
            All Tokens ({coupons.length})
          </button>
          <button
            className={`btn ${activeFilter === 'TICKET_COUNT' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '6px 14px', fontSize: '0.82rem', fontWeight: 600 }}
            onClick={() => setActiveFilter('TICKET_COUNT')}
          >
            🎟️ Bulk Tickets (N+ Seats)
          </button>
          <button
            className={`btn ${activeFilter === 'REGULAR_CUSTOMER' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '6px 14px', fontSize: '0.82rem', fontWeight: 600 }}
            onClick={() => setActiveFilter('REGULAR_CUSTOMER')}
          >
            ⭐ Regular / Loyal Commuters
          </button>
          <button
            className={`btn ${activeFilter === 'ANY_BOOKING' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '6px 14px', fontSize: '0.82rem', fontWeight: 600 }}
            onClick={() => setActiveFilter('ANY_BOOKING')}
          >
            🌐 Any Customer
          </button>
          <button
            className={`btn ${activeFilter === 'EXHAUSTED' ? 'btn-primary' : 'btn-outline'}`}
            style={{
              padding: '6px 14px',
              fontSize: '0.82rem',
              fontWeight: 600,
              borderColor: activeFilter === 'EXHAUSTED' ? undefined : '#fca5a5',
              color: activeFilter === 'EXHAUSTED' ? undefined : '#dc2626',
            }}
            onClick={() => setActiveFilter('EXHAUSTED')}
          >
            🔒 Quota Limit Reached ({stats.exhaustedCoupons})
          </button>
        </div>

        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
          Showing <strong>{filteredCoupons.length}</strong> tokens
        </div>
      </div>

      {/* Coupons Cards Grid */}
      {filteredCoupons.length === 0 ? (
        <div className="card" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '2.2rem', marginBottom: 8 }}>🏷️</div>
          <h4 style={{ color: '#1e293b', marginBottom: 4 }}>No coupons found for this filter</h4>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 14 }}>
            Create custom discount tokens limited to the first N commuters or tailored for bulk and regular passengers.
          </p>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            + Create First Coupon
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {filteredCoupons.map((coupon) => {
            const isExhausted = coupon.status === 'EXHAUSTED' || coupon.usedCount >= coupon.maxQuota;
            const isPaused = coupon.status === 'PAUSED';
            const pct = Math.min(100, Math.round(((coupon.usedCount || 0) / coupon.maxQuota) * 100));

            return (
              <div
                key={coupon.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: isExhausted
                    ? '1.5px solid #fca5a5'
                    : isPaused
                    ? '1.5px solid #fde68a'
                    : '1.5px solid #e2e8f0',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Status Indicator Stripe */}
                <div
                  style={{
                    height: 4,
                    width: '100%',
                    background: isExhausted ? '#ef4444' : isPaused ? '#f59e0b' : '#16a34a',
                  }}
                />

                <div style={{ padding: '16px' }}>
                  {/* Card Header: Code & Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '1.05rem',
                            fontWeight: 800,
                            letterSpacing: '1px',
                            background: '#f1f5f9',
                            padding: '3px 10px',
                            borderRadius: 6,
                            border: '1px dashed #94a3b8',
                            color: '#0f172a',
                          }}
                        >
                          {coupon.code}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(coupon.code);
                            showToast(`Copied ${coupon.code} to clipboard!`, 'info');
                          }}
                          title="Copy Code"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 2 }}
                        >
                          📋
                        </button>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1e293b', marginTop: 4 }}>
                        {coupon.title}
                      </div>
                    </div>

                    <div>
                      {isExhausted ? (
                        <span className="badge badge-red" style={{ fontSize: '0.72rem' }}>
                          🔒 Limit Reached (Removed)
                        </span>
                      ) : isPaused ? (
                        <span className="badge badge-orange" style={{ fontSize: '0.72rem' }}>
                          ⏸ Paused
                        </span>
                      ) : (
                        <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>
                          ● Active on Portal
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Rule Badge */}
                  <div style={{ marginBottom: 12 }}>
                    {coupon.ruleType === 'TICKET_COUNT' && (
                      <span
                        style={{
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          border: '1px solid #bfdbfe',
                          padding: '3px 8px',
                          borderRadius: 4,
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          display: 'inline-block',
                        }}
                      >
                        🎟️ Minimum {coupon.minTicketCount} Tickets Required
                      </span>
                    )}
                    {coupon.ruleType === 'REGULAR_CUSTOMER' && (
                      <span
                        style={{
                          background: '#fef3c7',
                          color: '#b45309',
                          border: '1px solid #fde68a',
                          padding: '3px 8px',
                          borderRadius: 4,
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          display: 'inline-block',
                        }}
                      >
                        ⭐ Regular Commuters (≥ {coupon.regularCustomerMinTrips || 2} Prior Trips)
                      </span>
                    )}
                    {coupon.ruleType === 'ANY_BOOKING' && (
                      <span
                        style={{
                          background: '#f0fdf4',
                          color: '#15803d',
                          border: '1px solid #bbf7d0',
                          padding: '3px 8px',
                          borderRadius: 4,
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          display: 'inline-block',
                        }}
                      >
                        🌐 Any Customer Booking
                      </span>
                    )}
                  </div>

                  {/* Discount Value Highlight */}
                  <div
                    style={{
                      background: '#f8fafc',
                      borderRadius: 8,
                      padding: '10px 12px',
                      marginBottom: 14,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#2563eb' }}>
                        {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} FLAT OFF`}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        {coupon.discountType === 'PERCENTAGE' && coupon.maxDiscountAmount
                          ? `Up to ₹${coupon.maxDiscountAmount} discount`
                          : `Direct fare deduction`}
                        {coupon.minBookingFare > 0 && ` · Min fare ₹${coupon.minBookingFare}`}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.74rem', color: '#475569' }}>
                      Corridor: <strong>{coupon.corridor === 'ALL' ? 'All Routes' : coupon.corridor}</strong>
                      <br />
                      Valid till: {coupon.expiryDate}
                    </div>
                  </div>

                  {/* Customer Quota Progress Bar (Core Requirement) */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: '#334155' }}>
                        👥 People Accessed Token:
                      </span>
                      <span style={{ fontWeight: 700, color: isExhausted ? '#dc2626' : '#16a34a' }}>
                        {coupon.usedCount} / {coupon.maxQuota} people ({pct}%)
                      </span>
                    </div>

                    <div
                      style={{
                        width: '100%',
                        height: 8,
                        background: '#e2e8f0',
                        borderRadius: 4,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: isExhausted ? '#ef4444' : pct > 75 ? '#f59e0b' : '#16a34a',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>

                    <div style={{ marginTop: 6, fontSize: '0.74rem' }}>
                      {isExhausted ? (
                        <div style={{ color: '#dc2626', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span>🔒</span>
                          <span>Quota reached ({coupon.maxQuota}/{coupon.maxQuota}). Customer portal access automatically locked!</span>
                        </div>
                      ) : (
                        <div style={{ color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span>🟢</span>
                          <span>{coupon.maxQuota - coupon.usedCount} customer redemptions available before automatic removal.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div
                  style={{
                    padding: '10px 16px',
                    background: '#f8fafc',
                    borderTop: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 6,
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setSelectedCouponForManifest(coupon)}
                    style={{ fontSize: '0.76rem', padding: '4px 10px', fontWeight: 600 }}
                  >
                    📋 View Redemptions ({coupon.usedCount})
                  </button>

                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {/* Simulator Button for Lab Evaluation */}
                    {!isExhausted && !isPaused && (
                      <button
                        type="button"
                        onClick={() => handleSimulateRedemption(coupon)}
                        title="Simulate a customer booking using this token to test quota decrement and automatic lock"
                        style={{
                          background: '#f0fdf4',
                          border: '1px solid #86efac',
                          color: '#16a34a',
                          borderRadius: 5,
                          padding: '4px 8px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        ⚡ Simulate Claim
                      </button>
                    )}

                    {!isExhausted && (
                      <button
                        type="button"
                        onClick={() => handleToggle(coupon.id)}
                        className="btn btn-outline"
                        style={{ fontSize: '0.74rem', padding: '4px 8px' }}
                      >
                        {isPaused ? 'Resume' : 'Pause'}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(coupon)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        padding: 2,
                      }}
                      title="Delete Coupon"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
         MODAL 1: Create New Coupon / Token
         ───────────────────────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 620, width: '92%' }}>
            <div className="modal-header-row">
              <div>
                <div className="modal-title">🎟️ Create Promotional Coupon / Token</div>
                <div className="modal-sub">
                  Configure discount rules and restrict total customer redemption quota.
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body-scroll">
              {formError && <div className="alert alert-error">⚠️ {formError}</div>}

              <form onSubmit={handleCreateCoupon}>
                {/* Code & Title */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Coupon Code (Uppercase) *</label>
                    <input
                      type="text"
                      className="form-control no-icon"
                      placeholder="e.g. KIRAN3PLUS, FREQUENT20"
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                      required
                      style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Campaign / Offer Title *</label>
                    <input
                      type="text"
                      className="form-control no-icon"
                      placeholder="e.g. Group Booking Saver"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Eligibility Rule Selector */}
                <div className="form-group">
                  <label className="form-label">Eligibility Criteria / Customer Targeting *</label>
                  <select
                    className="form-control no-icon"
                    value={form.ruleType}
                    onChange={(e) => setForm({ ...form, ruleType: e.target.value })}
                    style={{ cursor: 'pointer', fontWeight: 600 }}
                  >
                    <option value="TICKET_COUNT">🎟️ Ticket Count Rule (Bulk Booking / Group Travel)</option>
                    <option value="REGULAR_CUSTOMER">⭐ Regular Commuters Only (Loyalty Program)</option>
                    <option value="ANY_BOOKING">🌐 General Public (Open to Any Booking)</option>
                  </select>
                </div>

                {/* Dynamic Inputs based on Rule */}
                {form.ruleType === 'TICKET_COUNT' && (
                  <div
                    style={{
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: 8,
                      padding: '12px 14px',
                      marginBottom: '1rem',
                    }}
                  >
                    <label className="form-label" style={{ color: '#1e40af' }}>
                      Minimum Tickets Booked in Single PNR *
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                        type="number"
                        className="form-control no-icon"
                        min="2"
                        max="10"
                        value={form.minTicketCount}
                        onChange={(e) => setForm({ ...form, minTicketCount: e.target.value })}
                        style={{ width: 100 }}
                        required
                      />
                      <span style={{ fontSize: '0.82rem', color: '#1e40af' }}>
                        Customer receives discount only when booking <strong>{form.minTicketCount || 2}+ seats</strong>.
                      </span>
                    </div>
                  </div>
                )}

                {form.ruleType === 'REGULAR_CUSTOMER' && (
                  <div
                    style={{
                      background: '#fef3c7',
                      border: '1px solid #fde68a',
                      borderRadius: 8,
                      padding: '12px 14px',
                      marginBottom: '1rem',
                    }}
                  >
                    <label className="form-label" style={{ color: '#92400e' }}>
                      Minimum Prior Completed Trips for Regular Customer *
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                        type="number"
                        className="form-control no-icon"
                        min="1"
                        max="20"
                        value={form.regularCustomerMinTrips}
                        onChange={(e) => setForm({ ...form, regularCustomerMinTrips: e.target.value })}
                        style={{ width: 100 }}
                        required
                      />
                      <span style={{ fontSize: '0.82rem', color: '#92400e' }}>
                        Only commuter accounts with at least <strong>{form.regularCustomerMinTrips || 2} completed journeys</strong> qualify.
                      </span>
                    </div>
                  </div>
                )}

                {/* Quota Limit (The Core Requirement) */}
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: 8,
                    padding: '12px 14px',
                    marginBottom: '1rem',
                  }}
                >
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', color: '#0f172a' }}>
                    <span>Limit to First N People Only (Maximum Redemption Quota) *</span>
                    <span style={{ color: '#dc2626', fontWeight: 700, fontSize: '0.75rem' }}>Strict Cap Enforcement</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input
                      type="number"
                      className="form-control no-icon"
                      min="1"
                      max="1000"
                      placeholder="e.g. 20"
                      value={form.maxQuota}
                      onChange={(e) => setForm({ ...form, maxQuota: e.target.value })}
                      required
                      style={{ width: 120, fontSize: '1rem', fontWeight: 700 }}
                    />
                    <span style={{ fontSize: '0.82rem', color: '#475569' }}>
                      After <strong>{form.maxQuota || 0} customers</strong> redeem this token, it is <strong>automatically locked and removed from the customer portal</strong>.
                    </span>
                  </div>
                </div>

                {/* Discount Type & Value */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Discount Type *</label>
                    <select
                      className="form-control no-icon"
                      value={form.discountType}
                      onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                      style={{ cursor: 'pointer' }}
                    >
                      <option value="PERCENTAGE">Percentage (%) Discount</option>
                      <option value="FLAT">Flat Amount (₹) Discount</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {form.discountType === 'PERCENTAGE' ? 'Discount Percentage (%) *' : 'Flat Discount (₹) *'}
                    </label>
                    <input
                      type="number"
                      className="form-control no-icon"
                      min="1"
                      max={form.discountType === 'PERCENTAGE' ? '90' : '2000'}
                      value={form.discountValue}
                      onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Limits & Corridor */}
                <div className="form-row">
                  {form.discountType === 'PERCENTAGE' && (
                    <div className="form-group">
                      <label className="form-label">Max Discount Cap (₹)</label>
                      <input
                        type="number"
                        className="form-control no-icon"
                        min="50"
                        value={form.maxDiscountAmount}
                        onChange={(e) => setForm({ ...form, maxDiscountAmount: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Applicable Corridor / Route</label>
                    <select
                      className="form-control no-icon"
                      value={form.corridor}
                      onChange={(e) => setForm({ ...form, corridor: e.target.value })}
                      style={{ cursor: 'pointer' }}
                    >
                      <option value="ALL">All Network Routes</option>
                      {approvedCities.slice(0, 8).map((city) => (
                        <option key={city} value={`SriCity → ${city}`}>
                          SriCity → {city}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Expiry Date */}
                <div className="form-group">
                  <label className="form-label">Coupon Expiry Date *</label>
                  <input
                    type="date"
                    className="form-control no-icon"
                    value={form.expiryDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                    required
                    style={{ cursor: 'pointer' }}
                  />
                </div>

                {/* Modal Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: '1.25rem' }}>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setShowCreateModal(false)}
                    style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1' }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={formLoading} style={{ padding: '8px 20px' }}>
                    {formLoading ? 'Creating…' : 'Issue Coupon Token'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
         MODAL 2: Redemptions Manifest / Passenger Access Inspector
         ───────────────────────────────────────────────────────────── */}
      {selectedCouponForManifest && (
        <div className="modal-overlay" onClick={() => setSelectedCouponForManifest(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720, width: '94%' }}>
            <div className="modal-header-row">
              <div>
                <div className="modal-title">
                  👥 Passenger Redemptions Manifest — <span style={{ color: '#2563eb' }}>{selectedCouponForManifest.code}</span>
                </div>
                <div className="modal-sub">
                  Real-time log of passengers who accessed and applied this promotional token.
                </div>
              </div>
              <button className="modal-close" onClick={() => setSelectedCouponForManifest(null)}>
                ✕
              </button>
            </div>

            <div className="modal-body-scroll">
              {/* Manifest Summary Card */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: '12px 16px',
                  marginBottom: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                    {selectedCouponForManifest.title}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
                    Quota: <strong>{selectedCouponForManifest.usedCount} of {selectedCouponForManifest.maxQuota} people</strong> accessed
                  </div>
                </div>

                <div>
                  {selectedCouponForManifest.usedCount >= selectedCouponForManifest.maxQuota ? (
                    <span className="badge badge-red" style={{ fontSize: '0.75rem' }}>
                      🔒 Quota Exhausted (Customer Access Locked)
                    </span>
                  ) : (
                    <span className="badge badge-green" style={{ fontSize: '0.75rem' }}>
                      🟢 {selectedCouponForManifest.maxQuota - selectedCouponForManifest.usedCount} Slots Remaining
                    </span>
                  )}
                </div>
              </div>

              {/* Redemptions Table */}
              {(selectedCouponForManifest.redemptions || []).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 16px', color: '#94a3b8' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>👥</div>
                  <p style={{ fontWeight: 600 }}>No passenger redemptions yet.</p>
                  <p style={{ fontSize: '0.8rem' }}>
                    Use the <strong>"⚡ Simulate Claim"</strong> button on the card to simulate passenger redemptions during evaluation.
                  </p>
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>PASSENGER</th>
                        <th>BOOKING ID</th>
                        <th>ROUTE</th>
                        <th>TICKETS</th>
                        <th>DISCOUNT</th>
                        <th>TIME</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedCouponForManifest.redemptions || []).map((r, i) => (
                        <tr key={r.redemptionId || i}>
                          <td>
                            <strong>{r.customerName}</strong>
                            {r.customerEmail && (
                              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{r.customerEmail}</div>
                            )}
                          </td>
                          <td style={{ fontFamily: 'monospace', fontWeight: 600, color: '#2563eb' }}>
                            {r.bookingId}
                          </td>
                          <td style={{ fontSize: '0.82rem' }}>{r.tripRoute || 'SriCity → Chennai'}</td>
                          <td>
                            <span style={{ fontWeight: 600, color: '#0f172a' }}>{r.ticketsBooked || 1} seat(s)</span>
                          </td>
                          <td style={{ color: '#16a34a', fontWeight: 700 }}>
                            -₹{r.discountAmount}
                          </td>
                          <td style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {new Date(r.redeemedAt).toLocaleString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setSelectedCouponForManifest(null)}
                >
                  Close Inspector
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

