import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { TripRepository } from './trip.repository';
import { ScheduleRepository } from '../schedule/schedule.repository';
import { VehicleRepository } from '../vehicle/vehicle.repository';
import { SeatRepository } from '../seat/seat.repository';
import { RouteRepository } from '../route/route.repository';
import { ProviderRepository } from '../provider/provider.repository';
import { BookingRepository } from '../booking/booking.repository';
import { BookingStatus } from '../booking/enums/booking-status.enum';
import { Trip } from './interfaces/trip.interface';
import { CreateTripDto, UpdateTripStatusDto } from './dto/trip.dto';
import { TripStatus } from './enums/trip-status.enum';
import { successResponse } from '../../common/utils/response.util';

@Injectable()
export class TripService {
  constructor(
    private readonly tripRepo: TripRepository,
    private readonly scheduleRepo: ScheduleRepository,
    private readonly vehicleRepo: VehicleRepository,
    private readonly seatRepo: SeatRepository,
    private readonly routeRepo: RouteRepository,
    @Inject(forwardRef(() => ProviderRepository))
    private readonly providerRepo: ProviderRepository,
    @Inject(forwardRef(() => BookingRepository))
    private readonly bookingRepo: BookingRepository,
  ) {}

  create(dto: CreateTripDto) {
    const schedule = this.scheduleRepo.findById(dto.scheduleId);
    if (!schedule)
      throw new NotFoundException(`Schedule ${dto.scheduleId} not found`);
    const vehicle = this.vehicleRepo.findById(dto.vehicleId);
    if (!vehicle)
      throw new NotFoundException(`Vehicle ${dto.vehicleId} not found`);
    const existing = this.tripRepo
      .findAll()
      .find(
        (t) => t.scheduleId === dto.scheduleId && t.vehicleId === dto.vehicleId,
      );
    if (existing) {
      this.seatRepo.initSeats(dto.vehicleId, vehicle.totalSeats);
      return successResponse(
        'Trip already exists and seats initialized',
        existing,
      );
    }

    // Initialize seats for this vehicle
    this.seatRepo.initSeats(dto.vehicleId, vehicle.totalSeats);
    const trip = this.tripRepo.create({
      ...dto,
      tripStatus: TripStatus.SCHEDULED,
    });
    return successResponse('Trip created and seats initialized', trip);
  }

  findAll(status?: TripStatus) {
    const rawTrips = (
      status ? this.tripRepo.findByStatus(status) : this.tripRepo.findAll()
    ).filter((t) => Boolean(this.vehicleRepo.findById(t.vehicleId)));
    const enriched = rawTrips.map((t) => {
      const schedule = this.scheduleRepo.findById(t.scheduleId);
      const vehicle = this.vehicleRepo.findById(t.vehicleId);
      const route = schedule ? this.routeRepo.findById(schedule.routeId) : null;
      const provider = schedule
        ? this.providerRepo.findById(schedule.providerId)
        : null;
      const activeBookings = this.bookingRepo
        .findByTrip(t.tripId)
        .filter(
          (b) =>
            b.bookingStatus === BookingStatus.PENDING ||
            b.bookingStatus === BookingStatus.CONFIRMED,
        ).length;
      const totalSeats = vehicle?.totalSeats || 40;
      const remainingSeats = Math.max(0, totalSeats - activeBookings);
      return {
        ...t,
        source: route?.source || 'Origin',
        destination: route?.destination || 'Destination',
        route: route ? `${route.source} → ${route.destination}` : 'Route',
        via: (schedule as any)?.via || (route as any)?.via || '',
        departureTime: schedule?.departureTime || '08:00',
        arrivalTime: schedule?.arrivalTime || '12:00',
        duration:
          schedule?.departureTime && schedule?.arrivalTime
            ? this.calcDuration(schedule.departureTime, schedule.arrivalTime)
            : '4h 00m',
        journeyDate:
          schedule?.journeyDate || new Date().toISOString().split('T')[0],
        busName: vehicle?.busName || 'Express Bus',
        vehicleType: vehicle?.vehicleType || 'AC',
        totalSeats,
        availableSeats: remainingSeats,
        remainingSeats,
        fare: schedule?.fare || 500,
        price: schedule?.fare || 500,
        providerId: schedule?.providerId || 'P001',
        providerName: provider?.name || 'Bus Operator',
        rating: vehicle?.rating || 4.5,
      };
    });
    return successResponse(status ? 'Trips by status' : 'All trips', enriched);
  }

  // Calculate duration string from departure and arrival time (HH:MM format)
  private calcDuration(dep: string, arr: string): string {
    const [dH, dM] = dep.split(':').map(Number);
    const [aH, aM] = arr.split(':').map(Number);
    let mins = aH * 60 + aM - (dH * 60 + dM);
    if (mins < 0) mins += 24 * 60; // overnight trip
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m > 0 ? m + 'm' : ''}`.trim();
  }

  private routeSegmentsOverlap(
    fullRouteStops: string[],
    searchFrom: string,
    searchTo: string,
    bookingFrom: string,
    bookingTo: string,
  ): boolean {
    const startA = fullRouteStops.indexOf(searchFrom);
    const endA = fullRouteStops.indexOf(searchTo);
    const startB = fullRouteStops.indexOf(bookingFrom);
    const endB = fullRouteStops.indexOf(bookingTo);
    if ([startA, endA, startB, endB].some((index) => index < 0)) return true;
    return (
      Math.min(startA, endA) < Math.max(startB, endB) &&
      Math.min(startB, endB) < Math.max(startA, endA)
    );
  }

  // Search trips by source, destination, date, and departure time
  search(source: string, destination: string, date: string) {
    const allTrips = this.tripRepo.findAll();
    const src = (source || '').trim().toLowerCase();
    const dst = (destination || '').trim().toLowerCase();

    const norm = (c: string) => {
      const s = (c || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      if (
        [
          'visakhapatnam',
          'vishakapatnam',
          'vishakapatanam',
          'vizag',
          'vskp',
        ].includes(s)
      )
        return 'visakhapatnam';
      if (['chennai', 'madras'].includes(s)) return 'chennai';
      if (['bangalore', 'bengaluru'].includes(s)) return 'bangalore';
      if (['hyderabad', 'secunderabad'].includes(s)) return 'hyderabad';
      if (['vijayawada', 'bezawada'].includes(s)) return 'vijayawada';
      return s;
    };
    const srcNorm = norm(src);
    const dstNorm = norm(dst);

    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const curH = String(now.getHours()).padStart(2, '0');
    const curM = String(now.getMinutes()).padStart(2, '0');
    const nowTime = `${curH}:${curM}`;

    const NH16_COASTAL_UP = [
      'chennai',
      'tada',
      'sricity',
      'nayudupeta',
      'gudur',
      'nellore',
      'kavali',
      'ongole',
      'chilakaluripet',
      'guntur',
      'vijayawada',
      'eluru',
      'tadepalligudem',
      'tanuku',
      'rajahmundry',
      'samalkot',
      'kakinada',
      'annavaram',
      'tuni',
      'anakapalle',
      'visakhapatnam',
    ];
    const NH16_COASTAL_DN = [...NH16_COASTAL_UP].reverse();

    const results = allTrips
      .map((trip) => {
        if (
          trip.tripStatus === TripStatus.COMPLETED ||
          trip.tripStatus === TripStatus.CANCELLED
        ) {
          return null;
        }
        const schedule = this.scheduleRepo.findById(trip.scheduleId);
        if (!schedule) return null;
        const route = this.routeRepo.findById(schedule.routeId);
        if (!route) return null;

        const vehicle = this.vehicleRepo.findById(trip.vehicleId);
        if (!vehicle) return null;
        // Only approved providers may appear in — or be booked from — search results.
        const provider = this.providerRepo.findById(schedule.providerId);
        if (!provider || !provider.approved) return null;

        const rSrc = norm(route.source);
        const rDst = norm(route.destination);
        const directSMatch =
          !srcNorm ||
          rSrc.includes(srcNorm) ||
          route.source.toLowerCase().includes(src);
        const directDMatch =
          !dstNorm ||
          rDst.includes(dstNorm) ||
          route.destination.toLowerCase().includes(dst);
        const directMatch = directSMatch && directDMatch;

        // Build complete stop sequence for intermediate stop matching
        const viaStr = (schedule as any)?.via || (route as any)?.via || '';
        const viaList = viaStr
          ? viaStr.split(',').map((s: string) => norm(s.trim()))
          : [];
        const assignedStops = (
          vehicle?.assignedRoute?.intermediateStops || []
        ).map((s: string) => norm(s));

        let intermediateStopsList =
          viaList.length > 0 ? viaList : assignedStops;
        if (intermediateStopsList.length === 0) {
          if (rSrc === 'chennai' && rDst === 'visakhapatnam') {
            intermediateStopsList = NH16_COASTAL_UP.slice(1, -1);
          } else if (rSrc === 'visakhapatnam' && rDst === 'chennai') {
            intermediateStopsList = NH16_COASTAL_DN.slice(1, -1);
          }
        }

        const fullRouteStops = [rSrc, ...intermediateStopsList, rDst];
        const fIdx = srcNorm ? fullRouteStops.indexOf(srcNorm) : 0;
        const tIdx = dstNorm
          ? fullRouteStops.indexOf(dstNorm)
          : fullRouteStops.length - 1;
        const intermediateMatch = fIdx !== -1 && tIdx !== -1 && fIdx < tIdx;

        if (!directMatch && !intermediateMatch) return null;

        const overlappingSeatNumbers = new Set(
          this.bookingRepo
            .findByTrip(trip.tripId)
            .filter(
              (b) =>
                b.bookingStatus === BookingStatus.PENDING ||
                b.bookingStatus === BookingStatus.CONFIRMED,
            )
            .filter((b) => {
              if (!b.from || !b.to) return true;
              return this.routeSegmentsOverlap(
                fullRouteStops,
                srcNorm,
                dstNorm,
                norm(b.from),
                norm(b.to),
              );
            })
            .map((b) => b.seatNumber),
        );
        const remainingSeats = Math.max(
          0,
          (vehicle.totalSeats || 40) - overlappingSeatNumbers.size,
        );
        if (remainingSeats <= 0) return null;

        // If journeyDate is specified on schedule, match against requested date.
        // Seed schedules (SCH001-SCH027) serve as daily recurring templates for any searched date.
        const isSeedSchedule = /^SCH0(0[1-9]|1[0-9]|2[0-7])$/.test(
          schedule.scheduleId,
        );
        if (
          !isSeedSchedule &&
          schedule.journeyDate &&
          date &&
          schedule.journeyDate !== date
        ) {
          return null;
        }

        // If date searched is today, filter out buses whose departure time has already passed
        if (date && date === todayStr) {
          if (schedule.departureTime && schedule.departureTime < nowTime) {
            return null;
          }
        }

        const v = vehicle as any;
        return {
          tripId: trip.tripId,
          scheduleId: schedule.scheduleId,
          vehicleId: vehicle.vehicleId,
          busName: v.busName || vehicle.vehicleNumber,
          providerId: schedule.providerId,
          providerName: provider.name,
          source: route.source,
          destination: route.destination,
          departureTime: schedule.departureTime,
          arrivalTime: schedule.arrivalTime,
          duration: this.calcDuration(
            schedule.departureTime,
            schedule.arrivalTime,
          ),
          journeyDate: date || schedule.journeyDate, // show user's requested date
          fare: schedule.fare,
          price: schedule.fare,
          availableSeats: remainingSeats,
          totalSeats: vehicle.totalSeats,
          vehicleType: vehicle.vehicleType,
          amenities: v.amenities || [],
          boardingPoint: intermediateMatch
            ? source || route.source
            : v.boardingPoint || route.source,
          droppingPoint: intermediateMatch
            ? destination || route.destination
            : v.droppingPoint || route.destination,
          rating: v.rating || 4.8,
          tripStatus: trip.tripStatus,
          distance: route.distance,
          via: viaStr || undefined,
          seatLayout: vehicle.seatLayout || null,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => a.departureTime.localeCompare(b.departureTime));

    if (results.length === 0)
      throw new NotFoundException(
        `No available trips found from ${source} to ${destination} on ${date || 'today'}`,
      );

    return successResponse(
      `${results.length} bus(es) found from ${source} to ${destination}`,
      results,
    );
  }

  findById(id: string) {
    const trip = this.tripRepo.findById(id);
    if (!trip) throw new NotFoundException(`Trip ${id} not found`);
    const schedule = this.scheduleRepo.findById(trip.scheduleId);
    const vehicle = this.vehicleRepo.findById(trip.vehicleId);
    return successResponse('Trip details', { trip, schedule, vehicle });
  }

  updateStatus(id: string, dto: UpdateTripStatusDto) {
    const trip = this.tripRepo.findById(id);
    if (!trip) throw new NotFoundException(`Trip ${id} not found`);
    const updated = this.tripRepo.update(id, { tripStatus: dto.tripStatus });
    return successResponse('Trip status updated', updated);
  }

  // Departure: moves a trip from SCHEDULED into IN_PROGRESS (tracking/SOS require this)
  confirm(id: string) {
    const trip = this.tripRepo.findById(id);
    if (!trip) throw new NotFoundException(`Trip ${id} not found`);
    if (trip.tripStatus !== TripStatus.SCHEDULED)
      throw new BadRequestException('Only SCHEDULED trips can depart');
    return successResponse(
      'Trip departed — now in progress',
      this.tripRepo.update(id, { tripStatus: TripStatus.IN_PROGRESS }),
    );
  }

  // Arrival / Completion: moves a trip from IN_PROGRESS / SCHEDULED into COMPLETED
  complete(id: string) {
    const trip = this.tripRepo.findById(id);
    if (!trip) throw new NotFoundException(`Trip ${id} not found`);
    if (
      trip.tripStatus !== TripStatus.IN_PROGRESS &&
      trip.tripStatus !== TripStatus.SCHEDULED
    )
      throw new BadRequestException('Only active trips can be completed');
    return successResponse(
      'Trip completed — destination reached',
      this.tripRepo.update(id, { tripStatus: TripStatus.COMPLETED }),
    );
  }
}
