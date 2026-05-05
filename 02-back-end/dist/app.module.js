"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("./modules/auth/auth.module");
const customer_module_1 = require("./modules/customer/customer.module");
const admin_module_1 = require("./modules/admin/admin.module");
const provider_module_1 = require("./modules/provider/provider.module");
const support_module_1 = require("./modules/support/support.module");
const vehicle_module_1 = require("./modules/vehicle/vehicle.module");
const seat_module_1 = require("./modules/seat/seat.module");
const route_module_1 = require("./modules/route/route.module");
const schedule_module_1 = require("./modules/schedule/schedule.module");
const trip_module_1 = require("./modules/trip/trip.module");
const offer_module_1 = require("./modules/offer/offer.module");
const irctc_module_1 = require("./modules/irctc/irctc.module");
const booking_module_1 = require("./modules/booking/booking.module");
const payment_module_1 = require("./modules/payment/payment.module");
const cancellation_module_1 = require("./modules/cancellation/cancellation.module");
const refund_module_1 = require("./modules/refund/refund.module");
const review_module_1 = require("./modules/review/review.module");
const support_request_module_1 = require("./modules/support-request/support-request.module");
const report_module_1 = require("./modules/report/report.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_module_1.AuthModule,
            customer_module_1.CustomerModule,
            admin_module_1.AdminModule,
            provider_module_1.ProviderModule,
            support_module_1.SupportModule,
            route_module_1.RouteModule,
            vehicle_module_1.VehicleModule,
            seat_module_1.SeatModule,
            schedule_module_1.ScheduleModule,
            trip_module_1.TripModule,
            offer_module_1.OfferModule,
            booking_module_1.BookingModule,
            payment_module_1.PaymentModule,
            cancellation_module_1.CancellationModule,
            refund_module_1.RefundModule,
            irctc_module_1.IrctcModule,
            review_module_1.ReviewModule,
            support_request_module_1.SupportRequestModule,
            report_module_1.ReportModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map