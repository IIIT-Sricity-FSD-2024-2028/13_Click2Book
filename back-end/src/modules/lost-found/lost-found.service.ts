import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { LostFoundRepository } from './lost-found.repository';
import { BookingRepository } from '../booking/booking.repository';
import { TripRepository } from '../trip/trip.repository';
import { VehicleRepository } from '../vehicle/vehicle.repository';
import { CreateLostFoundItemDto, UpdateLostFoundStatusDto } from './dto/lost-found.dto';
import { LostFoundStatus } from './enums/lost-found-status.enum';
import { Role } from '../../common/enums/role.enum';
import { successResponse } from '../../common/utils/response.util';

@Injectable()
export class LostFoundService {
  constructor(
    private readonly lostFoundRepo: LostFoundRepository,
    private readonly bookingRepo: BookingRepository,
    private readonly tripRepo: TripRepository,
    private readonly vehicleRepo: VehicleRepository,
  ) {}

  create(dto: CreateLostFoundItemDto) {
    const booking = this.bookingRepo.findById(dto.bookingId);
    if (!booking) throw new NotFoundException(`Booking ${dto.bookingId} not found`);
    if (booking.customerId !== dto.customerId) throw new ForbiddenException('This booking does not belong to you');
    if (booking.tripId !== dto.tripId) throw new BadRequestException('Trip does not match this booking');

    const item = this.lostFoundRepo.create(dto);
    return successResponse('Lost & found report submitted', item);
  }

  findAll() {
    return successResponse('All lost & found reports', this.lostFoundRepo.findAll());
  }

  findByCustomer(customerId: string) {
    return successResponse('Your lost & found reports', this.lostFoundRepo.findByCustomer(customerId));
  }

  findByProvider(providerId: string) {
    const tripIds = this.tripRepo
      .findAll()
      .filter(t => this.vehicleRepo.findById(t.vehicleId)?.providerId === providerId)
      .map(t => t.tripId);
    return successResponse('Items reported on your trips', this.lostFoundRepo.findByTrips(tripIds));
  }

  findById(id: string, role?: string, customerId?: string) {
    const item = this.lostFoundRepo.findById(id);
    if (!item) throw new NotFoundException(`Lost & found item ${id} not found`);
    if (role === Role.CUSTOMER && item.customerId !== customerId)
      throw new ForbiddenException('You do not own this report');
    return successResponse('Lost & found item', item);
  }

  updateStatus(id: string, dto: UpdateLostFoundStatusDto) {
    if (!this.lostFoundRepo.findById(id)) throw new NotFoundException(`Lost & found item ${id} not found`);
    const resolved = dto.status === LostFoundStatus.RETURNED || dto.status === LostFoundStatus.CLOSED;
    return successResponse(
      'Status updated',
      this.lostFoundRepo.update(id, {
        status: dto.status,
        foundNote: dto.foundNote,
        ...(resolved ? { resolvedAt: new Date().toISOString() } : {}),
      }),
    );
  }
}
