import { Injectable } from '@nestjs/common';
import { Provider } from './interfaces/provider.interface';
import { generateId } from '../../common/utils/id.util';

@Injectable()
export class ProviderRepository {
  private providers: Provider[] = [
    { providerId: 'P001', name: 'APSRTC Travels', email: 'apsrtc@example.com', password: 'hashed_p1', approved: true },
    { providerId: 'P002', name: 'KPN Tours', email: 'kpn@example.com', password: 'hashed_p2', approved: true },
    { providerId: 'P003', name: 'Orange Travels', email: 'orange@example.com', password: 'hashed_p3', approved: false },
  ];

  create(data: Omit<Provider, 'providerId' | 'approved'>): Provider {
    const p: Provider = { providerId: generateId('P'), ...data, approved: false };
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
