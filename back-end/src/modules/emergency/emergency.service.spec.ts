import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { EmergencyService } from './emergency.service';
import { EmergencyRepository } from './emergency.repository';
import { BookingRepository } from '../booking/booking.repository';
import { TripRepository } from '../trip/trip.repository';
import { TripStatus } from '../trip/enums/trip-status.enum';
import { EmergencyType } from './enums/emergency-type.enum';
import { EmergencyStatus } from './enums/emergency-status.enum';

describe('EmergencyService', () => {
  let service: EmergencyService;
  let tripRepo: TripRepository;

  beforeEach(() => {
    tripRepo = new TripRepository();
    service = new EmergencyService(new EmergencyRepository(), new BookingRepository(), tripRepo);
  });

  it('rejects an SOS raised by someone who does not own the booking', () => {
    expect(() =>
      service.create({ bookingId: 'B001', customerId: 'C999', type: EmergencyType.SAFETY }),
    ).toThrow(ForbiddenException);
  });

  it('rejects an SOS while the trip has not departed', () => {
    // Seeded B001 is CONFIRMED, owned by C001, on T001 which starts SCHEDULED
    expect(() =>
      service.create({ bookingId: 'B001', customerId: 'C001', type: EmergencyType.SAFETY }),
    ).toThrow(BadRequestException);
  });

  it('raises an alert once the booking is confirmed and the trip is in progress', () => {
    tripRepo.update('T001', { tripStatus: TripStatus.IN_PROGRESS });
    const result = service.create({ bookingId: 'B001', customerId: 'C001', type: EmergencyType.MEDICAL, message: 'Need help' });
    expect(result.success).toBe(true);
    expect(result.data?.status).toBe(EmergencyStatus.OPEN);
    expect(result.data?.tripId).toBe('T001');
  });

  it('walks an alert through acknowledge and resolve', () => {
    tripRepo.update('T001', { tripStatus: TripStatus.IN_PROGRESS });
    const created = service.create({ bookingId: 'B001', customerId: 'C001', type: EmergencyType.OTHER });
    const id = created.data!.alertId;

    const acknowledged = service.acknowledge(id);
    expect(acknowledged.data?.status).toBe(EmergencyStatus.ACKNOWLEDGED);

    const resolved = service.resolve(id);
    expect(resolved.data?.status).toBe(EmergencyStatus.RESOLVED);
    expect(resolved.data?.resolvedAt).toBeDefined();
  });

  it('404s when acknowledging an alert that does not exist', () => {
    expect(() => service.acknowledge('EMG999')).toThrow(NotFoundException);
  });
});
