export interface Review {
    reviewId: string;
    customerId: string;
    tripId: string;
    rating: number;
    comment?: string;
    reviewDate: string;
}
