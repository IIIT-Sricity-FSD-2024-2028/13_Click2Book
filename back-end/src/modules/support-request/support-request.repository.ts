import { Injectable } from '@nestjs/common';
import { SupportRequest } from './interfaces/support-request.interface';
import { SupportStatus } from './enums/support-status.enum';
import { generateId } from '../../common/utils/id.util';

@Injectable()
export class SupportRequestRepository {
  private requests: SupportRequest[] = [
    {
      requestId: 'SR001',
      customerId: 'C001',
      customerName: 'Rahul Verma',
      bookingId: 'B001',
      supporterId: 'SUP001',
      category: 'cancellation',
      priority: 'Medium',
      description: 'Unable to cancel booking B001.',
      status: SupportStatus.RESOLVED,
      createdDate: '2026-05-01',
      resolution: 'Cancellation unlocked and refund initiated to source account.',
      resolvedBy: 'Support Agent (Deepika)',
      resolvedAt: '2026-05-02T10:00:00.000Z',
    },
    {
      requestId: 'SR002',
      customerId: 'C002',
      customerName: 'Priya Sharma',
      bookingId: 'B002',
      supporterId: 'SUP001',
      category: 'booking',
      priority: 'High',
      description: 'Payment deducted but booking not confirmed.',
      status: SupportStatus.OPEN,
      createdDate: '2026-05-02',
    },
    {
      requestId: 'SR003',
      customerId: 'C003',
      customerName: 'Ravi Teja',
      bookingId: 'B003',
      supporterId: 'SUP001',
      category: 'refund',
      priority: 'High',
      description: 'Refund not received after 7 days.',
      status: SupportStatus.IN_PROGRESS,
      createdDate: '2026-05-03',
    },
  ];

  create(data: Partial<SupportRequest>): SupportRequest {
    const req: SupportRequest = {
      requestId: data.requestId || generateId('SR'),
      customerId: data.customerId || 'C001',
      customerName: data.customerName || 'Customer',
      supporterId: data.supporterId || 'SUP001',
      description: data.description || '',
      category: data.category || 'Booking Issue',
      priority: data.priority || 'Medium',
      status: (data.status as SupportStatus) || SupportStatus.OPEN,
      createdDate: data.createdDate || (data as any).createdAt || new Date().toISOString().split('T')[0],
      bookingId: data.bookingId,
      resolution: data.resolution || '',
      resolvedAt: data.resolvedAt,
      resolvedBy: data.resolvedBy,
    };
    this.requests.unshift(req);
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
