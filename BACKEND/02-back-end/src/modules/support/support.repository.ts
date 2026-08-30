import { Injectable } from '@nestjs/common';
import { SupportStaff } from './interfaces/support-staff.interface';
import { generateId } from '../../common/utils/id.util';

@Injectable()
export class SupportRepository {
  private staff: SupportStaff[] = [
    { supporterId: 'SUP001', name: 'Rahul Support', email: 'rahul@click2book.com', password: 'hashed_s1' },
    { supporterId: 'SUP002', name: 'Anita Help', email: 'anita@click2book.com', password: 'hashed_s2' },
  ];

  create(data: Omit<SupportStaff, 'supporterId'>): SupportStaff {
    const s: SupportStaff = { supporterId: generateId('SUP'), ...data };
    this.staff.push(s);
    return s;
  }

  findAll(): SupportStaff[] { return this.staff; }
  findById(id: string): SupportStaff | undefined { return this.staff.find(s => s.supporterId === id); }
  findByEmail(email: string): SupportStaff | undefined { return this.staff.find(s => s.email === email); }
}
