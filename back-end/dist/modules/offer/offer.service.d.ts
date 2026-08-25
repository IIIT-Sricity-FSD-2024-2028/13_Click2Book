import { OfferRepository } from './offer.repository';
import { CreateOfferDto, UpdateOfferDto } from './dto/offer.dto';
export declare class OfferService {
    private readonly offerRepo;
    constructor(offerRepo: OfferRepository);
    create(dto: CreateOfferDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/offer.interface").Offer>;
    findAll(): import("../../common/utils/response.util").ApiResponse<import("./interfaces/offer.interface").Offer[]>;
    findActive(): import("../../common/utils/response.util").ApiResponse<import("./interfaces/offer.interface").Offer[]>;
    findById(id: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/offer.interface").Offer>;
    validateAndApply(offerCode: string, fare: number): {
        offerId: string;
        discountAmount: number;
        finalFare: number;
    };
    update(id: string, dto: UpdateOfferDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/offer.interface").Offer>;
    remove(id: string): import("../../common/utils/response.util").ApiResponse<unknown>;
}
