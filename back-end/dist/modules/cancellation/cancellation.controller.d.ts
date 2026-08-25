import { CancellationService } from './cancellation.service';
import { CreateCancellationDto } from './dto/cancellation.dto';
export declare class CancellationController {
    private readonly cancellationService;
    constructor(cancellationService: CancellationService);
    cancel(dto: CreateCancellationDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/cancellation.interface").Cancellation>;
    findAll(): import("../../common/utils/response.util").ApiResponse<import("./interfaces/cancellation.interface").Cancellation[]>;
    findByBooking(bookingId: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/cancellation.interface").Cancellation | null>;
}
