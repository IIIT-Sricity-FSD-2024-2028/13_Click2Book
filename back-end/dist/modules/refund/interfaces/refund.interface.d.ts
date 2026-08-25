import { RefundStatus } from '../enums/refund-status.enum';
export interface Refund {
    bookingId: string;
    adminId?: string;
    refundAmount: number;
    refundStatus: RefundStatus;
    refundDate: string;
}
