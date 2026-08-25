import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { TrackingRepository } from './tracking.repository';
import { TripRepository } from '../trip/trip.repository';
import { VehicleRepository } from '../vehicle/vehicle.repository';
import { BookingRepository } from '../booking/booking.repository';
import { ScheduleRepository } from '../schedule/schedule.repository';
import { RouteRepository } from '../route/route.repository';
import { TripStatus } from '../trip/enums/trip-status.enum';
import { TrackingStatus } from './enums/tracking-status.enum';
import { Role } from '../../common/enums/role.enum';

describe('TrackingService', () => {
  let service: TrackingService;
  let tripRepo: TripRepository;

  beforeEach(() => {
    tripRepo = new TripRepository();
    service = new TrackingService(
      new TrackingRepository(),
      tripRepo,
      new VehicleRepository(),
      new BookingRepository(),
      new ScheduleRepository(),
      new RouteRepository(),
    );
  });

  it('rejects a location update while the trip has not departed', () => {
    // Seeded T001 starts as SCHEDULED
    expect(() =>
      service.updateLocation('T001', { providerId: 'P001', lat: 1, lng: 1, status: TrackingStatus.EN_ROUTE }),
    ).toThrow(BadRequestException);
  });

  it('rejects a provider who does not operate the trip', () => {
    tripRepo.update('T001', { tripStatus: TripStatus.IN_PROGRESS });
    expect(() =>
      service.updateLocation('T001', { providerId: 'P002', lat: 1, lng: 1, status: TrackingStatus.EN_ROUTE }),
    ).toThrow(ForbiddenException);
  });

  it('accepts a location update from the owning provider once in progress', () => {
    tripRepo.update('T001', { tripStatus: TripStatus.IN_PROGRESS });
    const result = service.updateLocation('T001', {
      providerId: 'P001',
      lat: 17.4,
      lng: 78.5,
      status: TrackingStatus.EN_ROUTE,
      nextStop: 'Vijayawada',
    });
    expect(result.success).toBe(true);
    expect(result.data?.lat).toBe(17.4);
  });

  it('blocks a customer without a booking on the trip from viewing location', () => {
    tripRepo.update('T001', { tripStatus: TripStatus.IN_PROGRESS });
    service.updateLocation('T001', { providerId: 'P001', lat: 1, lng: 1, status: TrackingStatus.EN_ROUTE });
    expect(() => service.getLocation('T001', Role.CUSTOMER, 'C999')).toThrow(ForbiddenException);
  });

  it('lets a customer with a confirmed booking view location', () => {
    tripRepo.update('T001', { tripStatus: TripStatus.IN_PROGRESS });
    service.updateLocation('T001', { providerId: 'P001', lat: 1, lng: 1, status: TrackingStatus.EN_ROUTE });
    // C001 holds seeded booking B001 on T001
    const result = service.getLocation('T001', Role.CUSTOMER, 'C001');
    expect(result.success).toBe(true);
  });

  it('rejects ETA requests before the trip departs', () => {
    expect(() => service.getEta('T001')).toThrow(BadRequestException);
  });

  it('computes an ETA once the trip is in progress', () => {
    tripRepo.update('T001', { tripStatus: TripStatus.IN_PROGRESS });
    const result = service.getEta('T001');
    expect(result.success).toBe(true);
    expect(result.data?.distanceKm).toBe(625);
    expect(result.data?.etaMinutes).toBeGreaterThanOrEqual(0);
  });

  it('404s for a trip that does not exist', () => {
    expect(() => service.getLocation('T999')).toThrow(NotFoundException);
  });
});
