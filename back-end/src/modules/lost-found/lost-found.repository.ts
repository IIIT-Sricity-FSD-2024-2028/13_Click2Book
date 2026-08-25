import { Injectable } from '@nestjs/common';
import { LostFoundItem } from './interfaces/lost-found.interface';
import { LostFoundStatus } from './enums/lost-found-status.enum';
import { generateId } from '../../common/utils/id.util';

@Injectable()
export class LostFoundRepository {
  private items: LostFoundItem[] = [];

  create(data: Omit<LostFoundItem, 'itemId' | 'status' | 'reportedAt'>): LostFoundItem {
    const item: LostFoundItem = {
      itemId: generateId('LF'),
      ...data,
      status: LostFoundStatus.REPORTED,
      reportedAt: new Date().toISOString(),
    };
    this.items.push(item);
    return item;
  }

  findAll(): LostFoundItem[] { return this.items; }
  findById(itemId: string): LostFoundItem | undefined { return this.items.find(i => i.itemId === itemId); }
  findByCustomer(customerId: string): LostFoundItem[] { return this.items.filter(i => i.customerId === customerId); }
  findByTrips(tripIds: string[]): LostFoundItem[] { return this.items.filter(i => tripIds.includes(i.tripId)); }

  update(itemId: string, data: Partial<LostFoundItem>): LostFoundItem | undefined {
    const i = this.items.findIndex(item => item.itemId === itemId);
    if (i === -1) return undefined;
    this.items[i] = { ...this.items[i], ...data };
    return this.items[i];
  }
}
