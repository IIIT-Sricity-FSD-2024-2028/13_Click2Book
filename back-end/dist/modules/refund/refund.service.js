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
exports.RefundService = void 0;
const common_1 = require("@nestjs/common");
const refund_repository_1 = require("./refund.repository");
const cancellation_repository_1 = require("../cancellation/cancellation.repository");
const payment_service_1 = require("../payment/payment.service");
const refund_status_enum_1 = require("./enums/refund-status.enum");
const response_util_1 = require("../../common/utils/response.util");
let RefundService = class RefundService {
    refundRepo;
    cancellationRepo;
    paymentService;
    constructor(refundRepo, cancellationRepo, paymentService) {
        this.refundRepo = refundRepo;
        this.cancellationRepo = cancellationRepo;
        this.paymentService = paymentService;
    }
    request(dto) {
        const cancellation = this.cancellationRepo.findByBooking(dto.bookingId);
        if (!cancellation)
            throw new common_1.BadRequestException(`Booking ${dto.bookingId} has not been cancelled yet`);
        if (this.refundRepo.findByBooking(dto.bookingId))
            throw new common_1.ConflictException(`Refund already requested for booking ${dto.bookingId}`);
        const refund = this.refundRepo.create({ bookingId: dto.bookingId, refundAmount: dto.refundAmount });
        return (0, response_util_1.successResponse)('Refund requested. Admin will process it.', refund);
    }
    findAll(status) {
        if (status)
            return (0, response_util_1.successResponse)('Refunds by status', this.refundRepo.findByStatus(status));
        return (0, response_util_1.successResponse)('All refunds', this.refundRepo.findAll());
    }
    findByBooking(bookingId) {
        const r = this.refundRepo.findByBooking(bookingId);
        if (!r)
            throw new common_1.NotFoundException(`No refund found for booking ${bookingId}`);
        return (0, response_util_1.successResponse)('Refund record', r);
    }
    process(bookingId, dto) {
        const refund = this.refundRepo.findByBooking(bookingId);
        if (!refund)
            throw new common_1.NotFoundException(`No refund for booking ${bookingId}`);
        if (refund.refundStatus === refund_status_enum_1.RefundStatus.COMPLETED)
            throw new common_1.BadRequestException('Refund already completed');
        const updated = this.refundRepo.update(bookingId, {
            adminId: dto.adminId,
            refundStatus: dto.refundStatus,
        });
        if (dto.refundStatus === refund_status_enum_1.RefundStatus.COMPLETED) {
            this.paymentService.markRefunded(bookingId);
        }
        return (0, response_util_1.successResponse)(`Refund ${dto.refundStatus}`, updated);
    }
};
exports.RefundService = RefundService;
exports.RefundService = RefundService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [refund_repository_1.RefundRepository,
        cancellation_repository_1.CancellationRepository,
        payment_service_1.PaymentService])
], RefundService);
//# sourceMappingURL=refund.service.js.map