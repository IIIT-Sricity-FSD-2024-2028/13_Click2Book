import { OfferStatus } from '../enums/offer-status.enum';

export interface Offer {
  offerId: string;
  providerId: string;
  offerCode: string;
  discountPercentage?: number;
  flatDiscount?: number;
  minFare?: number;
  startDate: string;
  endDate: string;
  status: OfferStatus;
}
