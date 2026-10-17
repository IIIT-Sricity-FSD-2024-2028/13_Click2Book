import { Injectable } from '@nestjs/common';
import { SupportStaff } from './interfaces/support-staff.interface';
import { generateId } from '../../common/utils/id.util';

@Injectable()
export class SupportRepository {
  private staff: SupportStaff[] = [
    { supporterId: 'SUP001', name: 'Rahul Support', email: 'rahul@click2book.com', password: 'hashed_s1', status: 'ACTIVE', createdAt: '2026-01-05' },
    { supporterId: 'SUP002', name: 'Anita Help', email: 'anita@click2book.com', password: 'hashed_s2', status: 'ACTIVE', createdAt: '2026-01-08' },
  ];

  create(data: Omit<SupportStaff, 'supporterId'>): SupportStaff {
    const s: SupportStaff = {
      supporterId: generateId('SUP'),
      status: 'ACTIVE',
      createdAt: new Date().toISOString().split('T')[0],
      ...data,
    };
    this.staff.push(s);
    return s;
  }

  findAll(): SupportStaff[] { return this.staff; }
  findById(id: string): SupportStaff | undefined { return this.staff.find(s => s.supporterId === id); }
  findByEmail(email: string): SupportStaff | undefined { return this.staff.find(s => s.email === email); }

  update(id: string, data: Partial<SupportStaff>): SupportStaff | undefined {
    const i = this.staff.findIndex(s => s.supporterId === id);
    if (i === -1) return undefined;
    this.staff[i] = { ...this.staff[i], ...data };
    return this.staff[i];
  }
}
