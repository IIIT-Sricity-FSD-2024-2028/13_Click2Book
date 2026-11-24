import { forwardRef, Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { Subject, Observable, interval, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { TripRepository } from '../trip/trip.repository';
import { ScheduleRepository } from '../schedule/schedule.repository';
import { VehicleRepository } from '../vehicle/vehicle.repository';
import { RouteRepository } from '../route/route.repository';
import { BookingRepository } from '../booking/booking.repository';
import { PaymentRepository } from '../payment/payment.repository';
import { ProviderRepository } from '../provider/provider.repository';
import { RefundRepository } from '../refund/refund.repository';
import { TripStatus } from '../trip/enums/trip-status.enum';

export interface SyncEvent {
  id: number;
  type: string;
  payload: any;
  timestamp: string;
}

@Injectable()
export class SyncService implements OnModuleDestroy {
  private eventCounter = 0;
  private readonly eventHistory: SyncEvent[] = [];
  private readonly maxHistory = 100;
  private readonly eventSubject = new Subject<SyncEvent>();
  private readonly heartbeatSub: Subscription;

  // Real-time custom schedules and dynamic trip overrides stored in-memory
  private readonly customSchedules: any[] = [];
  private readonly dynamicTripStatuses: Record<string, string> = {};

  constructor(
    @Inject(forwardRef(() => TripRepository))
    private readonly tripRepo: TripRepository,
    @Inject(forwardRef(() => ScheduleRepository))
    private readonly scheduleRepo: ScheduleRepository,
    @Inject(forwardRef(() => VehicleRepository))
    private readonly vehicleRepo: VehicleRepository,
    @Inject(forwardRef(() => RouteRepository))
    private readonly routeRepo: RouteRepository,
    @Inject(forwardRef(() => BookingRepository))
    private readonly bookingRepo: BookingRepository,
    @Inject(forwardRef(() => PaymentRepository))
    private readonly paymentRepo: PaymentRepository,
    @Inject(forwardRef(() => ProviderRepository))
    private readonly providerRepo: ProviderRepository,
    @Inject(forwardRef(() => RefundRepository))
    private readonly refundRepo: RefundRepository,
  ) {
    // Send a keep-alive heartbeat every 20 seconds
    this.heartbeatSub = interval(20000).subscribe(() => {
      this.emit('HEARTBEAT', { serverTime: new Date().toISOString() }, false);
    });
  }

  onModuleDestroy() {
    this.heartbeatSub?.unsubscribe();
  }

  emit(type: string, payload: any, saveHistory = true): SyncEvent {
    this.eventCounter += 1;
    const event: SyncEvent = {
      id: this.eventCounter,
      type,
      payload,
      timestamp: new Date().toISOString(),
    };

    if (saveHistory) {
      this.eventHistory.unshift(event);
      if (this.eventHistory.length > this.maxHistory) {
        this.eventHistory.pop();
      }
    }

    this.eventSubject.next(event);
    return event;
  }

  getEventStream(): Observable<any> {
    return this.eventSubject.asObservable().pipe(
      map((event) => ({
        data: JSON.stringify(event),
      })),
    );
  }

  getRecentEvents(limit = 30): SyncEvent[] {
    return this.eventHistory.slice(0, limit);
  }

  // Register custom schedule added by provider
  registerSchedule(schedule: any) {
    const existingIdx = this.customSchedules.findIndex(
      (s) => (s.id || s.tripId) === (schedule.id || schedule.tripId),
    );
    if (existingIdx >= 0) {
      this.customSchedules[existingIdx] = {
        ...this.customSchedules[existingIdx],
        ...schedule,
      };
    } else {
      this.customSchedules.unshift(schedule);
    }
    this.emit('SCHEDULE_UPDATED', schedule);
    return schedule;
  }

  // Set trip status (e.g. IN_PROGRESS, COMPLETED)
  setTripStatus(tripId: string, status: string) {
    this.dynamicTripStatuses[tripId] = status;
    try {
      const trip = this.tripRepo.findById(tripId);
      if (trip && Object.values(TripStatus).includes(status as any)) {
        this.tripRepo.update(tripId, { tripStatus: status as TripStatus });
      }
    } catch {}
    this.emit('TRIP_STATUS_UPDATED', { tripId, status });
    return { tripId, status };
  }

  private parseSeatNum(raw: any, totalSeats: number = 40): number {
    if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) return raw;
    const str = String(raw || '').trim().toUpperCase();
    if (/^\d+$/.test(str)) {
      const n = parseInt(str, 10);
      return n > 0 ? n : 1;
    }
    const lMatch = str.match(/^L(\d+)$/i);
    if (lMatch) return parseInt(lMatch[1], 10);
    const uMatch = str.match(/^U(\d+)$/i);
    if (uMatch) {
      const half = Math.ceil(totalSeats / 2);
      return half + parseInt(uMatch[1], 10);
    }
    const sMatch = str.match(/^([A-Z])(\d+)$/i);
    if (sMatch) {
      const row = sMatch[1].toUpperCase().charCodeAt(0) - 65;
      const col = parseInt(sMatch[2], 10);
      return row * 4 + col;
    }
    return 1;
  }

  // Register booking created by customer
  registerBooking(booking: any) {
    try {
      if (booking && (booking.bookingId || booking.id)) {
        const id = booking.bookingId || booking.id;
        const exists = this.bookingRepo.findById(id);
        const tripId = booking.tripId || booking.backendTripId || 'T001';
        const bookingDate = booking.bookingDate || booking.date || booking.journeyDate || new Date().toISOString().split('T')[0];
        const bookingStatus = (booking.status || booking.bookingStatus || 'CONFIRMED') as any;
        const passengers = Array.isArray(booking.passengers) ? booking.passengers : [];
        const rawSeats = Array.isArray(booking.seat_list)
          ? booking.seat_list
          : Array.isArray(booking.seats)
          ? booking.seats
          : typeof booking.seats === 'string'
          ? booking.seats.split(',')
          : booking.seatNumber != null
          ? [booking.seatNumber]
          : [];
        const seatBookings = Array.isArray(booking.seatBookings) ? booking.seatBookings : [];
        const backendIds = Array.isArray(booking.backendBookingIds)
          ? booking.backendBookingIds
          : [];

        const isCancelled =
          booking.status === 'CANCELLED' ||
          booking.booking_status === 'CANCELLED' ||
          booking.bookingStatus === 'CANCELLED' ||
          bookingStatus === 'CANCELLED';

        if (isCancelled) {
          const baseId = id.replace(/-\d+$/, '');
          this.bookingRepo.findAll().forEach((b) => {
            if (b.bookingId === baseId || b.bookingId.startsWith(baseId + '-')) {
              b.bookingStatus = 'CANCELLED' as any;
              (b as any).status = 'CANCELLED';
              (b as any).booking_status = 'CANCELLED';
            }
          });
          this.emit('BOOKING_CANCELLED', {
            ...booking,
            bookingId: id,
            status: 'CANCELLED',
            booking_status: 'CANCELLED',
            bookingStatus: 'CANCELLED',
          });
          return booking;
        }

        const cleanSeats = rawSeats.map((s: any) => String(s).trim()).filter(Boolean);
        const seatNumbers = cleanSeats.map((seat: any) => this.parseSeatNum(seat, 40));

        seatNumbers.forEach((seatNumber, index) => {
          const seatBooking = seatBookings[index];
          const bookingId = seatBooking?.bookingId || backendIds[index] ||
            (index === 0 ? id : `${id}-${index + 1}`);
          const rawSeatLabel = cleanSeats[index] || String(seatNumber);
          const existingSeat = this.bookingRepo.findById(bookingId);
          const bookingPayload = {
            bookingId,
            customerId: booking.customerId || booking.customer_id || 'C001',
            tripId,
            seatNumber,
            rawSeatLabel,
            bookingDate,
            bookingStatus,
            offerId: booking.offerId || booking.offerCode || booking.couponCode,
            from: booking.from,
            to: booking.to,
            vehicleId: booking.vehicleId,
            vehicleNumber: booking.vehicleNumber || booking.plateNumber,
            plateNumber: booking.vehicleNumber || booking.plateNumber,
            busName: booking.busName,
            busType: booking.busType,
            seats: booking.seats || cleanSeats.join(', '),
            seat_list: cleanSeats,
            passengerName: passengers[index]?.name || booking.passengerName || booking.customerName,
            phone: passengers[index]?.phone || booking.phone,
            email: passengers[index]?.email || booking.email,
            passengers,
            fare: booking.fare || booking.total,
            total: booking.total,
          };
          if (existingSeat) {
            this.bookingRepo.update(bookingId, bookingPayload as any);
          } else {
            this.bookingRepo.createWithId(bookingPayload as any);
          }
        });

        // Also ensure primary booking record is updated or created with full multi-seat details
        if (cleanSeats.length > 0) {
          const primaryPayload = {
            bookingId: id,
            customerId: booking.customerId || booking.customer_id || 'C001',
            tripId,
            seatNumber: seatNumbers[0] || 1,
            rawSeatLabel: cleanSeats[0],
            bookingDate,
            bookingStatus,
            offerId: booking.offerId || booking.offerCode || booking.couponCode,
            from: booking.from,
            to: booking.to,
            vehicleId: booking.vehicleId,
            vehicleNumber: booking.vehicleNumber || booking.plateNumber,
            plateNumber: booking.vehicleNumber || booking.plateNumber,
            busName: booking.busName,
            busType: booking.busType,
            seats: booking.seats || cleanSeats.join(', '),
            seat_list: cleanSeats,
            passengerName: passengers[0]?.name || booking.passengerName || booking.customerName,
            phone: passengers[0]?.phone || booking.phone,
            email: passengers[0]?.email || booking.email,
            passengers,
            fare: booking.fare || booking.total,
            total: booking.total,
          };
          this.bookingRepo.createWithId(primaryPayload as any);
        } else if (exists) {
          this.bookingRepo.update(id, { bookingStatus } as any);
        }
      }
    } catch (e) {
      // Non-blocking fallback for custom sync payloads
    }
    this.emit('BOOKING_CREATED', booking);
    return booking;
  }

  // Get consolidated real-time state for all actors
  getState() {
    const rawTrips = this.tripRepo.findAll().filter((t) => Boolean(this.vehicleRepo.findById(t.vehicleId)));
    const enrichedTrips = rawTrips.map((t) => {
      const schedule = this.scheduleRepo.findById(t.scheduleId);
      const vehicle = this.vehicleRepo.findById(t.vehicleId);
      const route = schedule ? this.routeRepo.findById(schedule.routeId) : null;
      const provider = schedule ? this.providerRepo.findById(schedule.providerId) : null;
      const status = this.dynamicTripStatuses[t.tripId] || t.tripStatus || 'SCHEDULED';
      return {
        ...t,
        source: route?.source || 'Origin',
        destination: route?.destination || 'Destination',
        route: route ? `${route.source} → ${route.destination}` : 'Route',
        via: schedule?.via || route?.via || '',
        departureTime: schedule?.departureTime || '08:00',
        arrivalTime: schedule?.arrivalTime || '12:00',
        journeyDate: schedule?.journeyDate || new Date().toISOString().split('T')[0],
        busName: vehicle?.busName || 'Express Bus',
        vehicleType: vehicle?.vehicleType || 'AC',
        totalSeats: vehicle?.totalSeats || 40,
        availableSeats: vehicle?.remainingSeats ?? 40,
        remainingSeats: vehicle?.remainingSeats ?? 40,
        fare: schedule?.fare || 500,
        price: schedule?.fare || 500,
        providerId: schedule?.providerId || 'P001',
        providerName: provider?.name || 'Bus Operator',
        rating: vehicle?.rating || 4.5,
        tripStatus: status,
        status,
      };
    });

    return {
      trips: [...this.customSchedules, ...enrichedTrips],
      bookings: this.bookingRepo.findAll(),
      vehicles: this.vehicleRepo.findAll(),
      payments: this.paymentRepo.findAll(),
      routes: this.routeRepo.findAll(),
      providers: this.providerRepo.findAll(),
      tripStatuses: this.dynamicTripStatuses,
      customSchedules: this.customSchedules,
      timestamp: new Date().toISOString(),
    };
  }
}
