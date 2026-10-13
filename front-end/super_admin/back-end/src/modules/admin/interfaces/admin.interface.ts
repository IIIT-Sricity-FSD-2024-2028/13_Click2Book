export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'FINANCE' | 'SUPPORT_LEAD';
export type AdminStatus = 'ACTIVE' | 'INACTIVE';

/** What an admin account may do in the console. SUPER_ADMIN has all of them. */
export const ADMIN_PERMISSIONS = [
  'MANAGE_ADMINS',
  'MANAGE_PROVIDERS',
  'MANAGE_CUSTOMERS',
  'MANAGE_BOOKINGS',
  'VIEW_REPORTS',
  'MANAGE_FINANCE',
  'MANAGE_SUPPORT',
  'MANAGE_SETTINGS',
] as const;
export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export const ADMIN_ROLES: AdminRole[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'FINANCE',
  'SUPPORT_LEAD',
];

/** Default permission set for each role. */
export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  SUPER_ADMIN: [...ADMIN_PERMISSIONS],
  ADMIN: [
    'MANAGE_PROVIDERS',
    'MANAGE_CUSTOMERS',
    'MANAGE_BOOKINGS',
    'VIEW_REPORTS',
    'MANAGE_SUPPORT',
  ],
  FINANCE: ['VIEW_REPORTS', 'MANAGE_FINANCE'],
  SUPPORT_LEAD: ['MANAGE_SUPPORT', 'MANAGE_BOOKINGS'],
};

export interface Admin {
  adminId: string;
  name: string;
  email: string;
  password: string;
  role: AdminRole;
  permissions: AdminPermission[];
  status: AdminStatus;
  createdAt: string;
  lastLoginAt?: string;
}
