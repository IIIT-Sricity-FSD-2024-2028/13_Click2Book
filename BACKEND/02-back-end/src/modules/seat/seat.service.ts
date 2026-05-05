import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { SeatRepository } from './seat.repository';
import { SeatStatus } from './enums/seat-status.enum';
import { successResponse } from '../../common/utils/response.util';

@Injectable()
export class SeatService {
  constructor(private readonly seatRepo: SeatRepository) {}

  initSeats(vehicleId: string, totalSeats: number) {
    this.seatRepo.initSeats(vehicleId, totalSeats);
    return successResponse(`${totalSeats} seats initialized for vehicle ${vehicleId}`);
  }

  getByVehicle(vehicleId: string) {
    return successResponse('Seats retrieved', this.seatRepo.findByVehicle(vehicleId));
  }

  getAvailableByVehicle(vehicleId: string) {
    return successResponse('Available seats', this.seatRepo.findAvailableByVehicle(vehicleId));
  }

  bookSeat(vehicleId: string, seatNumber: number) {
    if (!this.seatRepo.isSeatAvailable(vehicleId, seatNumber))
      throw new ConflictException(`Seat ${seatNumber} in vehicle ${vehicleId} is not available`);
    const seat = this.seatRepo.updateStatus(vehicleId, seatNumber, SeatStatus.BOOKED);
    return successResponse('Seat booked', seat);
  }

  releaseSeat(vehicleId: string, seatNumber: number) {
    const seat = this.seatRepo.findSeat(vehicleId, seatNumber);
    if (!seat) throw new NotFoundException(`Seat ${seatNumber} not found`);
    const updated = this.seatRepo.updateStatus(vehicleId, seatNumber, SeatStatus.AVAILABLE);
    return successResponse('Seat released', updated);
  }

  blockSeat(vehicleId: string, seatNumber: number) {
    const updated = this.seatRepo.updateStatus(vehicleId, seatNumber, SeatStatus.BLOCKED);
    if (!updated) throw new NotFoundException(`Seat ${seatNumber} not found`);
    return successResponse('Seat blocked', updated);
  }
}
