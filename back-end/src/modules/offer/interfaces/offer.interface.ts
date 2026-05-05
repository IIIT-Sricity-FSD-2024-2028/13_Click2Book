import { OfferStatus } from '../enums/offer-status.enum';

export interface Offer {
  offerId: string;
  providerId: string;
  offerCode: string;
  discountPercentage: number;
  startDate: string;
  endDate: string;
  status: OfferStatus;
}
