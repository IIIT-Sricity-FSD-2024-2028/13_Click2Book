import { Injectable } from '@nestjs/common';
import { Review } from './interfaces/review.interface';
import { generateId } from '../../common/utils/id.util';

@Injectable()
export class ReviewRepository {
  private reviews: Review[] = [
    { reviewId: 'REV001', customerId: 'C001', tripId: 'T001', rating: 5, comment: 'Excellent bus, very clean!', reviewDate: '2026-05-02' },
    { reviewId: 'REV002', customerId: 'C002', tripId: 'T001', rating: 4, comment: 'Good journey, on time.', reviewDate: '2026-05-02' },
    { reviewId: 'REV003', customerId: 'C003', tripId: 'T002', rating: 3, comment: 'Average experience.', reviewDate: '2026-05-04' },
  ];

  create(data: Omit<Review, 'reviewId' | 'reviewDate'>): Review {
    const review: Review = {
      reviewId: generateId('REV'),
      ...data,
      reviewDate: new Date().toISOString().split('T')[0],
    };
    this.reviews.push(review);
    return review;
  }

  findAll(): Review[] { return this.reviews; }
  findById(reviewId: string): Review | undefined { return this.reviews.find(r => r.reviewId === reviewId); }
  findByCustomer(customerId: string): Review[] { return this.reviews.filter(r => r.customerId === customerId); }
  findByTrip(tripId: string): Review[] { return this.reviews.filter(r => r.tripId === tripId); }

  remove(reviewId: string): boolean {
    const i = this.reviews.findIndex(r => r.reviewId === reviewId);
    if (i === -1) return false;
    this.reviews.splice(i, 1);
    return true;
  }
}
