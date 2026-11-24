import { useEffect, useState } from 'react';
import { apiFetch } from './api';

/**
 * Checkout fees and refund rules set by the Super Admin (GET /platform/settings).
 * The defaults are used only until the backend answers, or if it cannot be reached.
 */
export const DEFAULT_PRICING = {
  gstPercent: 18,
  convenienceFee: 25,
  allowCancellation: true,
  refundPercent: 100,
  cancellationFee: 50,
};

let cached = null;

export async function fetchPricing() {
  try {
    const s = await apiFetch('/platform/settings');
    cached = {
      gstPercent: s.fees?.gstPercent ?? DEFAULT_PRICING.gstPercent,
      convenienceFee: s.fees?.convenienceFee ?? DEFAULT_PRICING.convenienceFee,
      allowCancellation: s.cancellation?.allowCancellation ?? DEFAULT_PRICING.allowCancellation,
      refundPercent: s.cancellation?.refundPercent ?? DEFAULT_PRICING.refundPercent,
      cancellationFee: s.cancellation?.cancellationFee ?? DEFAULT_PRICING.cancellationFee,
    };
  } catch {
    cached = cached || DEFAULT_PRICING;
  }
  return cached;
}

/** Current pricing; refetched each time a page that uses it mounts, so Super Admin changes apply. */
export function usePricing() {
  const [pricing, setPricing] = useState(cached || DEFAULT_PRICING);
  useEffect(() => {
    let alive = true;
    fetchPricing().then((p) => alive && setPricing(p));
    return () => {
      alive = false;
    };
  }, []);
  return pricing;
}

/**
 * Refund for a ticket: the platform fee is never refunded, the refund % applies to the
 * rest of what was paid, and the cancellation fee is deducted once per ticket.
 * The platform fee charged at booking time is used when the ticket recorded it.
 */
export function computeRefund(ticket, pricing) {
  const paid = Number(ticket.total) || 0;
  const platformFee = Math.min(paid, Number(ticket.platformFee ?? pricing.convenienceFee) || 0);
  const refundable = paid - platformFee;
  const afterPercent = Math.round((refundable * pricing.refundPercent) / 100);
  const fee = pricing.cancellationFee;
  return {
    paid,
    platformFee,
    refundPercent: pricing.refundPercent,
    afterPercent,
    cancellationFee: fee,
    refund: Math.max(0, afterPercent - fee),
  };
}
