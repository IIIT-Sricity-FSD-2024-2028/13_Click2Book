import { Payment } from './interfaces/payment.interface';
export declare class PaymentRepository {
    private payments;
    create(data: Omit<Payment, 'paymentId' | 'paymentDate' | 'paymentStatus'>): Payment;
    findAll(): Payment[];
    findById(paymentId: string): Payment | undefined;
    findByBooking(bookingId: string): Payment | undefined;
    update(paymentId: string, data: Partial<Payment>): Payment | undefined;
}
