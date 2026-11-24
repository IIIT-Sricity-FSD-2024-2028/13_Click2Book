import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { OfferRepository } from './offer.repository';
import { CreateOfferDto, UpdateOfferDto } from './dto/offer.dto';
import { OfferStatus } from './enums/offer-status.enum';
import { successResponse } from '../../common/utils/response.util';

@Injectable()
export class OfferService {
  constructor(private readonly offerRepo: OfferRepository) {}

  create(dto: CreateOfferDto) {
    const offerCode = dto.offerCode.trim().toUpperCase();
    this.ensureUniqueCode(offerCode);
    this.validateOfferFields({ ...dto, offerCode }, true);
    const offer = this.offerRepo.create({
      ...dto,
      providerId: dto.providerId || 'ADMIN',
      offerCode,
      status: OfferStatus.ACTIVE,
    });
    return successResponse('Offer created', offer);
  }

  findAll() {
    return successResponse('All offers', this.offerRepo.findAll());
  }
  findActive() {
    const today = new Date().toISOString().slice(0, 10);
    return successResponse(
      'Active offers',
      this.offerRepo
        .findActive()
        .filter((offer) => offer.startDate <= today && offer.endDate >= today),
    );
  }

  analytics() {
    const redemptions = this.offerRepo.findRedemptions();
    const coupons = this.offerRepo.findAll().map((offer) => {
      const usage = redemptions.filter(
        (redemption) => redemption.offerId === offer.offerId,
      );
      const discountTotal = usage.reduce(
        (sum, item) => sum + item.discountAmount,
        0,
      );
      const grossBookingValue = usage.reduce(
        (sum, item) => sum + item.grossAmount,
        0,
      );
      return {
        ...offer,
        redemptions: usage.length,
        redemptionRecords: usage,
        discountTotal,
        grossBookingValue,
        netBookingValue: Math.max(0, grossBookingValue - discountTotal),
      };
    });
    return successResponse('Coupon analytics', {
      summary: {
        totalCoupons: coupons.length,
        activeCoupons: coupons.filter(
          (offer) =>
            offer.status === OfferStatus.ACTIVE &&
            offer.startDate <= new Date().toISOString().slice(0, 10) &&
            offer.endDate >= new Date().toISOString().slice(0, 10),
        ).length,
        inactiveCoupons: coupons.filter(
          (offer) =>
            offer.status === OfferStatus.INACTIVE ||
            offer.status === OfferStatus.SUSPENDED,
        ).length,
        expiredCoupons: coupons.filter(
          (offer) => offer.endDate < new Date().toISOString().slice(0, 10),
        ).length,
        totalRedemptions: redemptions.length,
        totalDiscount: redemptions.reduce(
          (sum, item) => sum + item.discountAmount,
          0,
        ),
        grossBookingValue: redemptions.reduce(
          (sum, item) => sum + item.grossAmount,
          0,
        ),
        netBookingValue: redemptions.reduce(
          (sum, item) => sum + item.grossAmount - item.discountAmount,
          0,
        ),
      },
      coupons,
    });
  }

  findById(id: string) {
    const offer = this.offerRepo.findById(id);
    if (!offer) throw new NotFoundException(`Offer ${id} not found`);
    return successResponse('Offer retrieved', offer);
  }

  // Validate and apply offer — returns discount amount
  validateAndApply(
    offerCode: string,
    fare: number,
    customerId?: string,
  ): {
    offerId: string;
    offerCode: string;
    discountAmount: number;
    grossAmount: number;
    finalFare: number;
  } {
    const offer = this.offerRepo.findByCode(offerCode);
    if (!offer)
      throw new NotFoundException(`Offer code ${offerCode} not found`);
    if (offer.status !== OfferStatus.ACTIVE)
      throw new BadRequestException(`Offer ${offerCode} is not active`);
    const today = new Date().toISOString().split('T')[0];
    if (today < offer.startDate || today > offer.endDate)
      throw new BadRequestException(
        `Offer ${offerCode} has expired or not yet started`,
      );
    if (offer.minFare != null && fare < offer.minFare)
      throw new BadRequestException(
        `Minimum fare of ₹${offer.minFare} required for this offer`,
      );

    let discountAmount = 0;
    if (offer.flatDiscount != null) {
      discountAmount = offer.flatDiscount;
    } else if (offer.discountPercentage != null) {
      discountAmount = Math.round((fare * offer.discountPercentage) / 100);
    }
    if (offer.maxDiscount != null)
      discountAmount = Math.min(discountAmount, offer.maxDiscount);
    discountAmount = Math.min(fare, discountAmount);
    const redemptions = this.offerRepo.findRedemptions(offer.offerId);
    if (offer.maxUsage != null && redemptions.length >= offer.maxUsage)
      throw new BadRequestException(
        `Offer ${offerCode} has reached its usage limit`,
      );
    if (
      customerId &&
      offer.maxUsagePerCustomer != null &&
      redemptions.filter((item) => item.customerId === customerId).length >=
        offer.maxUsagePerCustomer
    )
      throw new BadRequestException(
        `Customer has reached the usage limit for ${offerCode}`,
      );
    return {
      offerId: offer.offerId,
      offerCode: offer.offerCode,
      discountAmount,
      grossAmount: fare,
      finalFare: Math.max(0, fare - discountAmount),
    };
  }

  update(id: string, dto: UpdateOfferDto) {
    const existing = this.offerRepo.findById(id);
    if (!existing) throw new NotFoundException(`Offer ${id} not found`);
    const update: UpdateOfferDto = { ...dto };
    if (dto.offerCode) {
      update.offerCode = dto.offerCode.trim().toUpperCase();
      this.ensureUniqueCode(update.offerCode, id);
    }
    if (dto.discountPercentage != null) update.flatDiscount = undefined;
    if (dto.flatDiscount != null) update.discountPercentage = undefined;
    if (
      update.status === OfferStatus.ACTIVE &&
      new Date(existing.endDate) <
        new Date(new Date().toISOString().slice(0, 10))
    ) {
      throw new BadRequestException('An expired coupon cannot be activated');
    }
    this.validateOfferFields(
      { ...existing, ...update },
      dto.discountPercentage != null || dto.flatDiscount != null,
    );
    return successResponse('Offer updated', this.offerRepo.update(id, update));
  }

  remove(id: string) {
    if (!this.offerRepo.findById(id))
      throw new NotFoundException(`Offer ${id} not found`);
    this.offerRepo.update(id, { status: OfferStatus.INACTIVE });
    return successResponse('Offer archived');
  }

  recordRedemption(
    offerId: string,
    bookingId: string,
    customerId: string,
    discountAmount: number,
    grossAmount: number,
  ) {
    const offer = this.offerRepo.findById(offerId);
    if (!offer) throw new NotFoundException(`Offer ${offerId} not found`);
    const recorded = this.offerRepo
      .findRedemptions(offerId)
      .some((item) => item.bookingId === bookingId);
    if (recorded) return;
    const redemptions = this.offerRepo.findRedemptions(offerId);
    if (offer.maxUsage != null && redemptions.length >= offer.maxUsage)
      throw new BadRequestException(
        `Offer ${offer.offerCode} has reached its usage limit`,
      );
    if (
      offer.maxUsagePerCustomer != null &&
      redemptions.filter((item) => item.customerId === customerId).length >=
        offer.maxUsagePerCustomer
    )
      throw new BadRequestException(
        `Customer has reached the usage limit for ${offer.offerCode}`,
      );
    this.offerRepo.recordRedemption({
      offerId,
      bookingId,
      customerId,
      discountAmount,
      grossAmount,
    });
  }

  private ensureUniqueCode(offerCode: string, exceptId?: string) {
    const existing = this.offerRepo.findByCode(offerCode);
    if (existing && existing.offerId !== exceptId)
      throw new ConflictException(`Offer code ${offerCode} already exists`);
  }

  private validateOfferFields(
    offer: Partial<CreateOfferDto> & { endDate: string; startDate: string },
    validateDiscount = false,
  ) {
    if (
      Number.isNaN(new Date(offer.startDate).getTime()) ||
      Number.isNaN(new Date(offer.endDate).getTime()) ||
      new Date(offer.endDate) < new Date(offer.startDate)
    )
      throw new BadRequestException('End date must be on or after start date');
    if (
      validateDiscount &&
      (offer.discountPercentage == null) === (offer.flatDiscount == null)
    )
      throw new BadRequestException(
        'Provide exactly one discount type: percentage or fixed amount',
      );
  }
}
