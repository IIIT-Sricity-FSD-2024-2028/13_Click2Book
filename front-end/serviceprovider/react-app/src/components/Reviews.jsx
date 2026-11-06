import React, { useState, useEffect, useMemo } from 'react';
import {
  getBusReviews,
  submitCustomerReview,
  replyToReview,
  deleteReviewReply,
  getProviderFleetRatingSummary,
  getDashboardData,
} from '../services/api';

/* Quick Reply Templates for Service Provider */
const QUICK_REPLIES = [
  '🙏 Thank you for traveling with us! We are thrilled you enjoyed the journey.',
  '⏱️ We take punctuality and safety very seriously. Thank you for your feedback!',
  '🧼 Cleanliness and hygiene are our top priorities. Looking forward to welcoming you aboard again.',
  '⚠️ We sincerely apologize for any delay or inconvenience. We have escalated this to our route operations team.',
  '💺 Thank you for noticing our comfortable seating and AC. Have a wonderful day!',
];

export default function Reviews({ provider, showToast, onNavigate }) {
  const [reviews, setReviews] = useState([]);
  const [filterTrip, setFilterTrip] = useState('ALL');
  const [filterRating, setFilterRating] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'PENDING' | 'REPLIED'
  const [searchTerm, setSearchTerm] = useState('');

  // Operator Reply State
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Simulation Modal State (Customer Review Simulator)
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [simForm, setSimForm] = useState({
    tripId: 'T001',
    customerName: 'Rahul Sharma',
    bookingId: 'BK-89412',
    seatNumber: '14A',
    rating: 5,
    categories: { punctuality: 5, cleanliness: 5, comfort: 5, staff: 5 },
    comment: 'Exceptional journey! The bus departed on time, the seats were spotless and very comfortable.',
  });
  const [simSubmitting, setSimSubmitting] = useState(false);
  const [showIntegrationDetails, setShowIntegrationDetails] = useState(false);

  // Active Buses / Trips for dropdown
  const buses = useMemo(() => {
    try {
      const data = getDashboardData();
      return data.buses || [];
    } catch {
      return [];
    }
  }, []);

  const loadReviews = () => {
    try {
      const data = getBusReviews(provider?.id);
      setReviews(data);
    } catch (e) {
      console.warn('Error loading reviews:', e);
    }
  };

  useEffect(() => {
    loadReviews();
    const handleSync = () => loadReviews();
    window.addEventListener('storage', handleSync);
    window.addEventListener('c2b_sync', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('c2b_sync', handleSync);
    };
  }, [provider?.id]);

  // Overall Rating & Statistics
  const summary = useMemo(() => {
    return getProviderFleetRatingSummary(provider?.id);
  }, [reviews, provider?.id]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (filterTrip !== 'ALL' && r.tripId !== filterTrip) return false;
      if (filterRating !== 'ALL' && Math.round(r.rating || 5) !== parseInt(filterRating, 10)) return false;
      if (filterStatus === 'PENDING' && r.providerReply) return false;
      if (filterStatus === 'REPLIED' && !r.providerReply) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = (r.customerName || '').toLowerCase().includes(q);
        const matchBooking = (r.bookingId || '').toLowerCase().includes(q);
        const matchComment = (r.comment || '').toLowerCase().includes(q);
        const matchRoute = (r.route || '').toLowerCase().includes(q);
        const matchBus = (r.busName || '').toLowerCase().includes(q);
        if (!matchName && !matchBooking && !matchComment && !matchRoute && !matchBus) return false;
      }

      return true;
    });
  }, [reviews, filterTrip, filterRating, filterStatus, searchTerm]);

  // Handle Reply Submit
  const handleSendReply = (reviewId) => {
    if (!replyText.trim()) {
      showToast('Please type a reply message first.', 'warning');
      return;
    }

    setIsSubmittingReply(true);
    try {
      const updated = replyToReview(reviewId, replyText, provider?.name || 'Kiran Travels');
      loadReviews();
      setReplyingId(null);
      setReplyText('');
      showToast(`💬 Official reply sent to passenger ${updated.customerName || ''}!`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to submit reply.', 'error');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleDeleteReply = (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this reply?')) return;
    try {
      deleteReviewReply(reviewId);
      loadReviews();
      showToast('Reply removed.', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to remove reply.', 'error');
    }
  };

  const startReplying = (review) => {
    setReplyingId(review.reviewId);
    setReplyText(review.providerReply || '');
  };

  // Handle Customer Simulation Submit
  const handleSimulateSubmit = async (e) => {
    e.preventDefault();
    setSimSubmitting(true);
    try {
      const selectedBus = buses.find((b) => b.id === simForm.tripId || b.tripId === simForm.tripId);
      const newRev = await submitCustomerReview({
        tripId: simForm.tripId,
        busName: selectedBus?.name || (simForm.tripId === 'T001' ? 'Volvo A/C B12' : 'Scania AC'),
        route: selectedBus?.route || (simForm.tripId === 'T001' ? 'SriCity → Chennai' : 'Tada → Vizag'),
        customerName: simForm.customerName,
        bookingId: simForm.bookingId,
        seatNumber: simForm.seatNumber,
        rating: Number(simForm.rating),
        categories: simForm.categories,
        comment: simForm.comment,
      });

      loadReviews();
      setShowSimulateModal(false);
      showToast(`⭐ New Review submitted by ${newRev.customerName} on ${newRev.busName}!`, 'success');

      // Randomize next form data
      const sampleNames = ['Karthik Narayanan', 'Meera Krishnan', 'Arun Varma', 'Ananya Sengupta', 'Deepak Joshi'];
      const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
      setSimForm({
        tripId: simForm.tripId,
        customerName: randomName,
        bookingId: `BK-${Math.floor(10000 + Math.random() * 90000)}`,
        seatNumber: `${Math.floor(Math.random() * 25) + 1}${['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)]}`,
        rating: 5,
        categories: { punctuality: 5, cleanliness: 5, comfort: 5, staff: 5 },
        comment: 'Great trip! Punctual and safe driving throughout.',
      });
    } catch (err) {
      showToast(err.message || 'Simulation failed.', 'error');
    } finally {
      setSimSubmitting(false);
    }
  };

  // Helper to render star rating
  const renderStars = (rating) => {
    const full = Math.round(Number(rating) || 5);
    return (
      <span style={{ color: '#f59e0b', fontSize: '1rem', letterSpacing: '1px' }}>
        {'★'.repeat(full)}
        <span style={{ color: '#cbd5e1' }}>{'★'.repeat(Math.max(0, 5 - full))}</span>
      </span>
    );
  };

  const getRatingBadgeClass = (rating) => {
    const val = Number(rating);
    if (val >= 4.5) return 'badge-green';
    if (val >= 3.5) return 'badge-blue';
    if (val >= 2.5) return 'badge-orange';
    return 'badge-red';
  };

  return (
    <div>
      {/* Top Action Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: '1.25rem',
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: '#1e293b' }}>
            Bus Ratings &amp; Traveler Reviews
          </h3>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' }}>
            Real-time passenger ratings, journey feedback, and direct operator replies for your fleet.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            className="btn btn-outline"
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem', borderColor: '#3b82f6', color: '#2563eb' }}
            onClick={() => setShowIntegrationDetails((prev) => !prev)}
          >
            🔌 {showIntegrationDetails ? 'Hide Customer Contract' : 'Customer Integration API'}
          </button>

          <button
            className="btn btn-primary"
            style={{
              padding: '0.45rem 1rem',
              fontSize: '0.82rem',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              border: 'none',
              boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)',
            }}
            onClick={() => setShowSimulateModal(true)}
          >
            ⚡ Simulate Passenger Review
          </button>
        </div>
      </div>

      {/* Customer Integration Helper Info (When expanded) */}
      {showIntegrationDetails && (
        <div
          className="card"
          style={{
            marginBottom: '1.25rem',
            background: '#f8fafc',
            border: '1px solid #bfdbfe',
            borderLeft: '4px solid #3b82f6',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h4 style={{ color: '#1e40af', margin: '0 0 6px', fontSize: '0.95rem', fontWeight: 700 }}>
                🤝 Ready-to-Connect Customer Contract (Ratings &amp; Coupons)
              </h4>
              <p style={{ fontSize: '0.82rem', color: '#334155', margin: '0 0 10px', lineHeight: 1.5 }}>
                Your friend working on the <strong>Customer module</strong> can immediately plug into both reviews and coupons using the standard localStorage contracts or the global helper methods:
              </p>
            </div>
            <button
              onClick={() => setShowIntegrationDetails(false)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '1.1rem' }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
            <div style={{ background: '#fff', padding: '10px 14px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.82rem', marginBottom: 4 }}>
                ⭐ Customer Submits Review for a Bus:
              </div>
              <code style={{ display: 'block', fontSize: '0.75rem', background: '#f1f5f9', padding: '8px', borderRadius: 4, color: '#0369a1' }}>
                {`// 1. Using window API:
window.Click2BookReviewAPI.submit({
  tripId: 'T001',
  rating: 5,
  comment: 'Great ride!',
  categories: { punctuality: 5, cleanliness: 5, comfort: 5, staff: 4 }
});

// 2. Or standard storage key:
localStorage.getItem('c2b_bus_reviews');`}
              </code>
            </div>

            <div style={{ background: '#fff', padding: '10px 14px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.82rem', marginBottom: 4 }}>
                🎟️ Customer Redeems Provider Coupon:
              </div>
              <code style={{ display: 'block', fontSize: '0.75rem', background: '#f1f5f9', padding: '8px', borderRadius: 4, color: '#15803d' }}>
                {`// 1. Read active non-exhausted coupons:
const active = window.Click2BookCouponAPI.getAllActive();

// 2. Redeem at checkout:
window.Click2BookCouponAPI.redeem('FIRST20', {
  ticketCount: 3,
  baseFare: 1800,
  customerName: 'Rahul Sharma'
});`}
              </code>
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="stats-grid" style={{ marginBottom: '1.25rem' }}>
        <div className="stat-card orange">
          <div className="stat-header">
            <div className="stat-icon orange">⭐</div>
            <span className="stat-trend">Overall Score</span>
          </div>
          <div className="stat-value">
            {summary.averageRating} <span style={{ fontSize: '1rem', color: '#f59e0b' }}>★</span>
          </div>
          <div className="stat-label">
            Fleet Rating ({summary.positivePercentage}% 4-5★ positive)
          </div>
        </div>

        <div className="stat-card blue">
          <div className="stat-header">
            <div className="stat-icon blue">📝</div>
            <span className="stat-trend">Passenger Feedback</span>
          </div>
          <div className="stat-value">{summary.totalReviews}</div>
          <div className="stat-label">Total Verified Reviews</div>
        </div>

        <div className="stat-card green">
          <div className="stat-header">
            <div className="stat-icon green">💬</div>
            <span className="stat-trend">Operator Care</span>
          </div>
          <div className="stat-value">{summary.responseRate}%</div>
          <div className="stat-label">
            {summary.repliedCount} Replied &bull; {summary.pendingCount} Pending
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-header">
            <div className="stat-icon purple">🎯</div>
            <span className="stat-trend">Quality Index</span>
          </div>
          <div className="stat-value">
            {summary.categoryAverages.cleanliness} <span style={{ fontSize: '0.85rem', color: '#64748b' }}>/5</span>
          </div>
          <div className="stat-label">Cleanliness &amp; Hygiene Rating</div>
        </div>
      </div>

      {/* Category Breakdown & Star Distribution Strip */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          marginBottom: '1.25rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20,
          alignItems: 'center',
        }}
      >
        {/* Category Highlights */}
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: 12 }}>
            🏆 Service Category Performance
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>⏱️ Punctuality</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                {summary.categoryAverages.punctuality} <span style={{ fontSize: '0.75rem', color: '#f59e0b' }}>★</span>
              </div>
            </div>
            <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>🧼 Cleanliness</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                {summary.categoryAverages.cleanliness} <span style={{ fontSize: '0.75rem', color: '#f59e0b' }}>★</span>
              </div>
            </div>
            <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>💺 AC &amp; Comfort</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                {summary.categoryAverages.comfort} <span style={{ fontSize: '0.75rem', color: '#f59e0b' }}>★</span>
              </div>
            </div>
            <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>🤝 Driver &amp; Crew</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                {summary.categoryAverages.staff} <span style={{ fontSize: '0.75rem', color: '#f59e0b' }}>★</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rating Breakdown Bars */}
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: 8 }}>
            📊 Star Rating Distribution
          </div>
          {[5, 4, 3, 2, 1].map((stars) => {
            const pct = summary.starPercentages[stars] || 0;
            const count = summary.starCounts[stars] || 0;
            const isSelected = filterRating === String(stars);

            return (
              <div
                key={stars}
                onClick={() => setFilterRating(isSelected ? 'ALL' : String(stars))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: '0.78rem',
                  marginBottom: 6,
                  cursor: 'pointer',
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: isSelected ? '#fef3c7' : 'transparent',
                }}
                title={`Filter by ${stars} Stars`}
              >
                <span style={{ width: 45, fontWeight: 600, color: '#475569' }}>{stars} Stars</span>
                <div style={{ flex: 1, background: '#e2e8f0', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: stars >= 4 ? '#22c55e' : stars === 3 ? '#f59e0b' : '#ef4444',
                      borderRadius: 4,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
                <span style={{ width: 45, textAlign: 'right', color: '#64748b' }}>
                  {pct}% ({count})
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
          background: '#fff',
          padding: '12px 16px',
          borderRadius: 8,
          border: '1px solid #e2e8f0',
          marginBottom: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Trip Selector */}
          <div>
            <select
              value={filterTrip}
              onChange={(e) => setFilterTrip(e.target.value)}
              className="form-control"
              style={{ padding: '6px 12px', fontSize: '0.82rem', minWidth: 200, fontWeight: 600 }}
            >
              <option value="ALL">All Active Fleet &amp; Buses</option>
              {buses.map((bus) => (
                <option key={bus.id} value={bus.tripId || bus.id}>
                  {bus.route} ({bus.name})
                </option>
              ))}
            </select>
          </div>

          {/* Star Filter */}
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              className={`btn ${filterRating === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '5px 10px', fontSize: '0.78rem', fontWeight: 600 }}
              onClick={() => setFilterRating('ALL')}
            >
              All Stars
            </button>
            <button
              className={`btn ${filterRating === '5' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '5px 10px', fontSize: '0.78rem', fontWeight: 600 }}
              onClick={() => setFilterRating('5')}
            >
              5 ★
            </button>
            <button
              className={`btn ${filterRating === '4' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '5px 10px', fontSize: '0.78rem', fontWeight: 600 }}
              onClick={() => setFilterRating('4')}
            >
              4 ★
            </button>
            <button
              className={`btn ${filterRating === '3' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '5px 10px', fontSize: '0.78rem', fontWeight: 600 }}
              onClick={() => setFilterRating('3')}
            >
              3 ★
            </button>
            <button
              className={`btn ${filterRating === '1' || filterRating === '2' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '5px 10px', fontSize: '0.78rem', fontWeight: 600 }}
              onClick={() => setFilterRating('2')}
            >
              1-2 ★
            </button>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              className={`btn ${filterStatus === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '5px 10px', fontSize: '0.78rem', fontWeight: 600 }}
              onClick={() => setFilterStatus('ALL')}
            >
              All
            </button>
            <button
              className={`btn ${filterStatus === 'PENDING' ? 'btn-primary' : 'btn-outline'}`}
              style={{
                padding: '5px 10px',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: filterStatus === 'PENDING' ? '#fff' : '#b45309',
                borderColor: filterStatus === 'PENDING' ? undefined : '#fcd34d',
              }}
              onClick={() => setFilterStatus('PENDING')}
            >
              Pending Reply ({summary.pendingCount})
            </button>
            <button
              className={`btn ${filterStatus === 'REPLIED' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '5px 10px', fontSize: '0.78rem', fontWeight: 600 }}
              onClick={() => setFilterStatus('REPLIED')}
            >
              Replied ({summary.repliedCount})
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search passenger, booking, comment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control"
            style={{ padding: '6px 12px', fontSize: '0.82rem', width: 230 }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="btn btn-outline"
              style={{ padding: '5px 8px', fontSize: '0.75rem' }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Review Feed */}
      {filteredReviews.length === 0 ? (
        <div className="card" style={{ padding: '48px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>⭐</div>
          <h4 style={{ color: '#1e293b', marginBottom: 6 }}>No reviews found for this selection</h4>
          <p style={{ color: '#64748b', fontSize: '0.85rem', maxWidth: 450, margin: '0 auto 16px' }}>
            No traveler feedback matches your active filters. You can clear your filters or simulate a customer review to verify real-time display.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
            <button
              className="btn btn-outline"
              onClick={() => {
                setFilterTrip('ALL');
                setFilterRating('ALL');
                setFilterStatus('ALL');
                setSearchTerm('');
              }}
            >
              Reset Filters
            </button>
            <button className="btn btn-primary" onClick={() => setShowSimulateModal(true)}>
              ⚡ Simulate Passenger Review
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filteredReviews.map((review) => {
            const isReplying = replyingId === review.reviewId;
            const initials = (review.customerName || 'Passenger')
              .split(' ')
              .map((w) => w[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <div
                key={review.reviewId}
                className="card"
                style={{
                  padding: '18px 22px',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'box-shadow 0.2s ease',
                }}
              >
                {/* Review Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: 10,
                    marginBottom: 12,
                  }}
                >
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        flexShrink: 0,
                      }}
                    >
                      {initials}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                          {review.customerName}
                        </span>
                        {review.verifiedBooking && (
                          <span
                            style={{
                              background: '#ecfdf5',
                              color: '#059669',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              padding: '2px 7px',
                              borderRadius: 12,
                              border: '1px solid #a7f3d0',
                            }}
                          >
                            ✓ Verified Booking
                          </span>
                        )}
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                          {new Date(review.reviewDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
                        <span>Booking ID: <strong style={{ color: '#334155' }}>{review.bookingId}</strong></span>
                        <span>&bull;</span>
                        <span>Seat: <strong style={{ color: '#334155' }}>{review.seatNumber || 'N/A'}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Star Rating Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {renderStars(review.rating)}
                    <span
                      className={`badge ${getRatingBadgeClass(review.rating)}`}
                      style={{ fontSize: '0.82rem', padding: '3px 9px', fontWeight: 700 }}
                    >
                      {review.rating} / 5
                    </span>
                  </div>
                </div>

                {/* Bus and Route Metadata Strip */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    flexWrap: 'wrap',
                    background: '#f8fafc',
                    padding: '8px 12px',
                    borderRadius: 6,
                    fontSize: '0.8rem',
                    marginBottom: 12,
                  }}
                >
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>
                    🚌 {review.busName || 'Express Bus'}
                  </span>
                  <span style={{ color: '#94a3b8' }}>|</span>
                  <span style={{ color: '#475569' }}>
                    Route: <strong>{review.route || 'Intercity'}</strong>
                  </span>
                  <span style={{ color: '#94a3b8' }}>|</span>
                  <span style={{ color: '#64748b' }}>Trip ID: {review.tripId}</span>

                  <button
                    onClick={() => onNavigate('manage-schedules')}
                    style={{
                      marginLeft: 'auto',
                      background: 'transparent',
                      border: 'none',
                      color: '#2563eb',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    View Trip in Schedule &rarr;
                  </button>
                </div>

                {/* Category Ratings Pills */}
                {review.categories && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                    <span
                      style={{
                        background: '#f1f5f9',
                        padding: '3px 8px',
                        borderRadius: 4,
                        fontSize: '0.72rem',
                        color: '#475569',
                      }}
                    >
                      ⏱️ Punctuality: <strong>{review.categories.punctuality || 5}/5</strong>
                    </span>
                    <span
                      style={{
                        background: '#f1f5f9',
                        padding: '3px 8px',
                        borderRadius: 4,
                        fontSize: '0.72rem',
                        color: '#475569',
                      }}
                    >
                      🧼 Cleanliness: <strong>{review.categories.cleanliness || 5}/5</strong>
                    </span>
                    <span
                      style={{
                        background: '#f1f5f9',
                        padding: '3px 8px',
                        borderRadius: 4,
                        fontSize: '0.72rem',
                        color: '#475569',
                      }}
                    >
                      💺 Comfort: <strong>{review.categories.comfort || 5}/5</strong>
                    </span>
                    <span
                      style={{
                        background: '#f1f5f9',
                        padding: '3px 8px',
                        borderRadius: 4,
                        fontSize: '0.72rem',
                        color: '#475569',
                      }}
                    >
                      🤝 Staff: <strong>{review.categories.staff || 5}/5</strong>
                    </span>
                  </div>
                )}

                {/* Passenger Review Comment */}
                <div
                  style={{
                    fontSize: '0.88rem',
                    color: '#334155',
                    lineHeight: 1.6,
                    padding: '8px 12px',
                    background: '#ffffff',
                    borderLeft: '3px solid #cbd5e1',
                    marginBottom: 12,
                    fontStyle: 'italic',
                  }}
                >
                  &ldquo;{review.comment || 'No written comment provided.'}&rdquo;
                </div>

                {/* Official Provider Reply Area */}
                {review.providerReply && !isReplying && (
                  <div
                    style={{
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderLeft: '4px solid #22c55e',
                      padding: '12px 16px',
                      borderRadius: 6,
                      marginTop: 10,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#166534' }}>
                        🏢 Official Response from {review.providerName || provider?.name || 'Operator'}
                      </span>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {review.repliedAt && (
                          <span style={{ fontSize: '0.72rem', color: '#15803d' }}>
                            {new Date(review.repliedAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                        <button
                          onClick={() => startReplying(review)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#15803d',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteReply(review.reviewId)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#dc2626',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.84rem', color: '#14532d', lineHeight: 1.5 }}>
                      {review.providerReply}
                    </p>
                  </div>
                )}

                {/* Reply Form (Active when operator clicks Reply or Edit) */}
                {isReplying && (
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: 8,
                      padding: 14,
                      marginTop: 12,
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#1e293b', marginBottom: 6 }}>
                      ✍️ Official Operator Reply to {review.customerName}:
                    </div>

                    {/* Quick Response Chips */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                      {QUICK_REPLIES.map((template, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setReplyText(template)}
                          style={{
                            background: '#fff',
                            border: '1px solid #cbd5e1',
                            padding: '3px 8px',
                            borderRadius: 12,
                            fontSize: '0.7rem',
                            color: '#475569',
                            cursor: 'pointer',
                          }}
                        >
                          {template.slice(0, 32)}...
                        </button>
                      ))}
                    </div>

                    <textarea
                      rows={3}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write your professional response to the passenger..."
                      className="form-control"
                      style={{ width: '100%', fontSize: '0.84rem', marginBottom: 10 }}
                    />

                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '5px 12px', fontSize: '0.8rem' }}
                        onClick={() => {
                          setReplyingId(null);
                          setReplyText('');
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '5px 14px', fontSize: '0.8rem' }}
                        onClick={() => handleSendReply(review.reviewId)}
                        disabled={isSubmittingReply}
                      >
                        {isSubmittingReply ? 'Sending Reply...' : 'Post Official Reply'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Reply Button if not replied yet and not active */}
                {!review.providerReply && !isReplying && (
                  <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn-outline"
                      style={{
                        padding: '4px 12px',
                        fontSize: '0.78rem',
                        borderColor: '#2563eb',
                        color: '#2563eb',
                        fontWeight: 600,
                      }}
                      onClick={() => startReplying(review)}
                    >
                      💬 Reply to Passenger
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Customer Review Simulator Modal */}
      {showSimulateModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#1e293b' }}>
                ⚡ Test &amp; Simulate Passenger Bus Review
              </h3>
              <button
                className="close-btn"
                onClick={() => setShowSimulateModal(false)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSimulateSubmit}>
              <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                <div
                  style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    padding: '8px 12px',
                    borderRadius: 6,
                    fontSize: '0.78rem',
                    color: '#1e40af',
                    marginBottom: 14,
                  }}
                >
                  💡 <strong>Simulator for Evaluation &amp; Multi-Actor Testing:</strong> Simulates a passenger who booked a seat giving a live review and rating. It saves to the shared review storage and sends a real-time event.
                </div>

                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                    Select Booked Bus &amp; Route *
                  </label>
                  <select
                    className="form-control"
                    value={simForm.tripId}
                    onChange={(e) => setSimForm({ ...simForm, tripId: e.target.value })}
                    required
                  >
                    {buses.map((b) => (
                      <option key={b.id} value={b.tripId || b.id}>
                        {b.route} — {b.name} ({b.tripId || b.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      Passenger Name *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={simForm.customerName}
                      onChange={(e) => setSimForm({ ...simForm, customerName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      Booking ID *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={simForm.bookingId}
                      onChange={(e) => setSimForm({ ...simForm, bookingId: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      Assigned Seat
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={simForm.seatNumber}
                      onChange={(e) => setSimForm({ ...simForm, seatNumber: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      Overall Star Rating *
                    </label>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => {
                            setSimForm({
                              ...simForm,
                              rating: star,
                              categories: {
                                punctuality: star,
                                cleanliness: star,
                                comfort: star,
                                staff: star,
                              },
                            });
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            fontSize: '1.4rem',
                            cursor: 'pointer',
                            color: star <= simForm.rating ? '#f59e0b' : '#cbd5e1',
                            padding: 0,
                          }}
                        >
                          ★
                        </button>
                      ))}
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, marginLeft: 6, color: '#475569' }}>
                        {simForm.rating} / 5
                      </span>
                    </div>
                  </div>
                </div>

                {/* Category Ratings Slider/Pills */}
                <div style={{ background: '#f8fafc', padding: 10, borderRadius: 6, marginBottom: 14 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 8 }}>
                    Category Breakdown Ratings (1 - 5):
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                    {['punctuality', 'cleanliness', 'comfort', 'staff'].map((cat) => (
                      <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                        <span style={{ textTransform: 'capitalize', color: '#475569' }}>{cat}:</span>
                        <select
                          className="form-control"
                          style={{ width: 65, padding: '2px 6px', fontSize: '0.75rem' }}
                          value={simForm.categories[cat]}
                          onChange={(e) =>
                            setSimForm({
                              ...simForm,
                              categories: { ...simForm.categories, [cat]: Number(e.target.value) },
                            })
                          }
                        >
                          {[5, 4, 3, 2, 1].map((n) => (
                            <option key={n} value={n}>{n} ★</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                    Passenger Review &amp; Comments *
                  </label>
                  <textarea
                    rows={3}
                    className="form-control"
                    value={simForm.comment}
                    onChange={(e) => setSimForm({ ...simForm, comment: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowSimulateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={simSubmitting}
                >
                  {simSubmitting ? 'Posting Review...' : 'Submit as Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

