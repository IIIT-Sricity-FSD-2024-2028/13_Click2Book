/** Platform-wide settings managed by the Super Admin. Kept in memory like the rest of the demo data. */
export interface PlatformSettings {
  booking: {
    maxSeatsPerBooking: number; // seats one customer may hold on a single trip
    bookingWindowDays: number; // how far ahead customers may book
    allowGuestSearch: boolean; // search without logging in
  };
  cancellation: {
    allowCancellation: boolean;
    cancellationFee: number; // flat ₹ deducted from every refund
    refundPercent: number; // % of the fare refunded before the fee
  };
  fees: {
    convenienceFee: number; // flat ₹ per booking
    gstPercent: number;
  };
  notifications: {
    announcement: string; // banner text; empty = no banner
    announcementLevel: 'info' | 'warning' | 'success';
    audience: 'ALL' | 'CUSTOMER' | 'PROVIDER' | 'SUPPORT';
  };
  security: {
    maintenanceMode: boolean; // blocks new bookings and registrations
    allowCustomerRegistration: boolean;
    allowProviderRegistration: boolean;
    maxLoginAttempts: number; // failed attempts before a temporary lock
    lockoutMinutes: number;
  };
  updatedAt: string;
  updatedBy: string;
}

export const DEFAULT_SETTINGS: PlatformSettings = {
  booking: {
    maxSeatsPerBooking: 4,
    bookingWindowDays: 60,
    allowGuestSearch: true,
  },
  cancellation: {
    allowCancellation: true,
    cancellationFee: 50,
    refundPercent: 100,
  },
  fees: { convenienceFee: 25, gstPercent: 18 },
  notifications: {
    announcement: '',
    announcementLevel: 'info',
    audience: 'ALL',
  },
  security: {
    maintenanceMode: false,
    allowCustomerRegistration: true,
    allowProviderRegistration: true,
    maxLoginAttempts: 5,
    lockoutMinutes: 15,
  },
  updatedAt: '1970-01-01T00:00:00.000Z',
  updatedBy: 'system',
};

export interface ActivityEntry {
  id: string;
  at: string;
  actor: string; // admin email when the client sends x-admin-email, else the role
  role: string;
  method: string;
  path: string;
  status: number;
  action: string; // human-readable summary
}
