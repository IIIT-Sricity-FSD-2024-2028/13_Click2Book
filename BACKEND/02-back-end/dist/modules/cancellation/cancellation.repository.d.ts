import { Cancellation } from './interfaces/cancellation.interface';
export declare class CancellationRepository {
    private cancellations;
    create(bookingId: string): Cancellation;
    findAll(): Cancellation[];
    findByBooking(bookingId: string): Cancellation | undefined;
}
