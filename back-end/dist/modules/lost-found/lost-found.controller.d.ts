import { LostFoundService } from './lost-found.service';
import { CreateLostFoundItemDto, UpdateLostFoundStatusDto } from './dto/lost-found.dto';
export declare class LostFoundController {
    private readonly lostFoundService;
    constructor(lostFoundService: LostFoundService);
    create(dto: CreateLostFoundItemDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/lost-found.interface").LostFoundItem>;
    findAll(): import("../../common/utils/response.util").ApiResponse<import("./interfaces/lost-found.interface").LostFoundItem[]>;
    findByProvider(providerId: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/lost-found.interface").LostFoundItem[]>;
    findByCustomer(customerId: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/lost-found.interface").LostFoundItem[]>;
    findOne(id: string, role?: string, customerId?: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/lost-found.interface").LostFoundItem>;
    updateStatus(id: string, dto: UpdateLostFoundStatusDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/lost-found.interface").LostFoundItem>;
}
