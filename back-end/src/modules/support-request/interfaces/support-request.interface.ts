import { SupportStatus } from '../enums/support-status.enum';

export interface SupportRequest {
  requestId: string;
  customerId: string;
  customerName?: string;
  supporterId?: string;
  description: string;
  category?: string;
  priority?: string;
  status: SupportStatus;
  createdDate: string;
  bookingId?: string;
  resolution?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

