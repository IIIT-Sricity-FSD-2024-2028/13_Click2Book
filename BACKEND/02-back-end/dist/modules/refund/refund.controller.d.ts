import { RefundService } from './refund.service';
import { CreateRefundDto, ProcessRefundDto } from './dto/refund.dto';
import { RefundStatus } from './enums/refund-status.enum';
export declare class RefundController {
    private readonly refundService;
    constructor(refundService: RefundService);
    request(dto: CreateRefundDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/refund.interface").Refund>;
    findAll(status?: RefundStatus): import("../../common/utils/response.util").ApiResponse<import("./interfaces/refund.interface").Refund[]>;
    findByBooking(bookingId: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/refund.interface").Refund>;
    process(bookingId: string, dto: ProcessRefundDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/refund.interface").Refund>;
}
