import { useState } from 'react';
import BrandMark from '../components/BrandMark.jsx';
import { EMAIL_PATTERN } from '../lib/format.js';
import { DASHBOARD_PATH, SUPER_USER_AUTH_KEY } from '../lib/session.js';
import '../styles/super-user-login.css';

const CREDENTIALS = [
  ['superuser@click2book.com', 'super123'],
  ['superadmin@click2book.com', 'SuperAdmin@123'],
  ['admin@click2book.com', 'Admin@123'],
];

// Return to the page that sent us here (any portal on this host) with the
// panel auto-open flag set; fall back to the admin dashboard.
function redirectTarget() {
  let target;
  try {
    const referrer = document.referrer ? new URL(document.referrer) : null;
    const canReturnToReferrer = referrer
      && referrer.origin === location.origin
      && referrer.pathname !== '/'
      && !referrer.pathname.endsWith('/super-user-login.html');
    target = canReturnToReferrer ? referrer : new URL(DASHBOARD_PATH, location.origin);
  } catch {
    target = new URL(DASHBOARD_PATH, location.origin);
  }
  target.searchParams.set('superUser', 'open');
  return target.href;
}

export default function SuperUserLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = (event) => {
    event.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) return setError('Please enter your supervisor email.');
    if (!EMAIL_PATTERN.test(cleanEmail)) return setError('Please enter a valid email address (e.g. superuser@click2book.com).');
    if (!password) return setError('Please enter your access key.');
    if (password.length < 6) return setError('Access key must be at least 6 characters.');

    const valid = CREDENTIALS.some(([knownEmail, knownPassword]) => knownEmail === cleanEmail.toLowerCase() && knownPassword === password);
    if (!valid) {
      setError('Invalid super user credentials. Please check your email and access key.');
      return;
    }

    setError('');
    setBusy(true);
    sessionStorage.setItem(SUPER_USER_AUTH_KEY, 'true');
    const target = redirectTarget();
    window.setTimeout(() => { location.href = target; }, 800);
  };

  return (
    <div className="page">
      <section className="left">
        <div className="bg-icon" aria-hidden="true">📊</div>
        <div className="left-content">
          <div className="portal-badge">Restricted Access</div>
          <h1 className="left-h">Super User<br />Data Portal</h1>
          <p className="left-sub">Advanced management suite for core system entities, database cleaning, and mock data synchronization.</p>
          <div className="super-features">
            <span>✓ CRUD Master Control</span><span>✓ DB Reset Engine</span>
            <span>✓ Entity Auditing</span><span>✓ Low-Level Access</span>
          </div>
        </div>
      </section>
      <section className="right">
        <form className="form-box" onSubmit={submit}>
          <BrandMark superuser />
          <h2 className="form-title">Super User Login</h2>
          <p className="form-sub">Enter credentials to unlock the management portal.</p>
          {error && <div className="err-msg show" role="alert">{error}</div>}
          <div className="field">
            <label htmlFor="email">Supervisor Email</label>
            <div className="inp-wrap">
              <span className="inp-icon" aria-hidden="true">♙</span>
              <input id="email" className="finput" type="email" autoComplete="username" placeholder="superuser@click2book.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
          </div>
          <div className="field">
            <label htmlFor="password">Access Key</label>
            <div className="inp-wrap">
              <span className="inp-icon" aria-hidden="true">▣</span>
              <input id="password" className="finput" type="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </div>
          </div>
          <button className="btn-login" type="submit" disabled={busy}>{busy ? 'Authenticating…' : 'Unlock Portal'}</button>
          <div className="secure-note"><span className="secure-dot" />End-to-End Encrypted Session</div>
        </form>
        <div className="version-note">SYSTEM VERSION 2.4.0 • PRODUCTION</div>
      </section>
    </div>
  );
}
