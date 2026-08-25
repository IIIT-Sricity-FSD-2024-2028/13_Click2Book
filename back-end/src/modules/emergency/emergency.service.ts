import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { EmergencyRepository } from './emergency.repository';
import { BookingRepository } from '../booking/booking.repository';
import { TripRepository } from '../trip/trip.repository';
import { CreateEmergencyAlertDto } from './dto/emergency.dto';
import { EmergencyStatus } from './enums/emergency-status.enum';
import { BookingStatus } from '../booking/enums/booking-status.enum';
import { TripStatus } from '../trip/enums/trip-status.enum';
import { successResponse } from '../../common/utils/response.util';

@Injectable()
export class EmergencyService {
  constructor(
    private readonly emergencyRepo: EmergencyRepository,
    private readonly bookingRepo: BookingRepository,
    private readonly tripRepo: TripRepository,
  ) {}

  create(dto: CreateEmergencyAlertDto) {
    const booking = this.bookingRepo.findById(dto.bookingId);
    if (!booking) throw new NotFoundException(`Booking ${dto.bookingId} not found`);
    if (booking.customerId !== dto.customerId) throw new ForbiddenException('This booking does not belong to you');
    if (booking.bookingStatus !== BookingStatus.CONFIRMED)
      throw new BadRequestException('SOS is only available for a confirmed booking');

    const trip = this.tripRepo.findById(booking.tripId);
    if (!trip) throw new NotFoundException(`Trip for booking ${dto.bookingId} not found`);
    if (trip.tripStatus !== TripStatus.IN_PROGRESS)
      throw new BadRequestException('SOS can only be raised while the trip is in progress');

    const alert = this.emergencyRepo.create({
      bookingId: dto.bookingId,
      customerId: dto.customerId,
      tripId: booking.tripId,
      type: dto.type,
      message: dto.message,
      lat: dto.lat,
      lng: dto.lng,
    });
    return successResponse('Emergency alert raised — support has been notified', alert);
  }

  findAll(status?: EmergencyStatus) {
    if (status) return successResponse('Alerts by status', this.emergencyRepo.findByStatus(status));
    return successResponse('All emergency alerts', this.emergencyRepo.findAll());
  }

  findById(id: string) {
    const alert = this.emergencyRepo.findById(id);
    if (!alert) throw new NotFoundException(`Emergency alert ${id} not found`);
    return successResponse('Emergency alert', alert);
  }

  acknowledge(id: string) {
    const alert = this.emergencyRepo.findById(id);
    if (!alert) throw new NotFoundException(`Emergency alert ${id} not found`);
    if (alert.status !== EmergencyStatus.OPEN)
      throw new BadRequestException('Only OPEN alerts can be acknowledged');
    return successResponse('Alert acknowledged', this.emergencyRepo.update(id, { status: EmergencyStatus.ACKNOWLEDGED }));
  }

  resolve(id: string) {
    const alert = this.emergencyRepo.findById(id);
    if (!alert) throw new NotFoundException(`Emergency alert ${id} not found`);
    if (alert.status === EmergencyStatus.RESOLVED)
      throw new BadRequestException('Alert is already resolved');
    const updated = this.emergencyRepo.update(id, {
      status: EmergencyStatus.RESOLVED,
      resolvedAt: new Date().toISOString(),
    });
    return successResponse('Alert resolved', updated);
  }
}
