import { SeatRepository } from './seat.repository';
export declare class SeatService {
    private readonly seatRepo;
    constructor(seatRepo: SeatRepository);
    initSeats(vehicleId: string, totalSeats: number): import("../../common/utils/response.util").ApiResponse<unknown>;
    getByVehicle(vehicleId: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/seat.interface").Seat[]>;
    getAvailableByVehicle(vehicleId: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/seat.interface").Seat[]>;
    bookSeat(vehicleId: string, seatNumber: number): import("../../common/utils/response.util").ApiResponse<import("./interfaces/seat.interface").Seat>;
    releaseSeat(vehicleId: string, seatNumber: number): import("../../common/utils/response.util").ApiResponse<import("./interfaces/seat.interface").Seat>;
    blockSeat(vehicleId: string, seatNumber: number): import("../../common/utils/response.util").ApiResponse<import("./interfaces/seat.interface").Seat>;
}
