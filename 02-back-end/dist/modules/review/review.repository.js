"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewRepository = void 0;
const common_1 = require("@nestjs/common");
const id_util_1 = require("../../common/utils/id.util");
let ReviewRepository = class ReviewRepository {
    reviews = [
        { reviewId: 'REV001', customerId: 'C001', tripId: 'T001', rating: 5, comment: 'Excellent bus, very clean!', reviewDate: '2026-05-02' },
        { reviewId: 'REV002', customerId: 'C002', tripId: 'T001', rating: 4, comment: 'Good journey, on time.', reviewDate: '2026-05-02' },
        { reviewId: 'REV003', customerId: 'C003', tripId: 'T002', rating: 3, comment: 'Average experience.', reviewDate: '2026-05-04' },
    ];
    create(data) {
        const review = {
            reviewId: (0, id_util_1.generateId)('REV'),
            ...data,
            reviewDate: new Date().toISOString().split('T')[0],
        };
        this.reviews.push(review);
        return review;
    }
    findAll() { return this.reviews; }
    findById(reviewId) { return this.reviews.find(r => r.reviewId === reviewId); }
    findByCustomer(customerId) { return this.reviews.filter(r => r.customerId === customerId); }
    findByTrip(tripId) { return this.reviews.filter(r => r.tripId === tripId); }
    remove(reviewId) {
        const i = this.reviews.findIndex(r => r.reviewId === reviewId);
        if (i === -1)
            return false;
        this.reviews.splice(i, 1);
        return true;
    }
};
exports.ReviewRepository = ReviewRepository;
exports.ReviewRepository = ReviewRepository = __decorate([
    (0, common_1.Injectable)()
], ReviewRepository);
//# sourceMappingURL=review.repository.js.map