import { BookingRepository } from './booking.repository';
import { TripRepository } from '../trip/trip.repository';
import { VehicleRepository } from '../vehicle/vehicle.repository';
import { SeatRepository } from '../seat/seat.repository';
import { OfferService } from '../offer/offer.service';
import { CreateBookingDto } from './dto/booking.dto';
import { BookingStatus } from './enums/booking-status.enum';
export declare class BookingService {
    private readonly bookingRepo;
    private readonly tripRepo;
    private readonly vehicleRepo;
    private readonly seatRepo;
    private readonly offerService;
    constructor(bookingRepo: BookingRepository, tripRepo: TripRepository, vehicleRepo: VehicleRepository, seatRepo: SeatRepository, offerService: OfferService);
    create(dto: CreateBookingDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/booking.interface").Booking>;
    findAll(status?: BookingStatus): import("../../common/utils/response.util").ApiResponse<import("./interfaces/booking.interface").Booking[]>;
    findById(id: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/booking.interface").Booking>;
    findByCustomer(customerId: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/booking.interface").Booking[]>;
    confirm(bookingId: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/booking.interface").Booking>;
    cancel(bookingId: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/booking.interface").Booking>;
}
