export interface Provider {
  providerId: string;
  name: string;
  email: string;
  password: string;
  approved: boolean;
  status?: 'ACTIVE' | 'INACTIVE';
  phoneNumber?: string;
  createdAt?: string;
}
