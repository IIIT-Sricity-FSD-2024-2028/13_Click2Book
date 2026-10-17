import { RefundStatus } from '../enums/refund-status.enum';

export interface Refund {
  refundId?: string;
  bookingId: string;
  adminId?: string;
  customerId?: string;
  passengerName?: string;
  reason?: string;
  refundAmount: number;
  refundStatus: RefundStatus;
  refundDate: string;
}

