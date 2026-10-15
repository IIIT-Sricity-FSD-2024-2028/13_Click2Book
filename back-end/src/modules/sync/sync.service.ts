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

  // Register booking created by customer
  registerBooking(booking: any) {
    this.emit('BOOKING_CREATED', booking);
    return booking;
  }

  // Get consolidated real-time state for all actors
  getState() {
    const rawTrips = this.tripRepo.findAll();
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
      payments: this.paymentRepo.findAll(),
      routes: this.routeRepo.findAll(),
      providers: this.providerRepo.findAll(),
      tripStatuses: this.dynamicTripStatuses,
      customSchedules: this.customSchedules,
      timestamp: new Date().toISOString(),
    };
  }
}
