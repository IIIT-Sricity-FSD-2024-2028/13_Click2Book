import { Injectable, NotFoundException } from '@nestjs/common';
import { ReviewRepository } from './review.repository';
import { CreateReviewDto } from './dto/review.dto';
import { successResponse } from '../../common/utils/response.util';

@Injectable()
export class ReviewService {
  constructor(private readonly reviewRepo: ReviewRepository) {}

  create(dto: CreateReviewDto) {
    const review = this.reviewRepo.create(dto);
    return successResponse('Review submitted', review);
  }

  findAll() { return successResponse('All reviews', this.reviewRepo.findAll()); }
  findByCustomer(cid: string) { return successResponse('Customer reviews', this.reviewRepo.findByCustomer(cid)); }
  findByTrip(tid: string) { return successResponse('Trip reviews', this.reviewRepo.findByTrip(tid)); }

  remove(id: string) {
    if (!this.reviewRepo.remove(id)) throw new NotFoundException(`Review ${id} not found`);
    return successResponse('Review deleted');
  }
}
