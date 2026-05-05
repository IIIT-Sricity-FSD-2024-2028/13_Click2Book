import { SeatService } from './seat.service';
export declare class SeatController {
    private readonly seatService;
    constructor(seatService: SeatService);
    getByVehicle(vehicleId: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/seat.interface").Seat[]>;
    getAvailable(vehicleId: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/seat.interface").Seat[]>;
    block(vehicleId: string, seatNumber: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/seat.interface").Seat>;
    release(vehicleId: string, seatNumber: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/seat.interface").Seat>;
}
