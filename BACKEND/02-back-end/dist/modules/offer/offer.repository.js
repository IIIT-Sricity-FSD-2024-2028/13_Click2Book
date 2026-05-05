"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfferRepository = void 0;
const common_1 = require("@nestjs/common");
const offer_status_enum_1 = require("./enums/offer-status.enum");
const id_util_1 = require("../../common/utils/id.util");
let OfferRepository = class OfferRepository {
    offers = [
        { offerId: 'O001', providerId: 'P001', offerCode: 'SUMMER20', discountPercentage: 20, startDate: '2026-05-01', endDate: '2026-08-31', status: offer_status_enum_1.OfferStatus.ACTIVE },
        { offerId: 'O002', providerId: 'P002', offerCode: 'FIRST10', discountPercentage: 10, startDate: '2026-01-01', endDate: '2026-12-31', status: offer_status_enum_1.OfferStatus.ACTIVE },
        { offerId: 'O003', providerId: 'P001', offerCode: 'SAVE15', discountPercentage: 15, startDate: '2026-06-01', endDate: '2026-06-30', status: offer_status_enum_1.OfferStatus.INACTIVE },
    ];
    create(data) {
        const offer = { offerId: (0, id_util_1.generateId)('O'), ...data, status: offer_status_enum_1.OfferStatus.ACTIVE };
        this.offers.push(offer);
        return offer;
    }
    findAll() { return this.offers; }
    findById(offerId) { return this.offers.find(o => o.offerId === offerId); }
    findByCode(offerCode) { return this.offers.find(o => o.offerCode === offerCode); }
    findActive() { return this.offers.filter(o => o.status === offer_status_enum_1.OfferStatus.ACTIVE); }
    update(offerId, data) {
        const i = this.offers.findIndex(o => o.offerId === offerId);
        if (i === -1)
            return undefined;
        this.offers[i] = { ...this.offers[i], ...data };
        return this.offers[i];
    }
    remove(offerId) {
        const i = this.offers.findIndex(o => o.offerId === offerId);
        if (i === -1)
            return false;
        this.offers.splice(i, 1);
        return true;
    }
};
exports.OfferRepository = OfferRepository;
exports.OfferRepository = OfferRepository = __decorate([
    (0, common_1.Injectable)()
], OfferRepository);
//# sourceMappingURL=offer.repository.js.map