"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TripRepository = void 0;
const common_1 = require("@nestjs/common");
const trip_status_enum_1 = require("./enums/trip-status.enum");
const id_util_1 = require("../../common/utils/id.util");
let TripRepository = class TripRepository {
    trips = [
        { tripId: 'T001', scheduleId: 'SCH001', vehicleId: 'V001', tripStatus: trip_status_enum_1.TripStatus.SCHEDULED },
        { tripId: 'T002', scheduleId: 'SCH002', vehicleId: 'V004', tripStatus: trip_status_enum_1.TripStatus.SCHEDULED },
        { tripId: 'T003', scheduleId: 'SCH003', vehicleId: 'V007', tripStatus: trip_status_enum_1.TripStatus.SCHEDULED },
        { tripId: 'T004', scheduleId: 'SCH004', vehicleId: 'V003', tripStatus: trip_status_enum_1.TripStatus.SCHEDULED },
        { tripId: 'T005', scheduleId: 'SCH005', vehicleId: 'V005', tripStatus: trip_status_enum_1.TripStatus.SCHEDULED },
        { tripId: 'T006', scheduleId: 'SCH006', vehicleId: 'V012', tripStatus: trip_status_enum_1.TripStatus.SCHEDULED },
        { tripId: 'T007', scheduleId: 'SCH007', vehicleId: 'V006', tripStatus: trip_status_enum_1.TripStatus.SCHEDULED },
        { tripId: 'T008', scheduleId: 'SCH008', vehicleId: 'V002', tripStatus: trip_status_enum_1.TripStatus.SCHEDULED },
        { tripId: 'T009', scheduleId: 'SCH009', vehicleId: 'V008', tripStatus: trip_status_enum_1.TripStatus.SCHEDULED },
        { tripId: 'T010', scheduleId: 'SCH010', vehicleId: 'V003', tripStatus: trip_status_enum_1.TripStatus.SCHEDULED },
        { tripId: 'T011', scheduleId: 'SCH011', vehicleId: 'V006', tripStatus: trip_status_enum_1.TripStatus.SCHEDULED },
        { tripId: 'T012', scheduleId: 'SCH012', vehicleId: 'V001', tripStatus: trip_status_enum_1.TripStatus.SCHEDULED },
        { tripId: 'T013', scheduleId: 'SCH013', vehicleId: 'V002', tripStatus: trip_status_enum_1.TripStatus.SCHEDULED },
        { tripId: 'T014', scheduleId: 'SCH014', vehicleId: 'V006', tripStatus: trip_status_enum_1.TripStatus.SCHEDULED },
        { tripId: 'T015', scheduleId: 'SCH015', vehicleId: 'V011', tripStatus: trip_status_enum_1.TripStatus.SCHEDULED },
        { tripId: 'T016', scheduleId: 'SCH016', vehicleId: 'V010', tripStatus: trip_status_enum_1.TripStatus.SCHEDULED },
    ];
    create(data) {
        const trip = { tripId: (0, id_util_1.generateId)('T'), ...data };
        this.trips.push(trip);
        return trip;
    }
    findAll() { return this.trips; }
    findById(tripId) { return this.trips.find(t => t.tripId === tripId); }
    findBySchedule(scheduleId) { return this.trips.filter(t => t.scheduleId === scheduleId); }
    findByVehicle(vehicleId) { return this.trips.filter(t => t.vehicleId === vehicleId); }
    findByStatus(status) { return this.trips.filter(t => t.tripStatus === status); }
    update(tripId, data) {
        const i = this.trips.findIndex(t => t.tripId === tripId);
        if (i === -1)
            return undefined;
        this.trips[i] = { ...this.trips[i], ...data };
        return this.trips[i];
    }
    remove(tripId) {
        const i = this.trips.findIndex(t => t.tripId === tripId);
        if (i === -1)
            return false;
        this.trips.splice(i, 1);
        return true;
    }
};
exports.TripRepository = TripRepository;
exports.TripRepository = TripRepository = __decorate([
    (0, common_1.Injectable)()
], TripRepository);
//# sourceMappingURL=trip.repository.js.map