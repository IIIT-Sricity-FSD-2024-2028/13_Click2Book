import { Injectable } from '@nestjs/common';
import { SupportRequest } from './interfaces/support-request.interface';
import { SupportStatus } from './enums/support-status.enum';
import { generateId } from '../../common/utils/id.util';

@Injectable()
export class SupportRequestRepository {
  private requests: SupportRequest[] = [
    { requestId: 'SR001', customerId: 'C001', supporterId: 'SUP001', description: 'Unable to cancel booking B001.', status: SupportStatus.RESOLVED, createdDate: '2026-05-01' },
    { requestId: 'SR002', customerId: 'C002', description: 'Payment deducted but booking not confirmed.', status: SupportStatus.OPEN, createdDate: '2026-05-02' },
    { requestId: 'SR003', customerId: 'C003', description: 'Refund not received after 7 days.', status: SupportStatus.ESCALATED, createdDate: '2026-05-03' },
  ];

  create(data: Omit<SupportRequest, 'requestId' | 'createdDate' | 'status'>): SupportRequest {
    const req: SupportRequest = { requestId: generateId('SR'), ...data, status: SupportStatus.OPEN, createdDate: new Date().toISOString().split('T')[0] };
    this.requests.push(req);
    return req;
  }

  findAll(): SupportRequest[] { return this.requests; }
  findById(requestId: string): SupportRequest | undefined { return this.requests.find(r => r.requestId === requestId); }
  findByCustomer(customerId: string): SupportRequest[] { return this.requests.filter(r => r.customerId === customerId); }
  findByStatus(status: SupportStatus): SupportRequest[] { return this.requests.filter(r => r.status === status); }
  findBySupporter(supporterId: string): SupportRequest[] { return this.requests.filter(r => r.supporterId === supporterId); }

  update(requestId: string, data: Partial<SupportRequest>): SupportRequest | undefined {
    const i = this.requests.findIndex(r => r.requestId === requestId);
    if (i === -1) return undefined;
    this.requests[i] = { ...this.requests[i], ...data };
    return this.requests[i];
  }
}
