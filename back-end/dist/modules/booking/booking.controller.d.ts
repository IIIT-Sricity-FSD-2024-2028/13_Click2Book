import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/booking.dto';
import { BookingStatus } from './enums/booking-status.enum';
export declare class BookingController {
    private readonly bookingService;
    constructor(bookingService: BookingService);
    create(dto: CreateBookingDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/booking.interface").Booking>;
    findAll(status?: BookingStatus): import("../../common/utils/response.util").ApiResponse<import("./interfaces/booking.interface").Booking[]>;
    findByCustomer(customerId: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/booking.interface").Booking[]>;
    findOne(id: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/booking.interface").Booking>;
    confirm(id: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/booking.interface").Booking>;
    cancel(id: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/booking.interface").Booking>;
}
