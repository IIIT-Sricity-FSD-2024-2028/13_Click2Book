import { OfferService } from './offer.service';
import { CreateOfferDto, UpdateOfferDto } from './dto/offer.dto';
export declare class OfferController {
    private readonly offerService;
    constructor(offerService: OfferService);
    create(dto: CreateOfferDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/offer.interface").Offer>;
    findAll(): import("../../common/utils/response.util").ApiResponse<import("./interfaces/offer.interface").Offer[]>;
    findActive(): import("../../common/utils/response.util").ApiResponse<import("./interfaces/offer.interface").Offer[]>;
    findOne(id: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/offer.interface").Offer>;
    update(id: string, dto: UpdateOfferDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/offer.interface").Offer>;
    remove(id: string): import("../../common/utils/response.util").ApiResponse<unknown>;
}
