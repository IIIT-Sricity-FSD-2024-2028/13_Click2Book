import { SupportRequest } from './interfaces/support-request.interface';
import { SupportStatus } from './enums/support-status.enum';
export declare class SupportRequestRepository {
    private requests;
    create(data: Omit<SupportRequest, 'requestId' | 'createdDate' | 'status'>): SupportRequest;
    findAll(): SupportRequest[];
    findById(requestId: string): SupportRequest | undefined;
    findByCustomer(customerId: string): SupportRequest[];
    findByStatus(status: SupportStatus): SupportRequest[];
    findBySupporter(supporterId: string): SupportRequest[];
    update(requestId: string, data: Partial<SupportRequest>): SupportRequest | undefined;
}
