import { VehicleService } from './vehicle.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';
export declare class VehicleController {
    private readonly vehicleService;
    constructor(vehicleService: VehicleService);
    create(dto: CreateVehicleDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/vehicle.interface").Vehicle>;
    findAll(providerId?: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/vehicle.interface").Vehicle[]>;
    findOne(id: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/vehicle.interface").Vehicle>;
    update(id: string, dto: UpdateVehicleDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/vehicle.interface").Vehicle>;
    remove(id: string): import("../../common/utils/response.util").ApiResponse<unknown>;
}
