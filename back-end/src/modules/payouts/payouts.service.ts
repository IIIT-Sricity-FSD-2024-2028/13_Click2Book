import { BadRequestException, Injectable } from '@nestjs/common';
import { LedgerRepository } from '../ledger/ledger.repository';
import { ProviderRepository } from '../provider/provider.repository';
import { AdminRepository } from '../admin/admin.repository';
import { SupportRepository } from '../support/support.repository';
import { SupportTicketRepository } from '../support-ticket/support-ticket.repository';
import { successResponse } from '../../common/utils/response.util';

export type PayoutsGroupBy = 'providerId' | 'adminId' | 'agentId';

@Injectable()
export class PayoutsService {
  constructor(
    private readonly ledgerRepo: LedgerRepository,
    private readonly providerRepo: ProviderRepository,
    private readonly adminRepo: AdminRepository,
    private readonly supportRepo: SupportRepository,
    private readonly supportTicketRepo: SupportTicketRepository,
  ) {}

  getSummary(groupBy: string = 'providerId', from?: string, to?: string) {
    if (!['providerId', 'adminId', 'agentId'].includes(groupBy)) {
      throw new BadRequestException(`Invalid groupBy '${groupBy}'. Expected providerId, adminId, or agentId.`);
    }

    if (groupBy === 'agentId') return this.summarizeByAgent(from, to);
    return this.summarizeByLedgerField(groupBy as 'providerId' | 'adminId', from, to);
  }

  private inRange(createdAt: string, from?: string, to?: string): boolean {
    if (from && createdAt < from) return false;
    if (to && createdAt > to) return false;
    return true;
  }

  // providerId totals sum(operatorPayout) over non-cancelled bookings — a cancelled
  // booking's operator was never actually paid for it. adminId totals sum(adminNet)
  // over ALL rows including cancelled ones, since the platform's commission and
  // convenience fee are retained regardless of cancellation (see markCancelled()).
  private summarizeByLedgerField(field: 'providerId' | 'adminId', from?: string, to?: string) {
    const rows = this.ledgerRepo.findAll()
      .filter((r) => this.inRange(r.createdAt, from, to))
      .filter((r) => field === 'adminId' || r.status !== 'cancelled');

    const groups = new Map<string, { total: number; count: number }>();
    for (const row of rows) {
      const key = row[field];
      const g = groups.get(key) || { total: 0, count: 0 };
      g.total += field === 'providerId' ? row.operatorPayout : row.adminNet;
      g.count += 1;
      groups.set(key, g);
    }

    const resolveLabel = field === 'providerId'
      ? (id: string) => this.providerRepo.findById(id)?.name
      : (id: string) => this.adminRepo.findById(id)?.name;

    const result = Array.from(groups.entries())
      .map(([id, g]) => ({ id, label: resolveLabel(id) ?? id, total: g.total, count: g.count }))
      .sort((a, b) => b.total - a.total);

    return successResponse('Payouts summary', result);
  }

  // Unassigned tickets (no agentId) are deliberately excluded from this grouping —
  // they remain visible individually via GET /support-ticket/:bookingId.
  private summarizeByAgent(from?: string, to?: string) {
    const tickets = this.supportTicketRepo.findAll()
      .filter((t) => !!t.agentId)
      .filter((t) => this.inRange(t.createdAt, from, to));

    const groups = new Map<string, { total: number; count: number }>();
    for (const ticket of tickets) {
      const key = ticket.agentId as string;
      const g = groups.get(key) || { total: 0, count: 0 };
      g.total += ticket.costApplied;
      g.count += 1;
      groups.set(key, g);
    }

    const result = Array.from(groups.entries())
      .map(([id, g]) => ({ id, label: this.supportRepo.findById(id)?.name ?? id, total: g.total, count: g.count }))
      .sort((a, b) => b.total - a.total);

    return successResponse('Payouts summary', result);
  }
}
