import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { RouteRepository } from './route.repository';
import { CreateRouteDto } from './dto/route.dto';
import { successResponse } from '../../common/utils/response.util';
import { ScheduleRepository } from '../schedule/schedule.repository';
import { TripRepository } from '../trip/trip.repository';
import { BookingRepository } from '../booking/booking.repository';
import { SyncService } from '../sync/sync.service';
import { TripStatus } from '../trip/enums/trip-status.enum';
import { BookingStatus } from '../booking/enums/booking-status.enum';

const ACTIVE_BOOKING = [BookingStatus.PENDING, BookingStatus.CONFIRMED];
const FINISHED_TRIP = [TripStatus.COMPLETED, TripStatus.CANCELLED];

@Injectable()
export class RouteService {
  constructor(
    private readonly routeRepo: RouteRepository,
    private readonly moduleRef: ModuleRef,
    private readonly syncService: SyncService,
  ) {}

  // Schedule/Trip/Booking modules depend on RouteModule, so their repositories are looked up
  // lazily instead of imported (which would make a module cycle).
  private repo<T>(token: new (...args: any[]) => T): T {
    return this.moduleRef.get(token, { strict: false });
  }

  /** Schedules on this route, their upcoming trips, and bookings still holding seats on those trips. */
  private usage(routeId: string) {
    const schedules = this.repo(ScheduleRepository).findByRoute(routeId);
    const tripRepo = this.repo(TripRepository);
    const bookingRepo = this.repo(BookingRepository);
    const upcomingTrips = schedules
      .flatMap((s) => tripRepo.findBySchedule(s.scheduleId))
      .filter((t) => !FINISHED_TRIP.includes(t.tripStatus));
    const bookings = upcomingTrips
      .flatMap((t) => bookingRepo.findByTrip(t.tripId))
      .filter((b) => ACTIVE_BOOKING.includes(b.bookingStatus));
    return { schedules, upcomingTrips, bookings };
  }

  private checkEnds(source: string, destination: string) {
    if (!source.trim()) throw new BadRequestException('Source is required');
    if (!destination.trim()) throw new BadRequestException('Destination is required');
    if (source.trim().toLowerCase() === destination.trim().toLowerCase())
      throw new BadRequestException('Source and destination must be different');
  }

  create(dto: CreateRouteDto) {
    this.checkEnds(dto.source, dto.destination);
    const existing = this.routeRepo.findBySourceAndDestination(dto.source.trim(), dto.destination.trim());
    if (existing && existing.length > 0) {
      return successResponse('Route already exists', existing[0]);
    }
    const route = this.routeRepo.create({ ...dto, source: dto.source.trim(), destination: dto.destination.trim() });
    this.syncService.emit('ROUTE_UPDATED', { action: 'created', route });
    return successResponse('Route created successfully', route);
  }

  findAll() {
    return successResponse('All routes retrieved', this.routeRepo.findAll());
  }

  findById(id: string) {
    const route = this.routeRepo.findById(id);
    if (!route) throw new NotFoundException(`Route ${id} not found`);
    return successResponse('Route retrieved', route);
  }

  search(source: string, destination: string) {
    const routes = this.routeRepo.findBySourceAndDestination(source, destination);
    return successResponse(`Routes from ${source} to ${destination}`, routes);
  }

  // Customer search and the provider portal read the route live, so an edit shows on every trip using it.
  update(id: string, dto: Partial<CreateRouteDto>) {
    const route = this.routeRepo.findById(id);
    if (!route) throw new NotFoundException(`Route ${id} not found`);
    const source = (dto.source ?? route.source).trim();
    const destination = (dto.destination ?? route.destination).trim();
    this.checkEnds(source, destination);

    const clash = this.routeRepo.findBySourceAndDestination(source, destination).find((r) => r.routeId !== id);
    if (clash) throw new ConflictException(`Route ${source} → ${destination} already exists as ${clash.routeId}`);

    const updated = this.routeRepo.update(id, { ...dto, source, destination });
    this.syncService.emit('ROUTE_UPDATED', { action: 'updated', route: updated });
    return successResponse('Route updated', updated);
  }

  // A route with customers booked on an upcoming trip cannot be deleted. Otherwise its upcoming
  // trips are removed with it, and schedules left with no trips at all are removed too.
  remove(id: string) {
    if (!this.routeRepo.findById(id)) throw new NotFoundException(`Route ${id} not found`);
    const { schedules, upcomingTrips, bookings } = this.usage(id);
    if (bookings.length) {
      const tripIds = [...new Set(bookings.map((b) => b.tripId))].join(', ');
      throw new ConflictException(
        `Route ${id} has ${bookings.length} active booking(s) on trip(s) ${tripIds}. Cancel those bookings first.`,
      );
    }

    const tripRepo = this.repo(TripRepository);
    const scheduleRepo = this.repo(ScheduleRepository);
    upcomingTrips.forEach((t) => tripRepo.remove(t.tripId));
    const removedSchedules = schedules
      .filter((s) => tripRepo.findBySchedule(s.scheduleId).length === 0)
      .map((s) => s.scheduleId);
    removedSchedules.forEach((sid) => scheduleRepo.remove(sid));
    this.routeRepo.remove(id);

    const removedTrips = upcomingTrips.map((t) => t.tripId);
    this.syncService.emit('ROUTE_UPDATED', { action: 'removed', routeId: id, removedTrips, removedSchedules });
    return successResponse(
      `Route deleted${removedTrips.length ? ` with ${removedTrips.length} upcoming trip(s)` : ''}`,
      { routeId: id, removedTrips, removedSchedules },
    );
  }
}
