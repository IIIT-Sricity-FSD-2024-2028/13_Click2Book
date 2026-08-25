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
exports.EmergencyService = void 0;
const common_1 = require("@nestjs/common");
const emergency_repository_1 = require("./emergency.repository");
const booking_repository_1 = require("../booking/booking.repository");
const trip_repository_1 = require("../trip/trip.repository");
const emergency_status_enum_1 = require("./enums/emergency-status.enum");
const booking_status_enum_1 = require("../booking/enums/booking-status.enum");
const trip_status_enum_1 = require("../trip/enums/trip-status.enum");
const response_util_1 = require("../../common/utils/response.util");
let EmergencyService = class EmergencyService {
    emergencyRepo;
    bookingRepo;
    tripRepo;
    constructor(emergencyRepo, bookingRepo, tripRepo) {
        this.emergencyRepo = emergencyRepo;
        this.bookingRepo = bookingRepo;
        this.tripRepo = tripRepo;
    }
    create(dto) {
        const booking = this.bookingRepo.findById(dto.bookingId);
        if (!booking)
            throw new common_1.NotFoundException(`Booking ${dto.bookingId} not found`);
        if (booking.customerId !== dto.customerId)
            throw new common_1.ForbiddenException('This booking does not belong to you');
        if (booking.bookingStatus !== booking_status_enum_1.BookingStatus.CONFIRMED)
            throw new common_1.BadRequestException('SOS is only available for a confirmed booking');
        const trip = this.tripRepo.findById(booking.tripId);
        if (!trip)
            throw new common_1.NotFoundException(`Trip for booking ${dto.bookingId} not found`);
        if (trip.tripStatus !== trip_status_enum_1.TripStatus.IN_PROGRESS)
            throw new common_1.BadRequestException('SOS can only be raised while the trip is in progress');
        const alert = this.emergencyRepo.create({
            bookingId: dto.bookingId,
            customerId: dto.customerId,
            tripId: booking.tripId,
            type: dto.type,
            message: dto.message,
            lat: dto.lat,
            lng: dto.lng,
        });
        return (0, response_util_1.successResponse)('Emergency alert raised — support has been notified', alert);
    }
    findAll(status) {
        if (status)
            return (0, response_util_1.successResponse)('Alerts by status', this.emergencyRepo.findByStatus(status));
        return (0, response_util_1.successResponse)('All emergency alerts', this.emergencyRepo.findAll());
    }
    findById(id) {
        const alert = this.emergencyRepo.findById(id);
        if (!alert)
            throw new common_1.NotFoundException(`Emergency alert ${id} not found`);
        return (0, response_util_1.successResponse)('Emergency alert', alert);
    }
    acknowledge(id) {
        const alert = this.emergencyRepo.findById(id);
        if (!alert)
            throw new common_1.NotFoundException(`Emergency alert ${id} not found`);
        if (alert.status !== emergency_status_enum_1.EmergencyStatus.OPEN)
            throw new common_1.BadRequestException('Only OPEN alerts can be acknowledged');
        return (0, response_util_1.successResponse)('Alert acknowledged', this.emergencyRepo.update(id, { status: emergency_status_enum_1.EmergencyStatus.ACKNOWLEDGED }));
    }
    resolve(id) {
        const alert = this.emergencyRepo.findById(id);
        if (!alert)
            throw new common_1.NotFoundException(`Emergency alert ${id} not found`);
        if (alert.status === emergency_status_enum_1.EmergencyStatus.RESOLVED)
            throw new common_1.BadRequestException('Alert is already resolved');
        const updated = this.emergencyRepo.update(id, {
            status: emergency_status_enum_1.EmergencyStatus.RESOLVED,
            resolvedAt: new Date().toISOString(),
        });
        return (0, response_util_1.successResponse)('Alert resolved', updated);
    }
};
exports.EmergencyService = EmergencyService;
exports.EmergencyService = EmergencyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [emergency_repository_1.EmergencyRepository,
        booking_repository_1.BookingRepository,
        trip_repository_1.TripRepository])
], EmergencyService);
//# sourceMappingURL=emergency.service.js.map