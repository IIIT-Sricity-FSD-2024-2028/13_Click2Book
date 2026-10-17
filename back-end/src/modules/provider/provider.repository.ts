import { Injectable } from '@nestjs/common';
import { Provider } from './interfaces/provider.interface';
import { generateId } from '../../common/utils/id.util';

@Injectable()
export class ProviderRepository {
  private providers: Provider[] = [
    { providerId: 'P001', name: 'APSRTC Travels', email: 'apsrtc@gmail.com', password: 'Apsrtc@123', approved: true, status: 'ACTIVE', createdAt: '2026-01-01' },
    { providerId: 'P002', name: 'KPN Tours', email: 'kpn@gmail.com', password: 'Kpn@123', approved: true, status: 'ACTIVE', createdAt: '2026-01-02' },
    { providerId: 'P003', name: 'Orange Travels', email: 'orange@gmail.com', password: 'Orange@123', approved: false, status: 'INACTIVE', createdAt: '2026-01-03' },
    { providerId: 'P004', name: 'SRS Travels', email: 'srs@gmail.com', password: 'Srs@123', approved: true, status: 'ACTIVE', createdAt: '2026-01-04' },
    { providerId: 'P005', name: 'VRL Travels', email: 'vrl@gmail.com', password: 'Vrl@123', approved: true, status: 'ACTIVE', createdAt: '2026-01-05' },
    { providerId: 'P006', name: 'Parveen Travels', email: 'parveen@gmail.com', password: 'Parveen@123', approved: true, status: 'ACTIVE', createdAt: '2026-01-06' },
    { providerId: 'P007', name: 'Kaveri Travels', email: 'kaveri@gmail.com', password: 'Kaveri@123', approved: false, status: 'INACTIVE', createdAt: '2026-01-07' },
    { providerId: 'P008', name: 'Jabbar Travels', email: 'jabbar@gmail.com', password: 'Jabbar@123', approved: true, status: 'ACTIVE', createdAt: '2026-01-08' },
    { providerId: 'P009', name: 'Suresh Travels', email: 'suresh@gmail.com', password: 'Suresh@123', approved: true, status: 'ACTIVE', createdAt: '2026-01-09' },
    { providerId: 'P010', name: 'Ganesh Travels', email: 'ganesh@gmail.com', password: 'Ganesh@123', approved: true, status: 'ACTIVE', createdAt: '2026-01-10' },
  ];

  create(data: Omit<Provider, 'providerId' | 'approved'>): Provider {
    const p: Provider = { providerId: generateId('P'), ...data, approved: false, status: 'INACTIVE', createdAt: new Date().toISOString().split('T')[0] };
    this.providers.push(p);
    return p;
  }

  findAll(): Provider[] { return this.providers; }
  findById(providerId: string): Provider | undefined { return this.providers.find(p => p.providerId === providerId); }
  findByEmail(email: string): Provider | undefined { return this.providers.find(p => p.email === email); }

  update(providerId: string, data: Partial<Provider>): Provider | undefined {
    const i = this.providers.findIndex(p => p.providerId === providerId);
    if (i === -1) return undefined;
    this.providers[i] = { ...this.providers[i], ...data };
    return this.providers[i];
  }

  remove(providerId: string): boolean {
    const i = this.providers.findIndex(p => p.providerId === providerId);
    if (i === -1) return false;
    this.providers.splice(i, 1);
    return true;
  }
}
