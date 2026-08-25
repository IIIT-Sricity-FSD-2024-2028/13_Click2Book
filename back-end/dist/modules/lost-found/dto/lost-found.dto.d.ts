import { LostFoundStatus } from '../enums/lost-found-status.enum';
export declare class CreateLostFoundItemDto {
    tripId: string;
    bookingId: string;
    customerId: string;
    itemDescription: string;
    category?: string;
    dateLost: string;
    contactPhone: string;
}
export declare class UpdateLostFoundStatusDto {
    status: LostFoundStatus;
    foundNote?: string;
}
