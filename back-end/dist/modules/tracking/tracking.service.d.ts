import { TrackingRepository } from './tracking.repository';
import { TripRepository } from '../trip/trip.repository';
import { VehicleRepository } from '../vehicle/vehicle.repository';
import { BookingRepository } from '../booking/booking.repository';
import { ScheduleRepository } from '../schedule/schedule.repository';
import { RouteRepository } from '../route/route.repository';
import { UpdateLocationDto } from './dto/tracking.dto';
export declare class TrackingService {
    private readonly trackingRepo;
    private readonly tripRepo;
    private readonly vehicleRepo;
    private readonly bookingRepo;
    private readonly scheduleRepo;
    private readonly routeRepo;
    constructor(trackingRepo: TrackingRepository, tripRepo: TripRepository, vehicleRepo: VehicleRepository, bookingRepo: BookingRepository, scheduleRepo: ScheduleRepository, routeRepo: RouteRepository);
    updateLocation(tripId: string, dto: UpdateLocationDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/tracking.interface").TripLocation>;
    getLocation(tripId: string, role?: string, customerId?: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/tracking.interface").TripLocation>;
    getEta(tripId: string): import("../../common/utils/response.util").ApiResponse<{
        tripId: string;
        distanceKm: number;
        etaMinutes: number;
        etaTime: string;
        percentComplete: number;
    }>;
}
