import { Injectable, NotFoundException } from '@nestjs/common';
import { SupportRequestRepository } from './support-request.repository';
import { SupportTicketService } from '../support-ticket/support-ticket.service';
import { TicketCategory } from '../support-ticket/enums/ticket-category.enum';
import { CreateSupportRequestDto, UpdateSupportRequestDto } from './dto/support-request.dto';
import { SupportStatus } from './enums/support-status.enum';
import { successResponse } from '../../common/utils/response.util';

@Injectable()
export class SupportRequestService {
  constructor(
    private readonly repo: SupportRequestRepository,
    private readonly supportTicketService: SupportTicketService,
  ) {}

  create(dto: CreateSupportRequestDto) {
    const request = this.repo.create(dto);

    if (dto.bookingId) {
      try {
        this.supportTicketService.create({
          bookingId: dto.bookingId,
          category: dto.category === 'dispute' ? TicketCategory.DISPUTE : TicketCategory.COMPLAINT,
          sourceModule: 'support-request',
        });
      } catch (err) {
        // Non-blocking: ledger cost ticket creation error should not block customer support request
      }
    }

    return successResponse('Support request raised', request);
  }

  findAll(status?: SupportStatus) {
    if (status) return successResponse('Requests by status', this.repo.findByStatus(status));
    return successResponse('All support requests', this.repo.findAll());
  }

  findById(id: string) {
    const r = this.repo.findById(id);
    if (!r) throw new NotFoundException(`Support request ${id} not found`);
    return successResponse('Support request', r);
  }

  findByCustomer(cid: string) { return successResponse('Customer requests', this.repo.findByCustomer(cid)); }
  findBySupporter(sid: string) { return successResponse('Assigned tickets', this.repo.findBySupporter(sid)); }

  update(id: string, dto: UpdateSupportRequestDto) {
    const existing = this.repo.findById(id);
    if (!existing) throw new NotFoundException(`Support request ${id} not found`);

    const updatePayload: Partial<any> = { ...dto };
    if (dto.status === SupportStatus.RESOLVED) {
      if (!updatePayload.resolvedAt) updatePayload.resolvedAt = new Date().toISOString();
      if (!updatePayload.resolvedBy) updatePayload.resolvedBy = dto.resolvedBy || dto.supporterId || 'Support Agent';
    }

    const updated = this.repo.update(id, updatePayload);

    if (dto.status === SupportStatus.RESOLVED && existing.bookingId) {
      try {
        const ticketRes = this.supportTicketService.findByBooking(existing.bookingId);
        const tickets = Array.isArray(ticketRes?.data) ? ticketRes.data : [];
        tickets.forEach((t: any) => {
          if (t.status === 'open' && t.ticketId) {
            try { this.supportTicketService.resolve(t.ticketId); } catch (_) {}
          }
        });
      } catch (_) {}
    }

    return successResponse('Support request updated', updated);
  }
}
