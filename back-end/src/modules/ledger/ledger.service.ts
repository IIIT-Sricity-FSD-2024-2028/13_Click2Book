import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { LedgerRepository } from './ledger.repository';
import { TripRepository } from '../trip/trip.repository';
import { ScheduleRepository } from '../schedule/schedule.repository';
import { ProviderRepository } from '../provider/provider.repository';
import { AdminRepository } from '../admin/admin.repository';
import { RevenueSplitService } from '../revenue-split/revenue-split.service';
import { toPaise } from './utils/money.util';
import { successResponse } from '../../common/utils/response.util';
import { TransactionLedger } from './interfaces/transaction-ledger.interface';

@Injectable()
export class LedgerService {
  constructor(
    private readonly ledgerRepo: LedgerRepository,
    private readonly tripRepo: TripRepository,
    private readonly scheduleRepo: ScheduleRepository,
    @Inject(forwardRef(() => ProviderRepository))
    private readonly providerRepo: ProviderRepository,
    @Inject(forwardRef(() => AdminRepository))
    private readonly adminRepo: AdminRepository,
    private readonly revenueSplitService: RevenueSplitService,
  ) {}

  // Called from BookingService.create() right after a booking is created.
  // base_fare AND providerId are read from Schedule (via Trip) here — providerId lives
  // on Schedule, not Vehicle — and neither is ever re-read live again.
  createForBooking(bookingId: string, tripId: string): TransactionLedger {
    const trip = this.tripRepo.findById(tripId);
    if (!trip) throw new NotFoundException(`Trip ${tripId} not found`);
    const schedule = this.scheduleRepo.findById(trip.scheduleId);
    if (!schedule) throw new NotFoundException(`Schedule ${trip.scheduleId} not found`);
    // Data-integrity guard: every ledger row must resolve to a real Provider record.
    // A schedule.providerId with no matching Provider is a broken reference — refuse
    // to write a ledger row for it rather than silently persisting bad data.
    const provider = this.providerRepo.findById(schedule.providerId);
    if (!provider) {
      throw new NotFoundException(
        `Provider ${schedule.providerId} (referenced by schedule ${schedule.scheduleId}) does not exist`,
      );
    }

    // adminId: there is no per-request admin identity anywhere in this app today —
    // RolesGuard only ever sees the generic x-role header, never a specific admin's
    // own ID, and bookings are created by CUSTOMER requests where no admin is even
    // involved. With no real chain to resolve from, the platform's primary admin
    // record (AdminRepository's first entry) is used as the "owning admin" for every
    // ledger row — a single-admin-of-record model, consistent with RevenueSplitConfig
    // already being a single global singleton rather than per-admin.
    const [primaryAdmin] = this.adminRepo.findAll();
    if (!primaryAdmin) {
      throw new NotFoundException('No admin record exists to own this ledger row');
    }

    const config = this.revenueSplitService.getActiveConfig();
    const baseFare = toPaise(schedule.fare);
    const platformCommission = Math.round((baseFare * config.commissionPct) / 100);
    const operatorPayout = baseFare - platformCommission;
    const convenienceFee = config.convenienceFeeFlat;
    const platformPool = platformCommission + convenienceFee;
    const gatewayFee = Math.round((baseFare * config.gatewayFeePct) / 100);
    const supportCost = 0;
    const adminNet = platformPool - gatewayFee - supportCost;

    return this.ledgerRepo.create({
      bookingId,
      providerId: provider.providerId,
      adminId: primaryAdmin.adminId,
      baseFare,
      convenienceFee,
      platformCommission,
      operatorPayout,
      gatewayFee,
      supportCost,
      adminNet,
    });
  }

  // Called from CancellationService.cancel(). convenienceFee/baseFare/operatorPayout stay untouched —
  // only status flips and adminNet is recomputed from the (possibly since-updated) supportCost.
  // Bookings that predate the ledger (e.g. seed data never created through BookingService.create())
  // have no ledger row — that is not an error, cancellation simply has nothing to reconcile.
  markCancelled(bookingId: string): TransactionLedger | undefined {
    const ledger = this.ledgerRepo.findByBooking(bookingId);
    if (!ledger) return undefined;
    const platformPool = ledger.platformCommission + ledger.convenienceFee;
    const adminNet = platformPool - ledger.gatewayFee - ledger.supportCost;
    return this.ledgerRepo.update(bookingId, {
      status: 'cancelled',
      adminNet,
      updatedAt: new Date().toISOString(),
    });
  }

  // Called from SupportTicketService.create() whenever a wrapping ticket is raised for a booking.
  // Same no-ledger-is-fine reasoning as markCancelled above.
  applySupportCost(bookingId: string, costPaise: number): TransactionLedger | undefined {
    const ledger = this.ledgerRepo.findByBooking(bookingId);
    if (!ledger) return undefined;
    const supportCost = ledger.supportCost + costPaise;
    const platformPool = ledger.platformCommission + ledger.convenienceFee;
    const adminNet = platformPool - ledger.gatewayFee - supportCost;
    return this.ledgerRepo.update(bookingId, {
      supportCost,
      adminNet,
      updatedAt: new Date().toISOString(),
    });
  }

  findAll(status?: TransactionLedger['status']) {
    const rows = this.ledgerRepo.findAll();
    return successResponse('All ledger rows', status ? rows.filter((r) => r.status === status) : rows);
  }

  getByBooking(bookingId: string) {
    const ledger = this.ledgerRepo.findByBooking(bookingId);
    if (!ledger) throw new NotFoundException(`Ledger for booking ${bookingId} not found`);
    return successResponse('Ledger entry', ledger);
  }

  getSummary(from?: string, to?: string) {
    let rows = this.ledgerRepo.findAll();
    if (from) rows = rows.filter((r) => r.createdAt >= from);
    if (to) rows = rows.filter((r) => r.createdAt <= to);

    const sum = (key: keyof Pick<TransactionLedger,
      'baseFare' | 'operatorPayout' | 'platformCommission' | 'gatewayFee' | 'supportCost' | 'adminNet'>) =>
      rows.reduce((total, r) => total + r[key], 0);

    return successResponse('Ledger summary', {
      count: rows.length,
      baseFare: sum('baseFare'),
      operatorPayout: sum('operatorPayout'),
      platformCommission: sum('platformCommission'),
      gatewayFee: sum('gatewayFee'),
      supportCost: sum('supportCost'),
      adminNet: sum('adminNet'),
    });
  }
}
