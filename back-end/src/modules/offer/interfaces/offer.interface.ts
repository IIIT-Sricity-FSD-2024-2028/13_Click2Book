import { OfferStatus } from '../enums/offer-status.enum';

export interface Offer {
  offerId: string;
  providerId: string;
  offerCode: string;
  description?: string;
  discountPercentage?: number;
  flatDiscount?: number;
  minFare?: number;
  maxDiscount?: number;
  maxUsage?: number;
  maxUsagePerCustomer?: number;
  startDate: string;
  endDate: string;
  status: OfferStatus;
}
