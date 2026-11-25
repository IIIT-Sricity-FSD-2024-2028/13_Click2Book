import React, { useEffect, useState } from 'react';
import { Tag, Check, CreditCard, Smartphone, Building, Wallet, ArrowLeft, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { API } from '../services/api';

export default function PaymentModal({
  bus,
  selectedSeats,
  passengers,
  onConfirmPayment,
  onBack,
  isProcessing,
  paymentError,
}) {
  const [couponCode, setCouponCode] = useState('');
  const [appliedOffer, setAppliedOffer] = useState(null);
  const [couponMessage, setCouponMessage] = useState(null);
  const [showOffersPanel, setShowOffersPanel] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [availableOffers, setAvailableOffers] = useState([]);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [authoritativeFare, setAuthoritativeFare] = useState(null);
  useEffect(() => {
    let active = true;
    const loadOffers = () => API.offers.getActive()
      .then((offers) => active && setAvailableOffers(Array.isArray(offers) ? offers : []))
      .catch((error) => active && setCouponMessage({ text: error.message || 'Could not load available coupons.', error: true }));
    const onFocus = () => loadOffers();
    loadOffers();
    const timer = setInterval(loadOffers, 30000);
    window.addEventListener('focus', onFocus);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const tripId = bus?.backendTripId || bus?.tripId;
    setAuthoritativeFare(null);
    if (!/^T\d+$/.test(String(tripId || ''))) return () => { active = false; };
    API.trips.getById(tripId)
      .then((trip) => {
        const fare = Number(trip?.schedule?.fare);
        if (active && Number.isFinite(fare) && fare > 0) setAuthoritativeFare(fare);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [bus?.backendTripId, bus?.tripId]);

  const count = selectedSeats.length || 1;
  const baseFare = Number(authoritativeFare || bus.price || 500);
  const subtotal = baseFare * count;
  const providerOffers = availableOffers.filter((offer) =>
    String(offer.providerId || '').toUpperCase() === String(bus?.providerId || '').toUpperCase() &&
    (offer.minFare == null || baseFare >= Number(offer.minFare))
  ).sort((a, b) => (a.offerCode === 'RIDE50' ? -1 : b.offerCode === 'RIDE50' ? 1 : 0));
  const featuredOffer = providerOffers.find((offer) => offer.offerCode === 'RIDE50');
  const gst = Math.round(subtotal * 0.18);
  const platformFee = 25;
  const grossTotal = subtotal + gst + platformFee;

  let discount = 0;
  if (appliedOffer) {
    discount = appliedOffer.discountAmount;
  }
  const netTotal = Math.max(0, grossTotal - discount);

  const handleApplyCoupon = async (codeToApply) => {
    const code = (codeToApply || couponCode).trim().toUpperCase();
    if (!code) {
      setCouponMessage({ text: 'Please enter a coupon code.', error: true });
      return;
    }

    setValidatingCoupon(true);
    try {
      const offer = providerOffers.find((item) => String(item.offerCode || '').toUpperCase() === code);
      if (!offer) throw new Error('This coupon is not available for the selected bus.');
      if (offer.minFare != null && baseFare < Number(offer.minFare)) {
        throw new Error(`Minimum booking fare of ₹${offer.minFare} is required.`);
      }
      const validated = await API.offers.validate(code, baseFare);
      const discountAmount = Number(validated.discountAmount);
      if (!Number.isFinite(discountAmount) || discountAmount < 0) {
        throw new Error('The coupon returned an invalid discount. Please try another coupon.');
      }
      setAppliedOffer({ code, discountAmount });
      setCouponCode(code);
      setCouponMessage({ text: `Coupon "${code}" applied. You save ₹${discountAmount}.`, error: false });
    } catch (error) {
      setAppliedOffer(null);
      setCouponMessage({ text: error.message || 'Coupon could not be applied.', error: true });
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedOffer(null);
    setCouponCode('');
    setCouponMessage(null);
  };

  const handlePay = () => {
    onConfirmPayment({
      method: paymentMethod,
      subtotal,
      gst,
      platformFee,
      discount,
      total: netTotal,
      offerCode: appliedOffer?.code || null,
    });
  };

  return (
    <div className="fare-breakdown-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <ArrowLeft size={16} /> Back to passenger details
        </button>
        <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 700 }}>
          Payment & Fare Breakdown
        </span>
      </div>

      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
        Review & Pay
      </h2>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
        {bus.busName} ({bus.vehicleType}) · Seat(s): {selectedSeats.join(', ')}
      </p>

      {/* Fare Breakdown Details */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px 20px', marginBottom: '20px' }}>
        <div className="fare-line">
          <span>Base Ticket Fare ({count} seat{count > 1 ? 's' : ''} × ₹{baseFare})</span>
          <span>₹{subtotal}</span>
        </div>
        <div className="fare-line">
          <span>Goods & Services Tax (GST 18%)</span>
          <span>₹{gst}</span>
        </div>
        <div className="fare-line">
          <span>Click2Book Platform Fee</span>
          <span>₹{platformFee}</span>
        </div>

        {discount > 0 && (
          <div className="fare-line" style={{ color: '#16a34a', fontWeight: 700 }}>
            <span>Coupon Discount ({appliedOffer?.code})</span>
            <span>−₹{discount}</span>
          </div>
        )}

        <div className="fare-line total-line">
          <span>Total Amount Payable</span>
          <span style={{ color: 'var(--primary)' }}>₹{netTotal}</span>
        </div>
      </div>

      {/* Coupon Application Section */}
      <div className="coupon-section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', fontWeight: 700, color: 'var(--primary-dark)' }}>
            <Tag size={16} />
            <span>Apply Coupon Code</span>
          </div>
          <button
            type="button"
            onClick={() => setShowOffersPanel(!showOffersPanel)}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            {showOffersPanel ? 'Hide Offers' : 'View Available Offers'}
            {showOffersPanel ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {featuredOffer && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', margin: '12px 0', padding: '12px 14px', border: '1px solid #fdba74', borderRadius: '10px', background: '#fff7ed' }}>
            <div>
              <div style={{ fontWeight: 800, color: '#9a3412' }}>Recommended: {featuredOffer.offerCode}</div>
              <div style={{ fontSize: '0.75rem', color: '#7c2d12' }}>{featuredOffer.description || 'Save ₹50 on this provider’s bus'}</div>
            </div>
            <button type="button" className="btn-orange" disabled={validatingCoupon || appliedOffer?.code === featuredOffer.offerCode} onClick={() => handleApplyCoupon(featuredOffer.offerCode)} style={{ padding: '7px 12px', whiteSpace: 'nowrap' }}>
              {appliedOffer?.code === featuredOffer.offerCode ? 'Applied' : 'Apply RIDE50'}
            </button>
          </div>
        )}

        <div className="coupon-input-wrap">
          <input
            type="text"
            className="coupon-input"
            placeholder="ENTER PROMO CODE"
            value={couponCode}
            onChange={(e) => {
              const nextCode = e.target.value.toUpperCase();
              setCouponCode(nextCode);
              if (appliedOffer && nextCode.trim() !== appliedOffer.code) {
                setAppliedOffer(null);
                setCouponMessage({ text: 'Apply the edited coupon code before paying.', error: true });
              }
            }}
          />
          {appliedOffer ? (
            <button
              type="button"
              onClick={handleRemoveCoupon}
              className="btn-ghost"
              style={{ padding: '8px 16px', fontSize: '0.8rem', color: '#ef4444', borderColor: '#fca5a5' }}
            >
              Remove
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleApplyCoupon()}
              disabled={validatingCoupon}
              className="btn-orange"
              style={{ padding: '8px 18px', fontSize: '0.8rem' }}
            >
              {validatingCoupon ? 'Checking…' : 'Apply'}
            </button>
          )}
        </div>

        {couponMessage && (
          <div
            style={{
              marginTop: '8px',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: couponMessage.error ? '#dc2626' : '#15803d',
            }}
          >
            {couponMessage.error ? '⚠️ ' : '✅ '}
            {couponMessage.text}
          </div>
        )}

        {/* Collapsible Offers Accordion */}
        {showOffersPanel && (
          <div style={{ marginTop: '14px', borderTop: '1px dashed #fed7aa', paddingTop: '12px' }}>
            {providerOffers.map((o) => (
              <div
                key={o.offerId}
                onClick={() => handleApplyCoupon(o.offerCode)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  background: '#fff',
                  borderRadius: '8px',
                  border: '1px solid #fed7aa',
                  marginBottom: '6px',
                  cursor: 'pointer',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b' }}>
                    {o.offerCode} · <span style={{ color: 'var(--primary)' }}>{o.description || (o.flatDiscount != null ? `₹${o.flatDiscount} off` : `${o.discountPercentage}% off`)}</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Valid through {o.endDate}{o.minFare ? ` · Minimum ₹${o.minFare}` : ''}</div>
                </div>
                <button
                  type="button"
                  style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)', border: 'none', padding: '3px 10px', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Apply
                </button>
              </div>
            ))}
            {providerOffers.length === 0 && <p style={{ fontSize: '0.76rem', color: '#64748b' }}>No active coupons are available for this bus.</p>}
          </div>
        )}
      </div>

      {/* Payment Method Selector */}
      <div style={{ marginBottom: '22px' }}>
        <label className="pax-label">CHOOSE PAYMENT METHOD</label>
        <div className="pay-method-cards">
          {[
            { id: 'UPI', label: 'UPI / Google Pay / PhonePe', icon: Smartphone },
            { id: 'CARD', label: 'Credit or Debit Card', icon: CreditCard },
            { id: 'NETBANKING', label: 'Net Banking', icon: Building },
            { id: 'WALLET', label: 'Digital Wallets', icon: Wallet },
          ].map((m) => {
            const Icon = m.icon;
            const isSel = paymentMethod === m.id;
            return (
              <div
                key={m.id}
                className={`pay-method-card ${isSel ? 'active' : ''}`}
                onClick={() => setPaymentMethod(m.id)}
              >
                <Icon size={18} color={isSel ? 'var(--primary)' : '#64748b'} />
                <span style={{ fontSize: '0.8rem', fontWeight: isSel ? 700 : 500, color: isSel ? 'var(--primary-dark)' : 'var(--text-main)' }}>
                  {m.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error / Retry Banner */}
      {paymentError && (
        <div style={{ background: '#fff1f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 16px', fontSize: '0.82rem', color: '#ef4444', fontWeight: 600, marginBottom: '16px' }}>
          ⚠️ {paymentError}
        </div>
      )}

      {/* Pay Now Button */}
      <button
        type="button"
        id="process-payment-btn"
        className="btn-orange"
        style={{ width: '100%', padding: '14px' }}
        disabled={isProcessing}
        onClick={handlePay}
      >
        <ShieldCheck size={18} />
        {isProcessing ? 'Processing Payment…' : 'Process Payment'}
      </button>
    </div>
  );
}
