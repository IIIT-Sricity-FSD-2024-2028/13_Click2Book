"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeatService = void 0;
const common_1 = require("@nestjs/common");
const seat_repository_1 = require("./seat.repository");
const seat_status_enum_1 = require("./enums/seat-status.enum");
const response_util_1 = require("../../common/utils/response.util");
let SeatService = class SeatService {
    seatRepo;
    constructor(seatRepo) {
        this.seatRepo = seatRepo;
    }
    initSeats(vehicleId, totalSeats) {
        this.seatRepo.initSeats(vehicleId, totalSeats);
        return (0, response_util_1.successResponse)(`${totalSeats} seats initialized for vehicle ${vehicleId}`);
    }
    getByVehicle(vehicleId) {
        return (0, response_util_1.successResponse)('Seats retrieved', this.seatRepo.findByVehicle(vehicleId));
    }
    getAvailableByVehicle(vehicleId) {
        return (0, response_util_1.successResponse)('Available seats', this.seatRepo.findAvailableByVehicle(vehicleId));
    }
    bookSeat(vehicleId, seatNumber) {
        if (!this.seatRepo.isSeatAvailable(vehicleId, seatNumber))
            throw new common_1.ConflictException(`Seat ${seatNumber} in vehicle ${vehicleId} is not available`);
        const seat = this.seatRepo.updateStatus(vehicleId, seatNumber, seat_status_enum_1.SeatStatus.BOOKED);
        return (0, response_util_1.successResponse)('Seat booked', seat);
    }
    releaseSeat(vehicleId, seatNumber) {
        const seat = this.seatRepo.findSeat(vehicleId, seatNumber);
        if (!seat)
            throw new common_1.NotFoundException(`Seat ${seatNumber} not found`);
        const updated = this.seatRepo.updateStatus(vehicleId, seatNumber, seat_status_enum_1.SeatStatus.AVAILABLE);
        return (0, response_util_1.successResponse)('Seat released', updated);
    }
    blockSeat(vehicleId, seatNumber) {
        const updated = this.seatRepo.updateStatus(vehicleId, seatNumber, seat_status_enum_1.SeatStatus.BLOCKED);
        if (!updated)
            throw new common_1.NotFoundException(`Seat ${seatNumber} not found`);
        return (0, response_util_1.successResponse)('Seat blocked', updated);
    }
};
exports.SeatService = SeatService;
exports.SeatService = SeatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [seat_repository_1.SeatRepository])
], SeatService);
//# sourceMappingURL=seat.service.js.map