import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PaymentRepository } from './payment.repository';
import { BookingService } from '../booking/booking.service';
import { BookingRepository } from '../booking/booking.repository';
import { CreatePaymentDto } from './dto/payment.dto';
import { PaymentStatus } from './enums/payment-status.enum';
import { BookingStatus } from '../booking/enums/booking-status.enum';
import { successResponse } from '../../common/utils/response.util';

@Injectable()
export class PaymentService {
  constructor(
    private readonly paymentRepo: PaymentRepository,
    private readonly bookingRepo: BookingRepository,
    private readonly bookingService: BookingService,
  ) {}

  processPayment(dto: CreatePaymentDto) {
    // 1. Check booking exists
    const booking = this.bookingRepo.findById(dto.bookingId);
    if (!booking)
      throw new NotFoundException(`Booking ${dto.bookingId} not found`);
    const discountAmount = Number(booking.couponDiscountAmount || 0);
    if (!booking.offerId && Number(dto.discountAmount || 0) > 0) {
      throw new BadRequestException(
        'A discount requires a validated coupon on the booking',
      );
    }
    if (
      booking.offerId &&
      dto.discountAmount != null &&
      Math.round(Number(dto.discountAmount) * 100) !==
        Math.round(discountAmount * 100)
    ) {
      throw new BadRequestException(
        'Payment discount does not match the validated coupon',
      );
    }
    if (
      booking.offerId &&
      Number(dto.amount) <
        Math.max(0, Number(booking.couponGrossAmount || 0) - discountAmount)
    ) {
      throw new BadRequestException(
        'Payment amount is below the booking fare after the validated coupon',
      );
    }

    // If already confirmed, handle retries idempotently without charging or recording payment twice
    if (booking.bookingStatus === BookingStatus.CONFIRMED) {
      const existing = this.paymentRepo.findByBooking(booking.bookingId);
      if (existing) {
        if (existing.paymentStatus !== PaymentStatus.SUCCESS) {
          const updated =
            this.paymentRepo.update(existing.paymentId, {
              amount: dto.amount,
              discountAmount,
              paymentMethod: dto.paymentMethod,
              paymentStatus: PaymentStatus.SUCCESS,
            }) || existing;
          this.bookingService.confirmAfterPayment(booking.bookingId);
          return successResponse(
            'Payment already successful. Booking confirmed.',
            updated,
          );
        }
        return successResponse(
          'Payment already successful. Booking confirmed.',
          existing,
        );
      }
      const payment = this.paymentRepo.create({
        ...dto,
        bookingId: booking.bookingId,
        discountAmount,
      });
      const updated =
        this.paymentRepo.update(payment.paymentId, {
          paymentStatus: PaymentStatus.SUCCESS,
        }) || payment;
      this.bookingService.confirmAfterPayment(booking.bookingId);
      return successResponse(
        'Payment already successful. Booking confirmed.',
        updated,
      );
    }

    // 2. Cannot pay for cancelled bookings
    if (booking.bookingStatus === BookingStatus.CANCELLED) {
      throw new BadRequestException(
        'Cannot process payment for a cancelled booking',
      );
    }

    // 3. Booking must be PENDING
    if (booking.bookingStatus !== BookingStatus.PENDING)
      throw new BadRequestException(
        'Payment can only be made for PENDING bookings',
      );

    // 4. One payment per booking (idempotent retry)
    const existingPayment = this.paymentRepo.findByBooking(booking.bookingId);
    let payment = existingPayment;
    if (payment) {
      if (payment.paymentStatus === PaymentStatus.SUCCESS) {
        this.bookingService.confirm(booking.bookingId);
        return successResponse(
          'Payment already successful. Booking confirmed.',
          payment,
        );
      }
      payment =
        this.paymentRepo.update(payment.paymentId, {
          amount: dto.amount,
          discountAmount,
          paymentMethod: dto.paymentMethod,
          paymentStatus: PaymentStatus.PENDING,
        }) || payment;
    } else {
      payment = this.paymentRepo.create({
        ...dto,
        bookingId: booking.bookingId,
        discountAmount,
      });
    }

    try {
      // 5. Mark payment as SUCCESS
      const updated =
        this.paymentRepo.update(payment.paymentId, {
          paymentStatus: PaymentStatus.SUCCESS,
        }) || payment;

      // 6. Confirm the booking after payment succeeds
      this.bookingService.confirmAfterPayment(booking.bookingId);

      return successResponse('Payment successful. Booking confirmed.', updated);
    } catch (err) {
      this.paymentRepo.update(payment.paymentId, {
        paymentStatus: PaymentStatus.FAILED,
      });
      throw err;
    }
  }

  findAll() {
    return successResponse('All payments', this.paymentRepo.findAll());
  }

  findById(id: string) {
    const p = this.paymentRepo.findById(id);
    if (!p) throw new NotFoundException(`Payment ${id} not found`);
    return successResponse('Payment retrieved', p);
  }

  findByBooking(bookingId: string) {
    const p = this.paymentRepo.findByBooking(bookingId);
    if (!p)
      throw new NotFoundException(`No payment found for booking ${bookingId}`);
    return successResponse('Payment for booking', p);
  }

  markRefunded(bookingId: string) {
    const p = this.paymentRepo.findByBooking(bookingId);
    if (!p) throw new NotFoundException(`No payment for booking ${bookingId}`);
    const updated = this.paymentRepo.update(p.paymentId, {
      paymentStatus: PaymentStatus.REFUNDED,
    });
    return successResponse('Payment marked as refunded', updated);
  }
}
