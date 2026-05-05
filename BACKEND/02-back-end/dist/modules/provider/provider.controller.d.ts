import { ProviderService } from './provider.service';
import { CreateProviderDto, UpdateProviderDto } from './dto/provider.dto';
export declare class ProviderController {
    private readonly providerService;
    constructor(providerService: ProviderService);
    create(dto: CreateProviderDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/provider.interface").Provider>;
    findAll(): import("../../common/utils/response.util").ApiResponse<import("./interfaces/provider.interface").Provider[]>;
    getDashboard(id: string): import("../../common/utils/response.util").ApiResponse<{
        provider: string;
        totalVehicles: number;
        totalSchedules: number;
        totalSeats: number;
        bookedSeats: number;
        availableSeats: number;
    }>;
    findOne(id: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/provider.interface").Provider>;
    update(id: string, dto: UpdateProviderDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/provider.interface").Provider>;
    approve(id: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/provider.interface").Provider>;
    remove(id: string): import("../../common/utils/response.util").ApiResponse<unknown>;
}
