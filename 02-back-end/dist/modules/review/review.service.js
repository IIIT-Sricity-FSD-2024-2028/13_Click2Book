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
exports.ReviewService = void 0;
const common_1 = require("@nestjs/common");
const review_repository_1 = require("./review.repository");
const response_util_1 = require("../../common/utils/response.util");
let ReviewService = class ReviewService {
    reviewRepo;
    constructor(reviewRepo) {
        this.reviewRepo = reviewRepo;
    }
    create(dto) {
        const review = this.reviewRepo.create(dto);
        return (0, response_util_1.successResponse)('Review submitted', review);
    }
    findAll() { return (0, response_util_1.successResponse)('All reviews', this.reviewRepo.findAll()); }
    findByCustomer(cid) { return (0, response_util_1.successResponse)('Customer reviews', this.reviewRepo.findByCustomer(cid)); }
    findByTrip(tid) { return (0, response_util_1.successResponse)('Trip reviews', this.reviewRepo.findByTrip(tid)); }
    remove(id) {
        if (!this.reviewRepo.remove(id))
            throw new common_1.NotFoundException(`Review ${id} not found`);
        return (0, response_util_1.successResponse)('Review deleted');
    }
};
exports.ReviewService = ReviewService;
exports.ReviewService = ReviewService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [review_repository_1.ReviewRepository])
], ReviewService);
//# sourceMappingURL=review.service.js.map