import {
  forwardRef, Inject, Injectable, NotFoundException, BadRequestException, ConflictException,
} from '@nestjs/common';
import { BookingRepository } from './booking.repository';
import { TripRepository } from '../trip/trip.repository';
import { VehicleRepository } from '../vehicle/vehicle.repository';
import { SeatRepository } from '../seat/seat.repository';
import { OfferService } from '../offer/offer.service';
import { LedgerService } from '../ledger/ledger.service';
import { CreateBookingDto } from './dto/booking.dto';
import { BookingStatus } from './enums/booking-status.enum';
import { SeatStatus } from '../seat/enums/seat-status.enum';
import { TripStatus } from '../trip/enums/trip-status.enum';
import { successResponse } from '../../common/utils/response.util';

@Injectable()
export class BookingService {
  constructor(
    private readonly bookingRepo: BookingRepository,
    private readonly tripRepo: TripRepository,
    private readonly vehicleRepo: VehicleRepository,
    private readonly seatRepo: SeatRepository,
    private readonly offerService: OfferService,
    @Inject(forwardRef(() => LedgerService))
    private readonly ledgerService: LedgerService,
  ) {}

  create(dto: CreateBookingDto) {
    // 1. Validate trip exists and is SCHEDULED
    const trip = this.tripRepo.findById(dto.tripId);
    if (!trip) throw new NotFoundException(`Trip ${dto.tripId} not found`);
    if (trip.tripStatus === TripStatus.CANCELLED)
      throw new BadRequestException('Cannot book a cancelled trip');
    if (trip.tripStatus === TripStatus.COMPLETED)
      throw new BadRequestException('Cannot book a completed trip');

    // 2. Validate vehicle has remaining seats
    const vehicle = this.vehicleRepo.findById(trip.vehicleId);
    if (!vehicle || vehicle.remainingSeats <= 0)
      throw new BadRequestException('No seats available for this trip');

    // 3. Prevent double seat booking
    if (this.bookingRepo.isSeatTaken(dto.tripId, dto.seatNumber))
      throw new ConflictException(`Seat ${dto.seatNumber} is already booked for this trip`);

    // 4. Check seat belongs to vehicle and is available
    const seat = this.seatRepo.findSeat(trip.vehicleId, dto.seatNumber);
    if (!seat) throw new NotFoundException(`Seat ${dto.seatNumber} not found in this vehicle`);
    if (!this.seatRepo.isSeatAvailable(trip.vehicleId, dto.seatNumber))
      throw new ConflictException(`Seat ${dto.seatNumber} is not available`);

    // 5. Apply offer if provided
    let offerId: string | undefined;
    if (dto.offerCode) {
      const applied = this.offerService.validateAndApply(dto.offerCode, 0);
      offerId = applied.offerId;
    }

    // 6. Create booking (PENDING — awaiting payment)
    const booking = this.bookingRepo.create({
      customerId: dto.customerId,
      tripId: dto.tripId,
      seatNumber: dto.seatNumber,
      offerId,
      irctcId: dto.irctcId,
    });

    // 7. Mark seat as BOOKED & decrement vehicle remaining seats
    this.seatRepo.updateStatus(trip.vehicleId, dto.seatNumber, SeatStatus.BOOKED);
    this.vehicleRepo.decrementSeat(trip.vehicleId);

    // 8. Snapshot the fare split onto a new transaction ledger row
    this.ledgerService.createForBooking(booking.bookingId, dto.tripId);

    return successResponse('Booking created. Proceed to payment to confirm.', booking);
  }

  findAll(status?: BookingStatus) {
    if (status) return successResponse('Bookings by status', this.bookingRepo.findByStatus(status));
    return successResponse('All bookings', this.bookingRepo.findAll());
  }

  findById(id: string) {
    const b = this.bookingRepo.findById(id);
    if (!b) throw new NotFoundException(`Booking ${id} not found`);
    return successResponse('Booking retrieved', b);
  }

  findByCustomer(customerId: string) {
    return successResponse('Customer bookings', this.bookingRepo.findByCustomer(customerId));
  }

  confirm(bookingId: string) {
    const booking = this.bookingRepo.findById(bookingId);
    if (!booking) throw new NotFoundException(`Booking ${bookingId} not found`);
    if (booking.bookingStatus !== BookingStatus.PENDING)
      throw new BadRequestException('Only PENDING bookings can be confirmed');
    const updated = this.bookingRepo.update(bookingId, { bookingStatus: BookingStatus.CONFIRMED });
    return successResponse('Booking confirmed', updated);
  }

  cancel(bookingId: string) {
    const booking = this.bookingRepo.findById(bookingId);
    if (!booking) throw new NotFoundException(`Booking ${bookingId} not found`);
    if (booking.bookingStatus !== BookingStatus.CONFIRMED)
      throw new BadRequestException('Only CONFIRMED bookings can be cancelled');

    // Release the seat
    const trip = this.tripRepo.findById(booking.tripId);
    if (trip) {
      this.seatRepo.updateStatus(trip.vehicleId, booking.seatNumber, SeatStatus.AVAILABLE);
      this.vehicleRepo.incrementSeat(trip.vehicleId);
    }

    const updated = this.bookingRepo.update(bookingId, { bookingStatus: BookingStatus.CANCELLED });
    return successResponse('Booking cancelled. Refund request created.', updated);
  }
}
