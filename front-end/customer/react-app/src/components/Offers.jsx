import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchActiveOffersThunk, showToastThunk } from '../store/actions';

export default function Offers() {
  const dispatch = useDispatch();
  const offers = useSelector((state) => state.offers.items);
  const loading = useSelector((state) => state.offers.loading);
  const error = useSelector((state) => state.offers.error || '');
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    const loadOffers = () => dispatch(fetchActiveOffersThunk());
    loadOffers();
    const timer = setInterval(loadOffers, 30000);
    window.addEventListener('focus', loadOffers);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', loadOffers);
    };
  }, [dispatch]);

  const handleCopy = (code) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopiedCode(code);
    dispatch(showToastThunk(`🎟️ Coupon code "${code}" copied to clipboard!`, 'success'));
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  return (
    <div className="page-body fade-up">
      <h1 className="page-heading">Offers & Deals</h1>
      <p className="page-subhead">Exclusive discounts just for you</p>

      <div className="offers-hero">
        <div className="offers-hero-text">
          <p className="offers-hero-title">🎉 Save Big on Every Trip!</p>
          <p className="offers-hero-sub">
            Browse current coupons and check eligibility when you book.
          </p>
        </div>
        <div className="offers-hero-emoji">🎫</div>
      </div>

      {error && <p role="alert" style={{ color: '#b91c1c', margin: '12px 0' }}>{error}</p>}
      <div className="offers-grid">
        {offers.map((offer) => (
          <div key={offer.offerId} className="offer-card">
            <div className="offer-card-header">
              <div className="offer-icon-wrap orange">🎟️</div>
              <div className="offer-info">
                <div className="offer-title">{offer.offerCode}</div>
                <div className="offer-desc">{offer.description || 'Use this coupon on an eligible booking.'}</div>
              </div>
              <span className="offer-badge new">ACTIVE</span>
            </div>

            <div className="offer-card-coupon">
              <span className="coupon-code-text">{offer.offerCode}</span>
              <button
                className={`copy-btn ${copiedCode === offer.offerCode ? 'copied' : ''}`}
                onClick={() => handleCopy(offer.offerCode)}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                {copiedCode === offer.offerCode ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <div className="offer-card-footer">
              <span className="offer-validity">
                {offer.startDate} – {offer.endDate}
                {Number(offer.minFare) > 0 ? ` · Min fare ₹${offer.minFare}` : ''}
              </span>
              <span className="offer-discount-chip">
                {offer.flatDiscount != null ? `₹${offer.flatDiscount} OFF` : `${offer.discountPercentage}% OFF`}
              </span>
            </div>
          </div>
        ))}
      </div>

      {!loading && !error && offers.length === 0 && (
        <div className="offers-empty visible">
          <div className="offers-empty-icon">🎫</div>
          <p style={{ fontSize: '.9rem', fontWeight: 500 }}>No active coupons are available right now.</p>
        </div>
      )}
      {loading && <p role="status">Loading available coupons…</p>}
    </div>
  );
}
