import { Injectable } from '@nestjs/common';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { Booking } from './interfaces/booking.interface';
import { BookingStatus } from './enums/booking-status.enum';
import { generateId, bumpCounterIfHigher } from '../../common/utils/id.util';

@Injectable()
export class BookingRepository {
  private bookings: Booking[] = [
    { bookingId: 'B001', customerId: 'C001', tripId: 'T001', seatNumber: 5, bookingDate: '2026-05-01', bookingStatus: BookingStatus.CONFIRMED },
    { bookingId: 'B002', customerId: 'C002', tripId: 'T001', seatNumber: 6, bookingDate: '2026-05-02', bookingStatus: BookingStatus.CONFIRMED },
    { bookingId: 'B003', customerId: 'C003', tripId: 'T002', seatNumber: 3, offerId: 'O001', bookingDate: '2026-05-03', bookingStatus: BookingStatus.CONFIRMED },
  ];
  private aliasMap: Map<string, string> = new Map();
  private readonly storagePath: string | null;

  constructor(storagePath?: string) {
    this.storagePath = storagePath || (
      process.env.NODE_ENV === 'test'
        ? null
        : resolve(__dirname, '../../../data/bookings.json')
    );
    this.load();
  }

  private load(): void {
    if (!this.storagePath || !existsSync(this.storagePath)) return;

    const stored = JSON.parse(readFileSync(this.storagePath, 'utf8'));
    if (!stored || !Array.isArray(stored.bookings) || !Array.isArray(stored.aliases)) {
      throw new Error(`Invalid booking store at ${this.storagePath}`);
    }

    this.bookings = stored.bookings;
    this.aliasMap = new Map(stored.aliases);
  }

  private persist(): void {
    if (!this.storagePath) return;
    const directory = dirname(this.storagePath);
    mkdirSync(directory, { recursive: true });

    const temporaryPath = `${this.storagePath}.${process.pid}.tmp`;
    writeFileSync(
      temporaryPath,
      JSON.stringify({ bookings: this.bookings, aliases: Array.from(this.aliasMap.entries()) }),
      'utf8',
    );
    renameSync(temporaryPath, this.storagePath);
  }

  registerAlias(aliasId: string, canonicalBookingId: string): void {
    if (aliasId && canonicalBookingId && aliasId !== canonicalBookingId) {
      this.aliasMap.set(aliasId, canonicalBookingId);
      this.persist();
    }
  }

  create(data: Omit<Booking, 'bookingId' | 'bookingDate' | 'bookingStatus'>): Booking {
    let nextId = generateId('B');
    while (this.bookings.some(b => b.bookingId === nextId) || this.aliasMap.has(nextId)) {
      nextId = generateId('B');
    }
    const booking: Booking = {
      bookingId: nextId,
      ...data,
      bookingDate: new Date().toISOString().split('T')[0],
      bookingStatus: BookingStatus.PENDING,
    };
    this.bookings.push(booking);
    this.persist();
    return booking;
  }

  createWithId(data: Booking): Booking {
    if (data.bookingId) {
      bumpCounterIfHigher('B', data.bookingId);
    }
    const existing = this.bookings.find(b => b.bookingId === data.bookingId);
    if (existing) {
      Object.assign(existing, data);
      this.persist();
      return existing;
    }
    this.bookings.push(data);
    this.persist();
    return data;
  }

  findAll(): Booking[] { return this.bookings; }

  findById(bookingId: string): Booking | undefined {
    if (!bookingId) return undefined;
    // Prefer active (non-cancelled) booking in case duplicate entries exist in memory
    let b = this.bookings.find(b => b.bookingId === bookingId && b.bookingStatus !== BookingStatus.CANCELLED);
    if (!b) {
      b = this.bookings.find(b => b.bookingId === bookingId);
    }
    if (!b && this.aliasMap.has(bookingId)) {
      const canonical = this.aliasMap.get(bookingId)!;
      b = this.bookings.find(x => x.bookingId === canonical && x.bookingStatus !== BookingStatus.CANCELLED) ||
          this.bookings.find(x => x.bookingId === canonical);
    }
    return b;
  }

  findByCustomer(customerId: string): Booking[] { return this.bookings.filter(b => b.customerId === customerId); }
  findByTrip(tripId: string): Booking[] { return this.bookings.filter(b => b.tripId === tripId); }
  findByStatus(status: BookingStatus): Booking[] { return this.bookings.filter(b => b.bookingStatus === status); }

  findByCustomerAndTripAndSeat(customerId: string, tripId: string, seatNumber: number, status?: BookingStatus): Booking | undefined {
    return this.bookings.find(
      b => b.customerId === customerId && b.tripId === tripId && b.seatNumber === seatNumber && (!status || b.bookingStatus === status)
    );
  }

  // Check if seat already booked for a trip
  isSeatTaken(tripId: string, seatNumber: number): boolean {
    return this.bookings.some(
      b => b.tripId === tripId && b.seatNumber === seatNumber &&
        [BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(b.bookingStatus)
    );
  }

  update(bookingId: string, data: Partial<Booking>): Booking | undefined {
    if (!bookingId) return undefined;
    let i = this.bookings.findIndex(b => b.bookingId === bookingId && b.bookingStatus !== BookingStatus.CANCELLED);
    if (i === -1) {
      i = this.bookings.findIndex(b => b.bookingId === bookingId);
    }
    if (i === -1 && this.aliasMap.has(bookingId)) {
      const canonical = this.aliasMap.get(bookingId)!;
      i = this.bookings.findIndex(x => x.bookingId === canonical && x.bookingStatus !== BookingStatus.CANCELLED);
      if (i === -1) {
        i = this.bookings.findIndex(x => x.bookingId === canonical);
      }
    }
    if (i === -1) return undefined;
    this.bookings[i] = { ...this.bookings[i], ...data };
    this.persist();
    return this.bookings[i];
  }
}
