import { Seat } from './interfaces/seat.interface';
import { SeatStatus } from './enums/seat-status.enum';
export declare class SeatRepository {
    private seats;
    initSeats(vehicleId: string, totalSeats: number): void;
    findSeat(vehicleId: string, seatNumber: number): Seat | undefined;
    findByVehicle(vehicleId: string): Seat[];
    findAvailableByVehicle(vehicleId: string): Seat[];
    updateStatus(vehicleId: string, seatNumber: number, status: SeatStatus): Seat | undefined;
    isSeatAvailable(vehicleId: string, seatNumber: number): boolean;
}
