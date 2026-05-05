"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingRepository = void 0;
const common_1 = require("@nestjs/common");
const booking_status_enum_1 = require("./enums/booking-status.enum");
const id_util_1 = require("../../common/utils/id.util");
let BookingRepository = class BookingRepository {
    bookings = [
        { bookingId: 'B001', customerId: 'C001', tripId: 'T001', seatNumber: 5, bookingDate: '2026-05-01', bookingStatus: booking_status_enum_1.BookingStatus.CONFIRMED },
        { bookingId: 'B002', customerId: 'C002', tripId: 'T001', seatNumber: 6, bookingDate: '2026-05-02', bookingStatus: booking_status_enum_1.BookingStatus.CONFIRMED },
        { bookingId: 'B003', customerId: 'C003', tripId: 'T002', seatNumber: 3, offerId: 'O001', bookingDate: '2026-05-03', bookingStatus: booking_status_enum_1.BookingStatus.CONFIRMED },
    ];
    create(data) {
        const booking = {
            bookingId: (0, id_util_1.generateId)('B'),
            ...data,
            bookingDate: new Date().toISOString().split('T')[0],
            bookingStatus: booking_status_enum_1.BookingStatus.PENDING,
        };
        this.bookings.push(booking);
        return booking;
    }
    findAll() { return this.bookings; }
    findById(bookingId) { return this.bookings.find(b => b.bookingId === bookingId); }
    findByCustomer(customerId) { return this.bookings.filter(b => b.customerId === customerId); }
    findByTrip(tripId) { return this.bookings.filter(b => b.tripId === tripId); }
    findByStatus(status) { return this.bookings.filter(b => b.bookingStatus === status); }
    isSeatTaken(tripId, seatNumber) {
        return this.bookings.some(b => b.tripId === tripId && b.seatNumber === seatNumber &&
            [booking_status_enum_1.BookingStatus.PENDING, booking_status_enum_1.BookingStatus.CONFIRMED].includes(b.bookingStatus));
    }
    update(bookingId, data) {
        const i = this.bookings.findIndex(b => b.bookingId === bookingId);
        if (i === -1)
            return undefined;
        this.bookings[i] = { ...this.bookings[i], ...data };
        return this.bookings[i];
    }
};
exports.BookingRepository = BookingRepository;
exports.BookingRepository = BookingRepository = __decorate([
    (0, common_1.Injectable)()
], BookingRepository);
//# sourceMappingURL=booking.repository.js.map