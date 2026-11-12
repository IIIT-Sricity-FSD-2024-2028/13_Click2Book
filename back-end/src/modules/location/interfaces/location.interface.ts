export interface LocationAddress {
  city?: string;
  town?: string;
  village?: string;
  suburb?: string;
  county?: string;
  district?: string;
  state?: string;
  country?: string;
  postcode?: string;
  [key: string]: any;
}

export interface Location {
  locationId: string;
  name: string;
  displayName: string;
  osmId: string | number;
  osmType?: string;
  locationType: string; // 'city' | 'town' | 'bus_stop' | 'suburb' | 'administrative' | 'station'
  latitude: number;
  longitude: number;
  address?: LocationAddress;
  state?: string;
  isApproved: boolean;
  createdAt: string;
}

export type LocationRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface LocationRequest {
  requestId: string;
  osmId: string | number;
  osmType?: string;
  name: string;
  displayName: string;
  locationType: string;
  latitude: number;
  longitude: number;
  address?: LocationAddress;
  state?: string;
  providerId: string;
  providerName: string;
  connectingRoutes?: string;
  reason?: string;
  status: LocationRequestStatus;
  requestedAt: string;
  decidedAt?: string;
  decidedBy?: string;
  rejectionReason?: string;
}

