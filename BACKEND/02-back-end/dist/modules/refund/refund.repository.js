"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefundRepository = void 0;
const common_1 = require("@nestjs/common");
const refund_status_enum_1 = require("./enums/refund-status.enum");
let RefundRepository = class RefundRepository {
    refunds = [];
    create(data) {
        const refund = {
            ...data,
            refundStatus: refund_status_enum_1.RefundStatus.REQUESTED,
            refundDate: new Date().toISOString().split('T')[0],
        };
        this.refunds.push(refund);
        return refund;
    }
    findAll() { return this.refunds; }
    findByBooking(bookingId) { return this.refunds.find(r => r.bookingId === bookingId); }
    findByStatus(status) { return this.refunds.filter(r => r.refundStatus === status); }
    update(bookingId, data) {
        const i = this.refunds.findIndex(r => r.bookingId === bookingId);
        if (i === -1)
            return undefined;
        this.refunds[i] = { ...this.refunds[i], ...data };
        return this.refunds[i];
    }
};
exports.RefundRepository = RefundRepository;
exports.RefundRepository = RefundRepository = __decorate([
    (0, common_1.Injectable)()
], RefundRepository);
//# sourceMappingURL=refund.repository.js.map