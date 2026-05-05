"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentRepository = void 0;
const common_1 = require("@nestjs/common");
const payment_status_enum_1 = require("./enums/payment-status.enum");
const id_util_1 = require("../../common/utils/id.util");
let PaymentRepository = class PaymentRepository {
    payments = [
        { paymentId: 'PAY001', bookingId: 'B001', amount: 600, discountAmount: 0, paymentMethod: 'UPI', paymentStatus: payment_status_enum_1.PaymentStatus.SUCCESS, paymentDate: '2026-05-01' },
        { paymentId: 'PAY002', bookingId: 'B002', amount: 600, discountAmount: 0, paymentMethod: 'Card', paymentStatus: payment_status_enum_1.PaymentStatus.SUCCESS, paymentDate: '2026-05-02' },
        { paymentId: 'PAY003', bookingId: 'B003', amount: 720, discountAmount: 180, paymentMethod: 'NetBanking', paymentStatus: payment_status_enum_1.PaymentStatus.SUCCESS, paymentDate: '2026-05-03' },
    ];
    create(data) {
        const payment = {
            paymentId: (0, id_util_1.generateId)('PAY'),
            ...data,
            discountAmount: data.discountAmount ?? 0,
            paymentStatus: payment_status_enum_1.PaymentStatus.PENDING,
            paymentDate: new Date().toISOString().split('T')[0],
        };
        this.payments.push(payment);
        return payment;
    }
    findAll() { return this.payments; }
    findById(paymentId) { return this.payments.find(p => p.paymentId === paymentId); }
    findByBooking(bookingId) { return this.payments.find(p => p.bookingId === bookingId); }
    update(paymentId, data) {
        const i = this.payments.findIndex(p => p.paymentId === paymentId);
        if (i === -1)
            return undefined;
        this.payments[i] = { ...this.payments[i], ...data };
        return this.payments[i];
    }
};
exports.PaymentRepository = PaymentRepository;
exports.PaymentRepository = PaymentRepository = __decorate([
    (0, common_1.Injectable)()
], PaymentRepository);
//# sourceMappingURL=payment.repository.js.map