import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { TrackingRepository } from './tracking.repository';
import { TripRepository } from '../trip/trip.repository';
import { VehicleRepository } from '../vehicle/vehicle.repository';
import { BookingRepository } from '../booking/booking.repository';
import { ScheduleRepository } from '../schedule/schedule.repository';
import { RouteRepository } from '../route/route.repository';
import { UpdateLocationDto } from './dto/tracking.dto';
import { TripStatus } from '../trip/enums/trip-status.enum';
import { BookingStatus } from '../booking/enums/booking-status.enum';
import { Role } from '../../common/enums/role.enum';
import { successResponse } from '../../common/utils/response.util';

const AVG_SPEED_KMPH = 50;

@Injectable()
export class TrackingService {
  constructor(
    private readonly trackingRepo: TrackingRepository,
    private readonly tripRepo: TripRepository,
    private readonly vehicleRepo: VehicleRepository,
    private readonly bookingRepo: BookingRepository,
    private readonly scheduleRepo: ScheduleRepository,
    private readonly routeRepo: RouteRepository,
  ) {}

  updateLocation(tripId: string, dto: UpdateLocationDto) {
    const trip = this.tripRepo.findById(tripId);
    if (!trip) throw new NotFoundException(`Trip ${tripId} not found`);
    if (trip.tripStatus !== TripStatus.IN_PROGRESS)
      throw new BadRequestException('Trip is not in progress — start the trip before sending location updates');

    const vehicle = this.vehicleRepo.findById(trip.vehicleId);
    if (!vehicle || vehicle.providerId !== dto.providerId)
      throw new ForbiddenException('You do not operate this trip');

    const location = this.trackingRepo.upsert(tripId, {
      lat: dto.lat,
      lng: dto.lng,
      status: dto.status,
      nextStop: dto.nextStop,
    });
    return successResponse('Location updated', location);
  }

  getLocation(tripId: string, role?: string, customerId?: string) {
    const trip = this.tripRepo.findById(tripId);
    if (!trip) throw new NotFoundException(`Trip ${tripId} not found`);

    if (role === Role.CUSTOMER) {
      if (!customerId) throw new BadRequestException('customerId is required to view tracking as a customer');
      const holdsBooking = this.bookingRepo
        .findByTrip(tripId)
        .some(b => b.customerId === customerId && b.bookingStatus !== BookingStatus.CANCELLED);
      if (!holdsBooking) throw new ForbiddenException('You do not have a booking on this trip');
    }

    const location = this.trackingRepo.findByTrip(tripId);
    if (!location) throw new NotFoundException(`No location has been reported yet for trip ${tripId}`);
    return successResponse('Current location', location);
  }

  getEta(tripId: string) {
    const trip = this.tripRepo.findById(tripId);
    if (!trip) throw new NotFoundException(`Trip ${tripId} not found`);
    if (trip.tripStatus !== TripStatus.IN_PROGRESS)
      throw new BadRequestException('ETA is only available once the trip has departed');

    const schedule = this.scheduleRepo.findById(trip.scheduleId);
    if (!schedule) throw new NotFoundException(`Schedule for trip ${tripId} not found`);
    const route = this.routeRepo.findById(schedule.routeId);
    if (!route) throw new NotFoundException(`Route for trip ${tripId} not found`);

    const totalHours = route.distance / AVG_SPEED_KMPH;
    const departure = new Date(`${schedule.journeyDate}T${schedule.departureTime}`);
    const elapsedHours = Math.max((Date.now() - departure.getTime()) / 3_600_000, 0);
    const remainingHours = Math.max(totalHours - elapsedHours, 0);
    const percentComplete = totalHours > 0 ? Math.min(100, Math.round((elapsedHours / totalHours) * 100)) : 100;

    return successResponse('Estimated arrival', {
      tripId,
      distanceKm: route.distance,
      etaMinutes: Math.round(remainingHours * 60),
      etaTime: new Date(Date.now() + remainingHours * 3_600_000).toISOString(),
      percentComplete,
    });
  }
}
