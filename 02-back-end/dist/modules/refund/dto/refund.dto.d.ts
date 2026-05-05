import { RefundStatus } from '../enums/refund-status.enum';
export declare class CreateRefundDto {
    bookingId: string;
    refundAmount: number;
}
export declare class ProcessRefundDto {
    adminId: string;
    refundStatus: RefundStatus;
}
