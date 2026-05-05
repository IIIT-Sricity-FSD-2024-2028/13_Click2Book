import { VehicleRepository } from './vehicle.repository';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';
export declare class VehicleService {
    private readonly vehicleRepo;
    constructor(vehicleRepo: VehicleRepository);
    create(dto: CreateVehicleDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/vehicle.interface").Vehicle>;
    findAll(): import("../../common/utils/response.util").ApiResponse<import("./interfaces/vehicle.interface").Vehicle[]>;
    findById(id: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/vehicle.interface").Vehicle>;
    findByProvider(providerId: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/vehicle.interface").Vehicle[]>;
    update(id: string, dto: UpdateVehicleDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/vehicle.interface").Vehicle>;
    remove(id: string): import("../../common/utils/response.util").ApiResponse<unknown>;
}
