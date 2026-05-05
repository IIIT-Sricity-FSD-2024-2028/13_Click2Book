import { Injectable } from '@nestjs/common';
import { Offer } from './interfaces/offer.interface';
import { OfferStatus } from './enums/offer-status.enum';
import { generateId } from '../../common/utils/id.util';

@Injectable()
export class OfferRepository {
  private offers: Offer[] = [
    { offerId: 'O001', providerId: 'P001', offerCode: 'SUMMER20', discountPercentage: 20, startDate: '2026-05-01', endDate: '2026-08-31', status: OfferStatus.ACTIVE },
    { offerId: 'O002', providerId: 'P002', offerCode: 'FIRST10', discountPercentage: 10, startDate: '2026-01-01', endDate: '2026-12-31', status: OfferStatus.ACTIVE },
    { offerId: 'O003', providerId: 'P001', offerCode: 'SAVE15', discountPercentage: 15, startDate: '2026-06-01', endDate: '2026-06-30', status: OfferStatus.INACTIVE },
  ];

  create(data: Omit<Offer, 'offerId'>): Offer {
    const offer: Offer = { offerId: generateId('O'), ...data, status: OfferStatus.ACTIVE };
    this.offers.push(offer);
    return offer;
  }

  findAll(): Offer[] { return this.offers; }
  findById(offerId: string): Offer | undefined { return this.offers.find(o => o.offerId === offerId); }
  findByCode(offerCode: string): Offer | undefined { return this.offers.find(o => o.offerCode === offerCode); }
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
