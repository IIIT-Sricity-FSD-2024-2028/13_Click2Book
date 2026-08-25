"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackingRepository = void 0;
const common_1 = require("@nestjs/common");
const tracking_status_enum_1 = require("./enums/tracking-status.enum");
let TrackingRepository = class TrackingRepository {
    locations = [];
    findByTrip(tripId) {
        return this.locations.find(l => l.tripId === tripId);
    }
    upsert(tripId, data) {
        let location = this.findByTrip(tripId);
        if (!location) {
            location = { tripId, lat: 0, lng: 0, status: tracking_status_enum_1.TrackingStatus.AT_STOP, updatedAt: new Date().toISOString() };
            this.locations.push(location);
        }
        Object.assign(location, data, { updatedAt: new Date().toISOString() });
        return location;
    }
};
exports.TrackingRepository = TrackingRepository;
exports.TrackingRepository = TrackingRepository = __decorate([
    (0, common_1.Injectable)()
], TrackingRepository);
//# sourceMappingURL=tracking.repository.js.map