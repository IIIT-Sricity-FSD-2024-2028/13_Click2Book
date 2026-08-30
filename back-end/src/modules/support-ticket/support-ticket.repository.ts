import { Injectable } from '@nestjs/common';
import { SupportTicket } from './interfaces/support-ticket.interface';
import { generateId } from '../../common/utils/id.util';

@Injectable()
export class SupportTicketRepository {
  private tickets: SupportTicket[] = [];

  create(data: Omit<SupportTicket, 'ticketId' | 'status' | 'createdAt'>): SupportTicket {
    const ticket: SupportTicket = {
      ticketId: generateId('TCK'),
      ...data,
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    this.tickets.push(ticket);
    return ticket;
  }

  findAll(): SupportTicket[] {
    return this.tickets;
  }

  findById(ticketId: string): SupportTicket | undefined {
    return this.tickets.find((t) => t.ticketId === ticketId);
  }

  findByBooking(bookingId: string): SupportTicket[] {
    return this.tickets.filter((t) => t.bookingId === bookingId);
  }

  update(ticketId: string, data: Partial<Pick<SupportTicket, 'status'>>): SupportTicket | undefined {
    const i = this.tickets.findIndex((t) => t.ticketId === ticketId);
    if (i === -1) return undefined;
    this.tickets[i] = { ...this.tickets[i], ...data };
    return this.tickets[i];
  }
}
