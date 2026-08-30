import { forwardRef, Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TripRepository } from './trip.repository';
import { ScheduleRepository } from '../schedule/schedule.repository';
import { VehicleRepository } from '../vehicle/vehicle.repository';
import { SeatRepository } from '../seat/seat.repository';
import { RouteRepository } from '../route/route.repository';
import { ProviderRepository } from '../provider/provider.repository';
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
  ) {}

  create(dto: CreateTripDto) {
    const schedule = this.scheduleRepo.findById(dto.scheduleId);
    if (!schedule) throw new NotFoundException(`Schedule ${dto.scheduleId} not found`);
    const vehicle = this.vehicleRepo.findById(dto.vehicleId);
    if (!vehicle) throw new NotFoundException(`Vehicle ${dto.vehicleId} not found`);
    // Initialize seats for this vehicle
    this.seatRepo.initSeats(dto.vehicleId, vehicle.totalSeats);
    const trip = this.tripRepo.create({ ...dto, tripStatus: TripStatus.SCHEDULED });
    return successResponse('Trip created and seats initialized', trip);
  }

  findAll(status?: TripStatus) {
    if (status) return successResponse('Trips by status', this.tripRepo.findByStatus(status));
    return successResponse('All trips', this.tripRepo.findAll());
  }

  // Calculate duration string from departure and arrival time (HH:MM format)
  private calcDuration(dep: string, arr: string): string {
    const [dH, dM] = dep.split(':').map(Number);
    const [aH, aM] = arr.split(':').map(Number);
    let mins = (aH * 60 + aM) - (dH * 60 + dM);
    if (mins < 0) mins += 24 * 60; // overnight trip
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m > 0 ? m + 'm' : ''}`.trim();
  }

  // Search trips by source, destination (date shown in UI but not used to filter — demo mode)
  search(source: string, destination: string, date: string) {
    const allTrips = this.tripRepo.findAll();
    const src = source.trim().toLowerCase();
    const dst = destination.trim().toLowerCase();

    const results = allTrips
      .map(trip => {
        const schedule = this.scheduleRepo.findById(trip.scheduleId);
        if (!schedule) return null;
        const route = this.routeRepo.findById(schedule.routeId);
        if (!route) return null;
        if (src && !route.source.toLowerCase().includes(src)) return null;
        if (dst && !route.destination.toLowerCase().includes(dst)) return null;
        const vehicle = this.vehicleRepo.findById(trip.vehicleId);
        if (!vehicle || vehicle.remainingSeats <= 0) return null;
        // Only approved providers may appear in — or be booked from — search results.
        const provider = this.providerRepo.findById(schedule.providerId);
        if (!provider || !provider.approved) return null;

        const v = vehicle as any;
        return {
          tripId:         trip.tripId,
          scheduleId:     schedule.scheduleId,
          vehicleId:      vehicle.vehicleId,
          busName:        v.busName || vehicle.vehicleNumber,
          providerId:     schedule.providerId,
          providerName:   provider.name,
          source:         route.source,
          destination:    route.destination,
          departureTime:  schedule.departureTime,
          arrivalTime:    schedule.arrivalTime,
          duration:       this.calcDuration(schedule.departureTime, schedule.arrivalTime),
          journeyDate:    date || schedule.journeyDate,   // show user's requested date
          price:          schedule.fare,
          availableSeats: vehicle.remainingSeats,
          totalSeats:     vehicle.totalSeats,
          vehicleType:    vehicle.vehicleType,
          amenities:      v.amenities || [],
          boardingPoint:  v.boardingPoint || route.source,
          droppingPoint:  v.droppingPoint || route.destination,
          rating:         v.rating || 4.0,
          tripStatus:     trip.tripStatus,
          distance:       route.distance,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => a.departureTime.localeCompare(b.departureTime));

    if (results.length === 0)
      throw new NotFoundException(`No available trips found from ${source} to ${destination}`);

    return successResponse(`${results.length} bus(es) found from ${source} to ${destination}`, results);
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
    return successResponse('Trip departed — now in progress', this.tripRepo.update(id, { tripStatus: TripStatus.IN_PROGRESS }));
  }
}
