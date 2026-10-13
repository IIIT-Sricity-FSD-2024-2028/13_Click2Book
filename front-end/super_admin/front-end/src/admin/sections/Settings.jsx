import { useState } from 'react';
import { Card } from '../components/ui';
import { adminActions, formatINR } from '../lib/adminData';

const Num = ({ id, label, value, onChange, min, max, step = 1, hint }) => (
  <label>
    {label}
    <input id={id} type="number" min={min} max={max} step={step} value={value} onChange={(e) => onChange(e.target.value)} />
    {hint && <small>{hint}</small>}
  </label>
);

const Toggle = ({ id, label, checked, onChange, hint, danger }) => (
  <label className={'toggle-row' + (danger && checked ? ' danger' : '')}>
    <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    <span className="toggle-ui" />
    <span>
      {label}
      {hint && <small>{hint}</small>}
    </span>
  </label>
);

/** Numeric fields per section (sent as numbers). */
const NUMERIC = {
  booking: ['maxSeatsPerBooking', 'bookingWindowDays'],
  cancellation: ['cancellationFee', 'refundPercent'],
  fees: ['convenienceFee', 'gstPercent'],
  security: ['maxLoginAttempts', 'lockoutMinutes'],
};

export default function Settings({ ctx }) {
  const saved = ctx.data.settings;
  const [f, setF] = useState(() => (saved ? JSON.parse(JSON.stringify(saved)) : null));
  const [error, setError] = useState('');
  if (!saved || !f) return <Card title="Platform Settings">Platform settings need the backend (port 3000).</Card>;

  const set = (section, key) => (value) => setF((x) => ({ ...x, [section]: { ...x[section], [key]: value } }));
  const dirty = JSON.stringify(f) !== JSON.stringify(saved);

  const save = () => {
    const patch = {};
    for (const section of ['booking', 'cancellation', 'fees', 'notifications', 'security']) {
      patch[section] = { ...f[section] };
      for (const k of NUMERIC[section] || []) {
        const n = Number(patch[section][k]);
        if (patch[section][k] === '' || !Number.isFinite(n)) return setError(`Enter a number for ${k}.`);
        patch[section][k] = n;
      }
    }
    if (
      patch.security.maintenanceMode &&
      !saved.security.maintenanceMode &&
      !window.confirm('Turn on maintenance mode? Customers will not be able to book or register until it is turned off.')
    )
      return;
    setError('');
    ctx.act('settings', 'Platform settings saved.', () => adminActions.saveSettings(patch));
  };

  const reset = () =>
    ctx.act(
      'settings',
      'Settings restored to defaults.',
      () => adminActions.resetSettings(),
      'Restore every platform setting to its default value?',
    );

  const sample = 1000;
  const refund = Math.max(0, (sample * Number(f.cancellation.refundPercent || 0)) / 100 - Number(f.cancellation.cancellationFee || 0));

  return (
    <div id="settingsSection">
      <div className="settings-bar">
        <span className="muted">
          Last saved{' '}
          {saved.updatedAt.startsWith('1970')
            ? 'never (defaults)'
            : `${saved.updatedAt.replace('T', ' ').slice(0, 16)} by ${saved.updatedBy}`}
        </span>
        {error && <span className="form-error inline">⚠️ {error}</span>}
        <button className="action-btn btn-ghost" id="resetSettingsBtn" onClick={reset} disabled={ctx.busy === 'settings'}>
          Restore defaults
        </button>
        <button className="action-btn btn-ghost" onClick={() => setF(JSON.parse(JSON.stringify(saved)))} disabled={!dirty}>
          Discard changes
        </button>
        <button className="action-btn btn-primary" id="saveSettingsBtn" onClick={save} disabled={!dirty || ctx.busy === 'settings'}>
          {dirty ? 'Save settings' : 'Saved'}
        </button>
      </div>

      <div className="two-col">
        <Card title="📅 Booking Policy">
          <div className="form-grid">
            <Num
              id="setMaxSeats"
              label="Max seats per customer per trip"
              value={f.booking.maxSeatsPerBooking}
              onChange={set('booking', 'maxSeatsPerBooking')}
              min={1}
              max={10}
              hint="Enforced on the seat map and by the booking API"
            />
            <Num
              id="setWindow"
              label="Booking window (days ahead)"
              value={f.booking.bookingWindowDays}
              onChange={set('booking', 'bookingWindowDays')}
              min={1}
              max={365}
              hint="Latest travel date customers can pick"
            />
          </div>
          <Toggle
            id="setGuestSearch"
            label="Allow searching without logging in"
            checked={f.booking.allowGuestSearch}
            onChange={set('booking', 'allowGuestSearch')}
          />
        </Card>

        <Card title="↩️ Cancellation & Refund Rules">
          <Toggle
            id="setAllowCancel"
            label="Allow customers to cancel tickets"
            checked={f.cancellation.allowCancellation}
            onChange={set('cancellation', 'allowCancellation')}
          />
          <div className="form-grid">
            <Num
              id="setRefundPct"
              label="Refund (% of fare)"
              value={f.cancellation.refundPercent}
              onChange={set('cancellation', 'refundPercent')}
              min={0}
              max={100}
            />
            <Num
              id="setCancelFee"
              label="Cancellation fee (₹)"
              value={f.cancellation.cancellationFee}
              onChange={set('cancellation', 'cancellationFee')}
              min={0}
              max={10000}
            />
          </div>
          <p className="card-note">
            On a {formatINR(sample)} ticket the customer gets back <strong>{formatINR(refund)}</strong>.
          </p>
        </Card>

        <Card title="💰 Platform Fees">
          <div className="form-grid">
            <Num
              id="setConvFee"
              label="Convenience fee per booking (₹)"
              value={f.fees.convenienceFee}
              onChange={set('fees', 'convenienceFee')}
              min={0}
              max={5000}
              hint="Added at checkout"
            />
            <Num
              id="setGst"
              label="GST (%)"
              value={f.fees.gstPercent}
              onChange={set('fees', 'gstPercent')}
              min={0}
              max={28}
              step={0.5}
              hint="Charged on the fare at checkout"
            />
          </div>
          <p className="card-note">Platform commission on operator fares is set under Finance → Commission &amp; Fees.</p>
        </Card>

        <Card title="📣 System-wide Notification">
          <label className="block-label">
            Announcement banner (empty = no banner)
            <textarea
              id="setAnnouncement"
              rows={3}
              maxLength={280}
              value={f.notifications.announcement}
              onChange={(e) => set('notifications', 'announcement')(e.target.value)}
              placeholder="e.g. Services between Hyderabad and Vijayawada are delayed due to heavy rain."
            />
            <small>{f.notifications.announcement.length}/280</small>
          </label>
          <div className="form-grid">
            <label>
              Style
              <select
                id="setAnnLevel"
                value={f.notifications.announcementLevel}
                onChange={(e) => set('notifications', 'announcementLevel')(e.target.value)}
              >
                <option value="info">Info (blue)</option>
                <option value="warning">Warning (amber)</option>
                <option value="success">Good news (green)</option>
              </select>
            </label>
            <label>
              Show to
              <select
                id="setAnnAudience"
                value={f.notifications.audience}
                onChange={(e) => set('notifications', 'audience')(e.target.value)}
              >
                <option value="ALL">Everyone</option>
                <option value="CUSTOMER">Customers</option>
                <option value="PROVIDER">Providers</option>
                <option value="SUPPORT">Support staff</option>
              </select>
            </label>
          </div>
          {f.notifications.announcement && (
            <div className={`announce-preview ${f.notifications.announcementLevel}`}>📣 {f.notifications.announcement}</div>
          )}
        </Card>

        <Card title="🔒 Security & Access">
          <Toggle
            id="setMaintenance"
            label="Maintenance mode"
            hint="Pauses all new bookings and registrations"
            danger
            checked={f.security.maintenanceMode}
            onChange={set('security', 'maintenanceMode')}
          />
          <Toggle
            id="setCustReg"
            label="Allow new customer sign-ups"
            checked={f.security.allowCustomerRegistration}
            onChange={set('security', 'allowCustomerRegistration')}
          />
          <Toggle
            id="setProvReg"
            label="Allow new provider registrations"
            checked={f.security.allowProviderRegistration}
            onChange={set('security', 'allowProviderRegistration')}
          />
          <div className="form-grid">
            <Num
              id="setMaxAttempts"
              label="Failed logins before lock"
              value={f.security.maxLoginAttempts}
              onChange={set('security', 'maxLoginAttempts')}
              min={1}
              max={20}
            />
            <Num
              id="setLockout"
              label="Lockout duration (minutes)"
              value={f.security.lockoutMinutes}
              onChange={set('security', 'lockoutMinutes')}
              min={1}
              max={1440}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
