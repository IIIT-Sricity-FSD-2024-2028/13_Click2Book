import { BadRequestException, Injectable } from '@nestjs/common';
import { SyncService } from '../sync/sync.service';

/**
 * Platform-wide settings edited by the Super Admin (fees, refund rules,
 * booking limits, announcements). Kept in memory like the other repositories.
 * Every change is broadcast on the sync stream so open portals refresh.
 */
const DEFAULTS = {
  booking: { maxSeatsPerBooking: 4, bookingWindowDays: 60, allowGuestSearch: true },
  cancellation: { allowCancellation: true, cancellationFee: 50, refundPercent: 100 },
  fees: { convenienceFee: 25, gstPercent: 18 },
  notifications: { announcement: '', announcementLevel: 'info', audience: 'ALL' },
  security: {
    maintenanceMode: false,
    allowCustomerRegistration: true,
    allowProviderRegistration: true,
    maxLoginAttempts: 5,
    lockoutMinutes: 15,
  },
};

type Settings = typeof DEFAULTS & { updatedAt?: string; updatedBy?: string };

/** [section, key, min, max] for numeric settings. */
const NUMERIC_LIMITS: [string, string, number, number][] = [
  ['booking', 'maxSeatsPerBooking', 1, 20],
  ['booking', 'bookingWindowDays', 1, 365],
  ['cancellation', 'cancellationFee', 0, 10000],
  ['cancellation', 'refundPercent', 0, 100],
  ['fees', 'convenienceFee', 0, 5000],
  ['fees', 'gstPercent', 0, 28],
  ['security', 'maxLoginAttempts', 1, 20],
  ['security', 'lockoutMinutes', 1, 1440],
];

@Injectable()
export class PlatformService {
  private settings: Settings = JSON.parse(JSON.stringify(DEFAULTS));

  constructor(private readonly syncService: SyncService) {}

  get(): Settings {
    return this.settings;
  }

  update(patch: Record<string, any>, updatedBy = 'Super Admin'): Settings {
    if (!patch || typeof patch !== 'object') throw new BadRequestException('Settings body must be an object');

    const next: any = JSON.parse(JSON.stringify(this.settings));
    for (const [section, values] of Object.entries(patch)) {
      if (!(section in DEFAULTS)) throw new BadRequestException(`Unknown settings section "${section}"`);
      if (!values || typeof values !== 'object') throw new BadRequestException(`"${section}" must be an object`);
      for (const [key, value] of Object.entries(values)) {
        const base = (DEFAULTS as any)[section];
        if (!(key in base)) throw new BadRequestException(`Unknown setting "${section}.${key}"`);
        if (typeof value !== typeof base[key]) {
          throw new BadRequestException(`"${section}.${key}" must be a ${typeof base[key]}`);
        }
        next[section][key] = value;
      }
    }

    for (const [section, key, min, max] of NUMERIC_LIMITS) {
      const n = next[section][key];
      if (!Number.isFinite(n) || n < min || n > max) {
        throw new BadRequestException(`"${section}.${key}" must be between ${min} and ${max}`);
      }
    }

    next.updatedAt = new Date().toISOString();
    next.updatedBy = updatedBy;
    this.settings = next;
    this.syncService.emit('PLATFORM_SETTINGS_UPDATED', this.settings);
    return this.settings;
  }
}
