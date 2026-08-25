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
exports.TrackingService = void 0;
const common_1 = require("@nestjs/common");
const tracking_repository_1 = require("./tracking.repository");
const trip_repository_1 = require("../trip/trip.repository");
const vehicle_repository_1 = require("../vehicle/vehicle.repository");
const booking_repository_1 = require("../booking/booking.repository");
const schedule_repository_1 = require("../schedule/schedule.repository");
const route_repository_1 = require("../route/route.repository");
const trip_status_enum_1 = require("../trip/enums/trip-status.enum");
const booking_status_enum_1 = require("../booking/enums/booking-status.enum");
const role_enum_1 = require("../../common/enums/role.enum");
const response_util_1 = require("../../common/utils/response.util");
const AVG_SPEED_KMPH = 50;
let TrackingService = class TrackingService {
    trackingRepo;
    tripRepo;
    vehicleRepo;
    bookingRepo;
    scheduleRepo;
    routeRepo;
    constructor(trackingRepo, tripRepo, vehicleRepo, bookingRepo, scheduleRepo, routeRepo) {
        this.trackingRepo = trackingRepo;
        this.tripRepo = tripRepo;
        this.vehicleRepo = vehicleRepo;
        this.bookingRepo = bookingRepo;
        this.scheduleRepo = scheduleRepo;
        this.routeRepo = routeRepo;
    }
    updateLocation(tripId, dto) {
        const trip = this.tripRepo.findById(tripId);
        if (!trip)
            throw new common_1.NotFoundException(`Trip ${tripId} not found`);
        if (trip.tripStatus !== trip_status_enum_1.TripStatus.IN_PROGRESS)
            throw new common_1.BadRequestException('Trip is not in progress — start the trip before sending location updates');
        const vehicle = this.vehicleRepo.findById(trip.vehicleId);
        if (!vehicle || vehicle.providerId !== dto.providerId)
            throw new common_1.ForbiddenException('You do not operate this trip');
        const location = this.trackingRepo.upsert(tripId, {
            lat: dto.lat,
            lng: dto.lng,
            status: dto.status,
            nextStop: dto.nextStop,
        });
        return (0, response_util_1.successResponse)('Location updated', location);
    }
    getLocation(tripId, role, customerId) {
        const trip = this.tripRepo.findById(tripId);
        if (!trip)
            throw new common_1.NotFoundException(`Trip ${tripId} not found`);
        if (role === role_enum_1.Role.CUSTOMER) {
            if (!customerId)
                throw new common_1.BadRequestException('customerId is required to view tracking as a customer');
            const holdsBooking = this.bookingRepo
                .findByTrip(tripId)
                .some(b => b.customerId === customerId && b.bookingStatus !== booking_status_enum_1.BookingStatus.CANCELLED);
            if (!holdsBooking)
                throw new common_1.ForbiddenException('You do not have a booking on this trip');
        }
        const location = this.trackingRepo.findByTrip(tripId);
        if (!location)
            throw new common_1.NotFoundException(`No location has been reported yet for trip ${tripId}`);
        return (0, response_util_1.successResponse)('Current location', location);
    }
    getEta(tripId) {
        const trip = this.tripRepo.findById(tripId);
        if (!trip)
            throw new common_1.NotFoundException(`Trip ${tripId} not found`);
        if (trip.tripStatus !== trip_status_enum_1.TripStatus.IN_PROGRESS)
            throw new common_1.BadRequestException('ETA is only available once the trip has departed');
        const schedule = this.scheduleRepo.findById(trip.scheduleId);
        if (!schedule)
            throw new common_1.NotFoundException(`Schedule for trip ${tripId} not found`);
        const route = this.routeRepo.findById(schedule.routeId);
        if (!route)
            throw new common_1.NotFoundException(`Route for trip ${tripId} not found`);
        const totalHours = route.distance / AVG_SPEED_KMPH;
        const departure = new Date(`${schedule.journeyDate}T${schedule.departureTime}`);
        const elapsedHours = Math.max((Date.now() - departure.getTime()) / 3_600_000, 0);
        const remainingHours = Math.max(totalHours - elapsedHours, 0);
        const percentComplete = totalHours > 0 ? Math.min(100, Math.round((elapsedHours / totalHours) * 100)) : 100;
        return (0, response_util_1.successResponse)('Estimated arrival', {
            tripId,
            distanceKm: route.distance,
            etaMinutes: Math.round(remainingHours * 60),
            etaTime: new Date(Date.now() + remainingHours * 3_600_000).toISOString(),
            percentComplete,
        });
    }
};
exports.TrackingService = TrackingService;
exports.TrackingService = TrackingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [tracking_repository_1.TrackingRepository,
        trip_repository_1.TripRepository,
        vehicle_repository_1.VehicleRepository,
        booking_repository_1.BookingRepository,
        schedule_repository_1.ScheduleRepository,
        route_repository_1.RouteRepository])
], TrackingService);
//# sourceMappingURL=tracking.service.js.map