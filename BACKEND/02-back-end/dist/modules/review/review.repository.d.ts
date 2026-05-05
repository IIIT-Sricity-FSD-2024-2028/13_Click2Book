import { Review } from './interfaces/review.interface';
export declare class ReviewRepository {
    private reviews;
    create(data: Omit<Review, 'reviewId' | 'reviewDate'>): Review;
    findAll(): Review[];
    findById(reviewId: string): Review | undefined;
    findByCustomer(customerId: string): Review[];
    findByTrip(tripId: string): Review[];
    remove(reviewId: string): boolean;
}
