import { Injectable } from '@nestjs/common';
import { Location, LocationRequest } from './interfaces/location.interface';
import { generateId } from '../../common/utils/id.util';

@Injectable()
export class LocationRepository {
  // Predefined popular Indian cities with OSM attributes
  private locations: Location[] = [
    {
      locationId: 'LOC001',
      name: 'Hyderabad',
      displayName: 'Hyderabad, Telangana, India',
      osmId: '7998901',
      osmType: 'relation',
      locationType: 'city',
      latitude: 17.385044,
      longitude: 78.486671,
      state: 'Telangana',
      address: { city: 'Hyderabad', state: 'Telangana', country: 'India' },
      isApproved: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      locationId: 'LOC002',
      name: 'Bangalore',
      displayName: 'Bengaluru, Karnataka, India',
      osmId: '7998902',
      osmType: 'relation',
      locationType: 'city',
      latitude: 12.971599,
      longitude: 77.594566,
      state: 'Karnataka',
      address: { city: 'Bengaluru', state: 'Karnataka', country: 'India' },
      isApproved: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      locationId: 'LOC003',
      name: 'Chennai',
      displayName: 'Chennai, Tamil Nadu, India',
      osmId: '7998903',
      osmType: 'relation',
      locationType: 'city',
      latitude: 13.082680,
      longitude: 80.270721,
      state: 'Tamil Nadu',
      address: { city: 'Chennai', state: 'Tamil Nadu', country: 'India' },
      isApproved: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      locationId: 'LOC004',
      name: 'Mumbai',
      displayName: 'Mumbai, Maharashtra, India',
      osmId: '7998904',
      osmType: 'relation',
      locationType: 'city',
      latitude: 19.076090,
      longitude: 72.877426,
      state: 'Maharashtra',
      address: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
      isApproved: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      locationId: 'LOC005',
      name: 'Pune',
      displayName: 'Pune, Maharashtra, India',
      osmId: '7998905',
      osmType: 'relation',
      locationType: 'city',
      latitude: 18.520430,
      longitude: 73.856743,
      state: 'Maharashtra',
      address: { city: 'Pune', state: 'Maharashtra', country: 'India' },
      isApproved: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      locationId: 'LOC006',
      name: 'Delhi',
      displayName: 'New Delhi, Delhi, India',
      osmId: '7998906',
      osmType: 'relation',
      locationType: 'city',
      latitude: 28.613939,
      longitude: 77.209023,
      state: 'Delhi',
      address: { city: 'New Delhi', state: 'Delhi', country: 'India' },
      isApproved: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      locationId: 'LOC007',
      name: 'Jaipur',
      displayName: 'Jaipur, Rajasthan, India',
      osmId: '7998907',
      osmType: 'relation',
      locationType: 'city',
      latitude: 26.912434,
      longitude: 75.787270,
      state: 'Rajasthan',
      address: { city: 'Jaipur', state: 'Rajasthan', country: 'India' },
      isApproved: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      locationId: 'LOC008',
      name: 'Coimbatore',
      displayName: 'Coimbatore, Tamil Nadu, India',
      osmId: '7998908',
      osmType: 'relation',
      locationType: 'city',
      latitude: 11.016844,
      longitude: 76.955833,
      state: 'Tamil Nadu',
      address: { city: 'Coimbatore', state: 'Tamil Nadu', country: 'India' },
      isApproved: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      locationId: 'LOC009',
      name: 'Madurai',
      displayName: 'Madurai, Tamil Nadu, India',
      osmId: '7998909',
      osmType: 'relation',
      locationType: 'city',
      latitude: 9.925201,
      longitude: 78.119774,
      state: 'Tamil Nadu',
      address: { city: 'Madurai', state: 'Tamil Nadu', country: 'India' },
      isApproved: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      locationId: 'LOC010',
      name: 'Mysore',
      displayName: 'Mysuru, Karnataka, India',
      osmId: '7998910',
      osmType: 'relation',
      locationType: 'city',
      latitude: 12.295810,
      longitude: 76.639381,
      state: 'Karnataka',
      address: { city: 'Mysuru', state: 'Karnataka', country: 'India' },
      isApproved: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      locationId: 'LOC011',
      name: 'Nellore',
      displayName: 'Nellore, Andhra Pradesh, India',
      osmId: '7998911',
      osmType: 'relation',
      locationType: 'city',
      latitude: 14.442599,
      longitude: 79.986458,
      state: 'Andhra Pradesh',
      address: { city: 'Nellore', state: 'Andhra Pradesh', country: 'India' },
      isApproved: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      locationId: 'LOC012',
      name: 'SriCity',
      displayName: 'Sri City, Tirupati District, Andhra Pradesh, India',
      osmId: '7998912',
      osmType: 'node',
      locationType: 'town',
      latitude: 13.529000,
      longitude: 80.026000,
      state: 'Andhra Pradesh',
      address: { town: 'Sri City', state: 'Andhra Pradesh', country: 'India' },
      isApproved: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      locationId: 'LOC013',
      name: 'Tada',
      displayName: 'Tada, Tirupati District, Andhra Pradesh, India',
      osmId: '7998913',
      osmType: 'node',
      locationType: 'town',
      latitude: 13.590000,
      longitude: 80.030000,
      state: 'Andhra Pradesh',
      address: { town: 'Tada', state: 'Andhra Pradesh', country: 'India' },
      isApproved: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      locationId: 'LOC014',
      name: 'Tirupati',
      displayName: 'Tirupati, Andhra Pradesh, India',
      osmId: '7998914',
      osmType: 'relation',
      locationType: 'city',
      latitude: 13.628756,
      longitude: 79.419174,
      state: 'Andhra Pradesh',
      address: { city: 'Tirupati', state: 'Andhra Pradesh', country: 'India' },
      isApproved: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      locationId: 'LOC015',
      name: 'Vijayawada',
      displayName: 'Vijayawada, Andhra Pradesh, India',
      osmId: '7998915',
      osmType: 'relation',
      locationType: 'city',
      latitude: 16.506174,
      longitude: 80.648018,
      state: 'Andhra Pradesh',
      address: { city: 'Vijayawada', state: 'Andhra Pradesh', country: 'India' },
      isApproved: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      locationId: 'LOC016',
      name: 'Visakhapatnam',
      displayName: 'Visakhapatnam, Andhra Pradesh, India',
      osmId: '7998916',
      osmType: 'relation',
      locationType: 'city',
      latitude: 17.686816,
      longitude: 83.218483,
      state: 'Andhra Pradesh',
      address: { city: 'Visakhapatnam', state: 'Andhra Pradesh', country: 'India' },
      isApproved: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      locationId: 'LOC017',
      name: 'Goa',
      displayName: 'Panaji, Goa, India',
      osmId: '7998917',
      osmType: 'relation',
      locationType: 'administrative',
      latitude: 15.490930,
      longitude: 73.827850,
      state: 'Goa',
      address: { city: 'Panaji', state: 'Goa', country: 'India' },
      isApproved: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      locationId: 'LOC018',
      name: 'Kolkata',
      displayName: 'Kolkata, West Bengal, India',
      osmId: '7998918',
      osmType: 'relation',
      locationType: 'city',
      latitude: 22.572645,
      longitude: 88.363892,
      state: 'West Bengal',
      address: { city: 'Kolkata', state: 'West Bengal', country: 'India' },
      isApproved: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      locationId: 'LOC019',
      name: 'Ahmedabad',
      displayName: 'Ahmedabad, Gujarat, India',
      osmId: '7998919',
      osmType: 'relation',
      locationType: 'city',
      latitude: 23.022505,
      longitude: 72.571365,
      state: 'Gujarat',
      address: { city: 'Ahmedabad', state: 'Gujarat', country: 'India' },
      isApproved: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      locationId: 'LOC020',
      name: 'Surat',
      displayName: 'Surat, Gujarat, India',
      osmId: '7998920',
      osmType: 'relation',
      locationType: 'city',
      latitude: 21.170240,
      longitude: 72.831062,
      state: 'Gujarat',
      address: { city: 'Surat', state: 'Gujarat', country: 'India' },
      isApproved: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  // Location Requests
  private requests: LocationRequest[] = [
    {
      requestId: 'REQ001',
      osmId: '30491024',
      osmType: 'relation',
      name: 'Warangal',
      displayName: 'Warangal, Warangal Urban, Telangana, 506002, India',
      locationType: 'city',
      latitude: 17.9689,
      longitude: 79.5941,
      state: 'Telangana',
      address: { city: 'Warangal', district: 'Warangal Urban', state: 'Telangana', country: 'India' },
      providerId: 'P001',
      providerName: 'Kiran Travels',
      connectingRoutes: 'Hyderabad ↔ Warangal',
      reason: 'High volume commuter corridor with IT and engineering university students',
      status: 'PENDING',
      requestedAt: '2026-11-10T10:30:00.000Z',
    },
    {
      requestId: 'REQ002',
      osmId: '45892110',
      osmType: 'relation',
      name: 'Khammam',
      displayName: 'Khammam, Khammam District, Telangana, 507001, India',
      locationType: 'city',
      latitude: 17.2473,
      longitude: 80.1514,
      state: 'Telangana',
      address: { city: 'Khammam', state: 'Telangana', country: 'India' },
      providerId: 'P002',
      providerName: 'KPN Tours',
      connectingRoutes: 'Hyderabad ↔ Khammam',
      reason: 'Direct passenger express service demand',
      status: 'PENDING',
      requestedAt: '2026-11-11T14:15:00.000Z',
    },
    {
      requestId: 'REQ003',
      osmId: '68912301',
      osmType: 'node',
      name: 'Koyambedu CMBT Bus Terminus',
      displayName: 'Chennai Mofussil Bus Terminus, Koyambedu, Chennai, Tamil Nadu, 600107, India',
      locationType: 'bus_stop',
      latitude: 13.0673,
      longitude: 80.1918,
      state: 'Tamil Nadu',
      address: { bus_stop: 'CMBT', suburb: 'Koyambedu', city: 'Chennai', state: 'Tamil Nadu', country: 'India' },
      providerId: 'P001',
      providerName: 'Kiran Travels',
      connectingRoutes: 'SriCity ↔ Chennai CMBT',
      reason: 'Primary transit hub for intercity drop-offs in Chennai',
      status: 'APPROVED',
      requestedAt: '2026-11-05T09:00:00.000Z',
      decidedAt: '2026-11-06T11:00:00.000Z',
      decidedBy: 'A001',
    },
  ];

  /* ── Approved Locations ── */

  findAllApproved(search?: string): Location[] {
    if (!search || !search.trim()) {
      return [...this.locations].sort((a, b) => a.name.localeCompare(b.name));
    }
    const q = search.trim().toLowerCase();
    return this.locations
      .filter((loc) =>
        loc.name.toLowerCase().includes(q) ||
        loc.displayName.toLowerCase().includes(q) ||
        (loc.state && loc.state.toLowerCase().includes(q))
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  findApprovedById(id: string): Location | undefined {
    return this.locations.find((l) => l.locationId === id);
  }

  findApprovedByName(name: string): Location | undefined {
    if (!name) return undefined;
    const clean = name.trim().toLowerCase();
    return this.locations.find((l) => l.name.toLowerCase() === clean);
  }

  findApprovedByOsmId(osmId: string | number): Location | undefined {
    if (!osmId) return undefined;
    const str = String(osmId);
    return this.locations.find((l) => String(l.osmId) === str);
  }

  isApproved(nameOrId: string): boolean {
    if (!nameOrId) return false;
    const clean = nameOrId.trim().toLowerCase();
    return this.locations.some(
      (l) => l.name.toLowerCase() === clean || l.locationId.toLowerCase() === clean
    );
  }

  createApproved(data: Omit<Location, 'locationId' | 'createdAt'>): Location {
    const location: Location = {
      locationId: generateId('LOC'),
      ...data,
      isApproved: true,
      createdAt: new Date().toISOString(),
    };
    this.locations.push(location);
    return location;
  }

  removeApproved(id: string): boolean {
    const idx = this.locations.findIndex((l) => l.locationId === id);
    if (idx === -1) return false;
    this.locations.splice(idx, 1);
    return true;
  }

  /* ── Location Requests ── */

  findAllRequests(status?: string, providerId?: string): LocationRequest[] {
    let result = [...this.requests];
    if (status && status !== 'ALL') {
      result = result.filter((r) => r.status.toUpperCase() === status.toUpperCase());
    }
    if (providerId) {
      result = result.filter((r) => r.providerId === providerId);
    }
    return result.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }

  findRequestById(requestId: string): LocationRequest | undefined {
    return this.requests.find((r) => r.requestId === requestId);
  }

  findPendingRequestByOsmId(osmId: string | number): LocationRequest | undefined {
    const str = String(osmId);
    return this.requests.find((r) => String(r.osmId) === str && r.status === 'PENDING');
  }

  findPendingRequestByName(name: string): LocationRequest | undefined {
    const clean = name.trim().toLowerCase();
    return this.requests.find((r) => r.name.toLowerCase() === clean && r.status === 'PENDING');
  }

  createRequest(data: Omit<LocationRequest, 'requestId' | 'requestedAt' | 'status'>): LocationRequest {
    const request: LocationRequest = {
      requestId: generateId('REQ'),
      ...data,
      status: 'PENDING',
      requestedAt: new Date().toISOString(),
    };
    this.requests.unshift(request);
    return request;
  }

  updateRequest(requestId: string, update: Partial<LocationRequest>): LocationRequest | undefined {
    const idx = this.requests.findIndex((r) => r.requestId === requestId);
    if (idx === -1) return undefined;
    this.requests[idx] = { ...this.requests[idx], ...update };
    return this.requests[idx];
  }
}

