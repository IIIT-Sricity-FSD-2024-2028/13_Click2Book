import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ProviderRepository } from './provider.repository';
import { VehicleRepository } from '../vehicle/vehicle.repository';
import { ScheduleRepository } from '../schedule/schedule.repository';
import { LedgerRepository } from '../ledger/ledger.repository';
import { CreateProviderDto, UpdateProviderDto } from './dto/provider.dto';
import { successResponse } from '../../common/utils/response.util';
import { PlatformService } from '../platform/platform.service';

@Injectable()
export class ProviderService {
  constructor(
    private readonly providerRepo: ProviderRepository,
    private readonly vehicleRepo: VehicleRepository,
    private readonly scheduleRepo: ScheduleRepository,
    @Inject(forwardRef(() => LedgerRepository))
    private readonly ledgerRepo: LedgerRepository,
    private readonly platform: PlatformService,
  ) {}

  create(dto: CreateProviderDto) {
    const { security } = this.platform.get();
    if (security.maintenanceMode || !security.allowProviderRegistration)
      throw new ForbiddenException(
        'New provider registrations are currently disabled',
      );
    if (this.providerRepo.findByEmail(dto.email))
      throw new ConflictException('Provider email already exists');
    const documents = (
      [
        ['Operator Licence', dto.licenseNumber],
        ['Stage Carriage Permit', dto.permitNumber],
        ['GST Registration', dto.gstNumber],
      ] as [string, string | undefined][]
    )
      .filter(([, n]) => !!n)
      .map(([type, number]) => ({
        type,
        number: String(number),
        status: 'SUBMITTED' as const,
      }));
    const { password, ...created } = this.providerRepo.create({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      documents,
    });
    return successResponse(
      'Provider registered (awaiting admin approval)',
      created,
    );
  }

  // Never send passwords to the client.
  findAll() {
    return successResponse(
      'All providers',
      this.providerRepo.findAll().map(({ password, ...p }) => p),
    );
  }

  findById(id: string) {
    const p = this.providerRepo.findById(id);
    if (!p) throw new NotFoundException(`Provider ${id} not found`);
    const { password, ...rest } = p;
    return successResponse('Provider retrieved', rest);
  }

  update(id: string, dto: UpdateProviderDto) {
    if (!this.providerRepo.findById(id))
      throw new NotFoundException(`Provider ${id} not found`);
    const patch = dto.name ? { name: dto.name.trim() } : {};
    const { password, ...rest } = this.providerRepo.update(id, patch)!;
    return successResponse('Provider updated', rest);
  }

  changePassword(id: string, currentPassword: string, newPassword: string) {
    const p = this.providerRepo.findById(id);
    if (!p) throw new NotFoundException(`Provider ${id} not found`);
    if (p.password !== currentPassword)
      throw new BadRequestException('Current password is incorrect');
    if (currentPassword === newPassword)
      throw new BadRequestException(
        'New password must be different from the current one',
      );
    this.providerRepo.update(id, { password: newPassword });
    return successResponse('Password changed');
  }

  /**
   * The operator submits (or corrects) its compliance document numbers. Changed
   * documents go back to SUBMITTED for the Super Admin to verify again.
   */
  submitDocuments(
    id: string,
    dto: { licenseNumber?: string; permitNumber?: string; gstNumber?: string },
  ) {
    const p = this.providerRepo.findById(id);
    if (!p) throw new NotFoundException(`Provider ${id} not found`);
    const incoming: [string, string | undefined][] = [
      ['Operator Licence', dto.licenseNumber],
      ['Stage Carriage Permit', dto.permitNumber],
      ['GST Registration', dto.gstNumber],
    ];
    const docs = [...(p.documents ?? [])];
    for (const [type, raw] of incoming) {
      const number = raw?.trim();
      if (!number) continue;
      const i = docs.findIndex((d) => d.type === type);
      if (i === -1) docs.push({ type, number, status: 'SUBMITTED' });
      else if (docs[i].number !== number)
        docs[i] = { type, number, status: 'SUBMITTED' };
    }
    if (docs.length === 0)
      throw new BadRequestException('Enter at least one document number');
    const verificationStatus = docs.some((d) => d.status === 'REJECTED')
      ? 'REJECTED'
      : docs.every((d) => d.status === 'VERIFIED')
        ? 'VERIFIED'
        : 'PENDING';
    const { password, ...rest } = this.providerRepo.update(id, {
      documents: docs,
      verificationStatus,
    })!;
    return successResponse('Documents submitted for verification', rest);
  }

  approve(id: string) {
    const p = this.providerRepo.findById(id);
    if (!p) throw new NotFoundException(`Provider ${id} not found`);
    // Documents must be verified before an operator can go live.
    if (p.verificationStatus !== 'VERIFIED')
      throw new BadRequestException(
        `Verify ${p.name}'s documents before approving`,
      );
    const { password, ...rest } = this.providerRepo.update(id, {
      approved: true,
      rejectionReason: undefined,
      suspensionReason: undefined,
    })!;
    return successResponse('Provider approved', rest);
  }

  /** Verify or reject one submitted document; the overall status is derived from all of them. */
  reviewDocument(
    id: string,
    index: number,
    status: 'VERIFIED' | 'REJECTED',
    note?: string,
  ) {
    const p = this.providerRepo.findById(id);
    if (!p) throw new NotFoundException(`Provider ${id} not found`);
    const docs = [...(p.documents ?? [])];
    if (!Number.isInteger(index) || index < 0 || index >= docs.length)
      throw new NotFoundException(`Document ${index} not found`);
    docs[index] = {
      ...docs[index],
      status,
      note,
      reviewedAt: new Date().toISOString(),
    };
    const verificationStatus = docs.some((d) => d.status === 'REJECTED')
      ? 'REJECTED'
      : docs.every((d) => d.status === 'VERIFIED')
        ? 'VERIFIED'
        : 'PENDING';
    // A rejected document takes the operator offline.
    const { password, ...rest } = this.providerRepo.update(id, {
      documents: docs,
      verificationStatus,
      ...(verificationStatus === 'REJECTED' ? { approved: false } : {}),
    })!;
    return successResponse(`Document ${status.toLowerCase()}`, rest);
  }

  reject(id: string, reason?: string) {
    if (!this.providerRepo.findById(id))
      throw new NotFoundException(`Provider ${id} not found`);
    const { password, ...rest } = this.providerRepo.update(id, {
      approved: false,
      verificationStatus: 'REJECTED',
      rejectionReason: reason || 'Application rejected',
    })!;
    return successResponse('Provider rejected', rest);
  }

  /** Revoke approval: the provider's buses stop appearing in search and cannot be booked. */
  suspend(id: string, reason?: string) {
    if (!this.providerRepo.findById(id))
      throw new NotFoundException(`Provider ${id} not found`);
    const { password, ...rest } = this.providerRepo.update(id, {
      approved: false,
      suspensionReason: reason || 'Policy violation',
    })!;
    return successResponse('Provider suspended', rest);
  }

  remove(id: string) {
    if (!this.providerRepo.findById(id))
      throw new NotFoundException(`Provider ${id} not found`);
    this.providerRepo.remove(id);
    return successResponse('Provider removed');
  }

  getDashboard(providerId: string) {
    const provider = this.providerRepo.findById(providerId);
    if (!provider)
      throw new NotFoundException(`Provider ${providerId} not found`);
    const vehicles = this.vehicleRepo.findByProvider(providerId);
    const schedules = this.scheduleRepo.findByProvider(providerId);
    const totalSeats = vehicles.reduce((s, v) => s + v.totalSeats, 0);
    // One ledger row per booked seat; cancelled bookings no longer hold a seat.
    const bookedSeats = this.ledgerRepo
      .findAll()
      .filter((l) => l.providerId === providerId && l.status !== 'cancelled').length;
    return successResponse('Provider dashboard', {
      provider: provider.name,
      totalVehicles: vehicles.length,
      totalSchedules: schedules.length,
      totalSeats,
      bookedSeats,
      availableSeats: totalSeats - bookedSeats,
    });
  }

  // TransactionLedger.providerId is the authoritative link (resolved once, at ledger
  // creation, from Trip -> Schedule -> providerId) — filter directly on it rather than
  // re-deriving via vehicles/trips/bookings.
  getRevenue(providerId: string) {
    const provider = this.providerRepo.findById(providerId);
    if (!provider)
      throw new NotFoundException(`Provider ${providerId} not found`);

    const ledger = this.ledgerRepo
      .findAll()
      .filter((l) => l.providerId === providerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const cleanRows = ledger.filter((l) => l.status !== 'cancelled');
    const cancelledCount = ledger.length - cleanRows.length;

    return successResponse('Provider revenue', {
      providerId,
      bookingCount: ledger.length,
      cancelledCount,
      totalBaseFare: cleanRows.reduce((s, l) => s + l.baseFare, 0),
      totalOperatorPayout: cleanRows.reduce((s, l) => s + l.operatorPayout, 0),
      ledger,
    });
  }
}
