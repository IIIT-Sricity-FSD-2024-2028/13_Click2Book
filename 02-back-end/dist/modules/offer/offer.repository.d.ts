import { Offer } from './interfaces/offer.interface';
export declare class OfferRepository {
    private offers;
    create(data: Omit<Offer, 'offerId'>): Offer;
    findAll(): Offer[];
    findById(offerId: string): Offer | undefined;
    findByCode(offerCode: string): Offer | undefined;
    findActive(): Offer[];
    update(offerId: string, data: Partial<Offer>): Offer | undefined;
    remove(offerId: string): boolean;
}
