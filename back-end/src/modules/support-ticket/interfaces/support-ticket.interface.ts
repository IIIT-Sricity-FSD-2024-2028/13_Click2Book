import { TicketCategory } from '../enums/ticket-category.enum';

export type TicketStatus = 'open' | 'resolved';
export type TicketSourceModule = 'support-request' | 'emergency' | 'lost-found' | 'manual';

export interface SupportTicket {
  ticketId: string;
  bookingId: string;
  category: TicketCategory;
  costApplied: number; // paise
  status: TicketStatus;
  sourceModule?: TicketSourceModule;
  agentId?: string; // SupportStaff.supporterId — optional, ticket may be unassigned
  createdAt: string;
}
