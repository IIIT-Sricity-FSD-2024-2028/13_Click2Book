export interface SupportStaff {
  supporterId: string;
  name: string;
  email: string;
  password: string;
  status?: 'ACTIVE' | 'INACTIVE';
  authVersion?: number;
  createdAt?: string;
  phoneNumber?: string;
  role?: string;
}
