import { IrctcRepository } from './irctc.repository';
import { CreateIrctcDto, UpdateIrctcStatusDto } from './dto/irctc.dto';
export declare class IrctcService {
    private readonly irctcRepo;
    constructor(irctcRepo: IrctcRepository);
    verify(dto: CreateIrctcDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/irctc.interface").Irctc>;
    findAll(): import("../../common/utils/response.util").ApiResponse<import("./interfaces/irctc.interface").Irctc[]>;
    findById(id: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/irctc.interface").Irctc>;
    updateStatus(id: string, dto: UpdateIrctcStatusDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/irctc.interface").Irctc>;
}
