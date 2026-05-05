"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeatRepository = void 0;
const common_1 = require("@nestjs/common");
const seat_status_enum_1 = require("./enums/seat-status.enum");
let SeatRepository = class SeatRepository {
    seats = [];
    initSeats(vehicleId, totalSeats) {
        for (let i = 1; i <= totalSeats; i++) {
            if (!this.findSeat(vehicleId, i)) {
                this.seats.push({ vehicleId, seatNumber: i, seatStatus: seat_status_enum_1.SeatStatus.AVAILABLE });
            }
        }
    }
    findSeat(vehicleId, seatNumber) {
        return this.seats.find(s => s.vehicleId === vehicleId && s.seatNumber === seatNumber);
    }
    findByVehicle(vehicleId) {
        return this.seats.filter(s => s.vehicleId === vehicleId);
    }
    findAvailableByVehicle(vehicleId) {
        return this.seats.filter(s => s.vehicleId === vehicleId && s.seatStatus === seat_status_enum_1.SeatStatus.AVAILABLE);
    }
    updateStatus(vehicleId, seatNumber, status) {
        const seat = this.findSeat(vehicleId, seatNumber);
        if (!seat)
            return undefined;
        seat.seatStatus = status;
        return seat;
    }
    isSeatAvailable(vehicleId, seatNumber) {
        const seat = this.findSeat(vehicleId, seatNumber);
        return !!seat && seat.seatStatus === seat_status_enum_1.SeatStatus.AVAILABLE;
    }
};
exports.SeatRepository = SeatRepository;
exports.SeatRepository = SeatRepository = __decorate([
    (0, common_1.Injectable)()
], SeatRepository);
//# sourceMappingURL=seat.repository.js.map