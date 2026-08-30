import { SupportStatus } from '../enums/support-status.enum';
export interface SupportRequest {
  requestId: string;
  customerId: string;
  supporterId?: string;
  description: string;
  status: SupportStatus;
  createdDate: string;
  bookingId?: string;
}
