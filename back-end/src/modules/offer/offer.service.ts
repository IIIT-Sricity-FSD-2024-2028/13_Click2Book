import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { OfferRepository } from './offer.repository';
import { CreateOfferDto, UpdateOfferDto } from './dto/offer.dto';
import { OfferStatus } from './enums/offer-status.enum';
import { Offer } from './interfaces/offer.interface';
import { successResponse } from '../../common/utils/response.util';
import { SyncService } from '../sync/sync.service';
import { TripRepository } from '../trip/trip.repository';
import { ScheduleRepository } from '../schedule/schedule.repository';
import { RouteRepository } from '../route/route.repository';
import { VehicleRepository } from '../vehicle/vehicle.repository';
import { BookingRepository } from '../booking/booking.repository';
import { BookingStatus } from '../booking/enums/booking-status.enum';

const today = () => new Date().toISOString().split('T')[0];
const isForAll = (o: Offer) => !o.providerId || o.providerId.toUpperCase() === 'ALL';
const list = (s?: string) => (s || '').split(',').map((x) => x.trim().toUpperCase()).filter(Boolean);
const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const daysBetween = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / 864e5);

/**
 * What is known about the booking being checked. Any field left out skips the conditions that need it,
 * so the same rules run at checkout (everything known), at booking creation and at payment.
 */
export interface OfferContext {
  fare?: number; // booking total in ₹ (0/undefined skips the minimum-amount check)
  providerId?: string;
  tripId?: string; // gives operator, route, origin city and bus type
  customerId?: string;
  seats?: number;
  journeyDate?: string; // YYYY-MM-DD travel date
  paymentMethod?: string;
  bookingId?: string; // the booking being paid (not counted as a "past booking")
}

@Injectable()
export class OfferService {
  constructor(
    private readonly offerRepo: OfferRepository,
    private readonly syncService: SyncService,
    private readonly moduleRef: ModuleRef,
  ) {}

  // Trip/Booking/… modules import OfferModule, so their repositories are looked up lazily (no module cycle).
  private repo<T>(token: new (...args: any[]) => T): T {
    return this.moduleRef.get(token, { strict: false });
  }

  /** Exactly one kind of discount, dates in order, and consistent day windows. */
  private checkShape(o: Partial<Offer>) {
    if (o.discountPercentage == null && o.flatDiscount == null)
      throw new BadRequestException('Give a discount percentage or a flat discount');
    if (o.startDate && o.endDate && o.endDate < o.startDate)
      throw new BadRequestException('End date must be on or after start date');
    if (o.minDaysAhead != null && o.maxDaysAhead != null && o.minDaysAhead > o.maxDaysAhead)
      throw new BadRequestException('Early-bird days cannot be more than last-minute days');
  }

  /** Normalise text conditions so matching is simple. */
  private clean<T extends Partial<Offer>>(o: T): T {
    const out: any = { ...o };
    if (out.offerCode) out.offerCode = out.offerCode.trim().toUpperCase();
    for (const k of ['validDays', 'paymentMethods']) if (out[k] != null) out[k] = list(out[k]).join(',');
    if (out.vehicleTypes != null) out.vehicleTypes = out.vehicleTypes.split(',').map((s: string) => s.trim()).filter(Boolean).join(',');
    if (out.providerId != null) out.providerId = out.providerId.trim() || 'ALL';
    if (out.originCity != null) out.originCity = out.originCity.trim();
    if (out.routeId != null) out.routeId = out.routeId.trim().toUpperCase();
    return out;
  }

  create(dto: CreateOfferDto) {
    const data = this.clean({ ...dto, providerId: dto.providerId || 'ALL' });
    if (this.offerRepo.findByCode(data.offerCode))
      throw new ConflictException(`Offer code ${data.offerCode} already exists`);
    this.checkShape(data);
    const offer = this.offerRepo.create({ ...data, providerId: data.providerId || 'ALL', status: dto.status ?? OfferStatus.ACTIVE });
    this.syncService.emit('OFFER_UPDATED', { action: 'created', offer });
    return successResponse('Offer created', this.withUsage(offer));
  }

  /** An offer can be used up to and including its endDate; after that an ACTIVE offer becomes EXPIRED. */
  private expireOld() {
    const d = today();
    for (const o of this.offerRepo.findAll()) {
      if (o.status === OfferStatus.ACTIVE && o.endDate < d) {
        this.offerRepo.update(o.offerId, { status: OfferStatus.EXPIRED });
        this.syncService.emit('OFFER_UPDATED', { action: 'expired', offerId: o.offerId });
      }
    }
  }

  /** Offer plus how many times it has been used (shown in Super Admin and to customers as "N left"). */
  private withUsage(o: Offer) {
    return { ...o, usedCount: this.offerRepo.countUses(o.offerId) };
  }

  findAll() {
    this.expireOld();
    return successResponse('All offers', this.offerRepo.findAll().map((o) => this.withUsage(o)));
  }

  /** Offers a customer can use today: ACTIVE, inside their dates, not used up; optionally for one provider. */
  findActive(providerId?: string) {
    this.expireOld();
    const d = today();
    const rows = this.offerRepo.findActive()
      .filter((o) => d >= o.startDate && d <= o.endDate)
      .filter((o) => !o.maxTotalUses || this.offerRepo.countUses(o.offerId) < o.maxTotalUses)
      .filter((o) => !providerId || isForAll(o) || o.providerId === providerId)
      .map((o) => this.withUsage(o));
    return successResponse('Active offers', rows);
  }

  findById(id: string) {
    const offer = this.offerRepo.findById(id);
    if (!offer) throw new NotFoundException(`Offer ${id} not found`);
    return successResponse('Offer retrieved', this.withUsage(offer));
  }

  /** Check every condition the context allows, then work out the discount. Throws with the reason if any fails. */
  validateAndApply(offerCode: string, ctxOrFare: OfferContext | number = {}, legacyProviderId?: string) {
    const ctx: OfferContext = typeof ctxOrFare === 'number' ? { fare: ctxOrFare, providerId: legacyProviderId } : ctxOrFare;
    const offer = this.offerRepo.findByCode(offerCode);
    if (!offer) throw new NotFoundException(`Offer code ${offerCode} not found`);
    const code = offer.offerCode;
    const fail = (msg: string) => { throw new BadRequestException(`${code}: ${msg}`); };
    const d = today();

    // Status and validity window
    if (d > offer.endDate || offer.status === OfferStatus.EXPIRED) fail(`expired on ${offer.endDate}`);
    if (offer.status !== OfferStatus.ACTIVE) fail('this offer is not active');
    if (d < offer.startDate) fail(`starts on ${offer.startDate}`);

    // Trip details (operator, route, origin city, bus type) come from the backend, not the client.
    let providerId = ctx.providerId;
    let journeyDate = ctx.journeyDate;
    if (ctx.tripId) {
      const trip = this.repo(TripRepository).findById(ctx.tripId);
      const schedule = trip && this.repo(ScheduleRepository).findById(trip.scheduleId);
      const route = schedule && this.repo(RouteRepository).findById(schedule.routeId);
      const vehicle = trip && this.repo(VehicleRepository).findById(trip.vehicleId);
      if (schedule) providerId = schedule.providerId;
      if (!journeyDate && schedule?.journeyDate && schedule.journeyDate >= d) journeyDate = schedule.journeyDate;
      if (offer.routeId && schedule && schedule.routeId !== offer.routeId) fail(`only valid on route ${offer.routeId}`);
      if (offer.originCity && route && route.source.toLowerCase() !== offer.originCity.toLowerCase())
        fail(`only valid on buses from ${offer.originCity}`);
      const types = (offer.vehicleTypes || '').split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
      if (types.length && vehicle && !types.includes(String(vehicle.vehicleType).toLowerCase()))
        fail(`only valid on ${offer.vehicleTypes} buses`);
    }
    if (providerId && !isForAll(offer) && offer.providerId !== providerId) fail('not valid for this operator');

    // Travel-date conditions
    if (journeyDate) {
      const days = list(offer.validDays);
      if (days.length && !days.includes(WEEKDAYS[new Date(journeyDate + 'T00:00:00Z').getUTCDay()]))
        fail(`only valid for travel on ${days.join(', ')}`);
      const ahead = daysBetween(d, journeyDate);
      if (offer.minDaysAhead != null && ahead < offer.minDaysAhead)
        fail(`early-bird offer: book at least ${offer.minDaysAhead} day(s) before travel`);
      if (offer.maxDaysAhead != null && ahead > offer.maxDaysAhead)
        fail(`last-minute offer: only for travel within ${offer.maxDaysAhead} day(s)`);
    }

    // Booking size
    if (ctx.seats && offer.minSeats && ctx.seats < offer.minSeats) fail(`book at least ${offer.minSeats} seats`);
    if (offer.minFare && ctx.fare && ctx.fare < offer.minFare) fail(`minimum booking amount is ₹${offer.minFare}`);

    // Payment method
    const methods = list(offer.paymentMethods);
    if (methods.length && ctx.paymentMethod && !methods.includes(ctx.paymentMethod.trim().toUpperCase()))
      fail(`pay with ${methods.join(' or ')} to use this offer`);

    // Customer history and usage limits
    if (ctx.customerId) {
      if (offer.firstBookingOnly || offer.minPastBookings) {
        const past = this.repo(BookingRepository).findByCustomer(ctx.customerId)
          .filter((b) => b.bookingId !== ctx.bookingId)
          .filter((b) => b.bookingStatus === BookingStatus.CONFIRMED || b.bookingStatus === BookingStatus.COMPLETED).length;
        if (offer.firstBookingOnly && past > 0) fail('only for your first booking');
        if (offer.minPastBookings && past < offer.minPastBookings)
          fail(`for customers with at least ${offer.minPastBookings} past bookings (you have ${past})`);
      }
      if (offer.maxUsesPerUser && this.offerRepo.countUses(offer.offerId, ctx.customerId) >= offer.maxUsesPerUser)
        fail(offer.maxUsesPerUser === 1 ? 'you have already used this offer' : `you can use this offer ${offer.maxUsesPerUser} times`);
    }
    if (offer.maxTotalUses && this.offerRepo.countUses(offer.offerId) >= offer.maxTotalUses) fail('this offer has been fully redeemed');

    // Discount
    const fare = ctx.fare || 0;
    let discountAmount = 0;
    if (offer.flatDiscount != null) {
      discountAmount = fare > 0 ? Math.min(fare, offer.flatDiscount) : offer.flatDiscount;
    } else if (offer.discountPercentage != null) {
      discountAmount = Math.round((fare * offer.discountPercentage) / 100);
      if (offer.maxDiscount) discountAmount = Math.min(discountAmount, offer.maxDiscount);
    }
    return { offerId: offer.offerId, discountAmount, finalFare: Math.max(0, fare - discountAmount) };
  }

  /** Public check used at checkout: is this code usable for this booking, and how much does it save? */
  validate(offerCode: string, ctx: OfferContext) {
    const result = this.validateAndApply(offerCode, ctx);
    const offer = this.offerRepo.findById(result.offerId)!;
    return successResponse(`Offer ${offer.offerCode} applied`, { ...result, offer: this.withUsage(offer) });
  }

  /** Called when a booking that carries an offer is paid: re-check payment-time rules, then count the use. */
  redeemForBooking(offerId: string, ctx: OfferContext & { customerId: string; bookingId: string }) {
    const offer = this.offerRepo.findById(offerId);
    if (!offer) return;
    this.validateAndApply(offer.offerCode, ctx);
    this.offerRepo.addRedemption(offerId, ctx.customerId, ctx.bookingId);
    this.syncService.emit('OFFER_UPDATED', { action: 'redeemed', offerId });
  }

  /** A cancelled booking gives its offer use back. */
  releaseForBooking(bookingId: string) {
    this.offerRepo.removeRedemption(bookingId);
  }

  update(id: string, dto: UpdateOfferDto) {
    const current = this.offerRepo.findById(id);
    if (!current) throw new NotFoundException(`Offer ${id} not found`);
    // Only fields actually sent change.
    const sent = this.clean(Object.fromEntries(Object.entries(dto).filter(([, v]) => v !== undefined)) as Partial<Offer>);
    const next: Offer = { ...current, ...sent };
    // Switching kind: a new flat discount replaces the percentage and vice versa.
    if (sent.flatDiscount != null && sent.discountPercentage == null) next.discountPercentage = undefined;
    if (sent.discountPercentage != null && sent.flatDiscount == null) next.flatDiscount = undefined;
    this.checkShape(next);
    const updated = this.offerRepo.update(id, next)!;
    this.syncService.emit('OFFER_UPDATED', { action: 'updated', offer: updated });
    return successResponse('Offer updated', this.withUsage(updated));
  }

  remove(id: string) {
    if (!this.offerRepo.findById(id)) throw new NotFoundException(`Offer ${id} not found`);
    this.offerRepo.remove(id);
    this.syncService.emit('OFFER_UPDATED', { action: 'removed', offerId: id });
    return successResponse('Offer deleted');
  }
}
