import { SupportRequestService } from './support-request.service';
import { CreateSupportRequestDto, UpdateSupportRequestDto } from './dto/support-request.dto';
import { SupportStatus } from './enums/support-status.enum';
export declare class SupportRequestController {
    private readonly service;
    constructor(service: SupportRequestService);
    create(dto: CreateSupportRequestDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/support-request.interface").SupportRequest>;
    findAll(status?: SupportStatus): import("../../common/utils/response.util").ApiResponse<import("./interfaces/support-request.interface").SupportRequest[]>;
    findByCustomer(cid: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/support-request.interface").SupportRequest[]>;
    findOne(id: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/support-request.interface").SupportRequest>;
    update(id: string, dto: UpdateSupportRequestDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/support-request.interface").SupportRequest>;
    escalate(id: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/support-request.interface").SupportRequest>;
}
