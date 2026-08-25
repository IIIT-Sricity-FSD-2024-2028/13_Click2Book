import { LostFoundStatus } from '../enums/lost-found-status.enum';

export interface LostFoundItem {
  itemId: string;
  tripId: string;
  bookingId: string;
  customerId: string;
  itemDescription: string;
  category?: string;
  dateLost: string;
  contactPhone: string;
  status: LostFoundStatus;
  foundNote?: string;
  reportedAt: string;
  resolvedAt?: string;
}
