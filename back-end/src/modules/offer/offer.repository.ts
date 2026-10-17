import { Injectable } from '@nestjs/common';
import { Offer } from './interfaces/offer.interface';
import { OfferStatus } from './enums/offer-status.enum';
import { generateId } from '../../common/utils/id.util';

@Injectable()
export class OfferRepository {
  private offers: Offer[] = [
    { offerId: 'O001', providerId: 'P001', offerCode: 'SUMMER20', discountPercentage: 20, startDate: '2025-01-01', endDate: '2028-12-31', status: OfferStatus.ACTIVE },
    { offerId: 'O002', providerId: 'P002', offerCode: 'FIRST10', discountPercentage: 10, startDate: '2025-01-01', endDate: '2028-12-31', status: OfferStatus.ACTIVE },
    { offerId: 'O003', providerId: 'P001', offerCode: 'SAVE15', discountPercentage: 15, startDate: '2025-01-01', endDate: '2028-12-31', status: OfferStatus.INACTIVE },
    // Click2Book Standard Offers Catalog
    { offerId: 'O004', providerId: 'P001', offerCode: 'FIRSTBUS100', discountPercentage: 20, flatDiscount: 100, minFare: 0, startDate: '2025-01-01', endDate: '2028-12-31', status: OfferStatus.ACTIVE },
    { offerId: 'O005', providerId: 'P001', offerCode: 'WEEKEND150', discountPercentage: 25, flatDiscount: 150, minFare: 300, startDate: '2025-01-01', endDate: '2028-12-31', status: OfferStatus.ACTIVE },
    { offerId: 'O006', providerId: 'P001', offerCode: 'PREMIUM200', discountPercentage: 25, flatDiscount: 200, minFare: 800, startDate: '2025-01-01', endDate: '2028-12-31', status: OfferStatus.ACTIVE },
    { offerId: 'O007', providerId: 'P001', offerCode: 'REFER75', discountPercentage: 15, flatDiscount: 75, minFare: 0, startDate: '2025-01-01', endDate: '2028-12-31', status: OfferStatus.ACTIVE },
    { offerId: 'O008', providerId: 'P001', offerCode: 'NIGHTBUS25', discountPercentage: 25, minFare: 0, startDate: '2025-01-01', endDate: '2028-12-31', status: OfferStatus.ACTIVE },
    { offerId: 'O009', providerId: 'P001', offerCode: 'STUDENT150', discountPercentage: 25, flatDiscount: 150, minFare: 0, startDate: '2025-01-01', endDate: '2028-12-31', status: OfferStatus.ACTIVE },
    { offerId: 'O010', providerId: 'P001', offerCode: 'MONSOON50', discountPercentage: 10, flatDiscount: 50, minFare: 0, startDate: '2025-01-01', endDate: '2028-12-31', status: OfferStatus.ACTIVE },
    { offerId: 'O011', providerId: 'P001', offerCode: 'SUPERFAST10', discountPercentage: 10, minFare: 0, startDate: '2025-01-01', endDate: '2028-12-31', status: OfferStatus.ACTIVE },
    { offerId: 'O012', providerId: 'P001', offerCode: 'WEEKEND15', discountPercentage: 15, minFare: 0, startDate: '2025-01-01', endDate: '2028-12-31', status: OfferStatus.ACTIVE },
    { offerId: 'O013', providerId: 'P001', offerCode: 'FLASH20', discountPercentage: 20, minFare: 0, startDate: '2025-01-01', endDate: '2028-12-31', status: OfferStatus.ACTIVE },
    { offerId: 'O014', providerId: 'P001', offerCode: 'MONSOON30', discountPercentage: 30, minFare: 0, startDate: '2025-01-01', endDate: '2028-12-31', status: OfferStatus.ACTIVE },
  ];

  create(data: Omit<Offer, 'offerId'>): Offer {
    const offer: Offer = { offerId: generateId('O'), ...data, status: OfferStatus.ACTIVE };
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
}
