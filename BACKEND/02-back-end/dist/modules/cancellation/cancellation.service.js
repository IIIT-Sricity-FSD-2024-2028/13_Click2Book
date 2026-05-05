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
exports.CancellationService = void 0;
const common_1 = require("@nestjs/common");
const cancellation_repository_1 = require("./cancellation.repository");
const booking_service_1 = require("../booking/booking.service");
const response_util_1 = require("../../common/utils/response.util");
let CancellationService = class CancellationService {
    cancellationRepo;
    bookingService;
    constructor(cancellationRepo, bookingService) {
        this.cancellationRepo = cancellationRepo;
        this.bookingService = bookingService;
    }
    cancel(dto) {
        if (this.cancellationRepo.findByBooking(dto.bookingId))
            throw new common_1.ConflictException(`Booking ${dto.bookingId} already cancelled`);
        this.bookingService.cancel(dto.bookingId);
        const cancellation = this.cancellationRepo.create(dto.bookingId);
        return (0, response_util_1.successResponse)('Booking cancelled. Refund request must be raised separately.', cancellation);
    }
    findAll() { return (0, response_util_1.successResponse)('All cancellations', this.cancellationRepo.findAll()); }
    findByBooking(bookingId) {
        const c = this.cancellationRepo.findByBooking(bookingId);
        return (0, response_util_1.successResponse)('Cancellation record', c || null);
    }
};
exports.CancellationService = CancellationService;
exports.CancellationService = CancellationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cancellation_repository_1.CancellationRepository,
        booking_service_1.BookingService])
], CancellationService);
//# sourceMappingURL=cancellation.service.js.map