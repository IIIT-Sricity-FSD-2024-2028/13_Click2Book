import { PaymentStatus } from '../enums/payment-status.enum';
export interface Payment {
    paymentId: string;
    bookingId: string;
    amount: number;
    discountAmount: number;
    paymentMethod: string;
    paymentStatus: PaymentStatus;
    paymentDate: string;
}
