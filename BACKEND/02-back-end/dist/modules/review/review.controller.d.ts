import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/review.dto';
export declare class ReviewController {
    private readonly reviewService;
    constructor(reviewService: ReviewService);
    create(dto: CreateReviewDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/review.interface").Review>;
    findAll(): import("../../common/utils/response.util").ApiResponse<import("./interfaces/review.interface").Review[]>;
    findByCustomer(cid: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/review.interface").Review[]>;
    findByTrip(tid: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/review.interface").Review[]>;
    remove(id: string): import("../../common/utils/response.util").ApiResponse<unknown>;
}
