import { ProviderRepository } from './provider.repository';
import { VehicleRepository } from '../vehicle/vehicle.repository';
import { ScheduleRepository } from '../schedule/schedule.repository';
import { CreateProviderDto, UpdateProviderDto } from './dto/provider.dto';
export declare class ProviderService {
    private readonly providerRepo;
    private readonly vehicleRepo;
    private readonly scheduleRepo;
    constructor(providerRepo: ProviderRepository, vehicleRepo: VehicleRepository, scheduleRepo: ScheduleRepository);
    create(dto: CreateProviderDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/provider.interface").Provider>;
    findAll(): import("../../common/utils/response.util").ApiResponse<import("./interfaces/provider.interface").Provider[]>;
    findById(id: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/provider.interface").Provider>;
    update(id: string, dto: UpdateProviderDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/provider.interface").Provider>;
    approve(id: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/provider.interface").Provider>;
    remove(id: string): import("../../common/utils/response.util").ApiResponse<unknown>;
    getDashboard(providerId: string): import("../../common/utils/response.util").ApiResponse<{
        provider: string;
        totalVehicles: number;
        totalSchedules: number;
        totalSeats: number;
        bookedSeats: number;
        availableSeats: number;
    }>;
}
