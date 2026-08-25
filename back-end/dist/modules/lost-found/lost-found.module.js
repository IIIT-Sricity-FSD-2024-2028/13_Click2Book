"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LostFoundModule = void 0;
const common_1 = require("@nestjs/common");
const lost_found_controller_1 = require("./lost-found.controller");
const lost_found_service_1 = require("./lost-found.service");
const lost_found_repository_1 = require("./lost-found.repository");
const booking_module_1 = require("../booking/booking.module");
const trip_module_1 = require("../trip/trip.module");
const vehicle_module_1 = require("../vehicle/vehicle.module");
let LostFoundModule = class LostFoundModule {
};
exports.LostFoundModule = LostFoundModule;
exports.LostFoundModule = LostFoundModule = __decorate([
    (0, common_1.Module)({
        imports: [booking_module_1.BookingModule, trip_module_1.TripModule, vehicle_module_1.VehicleModule],
        controllers: [lost_found_controller_1.LostFoundController],
        providers: [lost_found_service_1.LostFoundService, lost_found_repository_1.LostFoundRepository],
        exports: [lost_found_service_1.LostFoundService, lost_found_repository_1.LostFoundRepository],
    })
], LostFoundModule);
//# sourceMappingURL=lost-found.module.js.map