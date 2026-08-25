import { LostFoundRepository } from './lost-found.repository';
import { BookingRepository } from '../booking/booking.repository';
import { TripRepository } from '../trip/trip.repository';
import { VehicleRepository } from '../vehicle/vehicle.repository';
import { CreateLostFoundItemDto, UpdateLostFoundStatusDto } from './dto/lost-found.dto';
export declare class LostFoundService {
    private readonly lostFoundRepo;
    private readonly bookingRepo;
    private readonly tripRepo;
    private readonly vehicleRepo;
    constructor(lostFoundRepo: LostFoundRepository, bookingRepo: BookingRepository, tripRepo: TripRepository, vehicleRepo: VehicleRepository);
    create(dto: CreateLostFoundItemDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/lost-found.interface").LostFoundItem>;
    findAll(): import("../../common/utils/response.util").ApiResponse<import("./interfaces/lost-found.interface").LostFoundItem[]>;
    findByCustomer(customerId: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/lost-found.interface").LostFoundItem[]>;
    findByProvider(providerId: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/lost-found.interface").LostFoundItem[]>;
    findById(id: string, role?: string, customerId?: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/lost-found.interface").LostFoundItem>;
    updateStatus(id: string, dto: UpdateLostFoundStatusDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/lost-found.interface").LostFoundItem>;
}
