import { SeatStatus } from '../enums/seat-status.enum';

export interface Seat {
  vehicleId: string;
  seatNumber: number;
  seatStatus: SeatStatus;
}
