import { Injectable } from '@nestjs/common';
import { Cancellation } from './interfaces/cancellation.interface';

@Injectable()
export class CancellationRepository {
  private cancellations: Cancellation[] = [];

  create(bookingId: string): Cancellation {
    const c: Cancellation = { bookingId, cancelDate: new Date().toISOString().split('T')[0] };
    this.cancellations.push(c);
    return c;
  }

  findAll(): Cancellation[] { return this.cancellations; }
  findByBooking(bookingId: string): Cancellation | undefined {
    return this.cancellations.find(c => c.bookingId === bookingId);
  }
}
