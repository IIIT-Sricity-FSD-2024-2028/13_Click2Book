"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfferService = void 0;
const common_1 = require("@nestjs/common");
const offer_repository_1 = require("./offer.repository");
const offer_status_enum_1 = require("./enums/offer-status.enum");
const response_util_1 = require("../../common/utils/response.util");
let OfferService = class OfferService {
    offerRepo;
    constructor(offerRepo) {
        this.offerRepo = offerRepo;
    }
    create(dto) {
        if (this.offerRepo.findByCode(dto.offerCode))
            throw new common_1.ConflictException(`Offer code ${dto.offerCode} already exists`);
        if (new Date(dto.endDate) < new Date(dto.startDate))
            throw new common_1.BadRequestException('End date must be after start date');
        const offer = this.offerRepo.create({ ...dto, status: offer_status_enum_1.OfferStatus.ACTIVE });
        return (0, response_util_1.successResponse)('Offer created', offer);
    }
    findAll() { return (0, response_util_1.successResponse)('All offers', this.offerRepo.findAll()); }
    findActive() { return (0, response_util_1.successResponse)('Active offers', this.offerRepo.findActive()); }
    findById(id) {
        const offer = this.offerRepo.findById(id);
        if (!offer)
            throw new common_1.NotFoundException(`Offer ${id} not found`);
        return (0, response_util_1.successResponse)('Offer retrieved', offer);
    }
    validateAndApply(offerCode, fare) {
        const offer = this.offerRepo.findByCode(offerCode);
        if (!offer)
            throw new common_1.NotFoundException(`Offer code ${offerCode} not found`);
        if (offer.status !== offer_status_enum_1.OfferStatus.ACTIVE)
            throw new common_1.BadRequestException(`Offer ${offerCode} is not active`);
        const today = new Date().toISOString().split('T')[0];
        if (today < offer.startDate || today > offer.endDate)
            throw new common_1.BadRequestException(`Offer ${offerCode} has expired or not yet started`);
        const discountAmount = (fare * offer.discountPercentage) / 100;
        return { offerId: offer.offerId, discountAmount, finalFare: fare - discountAmount };
    }
    update(id, dto) {
        if (!this.offerRepo.findById(id))
            throw new common_1.NotFoundException(`Offer ${id} not found`);
        return (0, response_util_1.successResponse)('Offer updated', this.offerRepo.update(id, dto));
    }
    remove(id) {
        if (!this.offerRepo.findById(id))
            throw new common_1.NotFoundException(`Offer ${id} not found`);
        this.offerRepo.remove(id);
        return (0, response_util_1.successResponse)('Offer deleted');
    }
};
exports.OfferService = OfferService;
exports.OfferService = OfferService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [offer_repository_1.OfferRepository])
], OfferService);
//# sourceMappingURL=offer.service.js.map