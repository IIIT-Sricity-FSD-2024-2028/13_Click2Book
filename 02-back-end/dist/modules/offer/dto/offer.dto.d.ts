import { OfferStatus } from '../enums/offer-status.enum';
export declare class CreateOfferDto {
    providerId: string;
    offerCode: string;
    discountPercentage: number;
    startDate: string;
    endDate: string;
}
export declare class UpdateOfferDto {
    status?: OfferStatus;
    endDate?: string;
}
