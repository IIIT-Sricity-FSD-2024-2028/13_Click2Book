import { LostFoundItem } from './interfaces/lost-found.interface';
export declare class LostFoundRepository {
    private items;
    create(data: Omit<LostFoundItem, 'itemId' | 'status' | 'reportedAt'>): LostFoundItem;
    findAll(): LostFoundItem[];
    findById(itemId: string): LostFoundItem | undefined;
    findByCustomer(customerId: string): LostFoundItem[];
    findByTrips(tripIds: string[]): LostFoundItem[];
    update(itemId: string, data: Partial<LostFoundItem>): LostFoundItem | undefined;
}
