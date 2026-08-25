"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleRepository = void 0;
const common_1 = require("@nestjs/common");
const id_util_1 = require("../../common/utils/id.util");
let ScheduleRepository = class ScheduleRepository {
    schedules = [
        { scheduleId: 'SCH001', routeId: 'R001', providerId: 'P001', departureTime: '21:00', arrivalTime: '06:30', journeyDate: '2026-06-01', arrivalTimeToDestination: '06:30', fare: 600 },
        { scheduleId: 'SCH002', routeId: 'R001', providerId: 'P002', departureTime: '22:00', arrivalTime: '08:00', journeyDate: '2026-06-01', arrivalTimeToDestination: '08:00', fare: 850 },
        { scheduleId: 'SCH003', routeId: 'R001', providerId: 'P002', departureTime: '08:00', arrivalTime: '18:00', journeyDate: '2026-06-02', arrivalTimeToDestination: '18:00', fare: 750 },
        { scheduleId: 'SCH004', routeId: 'R002', providerId: 'P002', departureTime: '20:00', arrivalTime: '10:00', journeyDate: '2026-06-01', arrivalTimeToDestination: '10:00', fare: 1400 },
        { scheduleId: 'SCH005', routeId: 'R002', providerId: 'P002', departureTime: '18:00', arrivalTime: '08:00', journeyDate: '2026-06-02', arrivalTimeToDestination: '08:00', fare: 1200 },
        { scheduleId: 'SCH006', routeId: 'R003', providerId: 'P001', departureTime: '06:00', arrivalTime: '10:30', journeyDate: '2026-06-01', arrivalTimeToDestination: '10:30', fare: 350 },
        { scheduleId: 'SCH007', routeId: 'R003', providerId: 'P001', departureTime: '14:00', arrivalTime: '18:30', journeyDate: '2026-06-01', arrivalTimeToDestination: '18:30', fare: 380 },
        { scheduleId: 'SCH008', routeId: 'R004', providerId: 'P001', departureTime: '07:00', arrivalTime: '16:00', journeyDate: '2026-06-02', arrivalTimeToDestination: '16:00', fare: 500 },
        { scheduleId: 'SCH009', routeId: 'R006', providerId: 'P002', departureTime: '09:00', arrivalTime: '12:30', journeyDate: '2026-06-01', arrivalTimeToDestination: '12:30', fare: 350 },
        { scheduleId: 'SCH010', routeId: 'R006', providerId: 'P002', departureTime: '21:00', arrivalTime: '00:30', journeyDate: '2026-06-01', arrivalTimeToDestination: '00:30', fare: 499 },
        { scheduleId: 'SCH011', routeId: 'R006', providerId: 'P002', departureTime: '07:00', arrivalTime: '10:30', journeyDate: '2026-06-02', arrivalTimeToDestination: '10:30', fare: 299 },
        { scheduleId: 'SCH012', routeId: 'R007', providerId: 'P001', departureTime: '23:00', arrivalTime: '05:00', journeyDate: '2026-06-01', arrivalTimeToDestination: '05:00', fare: 450 },
        { scheduleId: 'SCH013', routeId: 'R008', providerId: 'P001', departureTime: '06:30', arrivalTime: '09:30', journeyDate: '2026-06-01', arrivalTimeToDestination: '09:30', fare: 150 },
        { scheduleId: 'SCH014', routeId: 'R008', providerId: 'P002', departureTime: '10:00', arrivalTime: '13:00', journeyDate: '2026-06-01', arrivalTimeToDestination: '13:00', fare: 180 },
        { scheduleId: 'SCH015', routeId: 'R010', providerId: 'P001', departureTime: '06:00', arrivalTime: '11:00', journeyDate: '2026-06-01', arrivalTimeToDestination: '11:00', fare: 320 },
        { scheduleId: 'SCH016', routeId: 'R010', providerId: 'P001', departureTime: '16:00', arrivalTime: '21:00', journeyDate: '2026-06-01', arrivalTimeToDestination: '21:00', fare: 350 },
    ];
    create(data) {
        const schedule = { scheduleId: (0, id_util_1.generateId)('SCH'), ...data };
        this.schedules.push(schedule);
        return schedule;
    }
    findAll() { return this.schedules; }
    findById(scheduleId) { return this.schedules.find(s => s.scheduleId === scheduleId); }
    findByProvider(providerId) { return this.schedules.filter(s => s.providerId === providerId); }
    findByRoute(routeId) { return this.schedules.filter(s => s.routeId === routeId); }
    findByDate(journeyDate) { return this.schedules.filter(s => s.journeyDate === journeyDate); }
    update(scheduleId, data) {
        const i = this.schedules.findIndex(s => s.scheduleId === scheduleId);
        if (i === -1)
            return undefined;
        this.schedules[i] = { ...this.schedules[i], ...data };
        return this.schedules[i];
    }
    remove(scheduleId) {
        const i = this.schedules.findIndex(s => s.scheduleId === scheduleId);
        if (i === -1)
            return false;
        this.schedules.splice(i, 1);
        return true;
    }
};
exports.ScheduleRepository = ScheduleRepository;
exports.ScheduleRepository = ScheduleRepository = __decorate([
    (0, common_1.Injectable)()
], ScheduleRepository);
//# sourceMappingURL=schedule.repository.js.map