import { Injectable } from '@nestjs/common';
import { Irctc } from './interfaces/irctc.interface';
import { IrctcStatus } from './enums/irctc-status.enum';
import { generateId } from '../../common/utils/id.util';

@Injectable()
export class IrctcRepository {
  private records: Irctc[] = [
    { irctcId: 'IRCTC001', irctcUsername: 'ravi_irctc', linkedPhoneNumber: '9876543212', verificationStatus: IrctcStatus.VERIFIED },
  ];

  create(data: Omit<Irctc, 'irctcId' | 'verificationStatus'>): Irctc {
    const record: Irctc = { irctcId: generateId('IRCTC'), ...data, verificationStatus: IrctcStatus.IN_PROGRESS };
    this.records.push(record);
    return record;
  }

  findAll(): Irctc[] { return this.records; }
  findById(id: string): Irctc | undefined { return this.records.find(r => r.irctcId === id); }
  findByUsername(username: string): Irctc | undefined { return this.records.find(r => r.irctcUsername === username); }

  update(id: string, data: Partial<Irctc>): Irctc | undefined {
    const i = this.records.findIndex(r => r.irctcId === id);
    if (i === -1) return undefined;
    this.records[i] = { ...this.records[i], ...data };
    return this.records[i];
  }
}
