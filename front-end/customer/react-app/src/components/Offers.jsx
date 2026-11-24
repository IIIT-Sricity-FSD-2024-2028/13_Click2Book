import React, { useEffect, useState } from 'react';
import { API } from '../services/api';
import { offerTitle, offerDescription, offerConditions, offerDiscountLabel, offerExpiry, offerDaysLeft } from '../services/offers';

// Visual variety for cards; the offers themselves come from the backend (set by the Super Admin).
const LOOKS = [
  { icon: '🎁', iconColor: 'orange' },
  { icon: '🌟', iconColor: 'blue' },
  { icon: '⚡', iconColor: 'pink' },
  { icon: '🌧️', iconColor: 'green' },
  { icon: '⭐', iconColor: 'purple' },
];

const CATEGORIES = [
  { key: 'all', label: 'All Offers' },
  { key: 'percent', label: '% Off' },
  { key: 'flat', label: 'Flat ₹ Off' },
];

const kind = (o) => (o.flatDiscount != null ? 'flat' : 'percent');

export default function Offers({ showToast }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [copiedCode, setCopiedCode] = useState(null);
  const [offers, setOffers] = useState(null); // null = loading
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    API.offers
      .getActive()
      .then((o) => setOffers(Array.isArray(o) ? o : []))
      .catch(() => {
        setFailed(true);
        setOffers([]);
      });
  }, []);

  const list = offers || [];
  const filteredOffers = selectedCategory === 'all' ? list : list.filter((o) => kind(o) === selectedCategory);

  const handleCopy = (code) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopiedCode(code);
    if (showToast) {
      showToast(`🎟️ Coupon code "${code}" copied! Paste it at checkout.`, 'success');
    }
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="page-body fade-up">
      <h1 className="page-heading">Offers & Deals</h1>
      <p className="page-subhead">Exclusive discounts just for you</p>

      <div className="offers-hero">
        <div className="offers-hero-text">
          <p className="offers-hero-title">🎉 Save Big on Every Trip!</p>
          <p className="offers-hero-sub">
            Copy a code below and apply it on the payment page, or pick it from “View Available Offers” at checkout.
            Each offer can be used until the end of its expiry date.
          </p>
        </div>
        <div className="offers-hero-emoji">🎫</div>
      </div>

      <div className="offer-filters">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            className={`offer-filter-btn ${selectedCategory === cat.key ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {offers === null && <p style={{ color: '#64748b', fontSize: '.9rem' }}>Loading offers…</p>}

      <div className="offers-grid">
        {filteredOffers.map((offer, i) => {
          const look = LOOKS[i % LOOKS.length];
          const left = offerDaysLeft(offer);
          const conditions = offerConditions(offer);
          const badge = left <= 3 ? { text: left <= 0 ? 'ENDS TODAY' : `${left} DAYS LEFT`, cls: 'limited' } : null;
          return (
            <div key={offer.offerId} className="offer-card" data-category={kind(offer)}>
              <div className="offer-card-header">
                <div className={`offer-icon-wrap ${look.iconColor}`}>{look.icon}</div>
                <div className="offer-info">
                  <div className="offer-title">{offerTitle(offer)}</div>
                  <div className="offer-desc">{offerDescription(offer)}</div>
                </div>
                {badge && <span className={`offer-badge ${badge.cls}`}>{badge.text}</span>}
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
              {conditions.length > 0 && (
                <div className="offer-validity" style={{ padding: '0 0 6px' }}>{conditions.join(' · ')}</div>
              )}
              <div className="offer-card-footer">
                <span className="offer-validity" style={{ fontWeight: 700, color: left <= 3 ? '#dc2626' : undefined }}>
                  ⏳ {offerExpiry(offer)}
                </span>
                <span className="offer-discount-chip">{offerDiscountLabel(offer)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {offers !== null && filteredOffers.length === 0 && (
        <div className="offers-empty visible">
          <div className="offers-empty-icon">🎫</div>
          <p style={{ fontSize: '.9rem', fontWeight: 500 }}>
            {failed ? 'Could not load offers. Please try again later.' : 'No offers available right now.'}
          </p>
        </div>
      )}
    </div>
  );
}
