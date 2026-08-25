import { TrackingService } from './tracking.service';
import { UpdateLocationDto } from './dto/tracking.dto';
export declare class TrackingController {
    private readonly trackingService;
    constructor(trackingService: TrackingService);
    update(tripId: string, dto: UpdateLocationDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/tracking.interface").TripLocation>;
    eta(tripId: string): import("../../common/utils/response.util").ApiResponse<{
        tripId: string;
        distanceKm: number;
        etaMinutes: number;
        etaTime: string;
        percentComplete: number;
    }>;
    get(tripId: string, role?: string, customerId?: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/tracking.interface").TripLocation>;
}
