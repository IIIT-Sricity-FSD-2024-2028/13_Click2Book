import { useCallback, useEffect, useState } from 'react';
import { revenueRequest } from './revenueMock';
import { DEFAULT_PLATFORM_SETTINGS, loadPlatformSettings } from '../lib/platformSettings';

const inr = (r) => (Number(r) || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });

/** [section, key, label, min, max, step, hint] — limits match the backend's validation. */
const FIELDS = [
  ['fees', 'convenienceFee', 'Convenience fee per booking (₹)', 0, 5000, 1, 'Added at checkout; never refunded'],
  ['fees', 'gstPercent', 'GST (%)', 0, 28, 0.5, 'Charged on the fare at checkout'],
  ['cancellation', 'refundPercent', 'Refund (% of fare)', 0, 100, 1, 'Paid back when a customer cancels'],
  ['cancellation', 'cancellationFee', 'Cancellation fee (₹)', 0, 10000, 1, 'Deducted from every refund'],
];

/** Only these keys are sent; the backend merges them into the rest of the platform settings. */
const toPatch = (values) => {
  const patch = { fees: {}, cancellation: {} };
  for (const [section, key] of FIELDS) patch[section][key] = Number(values[key]);
  return patch;
};
const fromSettings = (s) => Object.fromEntries(FIELDS.map(([section, key]) => [key, String(s[section][key])]));

/**
 * Checkout fees and refund rules from the platform settings — the money part
 * of the settings, which the Admin console no longer edits.
 */
export default function PricingRulesCard() {
  const [saved, setSaved] = useState(null);
  const [f, setF] = useState(null);
  const [message, setMessage] = useState(null); // { text, ok }
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const s = await revenueRequest('/platform/settings', { role: null });
      setSaved(s);
      setF(fromSettings(s));
    } catch (err) {
      setMessage({ text: 'Could not load the platform settings: ' + err.message, ok: false });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const put = async (values, done) => {
    for (const [, key, label, min, max] of FIELDS) {
      const n = Number(values[key]);
      if (values[key] === '' || !Number.isFinite(n) || n < min || n > max)
        return setMessage({ text: `${label} must be between ${min} and ${max}.`, ok: false });
    }
    setBusy(true);
    try {
      const s = await revenueRequest('/platform/settings', {
        role: 'ADMIN',
        method: 'PUT',
        body: toPatch(values),
        headers: { 'x-admin-email': 'Super Admin' },
      });
      setSaved(s);
      setF(fromSettings(s));
      setMessage({ text: done, ok: true });
      loadPlatformSettings(true); // other pages pick up the new fees straight away
    } catch (err) {
      setMessage({ text: 'Failed to save: ' + err.message, ok: false });
    } finally {
      setBusy(false);
    }
  };

  const save = (e) => {
    e.preventDefault();
    put(f, 'Fees and refund rules saved.');
  };
  const restore = () => {
    if (!window.confirm('Restore the fees and refund rules to their default values?')) return;
    put(fromSettings(DEFAULT_PLATFORM_SETTINGS), 'Fees and refund rules restored to defaults.');
  };

  const dirty = saved && f && JSON.stringify(f) !== JSON.stringify(fromSettings(saved));
  const sample = 1000;
  const refund = f ? Math.max(0, (sample * Number(f.refundPercent || 0)) / 100 - Number(f.cancellationFee || 0)) : 0;

  return (
    <div className="card" id="pricingRulesCard">
      <div className="card-title">Checkout Fees & Refund Rules</div>
      <div className="card-sub">
        What customers pay at checkout and get back when they cancel.
        {saved &&
          !saved.updatedAt?.startsWith('1970') &&
          ` Last saved ${saved.updatedAt.replace('T', ' ').slice(0, 16)} by ${saved.updatedBy}.`}
      </div>
      {f && (
        <form id="pricingRulesForm" onSubmit={save}>
          <div className="form-grid">
            {FIELDS.map(([, key, label, min, max, step, hint]) => (
              <div className="field" key={key}>
                <label htmlFor={`pr-${key}`}>{label}</label>
                <input
                  type="number"
                  id={`pr-${key}`}
                  min={min}
                  max={max}
                  step={step}
                  required
                  value={f[key]}
                  onChange={(e) => setF((x) => ({ ...x, [key]: e.target.value }))}
                />
                <small className="hint">{hint}</small>
              </div>
            ))}
          </div>
          <p className="card-note">
            On a {inr(sample)} ticket the customer gets back <strong>{inr(refund)}</strong> when they cancel.
          </p>
          <div className="btn-row">
            <button className="btn btn-primary" type="submit" id="savePricingBtn" disabled={!dirty || busy}>
              {dirty ? 'Save Fees & Rules' : 'Saved'}
            </button>
            <button className="btn btn-ghost" type="button" disabled={!dirty || busy} onClick={() => setF(fromSettings(saved))}>
              Discard changes
            </button>
            <button className="btn btn-ghost" type="button" id="restorePricingBtn" disabled={busy} onClick={restore}>
              Restore defaults
            </button>
          </div>
        </form>
      )}
      {message && (
        <div className={message.ok ? 'ok-box' : 'warning-box'} style={{ display: 'block' }}>
          {message.text}
        </div>
      )}
    </div>
  );
}
