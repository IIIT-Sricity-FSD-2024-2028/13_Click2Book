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
exports.ReportService = void 0;
const common_1 = require("@nestjs/common");
const report_repository_1 = require("./report.repository");
const booking_repository_1 = require("../booking/booking.repository");
const payment_repository_1 = require("../payment/payment.repository");
const response_util_1 = require("../../common/utils/response.util");
let ReportService = class ReportService {
    reportRepo;
    bookingRepo;
    paymentRepo;
    constructor(reportRepo, bookingRepo, paymentRepo) {
        this.reportRepo = reportRepo;
        this.bookingRepo = bookingRepo;
        this.paymentRepo = paymentRepo;
    }
    generate(dto) {
        const bookingsOnDate = this.bookingRepo.findAll().filter(b => b.bookingDate === dto.reportDate);
        const paymentsOnDate = this.paymentRepo.findAll().filter(p => p.paymentDate === dto.reportDate && p.paymentStatus === 'SUCCESS');
        const totalRevenue = paymentsOnDate.reduce((sum, p) => sum + (p.amount - p.discountAmount), 0);
        const report = this.reportRepo.save({
            adminId: dto.adminId,
            reportDate: dto.reportDate,
            totalBookings: bookingsOnDate.length,
            totalRevenue: Math.round(totalRevenue * 100) / 100,
        });
        return (0, response_util_1.successResponse)(`Report generated for ${dto.reportDate}`, {
            ...report,
            breakdownByStatus: {
                CONFIRMED: bookingsOnDate.filter(b => b.bookingStatus === 'CONFIRMED').length,
                CANCELLED: bookingsOnDate.filter(b => b.bookingStatus === 'CANCELLED').length,
                PENDING: bookingsOnDate.filter(b => b.bookingStatus === 'PENDING').length,
            },
        });
    }
    findAll() { return (0, response_util_1.successResponse)('All reports', this.reportRepo.findAll()); }
    findByAdmin(adminId) { return (0, response_util_1.successResponse)('Reports by admin', this.reportRepo.findByAdmin(adminId)); }
    findByDate(date) { return (0, response_util_1.successResponse)('Reports for date', this.reportRepo.findByDate(date)); }
};
exports.ReportService = ReportService;
exports.ReportService = ReportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [report_repository_1.ReportRepository,
        booking_repository_1.BookingRepository,
        payment_repository_1.PaymentRepository])
], ReportService);
//# sourceMappingURL=report.service.js.map