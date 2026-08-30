import { Injectable, NotFoundException } from '@nestjs/common';
import { SupportTicketRepository } from './support-ticket.repository';
import { LedgerService } from '../ledger/ledger.service';
import { RevenueSplitService } from '../revenue-split/revenue-split.service';
import { SupportRepository } from '../support/support.repository';
import { CreateSupportTicketDto } from './dto/support-ticket.dto';
import { TicketCategory } from './enums/ticket-category.enum';
import { successResponse } from '../../common/utils/response.util';

@Injectable()
export class SupportTicketService {
  constructor(
    private readonly repo: SupportTicketRepository,
    private readonly ledgerService: LedgerService,
    private readonly revenueSplitService: RevenueSplitService,
    private readonly supportRepo: SupportRepository,
  ) {}

  create(dto: CreateSupportTicketDto) {
    if (dto.agentId && !this.supportRepo.findById(dto.agentId)) {
      throw new NotFoundException(`Support agent ${dto.agentId} not found`);
    }

    const config = this.revenueSplitService.getActiveConfig();
    const costApplied = dto.category === TicketCategory.SOS
      ? 0
      : (config.supportCostWeights[dto.category] ?? 0);

    const ticket = this.repo.create({
      bookingId: dto.bookingId,
      category: dto.category,
      costApplied,
      sourceModule: dto.sourceModule,
      agentId: dto.agentId,
    });

    this.ledgerService.applySupportCost(dto.bookingId, costApplied);

    return successResponse('Support ticket created', ticket);
  }

  findByBooking(bookingId: string) {
    return successResponse('Support tickets for booking', this.repo.findByBooking(bookingId));
  }

  findAll(status?: 'open' | 'resolved', category?: TicketCategory) {
    let tickets = this.repo.findAll();
    if (status) tickets = tickets.filter((t) => t.status === status);
    if (category) tickets = tickets.filter((t) => t.category === category);
    return successResponse('Support tickets', tickets);
  }

  resolve(ticketId: string) {
    const ticket = this.repo.findById(ticketId);
    if (!ticket) throw new NotFoundException(`Support ticket ${ticketId} not found`);
    return successResponse('Support ticket resolved', this.repo.update(ticketId, { status: 'resolved' }));
  }
}
