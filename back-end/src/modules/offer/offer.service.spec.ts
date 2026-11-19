import { BadRequestException, ConflictException } from '@nestjs/common';
import { OfferRepository } from './offer.repository';
import { OfferService } from './offer.service';
import { OfferStatus } from './enums/offer-status.enum';

describe('OfferService coupon workflow', () => {
  let repository: OfferRepository;
  let service: OfferService;

  beforeEach(() => {
    repository = new OfferRepository();
    service = new OfferService(repository);
  });

  it('creates normalized coupons and rejects duplicate codes case-insensitively', () => {
    const created = service.create({
      offerCode: '  SAVE25 ',
      flatDiscount: 100,
      startDate: '2026-01-01',
      endDate: '2027-01-01',
    }).data!;

    expect(repository.findAll().filter((offer) => offer.offerId === created.offerId))
      .toHaveLength(1);
    expect(created.offerId).not.toBe('O004');

    expect(() =>
      service.create({
        offerCode: 'save25',
        discountPercentage: 10,
        startDate: '2026-01-01',
        endDate: '2027-01-01',
      }),
    ).toThrow(ConflictException);
  });

  it('rejects invalid discount combinations and date ranges', () => {
    expect(() =>
      service.create({
        offerCode: 'BADCOMBO',
        flatDiscount: 25,
        discountPercentage: 10,
        startDate: '2026-01-01',
        endDate: '2027-01-01',
      }),
    ).toThrow(BadRequestException);

    expect(() =>
      service.create({
        offerCode: 'BADDATE',
        discountPercentage: 10,
        startDate: '2027-01-01',
        endDate: '2026-01-01',
      }),
    ).toThrow(BadRequestException);
  });

  it('calculates caps, minimum fare and successful per-customer usage limits', () => {
    const created = service.create({
      offerCode: 'LIMITED',
      discountPercentage: 50,
      minFare: 200,
      maxDiscount: 100,
      maxUsage: 1,
      maxUsagePerCustomer: 1,
      startDate: '2026-01-01',
      endDate: '2027-01-01',
    }).data!;

    expect(
      service.validateAndApply('LIMITED', 500, 'C001').discountAmount,
    ).toBe(100);
    expect(() => service.validateAndApply('LIMITED', 100, 'C001')).toThrow(
      BadRequestException,
    );
    service.recordRedemption(created.offerId, 'B900', 'C001', 100, 500);
    expect(() => service.validateAndApply('LIMITED', 500, 'C001')).toThrow(
      BadRequestException,
    );
  });

  it('counts redemptions idempotently and archives instead of deleting coupons', () => {
    const created = service.create({
      offerCode: 'ARCHIVE',
      flatDiscount: 25,
      startDate: '2026-01-01',
      endDate: '2027-01-01',
    }).data!;
    service.recordRedemption(created.offerId, 'B901', 'C001', 25, 100);
    service.recordRedemption(created.offerId, 'B901', 'C001', 25, 100);

    expect(repository.findRedemptions(created.offerId)).toHaveLength(1);
    service.remove(created.offerId);
    expect(repository.findById(created.offerId)?.status).toBe(
      OfferStatus.INACTIVE,
    );
    expect(repository.findRedemptions(created.offerId)).toHaveLength(1);
  });

  it('updates and persists coupon status, including idempotent and expired transitions', () => {
    const created = service.create({
      offerCode: 'STATUS',
      flatDiscount: 25,
      startDate: '2026-01-01',
      endDate: '2027-01-01',
    }).data!;

    expect(service.update(created.offerId, { status: OfferStatus.INACTIVE }).data?.status)
      .toBe(OfferStatus.INACTIVE);
    expect(service.update(created.offerId, { status: OfferStatus.INACTIVE }).data?.status)
      .toBe(OfferStatus.INACTIVE);
    expect(repository.findById(created.offerId)?.status).toBe(OfferStatus.INACTIVE);
    expect(service.update(created.offerId, { status: OfferStatus.ACTIVE }).data?.status)
      .toBe(OfferStatus.ACTIVE);
    expect(service.update(created.offerId, { status: OfferStatus.ACTIVE }).data?.status)
      .toBe(OfferStatus.ACTIVE);

    const expired = service.create({
      offerCode: 'EXPIRED',
      flatDiscount: 25,
      startDate: '2000-01-01',
      endDate: '2000-12-31',
    }).data!;
    expect(() => service.update(expired.offerId, { status: OfferStatus.ACTIVE }))
      .toThrow(BadRequestException);
    expect(() => service.validateAndApply('EXPIRED', 100)).toThrow(BadRequestException);
  });

  it('supports creating, editing, reading, and archiving an unused coupon', () => {
    const created = service.create({
      offerCode: 'CRUDTEST',
      description: 'Original',
      flatDiscount: 25,
      maxUsage: 2,
      startDate: '2026-01-01',
      endDate: '2027-01-01',
    }).data!;
    const edited = service.update(created.offerId, {
      description: 'Updated',
      flatDiscount: 40,
      maxUsage: 3,
      endDate: '2028-01-01',
    }).data!;

    expect(service.findById(created.offerId).data).toMatchObject({
      offerCode: 'CRUDTEST',
      description: 'Updated',
      flatDiscount: 40,
      maxUsage: 3,
      endDate: '2028-01-01',
    });
    expect(edited.offerId).toBe(created.offerId);
    service.remove(created.offerId);
    expect(() => service.validateAndApply('CRUDTEST', 100)).toThrow(BadRequestException);
  });

  it('retains the original coupon details and analytics after archiving a used coupon', () => {
    const created = service.create({
      offerCode: 'USEDARCHIVE',
      flatDiscount: 25,
      startDate: '2026-01-01',
      endDate: '2027-01-01',
    }).data!;
    service.recordRedemption(created.offerId, 'B902', 'C001', 25, 100);
    service.remove(created.offerId);

    expect(repository.findById(created.offerId)).toMatchObject({
      offerId: created.offerId,
      offerCode: 'USEDARCHIVE',
      status: OfferStatus.INACTIVE,
    });
    expect(repository.findRedemptions(created.offerId)).toHaveLength(1);
    expect(service.analytics().data?.summary.totalRedemptions).toBe(1);
    expect(service.analytics().data?.summary.totalDiscount).toBe(25);
  });
});
