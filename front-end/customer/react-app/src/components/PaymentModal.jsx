import React, { useState } from 'react';
import { Tag, Check, CreditCard, Smartphone, Building, Wallet, ArrowLeft, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { OFFERS_CATALOG } from '../services/mockData';

export default function PaymentModal({
  bus,
  selectedSeats,
  passengers,
  onConfirmPayment,
  onBack,
  isProcessing,
}) {
  const [couponCode, setCouponCode] = useState('');
  const [appliedOffer, setAppliedOffer] = useState(null);
  const [couponMessage, setCouponMessage] = useState(null);
  const [showOffersPanel, setShowOffersPanel] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI');

  const count = selectedSeats.length || 1;
  const baseFare = bus.price || 500;
  const subtotal = baseFare * count;
  const gst = Math.round(subtotal * 0.18);
  const platformFee = 25;
  const grossTotal = subtotal + gst + platformFee;

  let discount = 0;
  if (appliedOffer) {
    if (appliedOffer.type === 'percent') {
      discount = Math.round((grossTotal * appliedOffer.discount) / 100);
    } else {
      discount = appliedOffer.discount;
    }
  }
  const netTotal = Math.max(0, grossTotal - discount);

  const handleApplyCoupon = (codeToApply) => {
    const code = (codeToApply || couponCode).trim().toUpperCase();
    if (!code) {
      setCouponMessage({ text: 'Please enter a coupon code.', error: true });
      return;
    }

    const offer = OFFERS_CATALOG.find((o) => o.code === code);
    if (!offer) {
      setCouponMessage({ text: 'Invalid coupon code.', error: true });
      return;
    }

    if (grossTotal < offer.minFare) {
      setCouponMessage({
        text: `Minimum booking fare of ₹${offer.minFare} required for this coupon.`,
        error: true,
      });
      return;
    }

    setAppliedOffer(offer);
    setCouponCode(code);
    setCouponMessage({
      text: `Coupon "${code}" applied successfully! You save ₹${
        offer.type === 'percent' ? Math.round((grossTotal * offer.discount) / 100) : offer.discount
      }`,
      error: false,
    });
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

        <div className="coupon-input-wrap">
          <input
            type="text"
            className="coupon-input"
            placeholder="ENTER PROMO CODE"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
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
              className="btn-orange"
              style={{ padding: '8px 18px', fontSize: '0.8rem' }}
            >
              Apply
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
            {OFFERS_CATALOG.map((o) => (
              <div
                key={o.code}
                onClick={() => handleApplyCoupon(o.code)}
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
                    {o.code} · <span style={{ color: 'var(--primary)' }}>{o.title}</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{o.desc}</div>
                </div>
                <button
                  type="button"
                  style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)', border: 'none', padding: '3px 10px', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Apply
                </button>
              </div>
            ))}
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

      {/* Pay Now Button */}
      <button
        type="button"
        className="btn-orange"
        style={{ width: '100%', padding: '14px' }}
        disabled={isProcessing}
        onClick={handlePay}
      >
        <ShieldCheck size={18} />
        {isProcessing ? 'Processing Payment…' : `Pay ₹${netTotal} & Confirm Booking`}
      </button>
    </div>
  );
}
