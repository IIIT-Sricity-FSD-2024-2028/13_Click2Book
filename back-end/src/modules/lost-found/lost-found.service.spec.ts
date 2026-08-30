import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { LostFoundService } from './lost-found.service';
import { LostFoundRepository } from './lost-found.repository';
import { BookingRepository } from '../booking/booking.repository';
import { TripRepository } from '../trip/trip.repository';
import { VehicleRepository } from '../vehicle/vehicle.repository';
import { ScheduleRepository } from '../schedule/schedule.repository';
import { LedgerRepository } from '../ledger/ledger.repository';
import { LedgerService } from '../ledger/ledger.service';
import { ProviderRepository } from '../provider/provider.repository';
import { AdminRepository } from '../admin/admin.repository';
import { RevenueSplitRepository } from '../revenue-split/revenue-split.repository';
import { RevenueSplitService } from '../revenue-split/revenue-split.service';
import { SupportTicketRepository } from '../support-ticket/support-ticket.repository';
import { SupportTicketService } from '../support-ticket/support-ticket.service';
import { SupportRepository } from '../support/support.repository';
import { LostFoundStatus } from './enums/lost-found-status.enum';
import { Role } from '../../common/enums/role.enum';

describe('LostFoundService', () => {
  let service: LostFoundService;

  const validDto = {
    tripId: 'T001',
    bookingId: 'B001',
    customerId: 'C001',
    itemDescription: 'Black backpack left near seat 5',
    dateLost: '2026-06-01',
    contactPhone: '9876543210',
  };

  beforeEach(() => {
    const revenueSplitService = new RevenueSplitService(new RevenueSplitRepository());
    const ledgerService = new LedgerService(
      new LedgerRepository(), new TripRepository(), new ScheduleRepository(), new ProviderRepository(), new AdminRepository(), revenueSplitService,
    );
    const supportTicketService = new SupportTicketService(
      new SupportTicketRepository(), ledgerService, revenueSplitService, new SupportRepository(),
    );
    service = new LostFoundService(
      new LostFoundRepository(),
      new BookingRepository(),
      new TripRepository(),
      new VehicleRepository(),
      supportTicketService,
    );
  });

  it('rejects a report from someone who does not own the booking', () => {
    expect(() => service.create({ ...validDto, customerId: 'C999' })).toThrow(ForbiddenException);
  });

  it('rejects a report whose trip does not match the booking', () => {
    expect(() => service.create({ ...validDto, tripId: 'T999' })).toThrow(BadRequestException);
  });

  it('accepts a valid report and returns it REPORTED', () => {
    const result = service.create(validDto);
    expect(result.success).toBe(true);
    expect(result.data?.status).toBe(LostFoundStatus.REPORTED);
  });

  it('lets the operating provider see reports on their trips (B001/T001 is on V001, owned by P001)', () => {
    service.create(validDto);
    const result = service.findByProvider('P001');
    expect(result.data?.length).toBe(1);
  });

  it('excludes a report from a provider who did not run that trip', () => {
    service.create(validDto);
    const result = service.findByProvider('P002');
    expect(result.data?.length).toBe(0);
  });

  it('blocks a customer from viewing another customer\'s report', () => {
    const created = service.create(validDto);
    const id = created.data!.itemId;
    expect(() => service.findById(id, Role.CUSTOMER, 'C999')).toThrow(ForbiddenException);
  });

  it('stamps resolvedAt when moved to RETURNED', () => {
    const created = service.create(validDto);
    const id = created.data!.itemId;
    const updated = service.updateStatus(id, { status: LostFoundStatus.RETURNED, foundNote: 'Handed back at depot' });
    expect(updated.data?.status).toBe(LostFoundStatus.RETURNED);
    expect(updated.data?.resolvedAt).toBeDefined();
  });

  it('404s when updating a report that does not exist', () => {
    expect(() => service.updateStatus('LF999', { status: LostFoundStatus.FOUND })).toThrow(NotFoundException);
  });
});
