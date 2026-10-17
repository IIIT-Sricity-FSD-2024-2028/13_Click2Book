import {
  forwardRef, Inject, Injectable, NotFoundException, BadRequestException, ConflictException,
} from '@nestjs/common';
import { BookingRepository } from './booking.repository';
import { TripRepository } from '../trip/trip.repository';
import { VehicleRepository } from '../vehicle/vehicle.repository';
import { SeatRepository } from '../seat/seat.repository';
import { ScheduleRepository } from '../schedule/schedule.repository';
import { RouteRepository } from '../route/route.repository';
import { OfferService } from '../offer/offer.service';
import { LedgerService } from '../ledger/ledger.service';
import { CreateBookingDto } from './dto/booking.dto';
import { BookingStatus } from './enums/booking-status.enum';
import { SeatStatus } from '../seat/enums/seat-status.enum';
import { TripStatus } from '../trip/enums/trip-status.enum';
import { generateId } from '../../common/utils/id.util';
import { successResponse } from '../../common/utils/response.util';

@Injectable()
export class BookingService {
  constructor(
    private readonly bookingRepo: BookingRepository,
    private readonly tripRepo: TripRepository,
    private readonly vehicleRepo: VehicleRepository,
    private readonly seatRepo: SeatRepository,
    private readonly scheduleRepo: ScheduleRepository,
    private readonly routeRepo: RouteRepository,
    private readonly offerService: OfferService,
    @Inject(forwardRef(() => LedgerService))
    private readonly ledgerService: LedgerService,
  ) {}

  create(dto: CreateBookingDto) {
    // 1. Validate trip exists and is SCHEDULED (or resolve schedule ID to trip)
    let trip = this.tripRepo.findById(dto.tripId);
    if (!trip) {
      const bySched = this.tripRepo.findBySchedule(dto.tripId);
      if (bySched && bySched.length > 0) {
        trip = bySched[0];
      }
    }
    if (!trip) throw new NotFoundException(`Trip ${dto.tripId} not found`);
    if (trip.tripStatus === TripStatus.CANCELLED)
      throw new BadRequestException('Cannot book a cancelled trip');
    if (trip.tripStatus === TripStatus.COMPLETED)
      throw new BadRequestException('Cannot book a completed trip');

    // 2. Validate vehicle has remaining seats
    const vehicle = this.vehicleRepo.findById(trip.vehicleId);
    if (!vehicle || vehicle.remainingSeats <= 0)
      throw new BadRequestException('No seats available for this trip');

    // 3. Check if seat already booked by this customer (idempotent retry for pending booking)
    const existingMine = this.bookingRepo.findByCustomerAndTripAndSeat(dto.customerId, trip.tripId, dto.seatNumber, BookingStatus.PENDING);
    if (existingMine && existingMine.bookingStatus === BookingStatus.PENDING) {
      return successResponse('Existing booking retrieved.', existingMine);
    }

    // 4. Prevent double seat booking by other customers
    if (this.bookingRepo.isSeatTaken(trip.tripId, dto.seatNumber) || (dto.tripId !== trip.tripId && this.bookingRepo.isSeatTaken(dto.tripId, dto.seatNumber)))
      throw new ConflictException(`Seat ${dto.seatNumber} is already booked for this trip`);

    // 5. Check seat belongs to vehicle and is available
    let seat = this.seatRepo.findSeat(trip.vehicleId, dto.seatNumber);
    if (!seat) {
      this.seatRepo.initSeats(trip.vehicleId, vehicle.totalSeats || 40);
      seat = this.seatRepo.findSeat(trip.vehicleId, dto.seatNumber);
    }
    if (!seat) throw new NotFoundException(`Seat ${dto.seatNumber} not found in this vehicle`);
    if (!this.seatRepo.isSeatAvailable(trip.vehicleId, dto.seatNumber))
      throw new ConflictException(`Seat ${dto.seatNumber} is not available`);

    // 6. Apply offer if provided
    let offerId: string | undefined;
    if (dto.offerCode) {
      const applied = this.offerService.validateAndApply(dto.offerCode, 0);
      offerId = applied.offerId;
    }

    // 7. Create booking (PENDING — awaiting payment)
    const booking = this.bookingRepo.create({
      customerId: dto.customerId,
      tripId: trip.tripId,
      seatNumber: dto.seatNumber,
      offerId,
    });

    // 8. Mark seat as BOOKED & decrement vehicle remaining seats
    this.seatRepo.updateStatus(trip.vehicleId, dto.seatNumber, SeatStatus.BOOKED);
    this.vehicleRepo.decrementSeat(trip.vehicleId);

    // 9. Snapshot the fare split onto a new transaction ledger row
    this.ledgerService.createForBooking(booking.bookingId, trip.tripId);

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
    const list = this.bookingRepo.findByCustomer(customerId);
    const enriched = list.map((b) => {
      const trip = this.tripRepo.findById(b.tripId);
      const schedule = trip ? this.scheduleRepo.findById(trip.scheduleId) : null;
      const vehicle = trip ? this.vehicleRepo.findById(trip.vehicleId) : null;
      const route = schedule ? this.routeRepo.findById(schedule.routeId) : null;
      return {
        ...b,
        from: route?.source || 'Origin',
        to: route?.destination || 'Destination',
        route: route ? `${route.source} → ${route.destination}` : 'Route',
        busName: vehicle?.busName || vehicle?.vehicleNumber || 'Express Bus',
        vehicleType: vehicle?.vehicleType || 'AC',
        departureTime: schedule?.departureTime || '08:00',
        arrivalTime: schedule?.arrivalTime || '12:00',
        journeyDate: schedule?.journeyDate || b.bookingDate,
        totalAmount: schedule?.fare || 650,
        fare: schedule?.fare || 650,
      };
    });
    return successResponse('Customer bookings', enriched);
  }

  confirm(bookingId: string) {
    const booking = this.bookingRepo.findById(bookingId);
    if (!booking) throw new NotFoundException(`Booking ${bookingId} not found`);
    if (booking.bookingStatus !== BookingStatus.PENDING)
      throw new BadRequestException('Only PENDING bookings can be confirmed');
    const updated = this.bookingRepo.update(bookingId, { bookingStatus: BookingStatus.CONFIRMED });
    return successResponse('Booking confirmed', updated);
  }

  registerHistorical(body: any) {
    const customerId = body.customerId || 'C001';
    const aliasId = body.aliasId || body.bookingId;

    if (aliasId) {
      const existing = this.bookingRepo.findById(aliasId);
      if (existing) {
        return successResponse('Historical booking already registered', existing);
      }
    }

    let tripId = body.tripId;
    if (!tripId && (body.from || body.source) && (body.to || body.destination)) {
      const src = String(body.from || body.source).trim().toLowerCase();
      const dst = String(body.to || body.destination).trim().toLowerCase();
      const allTrips = this.tripRepo.findAll();
      for (const t of allTrips) {
        const sched = this.scheduleRepo.findById(t.scheduleId);
        if (sched) {
          const r = this.routeRepo.findById(sched.routeId);
          if (r && r.source.toLowerCase() === src && r.destination.toLowerCase() === dst) {
            tripId = t.tripId;
            break;
          }
        }
      }
    }
    if (!tripId) {
      throw new BadRequestException('Cannot reconcile booking: No valid trip found matching the specified route');
    }

    const trip = this.tripRepo.findById(tripId);
    if (!trip) {
      throw new NotFoundException(`Trip ${tripId} not found for historical booking reconciliation`);
    }

    if (!aliasId) {
      throw new BadRequestException('Cannot reconcile booking: Valid bookingId is required');
    }

    const seatNumber = Number(body.seatNumber || (Array.isArray(body.seat_list) ? body.seat_list[0] : 1)) || 1;

    const vehicle = this.vehicleRepo.findById(trip.vehicleId);
    if (vehicle) {
      this.seatRepo.initSeats(trip.vehicleId, vehicle.totalSeats);
      this.seatRepo.updateStatus(trip.vehicleId, seatNumber, SeatStatus.BOOKED);
    }

    const bookingId = aliasId;
    const booking = this.bookingRepo.createWithId({
      bookingId,
      customerId,
      tripId: trip.tripId,
      seatNumber,
      bookingDate: body.date || body.journeyDate || new Date().toISOString().split('T')[0],
      bookingStatus: BookingStatus.CONFIRMED,
    });

    if (aliasId && aliasId !== bookingId) {
      this.bookingRepo.registerAlias(aliasId, bookingId);
    }

    return successResponse('Historical booking registered', booking);
  }

  registerHistoricalBooking(data: any, aliasId?: string) {
    const b = this.bookingRepo.createWithId(data);
    if (aliasId) {
      this.bookingRepo.registerAlias(aliasId, b.bookingId);
    }
    return b;
  }

  cancel(bookingId: string) {
    const booking = this.bookingRepo.findById(bookingId);
    if (!booking) throw new NotFoundException(`Booking ${bookingId} not found`);
    if (booking.bookingStatus === BookingStatus.CANCELLED) {
      return successResponse('Booking already cancelled', booking);
    }
    if (booking.bookingStatus !== BookingStatus.CONFIRMED && booking.bookingStatus !== BookingStatus.PENDING)
      throw new BadRequestException('Only CONFIRMED or PENDING bookings can be cancelled');

    // Release the seat
    const trip = this.tripRepo.findById(booking.tripId);
    if (trip) {
      this.seatRepo.updateStatus(trip.vehicleId, booking.seatNumber, SeatStatus.AVAILABLE);
      this.vehicleRepo.incrementSeat(trip.vehicleId);
    }

    const updated = this.bookingRepo.update(booking.bookingId, { bookingStatus: BookingStatus.CANCELLED });
    return successResponse('Booking cancelled. Refund request created.', updated);
  }
}
