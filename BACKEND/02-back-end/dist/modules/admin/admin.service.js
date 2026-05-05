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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const admin_repository_1 = require("./admin.repository");
const booking_repository_1 = require("../booking/booking.repository");
const payment_repository_1 = require("../payment/payment.repository");
const response_util_1 = require("../../common/utils/response.util");
let AdminService = class AdminService {
    adminRepo;
    bookingRepo;
    paymentRepo;
    constructor(adminRepo, bookingRepo, paymentRepo) {
        this.adminRepo = adminRepo;
        this.bookingRepo = bookingRepo;
        this.paymentRepo = paymentRepo;
    }
    create(dto) {
        if (this.adminRepo.findByEmail(dto.email))
            throw new common_1.ConflictException('Admin email already exists');
        return (0, response_util_1.successResponse)('Admin created', this.adminRepo.create(dto));
    }
    findAll() { return (0, response_util_1.successResponse)('All admins', this.adminRepo.findAll()); }
    findById(id) {
        const a = this.adminRepo.findById(id);
        if (!a)
            throw new common_1.NotFoundException(`Admin ${id} not found`);
        return (0, response_util_1.successResponse)('Admin retrieved', a);
    }
    getDashboard() {
        const allBookings = this.bookingRepo.findAll();
        const allPayments = this.paymentRepo.findAll();
        const totalRevenue = allPayments
            .filter(p => p.paymentStatus === 'SUCCESS')
            .reduce((sum, p) => sum + p.amount - p.discountAmount, 0);
        return (0, response_util_1.successResponse)('Admin dashboard', {
            totalBookings: allBookings.length,
            confirmedBookings: allBookings.filter(b => b.bookingStatus === 'CONFIRMED').length,
            cancelledBookings: allBookings.filter(b => b.bookingStatus === 'CANCELLED').length,
            totalRevenue: totalRevenue.toFixed(2),
            totalPayments: allPayments.length,
        });
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [admin_repository_1.AdminRepository,
        booking_repository_1.BookingRepository,
        payment_repository_1.PaymentRepository])
], AdminService);
//# sourceMappingURL=admin.service.js.map