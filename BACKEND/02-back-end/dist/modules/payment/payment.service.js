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
exports.PaymentService = void 0;
const common_1 = require("@nestjs/common");
const payment_repository_1 = require("./payment.repository");
const booking_service_1 = require("../booking/booking.service");
const booking_repository_1 = require("../booking/booking.repository");
const payment_status_enum_1 = require("./enums/payment-status.enum");
const booking_status_enum_1 = require("../booking/enums/booking-status.enum");
const response_util_1 = require("../../common/utils/response.util");
let PaymentService = class PaymentService {
    paymentRepo;
    bookingRepo;
    bookingService;
    constructor(paymentRepo, bookingRepo, bookingService) {
        this.paymentRepo = paymentRepo;
        this.bookingRepo = bookingRepo;
        this.bookingService = bookingService;
    }
    processPayment(dto) {
        const booking = this.bookingRepo.findById(dto.bookingId);
        if (!booking)
            throw new common_1.NotFoundException(`Booking ${dto.bookingId} not found`);
        if (booking.bookingStatus !== booking_status_enum_1.BookingStatus.PENDING)
            throw new common_1.BadRequestException('Payment can only be made for PENDING bookings');
        if (this.paymentRepo.findByBooking(dto.bookingId))
            throw new common_1.ConflictException(`Payment already exists for booking ${dto.bookingId}`);
        const payment = this.paymentRepo.create({ ...dto, discountAmount: dto.discountAmount ?? 0 });
        const updated = this.paymentRepo.update(payment.paymentId, { paymentStatus: payment_status_enum_1.PaymentStatus.SUCCESS });
        this.bookingService.confirm(dto.bookingId);
        return (0, response_util_1.successResponse)('Payment successful. Booking confirmed.', updated);
    }
    findAll() { return (0, response_util_1.successResponse)('All payments', this.paymentRepo.findAll()); }
    findById(id) {
        const p = this.paymentRepo.findById(id);
        if (!p)
            throw new common_1.NotFoundException(`Payment ${id} not found`);
        return (0, response_util_1.successResponse)('Payment retrieved', p);
    }
    findByBooking(bookingId) {
        const p = this.paymentRepo.findByBooking(bookingId);
        if (!p)
            throw new common_1.NotFoundException(`No payment found for booking ${bookingId}`);
        return (0, response_util_1.successResponse)('Payment for booking', p);
    }
    markRefunded(bookingId) {
        const p = this.paymentRepo.findByBooking(bookingId);
        if (!p)
            throw new common_1.NotFoundException(`No payment for booking ${bookingId}`);
        const updated = this.paymentRepo.update(p.paymentId, { paymentStatus: payment_status_enum_1.PaymentStatus.REFUNDED });
        return (0, response_util_1.successResponse)('Payment marked as refunded', updated);
    }
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [payment_repository_1.PaymentRepository,
        booking_repository_1.BookingRepository,
        booking_service_1.BookingService])
], PaymentService);
//# sourceMappingURL=payment.service.js.map