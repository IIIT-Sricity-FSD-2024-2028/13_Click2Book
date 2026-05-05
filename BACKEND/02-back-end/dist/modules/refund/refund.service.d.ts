import { RefundRepository } from './refund.repository';
import { CancellationRepository } from '../cancellation/cancellation.repository';
import { PaymentService } from '../payment/payment.service';
import { CreateRefundDto, ProcessRefundDto } from './dto/refund.dto';
import { RefundStatus } from './enums/refund-status.enum';
export declare class RefundService {
    private readonly refundRepo;
    private readonly cancellationRepo;
    private readonly paymentService;
    constructor(refundRepo: RefundRepository, cancellationRepo: CancellationRepository, paymentService: PaymentService);
    request(dto: CreateRefundDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/refund.interface").Refund>;
    findAll(status?: RefundStatus): import("../../common/utils/response.util").ApiResponse<import("./interfaces/refund.interface").Refund[]>;
    findByBooking(bookingId: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/refund.interface").Refund>;
    process(bookingId: string, dto: ProcessRefundDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/refund.interface").Refund>;
}
