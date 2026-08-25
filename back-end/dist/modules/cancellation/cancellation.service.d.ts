import { CancellationRepository } from './cancellation.repository';
import { BookingService } from '../booking/booking.service';
import { CreateCancellationDto } from './dto/cancellation.dto';
export declare class CancellationService {
    private readonly cancellationRepo;
    private readonly bookingService;
    constructor(cancellationRepo: CancellationRepository, bookingService: BookingService);
    cancel(dto: CreateCancellationDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/cancellation.interface").Cancellation>;
    findAll(): import("../../common/utils/response.util").ApiResponse<import("./interfaces/cancellation.interface").Cancellation[]>;
    findByBooking(bookingId: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/cancellation.interface").Cancellation | null>;
}
