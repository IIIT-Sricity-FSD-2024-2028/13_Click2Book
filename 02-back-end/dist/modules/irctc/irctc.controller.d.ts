import { IrctcService } from './irctc.service';
import { CreateIrctcDto, UpdateIrctcStatusDto } from './dto/irctc.dto';
export declare class IrctcController {
    private readonly irctcService;
    constructor(irctcService: IrctcService);
    verify(dto: CreateIrctcDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/irctc.interface").Irctc>;
    findAll(): import("../../common/utils/response.util").ApiResponse<import("./interfaces/irctc.interface").Irctc[]>;
    findOne(id: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/irctc.interface").Irctc>;
    updateStatus(id: string, dto: UpdateIrctcStatusDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/irctc.interface").Irctc>;
}
