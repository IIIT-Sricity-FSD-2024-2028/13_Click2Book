import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SyncService } from '../sync/sync.service';
import { generateId } from '../../common/utils/id.util';
import { LedgerRepository } from '../ledger/ledger.repository';
import { ProviderRepository } from '../provider/provider.repository';
import { AdminRepository } from '../admin/admin.repository';
import { SupportRepository } from '../support/support.repository';
import { SupportTicketRepository } from '../support-ticket/support-ticket.repository';
import { successResponse } from '../../common/utils/response.util';

export type PayoutsGroupBy = 'providerId' | 'adminId' | 'agentId';

/** One transfer of money to a provider, covering every booking that was due at that moment. */
export interface PayoutTransfer {
  transferId: string;
  providerId: string;
  providerName: string;
  amount: number; // paise
  bookingCount: number;
  bookingIds: string[];
  createdAt: string;
}

@Injectable()
export class PayoutsService {
  constructor(
    private readonly ledgerRepo: LedgerRepository,
    private readonly providerRepo: ProviderRepository,
    private readonly adminRepo: AdminRepository,
    private readonly supportRepo: SupportRepository,
    private readonly supportTicketRepo: SupportTicketRepository,
    private readonly syncService: SyncService,
  ) {}

  private transfers: PayoutTransfer[] = [];

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

    // For providers, `total`/`count` are what is still due; already-transferred rows go to paidTotal/paidCount.
    const groups = new Map<string, { total: number; count: number; paidTotal: number; paidCount: number }>();
    for (const row of rows) {
      const key = row[field];
      const g = groups.get(key) || { total: 0, count: 0, paidTotal: 0, paidCount: 0 };
      if (field === 'providerId' && row.payoutStatus === 'paid') {
        g.paidTotal += row.operatorPayout;
        g.paidCount += 1;
      } else {
        g.total += field === 'providerId' ? row.operatorPayout : row.adminNet;
        g.count += 1;
      }
      groups.set(key, g);
    }

    const resolveLabel = field === 'providerId'
      ? (id: string) => this.providerRepo.findById(id)?.name
      : (id: string) => this.adminRepo.findById(id)?.name;

    const result = Array.from(groups.entries())
      .map(([id, g]) => ({ id, label: resolveLabel(id) ?? id, ...g }))
      .sort((a, b) => b.total - a.total);

    return successResponse('Payouts summary', result);
  }

  /** Transfer everything a provider is owed: every non-cancelled booking whose payout is still pending. */
  transfer(providerId: string) {
    const provider = this.providerRepo.findById(providerId);
    if (!provider) throw new NotFoundException(`Provider ${providerId} not found`);

    const due = this.ledgerRepo.findAll()
      .filter((r) => r.providerId === providerId && r.status !== 'cancelled' && r.payoutStatus !== 'paid');
    if (!due.length) throw new BadRequestException(`Nothing is due to ${provider.name}`);

    const now = new Date().toISOString();
    const transfer: PayoutTransfer = {
      transferId: generateId('TRF'),
      providerId,
      providerName: provider.name,
      amount: due.reduce((s, r) => s + r.operatorPayout, 0),
      bookingCount: due.length,
      bookingIds: due.map((r) => r.bookingId),
      createdAt: now,
    };
    this.ledgerRepo.markPaidOut(transfer.bookingIds, transfer.transferId, now);
    this.transfers.unshift(transfer);
    this.syncService.emit('PAYOUT_TRANSFERRED', transfer);
    return successResponse(`Transferred to ${provider.name}`, transfer);
  }

  /** Transfer history, newest first; optionally for one provider. */
  listTransfers(providerId?: string) {
    const rows = providerId ? this.transfers.filter((t) => t.providerId === providerId) : this.transfers;
    return successResponse('Payout transfers', rows);
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
