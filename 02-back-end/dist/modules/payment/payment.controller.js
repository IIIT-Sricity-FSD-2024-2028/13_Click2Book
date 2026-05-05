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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const payment_service_1 = require("./payment.service");
const payment_dto_1 = require("./dto/payment.dto");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const role_enum_1 = require("../../common/enums/role.enum");
let PaymentController = class PaymentController {
    paymentService;
    constructor(paymentService) {
        this.paymentService = paymentService;
    }
    processPayment(dto) {
        return this.paymentService.processPayment(dto);
    }
    findAll() { return this.paymentService.findAll(); }
    findOne(id) { return this.paymentService.findById(id); }
    findByBooking(bookingId) {
        return this.paymentService.findByBooking(bookingId);
    }
};
exports.PaymentController = PaymentController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.CUSTOMER),
    (0, swagger_1.ApiOperation)({ summary: 'Process payment for a booking (Customer)' }),
    (0, swagger_1.ApiHeader)({ name: 'x-role', required: true, schema: { example: 'CUSTOMER' } }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [payment_dto_1.CreatePaymentDto]),
    __metadata("design:returntype", void 0)
], PaymentController.prototype, "processPayment", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get all payments (Admin)' }),
    (0, swagger_1.ApiHeader)({ name: 'x-role', required: true, schema: { example: 'ADMIN' } }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PaymentController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.CUSTOMER, role_enum_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get payment by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 'PAY001' }),
    (0, swagger_1.ApiHeader)({ name: 'x-role', required: true, schema: { example: 'CUSTOMER' } }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PaymentController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('booking/:bookingId'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.CUSTOMER, role_enum_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get payment by booking ID' }),
    (0, swagger_1.ApiParam)({ name: 'bookingId', example: 'B001' }),
    (0, swagger_1.ApiHeader)({ name: 'x-role', required: true, schema: { example: 'CUSTOMER' } }),
    __param(0, (0, common_1.Param)('bookingId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PaymentController.prototype, "findByBooking", null);
exports.PaymentController = PaymentController = __decorate([
    (0, swagger_1.ApiTags)('Payments'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, common_1.Controller)('payments'),
    __metadata("design:paramtypes", [payment_service_1.PaymentService])
], PaymentController);
//# sourceMappingURL=payment.controller.js.map