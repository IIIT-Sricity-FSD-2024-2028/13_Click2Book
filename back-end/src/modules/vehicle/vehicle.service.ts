import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { VehicleRepository } from './vehicle.repository';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';
import { successResponse } from '../../common/utils/response.util';
import { ProviderRepository } from '../provider/provider.repository';
import { TripRepository } from '../trip/trip.repository';
import { BookingRepository } from '../booking/booking.repository';
import { SeatRepository } from '../seat/seat.repository';
import { SyncService } from '../sync/sync.service';
import { TripStatus } from '../trip/enums/trip-status.enum';
import { BookingStatus } from '../booking/enums/booking-status.enum';

const ACTIVE_BOOKING = [BookingStatus.PENDING, BookingStatus.CONFIRMED];
const FINISHED_TRIP = [TripStatus.COMPLETED, TripStatus.CANCELLED];

@Injectable()
export class VehicleService {
  constructor(
    private readonly vehicleRepo: VehicleRepository,
    private readonly moduleRef: ModuleRef,
    private readonly syncService: SyncService,
  ) {}

  // Trip/Booking/Provider/Seat modules all import VehicleModule, so their repositories are
  // looked up lazily here instead of being imported (which would make a module cycle).
  private repo<T>(token: new (...args: any[]) => T): T {
    return this.moduleRef.get(token, { strict: false });
  }

  /** Upcoming trips on this bus, and the bookings still holding a seat on them. */
  private activeBookings(vehicleId: string) {
    const trips = this.repo(TripRepository)
      .findByVehicle(vehicleId)
      .filter((t) => !FINISHED_TRIP.includes(t.tripStatus));
    const bookingRepo = this.repo(BookingRepository);
    const bookings = trips
      .flatMap((t) => bookingRepo.findByTrip(t.tripId))
      .filter((b) => ACTIVE_BOOKING.includes(b.bookingStatus));
    return { trips, bookings };
  }

  create(dto: CreateVehicleDto) {
    if (!this.repo(ProviderRepository).findById(dto.providerId))
      throw new NotFoundException(`Provider ${dto.providerId} does not exist`);

    // A registration number belongs to one bus. The same provider re-adding it gets the existing bus back.
    const existing = this.vehicleRepo
      .findAll()
      .find((v) => v.vehicleNumber.toLowerCase() === dto.vehicleNumber.toLowerCase());
    if (existing) {
      if (existing.providerId !== dto.providerId)
        throw new ConflictException(`Registration ${dto.vehicleNumber} is already used by provider ${existing.providerId}`);
      return successResponse('Vehicle already exists', existing);
    }
    const vehicle = this.vehicleRepo.create(dto);
    this.syncService.emit('VEHICLE_UPDATED', { action: 'created', vehicle });
    return successResponse('Vehicle added', vehicle);
  }

  findAll() { return successResponse('All vehicles', this.vehicleRepo.findAll()); }

  findById(id: string) {
    const v = this.vehicleRepo.findById(id);
    if (!v) throw new NotFoundException(`Vehicle ${id} not found`);
    return successResponse('Vehicle retrieved', v);
  }

  findByProvider(providerId: string) {
    return successResponse(`Vehicles for provider ${providerId}`, this.vehicleRepo.findByProvider(providerId));
  }

  // Customer search, booking and the provider portal all read the bus live, so an update shows everywhere.
  update(id: string, dto: UpdateVehicleDto) {
    const vehicle = this.vehicleRepo.findById(id);
    if (!vehicle) throw new NotFoundException(`Vehicle ${id} not found`);
    const patch: Record<string, any> = { ...dto };

    const newNumber = dto.vehicleNumber;
    if (newNumber && newNumber.toLowerCase() !== vehicle.vehicleNumber.toLowerCase()) {
      const clash = this.vehicleRepo
        .findAll()
        .find((v) => v.vehicleId !== id && v.vehicleNumber.toLowerCase() === newNumber.toLowerCase());
      if (clash) throw new ConflictException(`Registration ${newNumber} is already used by ${clash.vehicleId}`);
    }

    if (dto.totalSeats !== undefined && dto.totalSeats !== vehicle.totalSeats) {
      const booked = vehicle.totalSeats - vehicle.remainingSeats;
      if (dto.totalSeats < booked)
        throw new BadRequestException(`${booked} seat(s) are booked on this bus; total seats cannot go below ${booked}`);
      const highest = Math.max(0, ...this.activeBookings(id).bookings.map((b) => Number(b.seatNumber) || 0));
      if (dto.totalSeats < highest)
        throw new BadRequestException(`Seat ${highest} is booked on this bus; total seats cannot go below ${highest}`);
      patch.remainingSeats = dto.totalSeats - booked;
      const seats = this.repo(SeatRepository);
      seats.removeAbove(id, dto.totalSeats);
      seats.initSeats(id, dto.totalSeats);
    }

    const updated = this.vehicleRepo.update(id, patch);
    this.syncService.emit('VEHICLE_UPDATED', { action: 'updated', vehicle: updated });
    return successResponse('Vehicle updated', updated);
  }

  // A bus with customers booked on an upcoming trip cannot be removed. Otherwise its upcoming
  // trips go with it (so they leave customer search); completed/cancelled trips stay as history.
  remove(id: string) {
    if (!this.vehicleRepo.findById(id)) throw new NotFoundException(`Vehicle ${id} not found`);
    const { trips, bookings } = this.activeBookings(id);
    if (bookings.length) {
      const tripIds = [...new Set(bookings.map((b) => b.tripId))].join(', ');
      throw new ConflictException(
        `Bus ${id} has ${bookings.length} active booking(s) on trip(s) ${tripIds}. Cancel those bookings first.`,
      );
    }
    const tripRepo = this.repo(TripRepository);
    trips.forEach((t) => tripRepo.remove(t.tripId));
    this.repo(SeatRepository).removeAbove(id, 0);
    this.vehicleRepo.remove(id);
    const removedTrips = trips.map((t) => t.tripId);
    this.syncService.emit('VEHICLE_UPDATED', { action: 'removed', vehicleId: id, removedTrips });
    return successResponse(
      `Vehicle removed${removedTrips.length ? ` with ${removedTrips.length} upcoming trip(s)` : ''}`,
      { vehicleId: id, removedTrips },
    );
  }
}
