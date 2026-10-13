import { BadRequestException, Injectable } from '@nestjs/common';
import {
  ActivityEntry,
  DEFAULT_SETTINGS,
  PlatformSettings,
} from './platform-settings';
import { successResponse } from '../../common/utils/response.util';

const MAX_ACTIVITY = 500;

type Section = Exclude<keyof PlatformSettings, 'updatedAt' | 'updatedBy'>;
const SECTIONS: Section[] = [
  'booking',
  'cancellation',
  'fees',
  'notifications',
  'security',
];

/** Numeric limits: [min, max]. */
const LIMITS: Record<string, [number, number]> = {
  'booking.maxSeatsPerBooking': [1, 10],
  'booking.bookingWindowDays': [1, 365],
  'cancellation.cancellationFee': [0, 10000],
  'cancellation.refundPercent': [0, 100],
  'fees.convenienceFee': [0, 5000],
  'fees.gstPercent': [0, 28],
  'security.maxLoginAttempts': [1, 20],
  'security.lockoutMinutes': [1, 1440],
};

const ENUMS: Record<string, string[]> = {
  'notifications.announcementLevel': ['info', 'warning', 'success'],
  'notifications.audience': ['ALL', 'CUSTOMER', 'PROVIDER', 'SUPPORT'],
};

@Injectable()
export class PlatformService {
  private settings: PlatformSettings = JSON.parse(
    JSON.stringify(DEFAULT_SETTINGS),
  );
  private activity: ActivityEntry[] = [];
  private seq = 0;
  private failedLogins = new Map<
    string,
    { count: number; lockedUntil: number }
  >();

  /* ── Settings ── */
  get(): PlatformSettings {
    return this.settings;
  }

  getSettings() {
    return successResponse('Platform settings', this.settings);
  }

  /**
   * Validates and merges a partial settings object. Unknown keys and wrong
   * types are rejected so a typo cannot silently disable a policy.
   */
  updateSettings(patch: any, actor = 'admin') {
    if (!patch || typeof patch !== 'object' || Array.isArray(patch))
      throw new BadRequestException('Settings body must be an object');
    const next: PlatformSettings = JSON.parse(JSON.stringify(this.settings));
    for (const [section, values] of Object.entries(patch)) {
      if (!SECTIONS.includes(section as Section))
        throw new BadRequestException(`Unknown settings section "${section}"`);
      if (!values || typeof values !== 'object')
        throw new BadRequestException(`"${section}" must be an object`);
      const target = next[section as Section] as Record<string, unknown>;
      for (const [key, value] of Object.entries(
        values as Record<string, unknown>,
      )) {
        const path = `${section}.${key}`;
        if (!(key in target))
          throw new BadRequestException(`Unknown setting "${path}"`);
        const expected = typeof target[key];
        if (typeof value !== expected)
          throw new BadRequestException(`"${path}" must be a ${expected}`);
        if (expected === 'number') {
          const [min, max] = LIMITS[path] ?? [0, Number.MAX_SAFE_INTEGER];
          if (
            !Number.isFinite(value) ||
            (value as number) < min ||
            (value as number) > max
          )
            throw new BadRequestException(
              `"${path}" must be between ${min} and ${max}`,
            );
        }
        if (ENUMS[path] && !ENUMS[path].includes(value as string))
          throw new BadRequestException(
            `"${path}" must be one of ${ENUMS[path].join(', ')}`,
          );
        if (
          path === 'notifications.announcement' &&
          (value as string).length > 280
        )
          throw new BadRequestException(
            'Announcement must be 280 characters or fewer',
          );
        target[key] = value;
      }
    }
    next.updatedAt = new Date().toISOString();
    next.updatedBy = actor;
    this.settings = next;
    return successResponse('Settings saved', this.settings);
  }

  resetSettings(actor = 'admin') {
    this.settings = {
      ...JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
      updatedAt: new Date().toISOString(),
      updatedBy: actor,
    };
    return successResponse('Settings reset to defaults', this.settings);
  }

  /* ── Admin activity ── */
  record(entry: Omit<ActivityEntry, 'id' | 'at'>) {
    this.activity.unshift({
      id: `ACT${String(++this.seq).padStart(5, '0')}`,
      at: new Date().toISOString(),
      ...entry,
    });
    if (this.activity.length > MAX_ACTIVITY)
      this.activity.length = MAX_ACTIVITY;
  }

  getActivity(limit = 200) {
    return successResponse('Admin activity', this.activity.slice(0, limit));
  }

  /* ── Login lockout (security.maxLoginAttempts / lockoutMinutes) ── */
  assertNotLocked(email: string) {
    const rec = this.failedLogins.get(email.toLowerCase());
    if (rec && rec.lockedUntil > Date.now()) {
      const mins = Math.ceil((rec.lockedUntil - Date.now()) / 60000);
      throw new BadRequestException(
        `Too many failed attempts. Try again in ${mins} minute${mins > 1 ? 's' : ''}.`,
      );
    }
  }

  loginFailed(email: string) {
    const key = email.toLowerCase();
    const rec = this.failedLogins.get(key) ?? { count: 0, lockedUntil: 0 };
    if (rec.lockedUntil && rec.lockedUntil <= Date.now()) rec.count = 0;
    rec.count += 1;
    if (rec.count >= this.settings.security.maxLoginAttempts) {
      rec.lockedUntil =
        Date.now() + this.settings.security.lockoutMinutes * 60000;
      rec.count = 0;
    }
    this.failedLogins.set(key, rec);
  }

  loginSucceeded(email: string) {
    this.failedLogins.delete(email.toLowerCase());
  }
}
