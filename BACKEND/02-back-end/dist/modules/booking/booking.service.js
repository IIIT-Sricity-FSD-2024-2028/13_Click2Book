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
exports.BookingService = void 0;
const common_1 = require("@nestjs/common");
const booking_repository_1 = require("./booking.repository");
const trip_repository_1 = require("../trip/trip.repository");
const vehicle_repository_1 = require("../vehicle/vehicle.repository");
const seat_repository_1 = require("../seat/seat.repository");
const offer_service_1 = require("../offer/offer.service");
const booking_status_enum_1 = require("./enums/booking-status.enum");
const seat_status_enum_1 = require("../seat/enums/seat-status.enum");
const trip_status_enum_1 = require("../trip/enums/trip-status.enum");
const response_util_1 = require("../../common/utils/response.util");
let BookingService = class BookingService {
    bookingRepo;
    tripRepo;
    vehicleRepo;
    seatRepo;
    offerService;
    constructor(bookingRepo, tripRepo, vehicleRepo, seatRepo, offerService) {
        this.bookingRepo = bookingRepo;
        this.tripRepo = tripRepo;
        this.vehicleRepo = vehicleRepo;
        this.seatRepo = seatRepo;
        this.offerService = offerService;
    }
    create(dto) {
        const trip = this.tripRepo.findById(dto.tripId);
        if (!trip)
            throw new common_1.NotFoundException(`Trip ${dto.tripId} not found`);
        if (trip.tripStatus === trip_status_enum_1.TripStatus.CANCELLED)
            throw new common_1.BadRequestException('Cannot book a cancelled trip');
        if (trip.tripStatus === trip_status_enum_1.TripStatus.COMPLETED)
            throw new common_1.BadRequestException('Cannot book a completed trip');
        const vehicle = this.vehicleRepo.findById(trip.vehicleId);
        if (!vehicle || vehicle.remainingSeats <= 0)
            throw new common_1.BadRequestException('No seats available for this trip');
        if (this.bookingRepo.isSeatTaken(dto.tripId, dto.seatNumber))
            throw new common_1.ConflictException(`Seat ${dto.seatNumber} is already booked for this trip`);
        const seat = this.seatRepo.findSeat(trip.vehicleId, dto.seatNumber);
        if (!seat)
            throw new common_1.NotFoundException(`Seat ${dto.seatNumber} not found in this vehicle`);
        if (!this.seatRepo.isSeatAvailable(trip.vehicleId, dto.seatNumber))
            throw new common_1.ConflictException(`Seat ${dto.seatNumber} is not available`);
        let offerId;
        if (dto.offerCode) {
            const applied = this.offerService.validateAndApply(dto.offerCode, 0);
            offerId = applied.offerId;
        }
        const booking = this.bookingRepo.create({
            customerId: dto.customerId,
            tripId: dto.tripId,
            seatNumber: dto.seatNumber,
            offerId,
            irctcId: dto.irctcId,
        });
        this.seatRepo.updateStatus(trip.vehicleId, dto.seatNumber, seat_status_enum_1.SeatStatus.BOOKED);
        this.vehicleRepo.decrementSeat(trip.vehicleId);
        return (0, response_util_1.successResponse)('Booking created. Proceed to payment to confirm.', booking);
    }
    findAll(status) {
        if (status)
            return (0, response_util_1.successResponse)('Bookings by status', this.bookingRepo.findByStatus(status));
        return (0, response_util_1.successResponse)('All bookings', this.bookingRepo.findAll());
    }
    findById(id) {
        const b = this.bookingRepo.findById(id);
        if (!b)
            throw new common_1.NotFoundException(`Booking ${id} not found`);
        return (0, response_util_1.successResponse)('Booking retrieved', b);
    }
    findByCustomer(customerId) {
        return (0, response_util_1.successResponse)('Customer bookings', this.bookingRepo.findByCustomer(customerId));
    }
    confirm(bookingId) {
        const booking = this.bookingRepo.findById(bookingId);
        if (!booking)
            throw new common_1.NotFoundException(`Booking ${bookingId} not found`);
        if (booking.bookingStatus !== booking_status_enum_1.BookingStatus.PENDING)
            throw new common_1.BadRequestException('Only PENDING bookings can be confirmed');
        const updated = this.bookingRepo.update(bookingId, { bookingStatus: booking_status_enum_1.BookingStatus.CONFIRMED });
        return (0, response_util_1.successResponse)('Booking confirmed', updated);
    }
    cancel(bookingId) {
        const booking = this.bookingRepo.findById(bookingId);
        if (!booking)
            throw new common_1.NotFoundException(`Booking ${bookingId} not found`);
        if (booking.bookingStatus !== booking_status_enum_1.BookingStatus.CONFIRMED)
            throw new common_1.BadRequestException('Only CONFIRMED bookings can be cancelled');
        const trip = this.tripRepo.findById(booking.tripId);
        if (trip) {
            this.seatRepo.updateStatus(trip.vehicleId, booking.seatNumber, seat_status_enum_1.SeatStatus.AVAILABLE);
            this.vehicleRepo.incrementSeat(trip.vehicleId);
        }
        const updated = this.bookingRepo.update(bookingId, { bookingStatus: booking_status_enum_1.BookingStatus.CANCELLED });
        return (0, response_util_1.successResponse)('Booking cancelled. Refund request created.', updated);
    }
};
exports.BookingService = BookingService;
exports.BookingService = BookingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [booking_repository_1.BookingRepository,
        trip_repository_1.TripRepository,
        vehicle_repository_1.VehicleRepository,
        seat_repository_1.SeatRepository,
        offer_service_1.OfferService])
], BookingService);
//# sourceMappingURL=booking.service.js.map