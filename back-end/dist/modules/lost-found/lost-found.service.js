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
exports.LostFoundService = void 0;
const common_1 = require("@nestjs/common");
const lost_found_repository_1 = require("./lost-found.repository");
const booking_repository_1 = require("../booking/booking.repository");
const trip_repository_1 = require("../trip/trip.repository");
const vehicle_repository_1 = require("../vehicle/vehicle.repository");
const lost_found_status_enum_1 = require("./enums/lost-found-status.enum");
const role_enum_1 = require("../../common/enums/role.enum");
const response_util_1 = require("../../common/utils/response.util");
let LostFoundService = class LostFoundService {
    lostFoundRepo;
    bookingRepo;
    tripRepo;
    vehicleRepo;
    constructor(lostFoundRepo, bookingRepo, tripRepo, vehicleRepo) {
        this.lostFoundRepo = lostFoundRepo;
        this.bookingRepo = bookingRepo;
        this.tripRepo = tripRepo;
        this.vehicleRepo = vehicleRepo;
    }
    create(dto) {
        const booking = this.bookingRepo.findById(dto.bookingId);
        if (!booking)
            throw new common_1.NotFoundException(`Booking ${dto.bookingId} not found`);
        if (booking.customerId !== dto.customerId)
            throw new common_1.ForbiddenException('This booking does not belong to you');
        if (booking.tripId !== dto.tripId)
            throw new common_1.BadRequestException('Trip does not match this booking');
        const item = this.lostFoundRepo.create(dto);
        return (0, response_util_1.successResponse)('Lost & found report submitted', item);
    }
    findAll() {
        return (0, response_util_1.successResponse)('All lost & found reports', this.lostFoundRepo.findAll());
    }
    findByCustomer(customerId) {
        return (0, response_util_1.successResponse)('Your lost & found reports', this.lostFoundRepo.findByCustomer(customerId));
    }
    findByProvider(providerId) {
        const tripIds = this.tripRepo
            .findAll()
            .filter(t => this.vehicleRepo.findById(t.vehicleId)?.providerId === providerId)
            .map(t => t.tripId);
        return (0, response_util_1.successResponse)('Items reported on your trips', this.lostFoundRepo.findByTrips(tripIds));
    }
    findById(id, role, customerId) {
        const item = this.lostFoundRepo.findById(id);
        if (!item)
            throw new common_1.NotFoundException(`Lost & found item ${id} not found`);
        if (role === role_enum_1.Role.CUSTOMER && item.customerId !== customerId)
            throw new common_1.ForbiddenException('You do not own this report');
        return (0, response_util_1.successResponse)('Lost & found item', item);
    }
    updateStatus(id, dto) {
        if (!this.lostFoundRepo.findById(id))
            throw new common_1.NotFoundException(`Lost & found item ${id} not found`);
        const resolved = dto.status === lost_found_status_enum_1.LostFoundStatus.RETURNED || dto.status === lost_found_status_enum_1.LostFoundStatus.CLOSED;
        return (0, response_util_1.successResponse)('Status updated', this.lostFoundRepo.update(id, {
            status: dto.status,
            foundNote: dto.foundNote,
            ...(resolved ? { resolvedAt: new Date().toISOString() } : {}),
        }));
    }
};
exports.LostFoundService = LostFoundService;
exports.LostFoundService = LostFoundService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [lost_found_repository_1.LostFoundRepository,
        booking_repository_1.BookingRepository,
        trip_repository_1.TripRepository,
        vehicle_repository_1.VehicleRepository])
], LostFoundService);
//# sourceMappingURL=lost-found.service.js.map