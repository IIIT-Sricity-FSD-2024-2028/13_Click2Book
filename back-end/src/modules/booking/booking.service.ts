import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Optional,
} from '@nestjs/common';
import { BookingRepository } from './booking.repository';
import { Booking } from './interfaces/booking.interface';
import { TripRepository } from '../trip/trip.repository';
import { VehicleRepository } from '../vehicle/vehicle.repository';
import { SeatRepository } from '../seat/seat.repository';
import { ScheduleRepository } from '../schedule/schedule.repository';
import { RouteRepository } from '../route/route.repository';
import { OfferService } from '../offer/offer.service';
import { LedgerService } from '../ledger/ledger.service';
import { CreateBookingDto } from './dto/booking.dto';
import { BookingStatus } from './enums/booking-status.enum';
import { TripStatus } from '../trip/enums/trip-status.enum';
import { SeatStatus } from '../seat/enums/seat-status.enum';
import { generateId } from '../../common/utils/id.util';
import { successResponse } from '../../common/utils/response.util';
import { CustomerRepository } from '../customer/customer.repository';
import { ProviderRepository } from '../provider/provider.repository';

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
    @Optional() private readonly customerRepo?: CustomerRepository,
    @Optional() private readonly providerRepo?: ProviderRepository,
  ) {}

  create(dto: CreateBookingDto) {
    if (this.customerRepo) {
      const customer = this.customerRepo.findById(dto.customerId);
      if (!customer)
        throw new NotFoundException(`Customer ${dto.customerId} not found`);
      if (
        String((customer as any).status || 'ACTIVE').toUpperCase() === 'INACTIVE'
      ) {
        throw new BadRequestException(
          'Inactive customers cannot create bookings',
        );
      }
    }

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
    const tripSchedule = this.scheduleRepo.findById(trip.scheduleId);
    if (tripSchedule?.providerId && this.providerRepo) {
      const provider = this.providerRepo.findById(tripSchedule.providerId);
      if (
        !provider ||
        !provider.approved ||
        String((provider as any).status || 'ACTIVE').toUpperCase() ===
          'INACTIVE'
      ) {
        throw new BadRequestException(
          'Cannot book a trip from an inactive or unapproved provider',
        );
      }
    }

    // 2. Reconcile stale/local trip records with an available provider vehicle.
    // Synthetic frontend trips can reference a trip ID whose vehicle was not
    // registered in this backend instance; repair that link before booking.
    let vehicle = this.vehicleRepo.findById(trip.vehicleId);
    if (!vehicle) {
      const schedule = this.scheduleRepo.findById(trip.scheduleId);
      const providerVehicles = this.vehicleRepo
        .findAll()
        .filter(
          (v) => !schedule?.providerId || v.providerId === schedule.providerId,
        );
      vehicle =
        providerVehicles.length === 1
          ? providerVehicles[0]
          : providerVehicles.find((v) => v.status === 'Assigned') ||
            providerVehicles[0];
      if (vehicle) {
        trip.vehicleId = vehicle.vehicleId;
        this.tripRepo.update(trip.tripId, { vehicleId: vehicle.vehicleId });
      }
    }
    if (!vehicle)
      throw new BadRequestException('No vehicle is available for this trip');

    // 3. Check if seat already booked by this customer (idempotent retry for pending booking)
    const existingMine = this.bookingRepo.findByCustomerAndTripAndSeat(
      dto.customerId,
      trip.tripId,
      dto.seatNumber,
    );
    const existingMineMatchesSegment =
      existingMine &&
      (!dto.from ||
        !dto.to ||
        !existingMine.from ||
        !existingMine.to ||
        this.segmentsOverlap(
          trip,
          dto.from,
          dto.to,
          existingMine.from,
          existingMine.to,
        ));
    if (
      existingMineMatchesSegment &&
      (existingMine.bookingStatus === BookingStatus.PENDING ||
        existingMine.bookingStatus === BookingStatus.CONFIRMED)
    ) {
      return successResponse(
        existingMine.bookingStatus === BookingStatus.CONFIRMED
          ? 'Existing confirmed booking retrieved.'
          : 'Existing booking retrieved.',
        existingMine,
      );
    }

    // 4. Prevent double seat booking only when route segments overlap.
    const activeBookings = this.bookingRepo
      .findByTrip(trip.tripId)
      .filter(
        (b) =>
          b.bookingStatus === BookingStatus.PENDING ||
          b.bookingStatus === BookingStatus.CONFIRMED,
      );
    const seatConflict = activeBookings.find((b) => {
      if (b.seatNumber !== dto.seatNumber) return false;
      if (b.customerId === dto.customerId) return true;
      if (!dto.from || !dto.to || !b.from || !b.to) return true;
      return this.segmentsOverlap(trip, dto.from, dto.to, b.from, b.to);
    });
    if (seatConflict)
      throw new ConflictException(
        `Seat ${dto.seatNumber} is already booked for the overlapping route segment`,
      );

    // 5. Validate the selected seat against this vehicle's capacity.
    this.seatRepo.initSeats(trip.vehicleId, vehicle.totalSeats || 40);
    const seat = this.seatRepo.findSeat(trip.vehicleId, dto.seatNumber);
    if (!seat) {
      throw new BadRequestException(
        `Seat ${dto.seatNumber} is invalid for this vehicle (total seats: ${vehicle.totalSeats || 40})`,
      );
    }
    // Availability is determined per trip by active bookings, not by a shared
    // vehicle-wide remaining-seat counter or seat status.

    // 6. Apply offer if provided
    let coupon: ReturnType<OfferService['validateAndApply']> | undefined;
    if (dto.offerCode) {
      const fare = this.scheduleRepo.findById(trip.scheduleId)?.fare;
      if (fare == null)
        throw new BadRequestException('Fare is unavailable for this trip');
      coupon = this.offerService.validateAndApply(
        dto.offerCode,
        fare,
        dto.customerId,
      );
    }

    // 7. Create booking (PENDING — awaiting payment)
    const booking = this.bookingRepo.create({
      customerId: dto.customerId,
      tripId: trip.tripId,
      seatNumber: dto.seatNumber,
      from: dto.from?.trim(),
      to: dto.to?.trim(),
      offerId: coupon?.offerId,
      offerCode: coupon?.offerCode,
      couponDiscountAmount: coupon?.discountAmount,
      couponGrossAmount: coupon?.grossAmount,
    });

    // 8. The seat reservation is persisted by the trip-specific booking record.

    // 9. Snapshot the fare split onto a new transaction ledger row
    this.ledgerService.createForBooking(booking.bookingId, trip.tripId);

    return successResponse(
      'Booking created. Proceed to payment to confirm.',
      booking,
    );
  }

  private segmentsOverlap(
    trip: any,
    fromA: string,
    toA: string,
    fromB: string,
    toB: string,
  ): boolean {
    const schedule = this.scheduleRepo.findById(trip.scheduleId);
    const route = schedule ? this.routeRepo.findById(schedule.routeId) : null;
    const normalize = (value: string) =>
      String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');

    const stops = [
      route?.source || '',
      ...String((schedule as any)?.via || (route as any)?.via || '')
        .split(',')
        .map((stop) => stop.trim())
        .filter(Boolean),
      route?.destination || '',
    ].map(normalize);

    const startA = stops.indexOf(normalize(fromA));
    const endA = stops.indexOf(normalize(toA));
    const startB = stops.indexOf(normalize(fromB));
    const endB = stops.indexOf(normalize(toB));
    if ([startA, endA, startB, endB].some((index) => index < 0)) return true;
    return (
      Math.min(startA, endA) < Math.max(startB, endB) &&
      Math.min(startB, endB) < Math.max(startA, endA)
    );
  }

  findAll(status?: BookingStatus) {
    if (status)
      return successResponse(
        'Bookings by status',
        this.bookingRepo.findByStatus(status),
      );
    return successResponse('All bookings', this.bookingRepo.findAll());
  }

  findById(id: string) {
    const b = this.bookingRepo.findById(id);
    if (!b) throw new NotFoundException(`Booking ${id} not found`);
    return successResponse('Booking retrieved', b);
  }

  findByTrip(tripId: string) {
    if (!tripId) return successResponse('Bookings for trip', []);
    const cleanId = (s: string) =>
      String(s || '')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
    const target = cleanId(tripId);

    const trip =
      this.tripRepo.findById(tripId) ||
      this.tripRepo
        .findAll()
        .find(
          (t) =>
            cleanId(t.tripId) === target || cleanId(t.scheduleId) === target,
        );

    const all = this.bookingRepo.findAll();
    const list = all
      .filter((b) => {
        if (
          b.bookingStatus !== BookingStatus.PENDING &&
          b.bookingStatus !== BookingStatus.CONFIRMED
        )
          return false;
        if (trip && b.tripId === trip.tripId) return true;
        if (cleanId(b.tripId) === target) return true;
        if (
          target.length >= 4 &&
          (cleanId(b.tripId).includes(target) ||
            target.includes(cleanId(b.tripId)))
        )
          return true;
        if (
          b.vehicleNumber &&
          cleanId(b.vehicleNumber) &&
          target.includes(cleanId(b.vehicleNumber))
        )
          return true;
        if (
          b.plateNumber &&
          cleanId(b.plateNumber) &&
          target.includes(cleanId(b.plateNumber))
        )
          return true;
        return false;
      })
      .map((b) => ({
        ...b,
        from: b.from,
        to: b.to,
        passengerName: b.passengerName,
        phone: b.phone,
        email: b.email,
        passengers: b.passengers,
      }));
    return successResponse('Bookings for trip', list);
  }

  findByCustomer(customerId: string) {
    const list = this.bookingRepo.findByCustomer(customerId);
    const enriched = list.map((b) => {
      const trip = this.tripRepo.findById(b.tripId);
      const schedule = trip
        ? this.scheduleRepo.findById(trip.scheduleId)
        : null;
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
    const updated = this.bookingRepo.update(bookingId, {
      bookingStatus: BookingStatus.CONFIRMED,
    });
    return successResponse('Booking confirmed', updated);
  }

  confirmAfterPayment(bookingId: string) {
    const booking = this.bookingRepo.findById(bookingId);
    if (!booking) throw new NotFoundException(`Booking ${bookingId} not found`);
    if (booking.bookingStatus === BookingStatus.CONFIRMED) {
      this.recordCouponRedemption(booking);
      return successResponse('Booking confirmed', booking);
    }
    if (booking.bookingStatus !== BookingStatus.PENDING)
      throw new BadRequestException('Only PENDING bookings can be confirmed');
    const confirmed = this.confirm(bookingId);
    try {
      this.recordCouponRedemption(booking);
      return confirmed;
    } catch (error) {
      this.bookingRepo.update(bookingId, {
        bookingStatus: BookingStatus.PENDING,
      });
      throw error;
    }
  }

  private recordCouponRedemption(booking: Booking) {
    if (booking.offerId) {
      this.offerService.recordRedemption(
        booking.offerId,
        booking.bookingId,
        booking.customerId,
        booking.couponDiscountAmount || 0,
        booking.couponGrossAmount || 0,
      );
    }
  }

  registerHistorical(body: any) {
    const customerId = body.customerId || 'C001';
    const aliasId = body.aliasId || body.bookingId;

    if (aliasId) {
      const existing = this.bookingRepo.findById(aliasId);
      if (existing) {
        return successResponse(
          'Historical booking already registered',
          existing,
        );
      }
    }

    let tripId = body.tripId;
    if (
      !tripId &&
      (body.from || body.source) &&
      (body.to || body.destination)
    ) {
      const src = String(body.from || body.source)
        .trim()
        .toLowerCase();
      const dst = String(body.to || body.destination)
        .trim()
        .toLowerCase();
      const allTrips = this.tripRepo.findAll();
      for (const t of allTrips) {
        const sched = this.scheduleRepo.findById(t.scheduleId);
        if (sched) {
          const r = this.routeRepo.findById(sched.routeId);
          if (
            r &&
            r.source.toLowerCase() === src &&
            r.destination.toLowerCase() === dst
          ) {
            tripId = t.tripId;
            break;
          }
        }
      }
    }
    if (!tripId) {
      throw new BadRequestException(
        'Cannot reconcile booking: No valid trip found matching the specified route',
      );
    }

    const trip = this.tripRepo.findById(tripId);
    if (!trip) {
      throw new NotFoundException(
        `Trip ${tripId} not found for historical booking reconciliation`,
      );
    }

    if (!aliasId) {
      throw new BadRequestException(
        'Cannot reconcile booking: Valid bookingId is required',
      );
    }

    const seatNumber =
      Number(
        body.seatNumber ||
          (Array.isArray(body.seat_list) ? body.seat_list[0] : 1),
      ) || 1;

    const vehicle = this.vehicleRepo.findById(trip.vehicleId);
    if (vehicle) {
      this.seatRepo.initSeats(trip.vehicleId, vehicle.totalSeats);
    }

    const bookingId = aliasId;
    const booking = this.bookingRepo.createWithId({
      bookingId,
      customerId,
      tripId: trip.tripId,
      seatNumber,
      bookingDate:
        body.date || body.journeyDate || new Date().toISOString().split('T')[0],
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
    if (
      booking.bookingStatus !== BookingStatus.CONFIRMED &&
      booking.bookingStatus !== BookingStatus.PENDING
    )
      throw new BadRequestException(
        'Only CONFIRMED or PENDING bookings can be cancelled',
      );

    const baseId = bookingId.replace(/-\d+$/, '');
    this.bookingRepo.findAll().forEach((b) => {
      if (
        b.bookingId === baseId ||
        b.bookingId.startsWith(baseId + '-') ||
        ((booking as any).aliasId && b.bookingId === (booking as any).aliasId)
      ) {
        b.bookingStatus = BookingStatus.CANCELLED;
        (b as any).status = 'CANCELLED';
        (b as any).booking_status = 'CANCELLED';
        try {
          const trip = this.tripRepo.findById(b.tripId);
          if (trip && trip.vehicleId && b.seatNumber) {
            this.seatRepo.updateStatus(
              trip.vehicleId,
              b.seatNumber,
              SeatStatus.AVAILABLE,
            );
          }
        } catch {}
      }
    });

    const updated = this.bookingRepo.update(booking.bookingId, {
      bookingStatus: BookingStatus.CANCELLED,
      status: 'CANCELLED',
      booking_status: 'CANCELLED',
    } as any);
    return successResponse(
      'Booking cancelled. Refund request created.',
      updated,
    );
  }
}
