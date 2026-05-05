import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { OfferRepository } from './offer.repository';
import { CreateOfferDto, UpdateOfferDto } from './dto/offer.dto';
import { OfferStatus } from './enums/offer-status.enum';
import { successResponse } from '../../common/utils/response.util';

@Injectable()
export class OfferService {
  constructor(private readonly offerRepo: OfferRepository) {}

  create(dto: CreateOfferDto) {
    if (this.offerRepo.findByCode(dto.offerCode))
      throw new ConflictException(`Offer code ${dto.offerCode} already exists`);
    if (new Date(dto.endDate) < new Date(dto.startDate))
      throw new BadRequestException('End date must be after start date');
    const offer = this.offerRepo.create({ ...dto, status: OfferStatus.ACTIVE });
    return successResponse('Offer created', offer);
  }

  findAll() { return successResponse('All offers', this.offerRepo.findAll()); }
  findActive() { return successResponse('Active offers', this.offerRepo.findActive()); }

  findById(id: string) {
    const offer = this.offerRepo.findById(id);
    if (!offer) throw new NotFoundException(`Offer ${id} not found`);
    return successResponse('Offer retrieved', offer);
  }

  // Validate and apply offer — returns discount amount
  validateAndApply(offerCode: string, fare: number): { offerId: string; discountAmount: number; finalFare: number } {
    const offer = this.offerRepo.findByCode(offerCode);
    if (!offer) throw new NotFoundException(`Offer code ${offerCode} not found`);
    if (offer.status !== OfferStatus.ACTIVE) throw new BadRequestException(`Offer ${offerCode} is not active`);
    const today = new Date().toISOString().split('T')[0];
    if (today < offer.startDate || today > offer.endDate)
      throw new BadRequestException(`Offer ${offerCode} has expired or not yet started`);
    const discountAmount = (fare * offer.discountPercentage) / 100;
    return { offerId: offer.offerId, discountAmount, finalFare: fare - discountAmount };
  }

  update(id: string, dto: UpdateOfferDto) {
    if (!this.offerRepo.findById(id)) throw new NotFoundException(`Offer ${id} not found`);
    return successResponse('Offer updated', this.offerRepo.update(id, dto));
  }

  remove(id: string) {
    if (!this.offerRepo.findById(id)) throw new NotFoundException(`Offer ${id} not found`);
    this.offerRepo.remove(id);
    return successResponse('Offer deleted');
  }
}
