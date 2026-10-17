export interface SupportStaff {
  supporterId: string;
  name: string;
  email: string;
  password: string;
  status?: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  phoneNumber?: string;
  role?: string;
}
