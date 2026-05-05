import { Injectable } from '@nestjs/common';
import { Seat } from './interfaces/seat.interface';
import { SeatStatus } from './enums/seat-status.enum';

@Injectable()
export class SeatRepository {
  private seats: Seat[] = [];

  // Initialize seats for a vehicle
  initSeats(vehicleId: string, totalSeats: number): void {
    for (let i = 1; i <= totalSeats; i++) {
      if (!this.findSeat(vehicleId, i)) {
        this.seats.push({ vehicleId, seatNumber: i, seatStatus: SeatStatus.AVAILABLE });
      }
    }
  }

  findSeat(vehicleId: string, seatNumber: number): Seat | undefined {
    return this.seats.find(s => s.vehicleId === vehicleId && s.seatNumber === seatNumber);
  }

  findByVehicle(vehicleId: string): Seat[] {
    return this.seats.filter(s => s.vehicleId === vehicleId);
  }

  findAvailableByVehicle(vehicleId: string): Seat[] {
    return this.seats.filter(s => s.vehicleId === vehicleId && s.seatStatus === SeatStatus.AVAILABLE);
  }

  updateStatus(vehicleId: string, seatNumber: number, status: SeatStatus): Seat | undefined {
    const seat = this.findSeat(vehicleId, seatNumber);
    if (!seat) return undefined;
    seat.seatStatus = status;
    return seat;
  }

  isSeatAvailable(vehicleId: string, seatNumber: number): boolean {
    const seat = this.findSeat(vehicleId, seatNumber);
    return !!seat && seat.seatStatus === SeatStatus.AVAILABLE;
  }
}
