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
      resolution:
        'Cancellation unlocked and refund initiated to source account.',
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
    {
      requestId: 'TKT001',
      customerId: 'C001',
      customerName: 'Rahul Sharma',
      bookingId: 'B004',
      supporterId: 'SUPPORT001',
      category: 'booking',
      priority: 'High',
      description:
        'Amount ₹1,200 deducted from UPI, but ticket status remained pending on the confirmation page.',
      status: SupportStatus.OPEN,
      createdDate: '2026-10-13',
    },
    {
      requestId: 'TKT002',
      customerId: 'C002',
      customerName: 'Priya Patel',
      bookingId: 'B012',
      supporterId: 'SUPPORT001',
      category: 'refund',
      priority: 'High',
      description:
        'Cancelled trip on Oct 5. Expected refund of ₹1,450 has not reflected in bank account yet.',
      status: SupportStatus.IN_PROGRESS,
      createdDate: '2026-10-12',
    },
    {
      requestId: 'TKT003',
      customerId: 'C003',
      customerName: 'Kiran Kumar',
      bookingId: 'B019',
      supporterId: 'SUPPORT001',
      category: 'complaint',
      priority: 'Medium',
      description:
        'Service #KT-101 departed Bengaluru 2 hours behind schedule without prior SMS alert.',
      status: SupportStatus.RESOLVED,
      createdDate: '2026-10-12',
      resolution:
        'GPS log validated 110-min delay. ₹200 travel voucher credited to passenger wallet.',
      resolvedBy: 'Support Agent (Deepika)',
      resolvedAt: '2026-10-12T16:20:00.000Z',
    },
    {
      requestId: 'TKT004',
      customerId: 'C004',
      customerName: 'Meera Singh',
      bookingId: 'B025',
      supporterId: 'SUPPORT002',
      category: 'cancellation',
      priority: 'High',
      description:
        'Passenger requests emergency cancellation for tonight trip. Seeking full refund waiver approval from operator.',
      status: SupportStatus.IN_PROGRESS,
      createdDate: '2026-10-13',
    },
    {
      requestId: 'TKT005',
      customerId: 'C005',
      customerName: 'Vijay Menon',
      supporterId: 'SUPPORT003',
      category: 'technical',
      priority: 'High',
      description:
        'Payment gateway screen hangs and crashes the application on OTP verification step on Android 14.',
      status: SupportStatus.OPEN,
      createdDate: '2026-10-13',
    },
    {
      requestId: 'TKT006',
      customerId: 'C006',
      customerName: 'Anitha Reddy',
      bookingId: 'B044',
      supporterId: 'SUPPORT001',
      category: 'payment',
      priority: 'High',
      description:
        'Two debits of ₹950 received for a single confirmed seat B3. Immediate refund required.',
      status: SupportStatus.OPEN,
      createdDate: '2026-10-13',
    },
    {
      requestId: 'TKT007',
      customerId: 'C007',
      customerName: 'Suresh Babu',
      bookingId: 'B052',
      supporterId: 'SUPPORT001',
      category: 'cancellation',
      priority: 'Medium',
      description:
        'Customer requested cancellation 40 minutes prior to departure; service provider rejected late cancellation.',
      status: SupportStatus.IN_PROGRESS,
      createdDate: '2026-10-12',
    },
    {
      requestId: 'TKT008',
      customerId: 'C008',
      customerName: 'Deepa Nair',
      bookingId: 'B060',
      supporterId: 'SUPPORT002',
      category: 'complaint',
      priority: 'High',
      description:
        'Booked Scania Luxury AC Sleeper, operator dispatched standard non-AC seated coach. Demands fare difference compensation.',
      status: SupportStatus.IN_PROGRESS,
      createdDate: '2026-10-13',
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
      createdDate:
        data.createdDate ||
        (data as any).createdAt ||
        new Date().toISOString().split('T')[0],
      bookingId: data.bookingId,
      resolution: data.resolution || '',
      resolvedAt: data.resolvedAt,
      resolvedBy: data.resolvedBy,
    };
    this.requests.unshift(req);
    return req;
  }

  findAll(): SupportRequest[] {
    return this.requests;
  }

  findById(requestId: string): SupportRequest | undefined {
    const cleanId = (requestId || '').trim().toLowerCase();
    return this.requests.find(
      (r) =>
        r.requestId.toLowerCase() === cleanId ||
        r.requestId.toLowerCase().replace(/[-_]/g, '') ===
          cleanId.replace(/[-_]/g, ''),
    );
  }

  findByCustomer(customerId: string): SupportRequest[] {
    const cleanCid = (customerId || '').trim().toLowerCase();
    return this.requests.filter(
      (r) =>
        r.customerId.toLowerCase() === cleanCid ||
        cleanCid.includes(r.customerId.toLowerCase()) ||
        r.customerId.toLowerCase().includes(cleanCid),
    );
  }

  findByStatus(status: SupportStatus): SupportRequest[] {
    return this.requests.filter((r) => r.status === status);
  }
  findBySupporter(supporterId: string): SupportRequest[] {
    return this.requests.filter((r) => r.supporterId === supporterId);
  }

  update(
    requestId: string,
    data: Partial<SupportRequest>,
  ): SupportRequest | undefined {
    const cleanId = (requestId || '').trim().toLowerCase();
    const i = this.requests.findIndex(
      (r) =>
        r.requestId.toLowerCase() === cleanId ||
        r.requestId.toLowerCase().replace(/[-_]/g, '') ===
          cleanId.replace(/[-_]/g, ''),
    );
    if (i === -1) return undefined;
    this.requests[i] = { ...this.requests[i], ...data };
    return this.requests[i];
  }
}
