"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TripModule = void 0;
const common_1 = require("@nestjs/common");
const trip_controller_1 = require("./trip.controller");
const trip_service_1 = require("./trip.service");
const trip_repository_1 = require("./trip.repository");
const schedule_module_1 = require("../schedule/schedule.module");
const vehicle_module_1 = require("../vehicle/vehicle.module");
const seat_module_1 = require("../seat/seat.module");
const route_module_1 = require("../route/route.module");
let TripModule = class TripModule {
};
exports.TripModule = TripModule;
exports.TripModule = TripModule = __decorate([
    (0, common_1.Module)({
        imports: [schedule_module_1.ScheduleModule, vehicle_module_1.VehicleModule, seat_module_1.SeatModule, route_module_1.RouteModule],
        controllers: [trip_controller_1.TripController],
        providers: [trip_service_1.TripService, trip_repository_1.TripRepository],
        exports: [trip_service_1.TripService, trip_repository_1.TripRepository],
    })
], TripModule);
//# sourceMappingURL=trip.module.js.map