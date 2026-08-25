import { Irctc } from './interfaces/irctc.interface';
export declare class IrctcRepository {
    private records;
    create(data: Omit<Irctc, 'irctcId' | 'verificationStatus'>): Irctc;
    findAll(): Irctc[];
    findById(id: string): Irctc | undefined;
    findByUsername(username: string): Irctc | undefined;
    update(id: string, data: Partial<Irctc>): Irctc | undefined;
}
