import { SupportRequestRepository } from './support-request.repository';
import { CreateSupportRequestDto, UpdateSupportRequestDto } from './dto/support-request.dto';
import { SupportStatus } from './enums/support-status.enum';
export declare class SupportRequestService {
    private readonly repo;
    constructor(repo: SupportRequestRepository);
    create(dto: CreateSupportRequestDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/support-request.interface").SupportRequest>;
    findAll(status?: SupportStatus): import("../../common/utils/response.util").ApiResponse<import("./interfaces/support-request.interface").SupportRequest[]>;
    findById(id: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/support-request.interface").SupportRequest>;
    findByCustomer(cid: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/support-request.interface").SupportRequest[]>;
    findBySupporter(sid: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/support-request.interface").SupportRequest[]>;
    update(id: string, dto: UpdateSupportRequestDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/support-request.interface").SupportRequest>;
}
