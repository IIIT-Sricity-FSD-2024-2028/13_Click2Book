import { Injectable } from '@nestjs/common';
import { Admin } from './interfaces/admin.interface';
import { generateId } from '../../common/utils/id.util';

@Injectable()
export class AdminRepository {
  private admins: Admin[] = [
    { adminId: 'A001', name: 'Super Admin', email: 'admin@click2book.com', password: 'hashed_admin' },
    { adminId: 'A002', name: 'Ops Admin', email: 'ops@click2book.com', password: 'hashed_ops' },
  ];

  create(data: Omit<Admin, 'adminId'>): Admin {
    const admin: Admin = { adminId: generateId('A'), ...data };
    this.admins.push(admin);
    return admin;
  }

  findAll(): Admin[] { return this.admins; }
  findById(adminId: string): Admin | undefined { return this.admins.find(a => a.adminId === adminId); }
  findByEmail(email: string): Admin | undefined { return this.admins.find(a => a.email === email); }
}
