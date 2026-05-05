import { Refund } from './interfaces/refund.interface';
import { RefundStatus } from './enums/refund-status.enum';
export declare class RefundRepository {
    private refunds;
    create(data: Omit<Refund, 'refundDate' | 'refundStatus'>): Refund;
    findAll(): Refund[];
    findByBooking(bookingId: string): Refund | undefined;
    findByStatus(status: RefundStatus): Refund[];
    update(bookingId: string, data: Partial<Refund>): Refund | undefined;
}
