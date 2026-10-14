import React, { useState } from 'react';

const OFFERS_DATA = [
  {
    id: 1,
    code: 'FIRSTBUS100',
    title: 'First Booking Discount',
    desc: 'Get ₹100 off on your very first bus booking with Click2Book.',
    category: 'firsttime',
    badge: 'NEW',
    badgeClass: 'new',
    icon: '🎁',
    iconColor: 'orange',
    validity: 'Valid till 30 Apr 2026',
    discount: 'Save ₹100'
  },
  {
    id: 2,
    code: 'WEEKEND15',
    title: 'Weekend Special',
    desc: 'Travel on weekends and get 15% off on all bus types. Valid Sat & Sun.',
    category: 'weekend',
    badge: 'HOT',
    badgeClass: 'hot',
    icon: '🌟',
    iconColor: 'blue',
    validity: 'Valid till 31 Mar 2026',
    discount: '15% OFF'
  },
  {
    id: 3,
    code: 'FLASH20',
    title: 'Flash Sale — Today Only',
    desc: 'Extra 20% off on Volvo AC and Sleeper AC buses. Flash deal!',
    category: 'seasonal',
    badge: 'LIMITED',
    badgeClass: 'limited',
    icon: '⚡',
    iconColor: 'pink',
    validity: 'Expires today midnight',
    discount: '20% OFF'
  },
  {
    id: 4,
    code: 'MONSOON30',
    title: 'Monsoon Travel Deal',
    desc: 'Enjoy 30% off during monsoon season on all routes. Beat the rains, not the price!',
    category: 'seasonal',
    badge: 'NEW',
    badgeClass: 'new',
    icon: '🌧️',
    iconColor: 'green',
    validity: 'Valid Jun–Sep 2026',
    discount: '30% OFF'
  },
  {
    id: 5,
    code: 'PREMIUM200',
    title: 'Premium Member Perk',
    desc: 'Exclusive ₹200 cashback for Premium members on bookings above ₹800.',
    category: 'premium',
    badge: 'EXCLUSIVE',
    badgeClass: 'exclusive',
    icon: '⭐',
    iconColor: 'purple',
    validity: 'Valid till 31 May 2026',
    discount: 'Save ₹200'
  },
  {
    id: 6,
    code: 'REFER75',
    title: 'Refer a Friend',
    desc: 'Share your referral code and both you and your friend get ₹75 off next booking.',
    category: 'firsttime',
    badge: 'HOT',
    badgeClass: 'hot',
    icon: '🤝',
    iconColor: 'orange',
    validity: 'No expiry',
    discount: 'Save ₹75'
  },
  {
    id: 7,
    code: 'NIGHTBUS25',
    title: 'Night Rider Offer',
    desc: 'Book overnight sleeper buses after 9 PM and save 25% on your total fare.',
    category: 'weekend',
    badge: 'LIMITED',
    badgeClass: 'limited',
    icon: '🌙',
    iconColor: 'blue',
    validity: 'Valid till 15 Apr 2026',
    discount: '25% OFF'
  },
  {
    id: 8,
    code: 'STUDENT150',
    title: 'Student Special',
    desc: 'Verified students get a flat ₹150 off on any route. Show valid student ID at boarding.',
    category: 'premium',
    badge: 'EXCLUSIVE',
    badgeClass: 'exclusive',
    icon: '🎓',
    iconColor: 'green',
    validity: 'Valid till 31 Dec 2026',
    discount: 'Save ₹150'
  }
];

export default function Offers({ showToast }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [copiedCode, setCopiedCode] = useState(null);

  const categories = [
    { key: 'all', label: 'All Offers' },
    { key: 'firsttime', label: 'First Time' },
    { key: 'weekend', label: 'Weekend' },
    { key: 'seasonal', label: 'Seasonal' },
    { key: 'premium', label: 'Premium' }
  ];

  const filteredOffers = selectedCategory === 'all'
    ? OFFERS_DATA
    : OFFERS_DATA.filter((o) => o.category === selectedCategory);

  const handleCopy = (code) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopiedCode(code);
    if (showToast) {
      showToast(`🎟️ Coupon code "${code}" copied to clipboard!`, 'success');
    }
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  return (
    <div className="page-body fade-up">
      <h1 className="page-heading">Offers & Deals</h1>
      <p className="page-subhead">Exclusive discounts just for you</p>

      {/* Hero Banner */}
      <div className="offers-hero">
        <div className="offers-hero-text">
          <p className="offers-hero-title">🎉 Save Big on Every Trip!</p>
          <p className="offers-hero-sub">
            Use our exclusive coupon codes at checkout and save up to ₹500 on your next booking.
          </p>
        </div>
        <div className="offers-hero-emoji">🎫</div>
      </div>

      {/* Promo Strip */}
      <div className="promo-strip">
        <div className="promo-strip-icon">⚡</div>
        <div className="promo-strip-text">
          <div className="promo-strip-title">Flash Sale — Today Only!</div>
          <div className="promo-strip-sub">
            Use FLASH20 for extra 20% off on Volvo AC buses. Expires at midnight.
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="offer-filters">
        {categories.map((cat) => (
          <button
            key={cat.key}
            className={`offer-filter-btn ${selectedCategory === cat.key ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Offers Grid */}
      <div className="offers-grid">
        {filteredOffers.map((offer) => (
          <div key={offer.id} className="offer-card" data-category={offer.category}>
            <div className="offer-card-header">
              <div className={`offer-icon-wrap ${offer.iconColor}`}>{offer.icon}</div>
              <div className="offer-info">
                <div className="offer-title">{offer.title}</div>
                <div className="offer-desc">{offer.desc}</div>
              </div>
              <span className={`offer-badge ${offer.badgeClass}`}>{offer.badge}</span>
            </div>

            <div className="offer-card-coupon">
              <span className="coupon-code-text">{offer.code}</span>
              <button
                className={`copy-btn ${copiedCode === offer.code ? 'copied' : ''}`}
                onClick={() => handleCopy(offer.code)}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                {copiedCode === offer.code ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <div className="offer-card-footer">
              <span className="offer-validity">{offer.validity}</span>
              <span className="offer-discount-chip">{offer.discount}</span>
            </div>
          </div>
        ))}
      </div>

      {filteredOffers.length === 0 && (
        <div className="offers-empty visible">
          <div className="offers-empty-icon">🎫</div>
          <p style={{ fontSize: '.9rem', fontWeight: 500 }}>No offers found for this category.</p>
        </div>
      )}
    </div>
  );
}
