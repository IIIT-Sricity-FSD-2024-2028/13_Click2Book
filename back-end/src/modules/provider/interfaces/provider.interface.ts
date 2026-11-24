export interface Provider {
  providerId: string;
  name: string;
  email: string;
  password: string;
  approved: boolean;
  status?: 'ACTIVE' | 'INACTIVE';
  authVersion?: number;
  phoneNumber?: string;
  createdAt?: string;
}
