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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TripService = void 0;
const common_1 = require("@nestjs/common");
const trip_repository_1 = require("./trip.repository");
const schedule_repository_1 = require("../schedule/schedule.repository");
const vehicle_repository_1 = require("../vehicle/vehicle.repository");
const seat_repository_1 = require("../seat/seat.repository");
const route_repository_1 = require("../route/route.repository");
const trip_status_enum_1 = require("./enums/trip-status.enum");
const response_util_1 = require("../../common/utils/response.util");
let TripService = class TripService {
    tripRepo;
    scheduleRepo;
    vehicleRepo;
    seatRepo;
    routeRepo;
    constructor(tripRepo, scheduleRepo, vehicleRepo, seatRepo, routeRepo) {
        this.tripRepo = tripRepo;
        this.scheduleRepo = scheduleRepo;
        this.vehicleRepo = vehicleRepo;
        this.seatRepo = seatRepo;
        this.routeRepo = routeRepo;
    }
    create(dto) {
        const schedule = this.scheduleRepo.findById(dto.scheduleId);
        if (!schedule)
            throw new common_1.NotFoundException(`Schedule ${dto.scheduleId} not found`);
        const vehicle = this.vehicleRepo.findById(dto.vehicleId);
        if (!vehicle)
            throw new common_1.NotFoundException(`Vehicle ${dto.vehicleId} not found`);
        this.seatRepo.initSeats(dto.vehicleId, vehicle.totalSeats);
        const trip = this.tripRepo.create({ ...dto, tripStatus: trip_status_enum_1.TripStatus.SCHEDULED });
        return (0, response_util_1.successResponse)('Trip created and seats initialized', trip);
    }
    findAll(status) {
        if (status)
            return (0, response_util_1.successResponse)('Trips by status', this.tripRepo.findByStatus(status));
        return (0, response_util_1.successResponse)('All trips', this.tripRepo.findAll());
    }
    calcDuration(dep, arr) {
        const [dH, dM] = dep.split(':').map(Number);
        const [aH, aM] = arr.split(':').map(Number);
        let mins = (aH * 60 + aM) - (dH * 60 + dM);
        if (mins < 0)
            mins += 24 * 60;
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h}h ${m > 0 ? m + 'm' : ''}`.trim();
    }
    search(source, destination, date) {
        const allTrips = this.tripRepo.findAll();
        const src = source.trim().toLowerCase();
        const dst = destination.trim().toLowerCase();
        const results = allTrips
            .map(trip => {
            const schedule = this.scheduleRepo.findById(trip.scheduleId);
            if (!schedule)
                return null;
            const route = this.routeRepo.findById(schedule.routeId);
            if (!route)
                return null;
            if (src && !route.source.toLowerCase().includes(src))
                return null;
            if (dst && !route.destination.toLowerCase().includes(dst))
                return null;
            const vehicle = this.vehicleRepo.findById(trip.vehicleId);
            if (!vehicle || vehicle.remainingSeats <= 0)
                return null;
            const v = vehicle;
            return {
                tripId: trip.tripId,
                scheduleId: schedule.scheduleId,
                vehicleId: vehicle.vehicleId,
                busName: v.busName || vehicle.vehicleNumber,
                providerName: schedule.providerId === 'P001' ? 'APSRTC' : 'Private Operators',
                source: route.source,
                destination: route.destination,
                departureTime: schedule.departureTime,
                arrivalTime: schedule.arrivalTime,
                duration: this.calcDuration(schedule.departureTime, schedule.arrivalTime),
                journeyDate: date || schedule.journeyDate,
                price: schedule.fare,
                availableSeats: vehicle.remainingSeats,
                totalSeats: vehicle.totalSeats,
                vehicleType: vehicle.vehicleType,
                amenities: v.amenities || [],
                boardingPoint: v.boardingPoint || route.source,
                droppingPoint: v.droppingPoint || route.destination,
                rating: v.rating || 4.0,
                tripStatus: trip.tripStatus,
                distance: route.distance,
            };
        })
            .filter((item) => item !== null)
            .sort((a, b) => a.departureTime.localeCompare(b.departureTime));
        if (results.length === 0)
            throw new common_1.NotFoundException(`No available trips found from ${source} to ${destination}`);
        return (0, response_util_1.successResponse)(`${results.length} bus(es) found from ${source} to ${destination}`, results);
    }
    findById(id) {
        const trip = this.tripRepo.findById(id);
        if (!trip)
            throw new common_1.NotFoundException(`Trip ${id} not found`);
        const schedule = this.scheduleRepo.findById(trip.scheduleId);
        const vehicle = this.vehicleRepo.findById(trip.vehicleId);
        return (0, response_util_1.successResponse)('Trip details', { trip, schedule, vehicle });
    }
    updateStatus(id, dto) {
        const trip = this.tripRepo.findById(id);
        if (!trip)
            throw new common_1.NotFoundException(`Trip ${id} not found`);
        const updated = this.tripRepo.update(id, { tripStatus: dto.tripStatus });
        return (0, response_util_1.successResponse)('Trip status updated', updated);
    }
    confirm(id) {
        const trip = this.tripRepo.findById(id);
        if (!trip)
            throw new common_1.NotFoundException(`Trip ${id} not found`);
        if (trip.tripStatus !== trip_status_enum_1.TripStatus.SCHEDULED)
            throw new common_1.BadRequestException('Only SCHEDULED trips can depart');
        return (0, response_util_1.successResponse)('Trip departed — now in progress', this.tripRepo.update(id, { tripStatus: trip_status_enum_1.TripStatus.IN_PROGRESS }));
    }
};
exports.TripService = TripService;
exports.TripService = TripService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [trip_repository_1.TripRepository,
        schedule_repository_1.ScheduleRepository,
        vehicle_repository_1.VehicleRepository,
        seat_repository_1.SeatRepository,
        route_repository_1.RouteRepository])
], TripService);
//# sourceMappingURL=trip.service.js.map