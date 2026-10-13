import { Injectable } from '@nestjs/common';
import { Provider, ProviderDocument } from './interfaces/provider.interface';

/** DEMO document numbers for the seeded operators — placeholders, not real licences. */
function demoDocs(
  id: string,
  status: 'SUBMITTED' | 'VERIFIED',
): ProviderDocument[] {
  return [
    { type: 'Operator Licence', number: `DEMO-OL-${id}`, status },
    { type: 'Stage Carriage Permit', number: `DEMO-SCP-${id}`, status },
    { type: 'GST Registration', number: `DEMO-GST-${id}`, status },
  ];
}
import { generateId } from '../../common/utils/id.util';

@Injectable()
export class ProviderRepository {
  private providers: Provider[] = [
    {
      providerId: 'P001',
      name: 'APSRTC Travels',
      email: 'apsrtc@gmail.com',
      password: 'Apsrtc@123',
      approved: true,
    },
    {
      providerId: 'P002',
      name: 'KPN Tours',
      email: 'kpn@gmail.com',
      password: 'Kpn@123',
      approved: true,
    },
    {
      providerId: 'P003',
      name: 'Orange Travels',
      email: 'orange@gmail.com',
      password: 'Orange@123',
      approved: false,
    },
    {
      providerId: 'P004',
      name: 'SRS Travels',
      email: 'srs@gmail.com',
      password: 'Srs@123',
      approved: true,
    },
    {
      providerId: 'P005',
      name: 'VRL Travels',
      email: 'vrl@gmail.com',
      password: 'Vrl@123',
      approved: true,
    },
    {
      providerId: 'P006',
      name: 'Parveen Travels',
      email: 'parveen@gmail.com',
      password: 'Parveen@123',
      approved: true,
    },
    {
      providerId: 'P007',
      name: 'Kaveri Travels',
      email: 'kaveri@gmail.com',
      password: 'Kaveri@123',
      approved: false,
    },
    {
      providerId: 'P008',
      name: 'Jabbar Travels',
      email: 'jabbar@gmail.com',
      password: 'Jabbar@123',
      approved: true,
    },
    {
      providerId: 'P009',
      name: 'Suresh Travels',
      email: 'suresh@gmail.com',
      password: 'Suresh@123',
      approved: true,
    },
    {
      providerId: 'P010',
      name: 'Ganesh Travels',
      email: 'ganesh@gmail.com',
      password: 'Ganesh@123',
      approved: true,
    },
  ];

  constructor() {
    this.providers = this.providers.map((p, i) => ({
      ...p,
      documents: demoDocs(p.providerId, p.approved ? 'VERIFIED' : 'SUBMITTED'),
      verificationStatus: p.approved ? 'VERIFIED' : 'PENDING',
      joinedAt: `2026-0${1 + (i % 3)}-${String(5 + i).padStart(2, '0')}`,
    }));
  }

  create(data: Omit<Provider, 'providerId' | 'approved'>): Provider {
    const p: Provider = {
      verificationStatus: 'PENDING',
      joinedAt: new Date().toISOString().slice(0, 10),
      ...data,
      providerId: generateId('P'),
      approved: false,
    };
    this.providers.push(p);
    return p;
  }

  findAll(): Provider[] {
    return this.providers;
  }
  findById(providerId: string): Provider | undefined {
    return this.providers.find((p) => p.providerId === providerId);
  }
  findByEmail(email: string): Provider | undefined {
    return this.providers.find(
      (p) => p.email.toLowerCase() === String(email).toLowerCase(),
    );
  }

  update(providerId: string, data: Partial<Provider>): Provider | undefined {
    const i = this.providers.findIndex((p) => p.providerId === providerId);
    if (i === -1) return undefined;
    this.providers[i] = { ...this.providers[i], ...data };
    return this.providers[i];
  }

  remove(providerId: string): boolean {
    const i = this.providers.findIndex((p) => p.providerId === providerId);
    if (i === -1) return false;
    this.providers.splice(i, 1);
    return true;
  }
}
