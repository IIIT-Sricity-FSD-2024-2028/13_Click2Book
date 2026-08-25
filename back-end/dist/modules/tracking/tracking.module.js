"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackingModule = void 0;
const common_1 = require("@nestjs/common");
const tracking_controller_1 = require("./tracking.controller");
const tracking_service_1 = require("./tracking.service");
const tracking_repository_1 = require("./tracking.repository");
const trip_module_1 = require("../trip/trip.module");
const vehicle_module_1 = require("../vehicle/vehicle.module");
const booking_module_1 = require("../booking/booking.module");
const schedule_module_1 = require("../schedule/schedule.module");
const route_module_1 = require("../route/route.module");
let TrackingModule = class TrackingModule {
};
exports.TrackingModule = TrackingModule;
exports.TrackingModule = TrackingModule = __decorate([
    (0, common_1.Module)({
        imports: [trip_module_1.TripModule, vehicle_module_1.VehicleModule, booking_module_1.BookingModule, schedule_module_1.ScheduleModule, route_module_1.RouteModule],
        controllers: [tracking_controller_1.TrackingController],
        providers: [tracking_service_1.TrackingService, tracking_repository_1.TrackingRepository],
        exports: [tracking_service_1.TrackingService, tracking_repository_1.TrackingRepository],
    })
], TrackingModule);
//# sourceMappingURL=tracking.module.js.map