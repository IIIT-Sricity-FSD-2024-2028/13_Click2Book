import { Injectable } from '@nestjs/common';
import { Offer, OfferRedemption } from './interfaces/offer.interface';
import { OfferStatus } from './enums/offer-status.enum';
import { generateId } from '../../common/utils/id.util';

@Injectable()
export class OfferRepository {
  private offers: Offer[] = [
    { offerId: 'O001', providerId: 'ALL', offerCode: 'SUMMER20', discountPercentage: 20, startDate: '2025-01-01', endDate: '2028-12-31', status: OfferStatus.ACTIVE },
    { offerId: 'O002', providerId: 'ALL', offerCode: 'FIRST10', discountPercentage: 10, startDate: '2025-01-01', endDate: '2028-12-31', status: OfferStatus.ACTIVE },
    { offerId: 'O003', providerId: 'ALL', offerCode: 'SAVE15', discountPercentage: 15, startDate: '2025-01-01', endDate: '2028-12-31', status: OfferStatus.INACTIVE },
    // Click2Book Standard Offers Catalog
    { offerId: 'O004', providerId: 'ALL', offerCode: 'FIRSTBUS100', discountPercentage: 20, flatDiscount: 100, minFare: 0, startDate: '2025-01-01', endDate: '2028-12-31', status: OfferStatus.ACTIVE },
    { offerId: 'O005', providerId: 'ALL', offerCode: 'WEEKEND150', discountPercentage: 25, flatDiscount: 150, minFare: 300, startDate: '2025-01-01', endDate: '2028-12-31', status: OfferStatus.ACTIVE },
    { offerId: 'O006', providerId: 'ALL', offerCode: 'PREMIUM200', discountPercentage: 25, flatDiscount: 200, minFare: 800, startDate: '2025-01-01', endDate: '2028-12-31', status: OfferStatus.ACTIVE },
    { offerId: 'O007', providerId: 'ALL', offerCode: 'REFER75', discountPercentage: 15, flatDiscount: 75, minFare: 0, startDate: '2025-01-01', endDate: '2028-12-31', status: OfferStatus.ACTIVE },
    { offerId: 'O008', providerId: 'ALL', offerCode: 'NIGHTBUS25', discountPercentage: 25, minFare: 0, startDate: '2025-01-01', endDate: '2028-12-31', status: OfferStatus.ACTIVE },
    { offerId: 'O009', providerId: 'ALL', offerCode: 'STUDENT150', discountPercentage: 25, flatDiscount: 150, minFare: 0, startDate: '2025-01-01', endDate: '2028-12-31', status: OfferStatus.ACTIVE },
    { offerId: 'O010', providerId: 'ALL', offerCode: 'MONSOON50', discountPercentage: 10, flatDiscount: 50, minFare: 0, startDate: '2025-01-01', endDate: '2028-12-31', status: OfferStatus.ACTIVE },
    { offerId: 'O011', providerId: 'ALL', offerCode: 'SUPERFAST10', discountPercentage: 10, minFare: 0, startDate: '2025-01-01', endDate: '2028-12-31', status: OfferStatus.ACTIVE },
    { offerId: 'O012', providerId: 'ALL', offerCode: 'WEEKEND15', discountPercentage: 15, minFare: 0, startDate: '2025-01-01', endDate: '2028-12-31', status: OfferStatus.ACTIVE },
    { offerId: 'O013', providerId: 'ALL', offerCode: 'FLASH20', discountPercentage: 20, minFare: 0, startDate: '2025-01-01', endDate: '2028-12-31', status: OfferStatus.ACTIVE },
    { offerId: 'O014', providerId: 'ALL', offerCode: 'MONSOON30', discountPercentage: 30, minFare: 0, startDate: '2025-01-01', endDate: '2028-12-31', status: OfferStatus.ACTIVE },
  ];

  create(data: Omit<Offer, 'offerId'>): Offer {
    const offer: Offer = { offerId: generateId('O'), ...data, status: data.status ?? OfferStatus.ACTIVE };
    this.offers.push(offer);
    return offer;
  }

  findAll(): Offer[] { return this.offers; }
  findById(offerId: string): Offer | undefined { return this.offers.find(o => o.offerId === offerId); }
  findByCode(offerCode: string): Offer | undefined {
    if (!offerCode) return undefined;
    const clean = offerCode.trim().toUpperCase();
    return this.offers.find(o => o.offerCode.toUpperCase() === clean);
  }
  findActive(): Offer[] { return this.offers.filter(o => o.status === OfferStatus.ACTIVE); }

  update(offerId: string, data: Partial<Offer>): Offer | undefined {
    const i = this.offers.findIndex(o => o.offerId === offerId);
    if (i === -1) return undefined;
    this.offers[i] = { ...this.offers[i], ...data };
    return this.offers[i];
  }

  remove(offerId: string): boolean {
    const i = this.offers.findIndex(o => o.offerId === offerId);
    if (i === -1) return false;
    this.offers.splice(i, 1);
    return true;
  }

  // ── Redemptions (usage limits) ──
  private redemptions: OfferRedemption[] = [];

  /** Record one use; a booking counts once however often payment is retried. */
  addRedemption(offerId: string, customerId: string, bookingId: string): void {
    if (this.redemptions.some((r) => r.bookingId === bookingId)) return;
    this.redemptions.push({ offerId, customerId, bookingId, redeemedAt: new Date().toISOString() });
  }

  /** A cancelled booking gives its use back. */
  removeRedemption(bookingId: string): void {
    this.redemptions = this.redemptions.filter((r) => r.bookingId !== bookingId);
  }

  countUses(offerId: string, customerId?: string): number {
    return this.redemptions.filter((r) => r.offerId === offerId && (!customerId || r.customerId === customerId)).length;
  }
}
