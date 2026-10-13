import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import useEnterKey from '../hooks/useEnterKey';
import './Login.css';

const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
const SUPER_USERS = [
  { email: 'superuser@click2book.com', password: 'super123' },
  { email: 'superadmin@click2book.com', password: 'SuperAdmin@123' },
  { email: 'admin@click2book.com', password: 'Admin@123' },
  { email: 'admin@c2b.com', password: 'admin123' },
];

export default function SuperAdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function doLogin() {
    setError('');
    const mail = email.trim();
    if (!mail) return setError('Please enter your supervisor email.');
    if (!EMAIL_RE.test(mail)) return setError('Please enter a valid email address (e.g. superuser@click2book.com).');
    if (!password) return setError('Please enter your access key.');
    if (password.length < 6) return setError('Access key must be at least 6 characters.');
    const matched = SUPER_USERS.find((u) => u.email.toLowerCase() === mail.toLowerCase() && u.password === password);
    if (!matched) return setError('Invalid Super Admin credentials. Please check your email and access key.');

    setBusy(true);
    sessionStorage.setItem('superUserAuth', 'true');
    // Sent here from another portal's data panel? Go back there with it open; otherwise the Super Admin console.
    const from = location.state?.from;
    const returnTo = from ? from + (from.includes('?') ? '&' : '?') + 'superUser=open' : '/super-admin';
    setTimeout(() => navigate(returnTo), 500);
  }
  useEnterKey(doLogin);
  usePageTitle('Super Admin Login – Click2Book');

  return (
    <div className="pg-superadmin-login">
      <div className="page">
        {/* LEFT PANEL */}
        <div className="left">
          <div className="bg-icon">📊</div>
          <div className="left-content">
            <div className="portal-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>{' '}
              Restricted Access
            </div>
            <h1 className="left-h">
              Super Admin
              <br />
              Portal
            </h1>
            <p className="left-sub">
              Advanced management suite for core system entities, database cleaning, and mock data synchronization.
            </p>
            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', color: '#fff', fontSize: '.85rem', fontWeight: '600' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: 'var(--orange)' }}>✓</span> CRUD Master Control
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: 'var(--orange)' }}>✓</span> DB Reset Engine
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: 'var(--orange)' }}>✓</span> Entity Auditing
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: 'var(--orange)' }}>✓</span> Low-Level Access
              </div>
            </div>
          </div>
        </div>
        {/* RIGHT PANEL */}
        <div className="right">
          <div className="form-box">
            <Link to="/" className="form-logo" title="Go to home page" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="form-logo-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="9" y1="21" x2="9" y2="9" />
                </svg>
              </div>
              <div>
                <span className="form-logo-name">CLICK2BOOK</span> <span className="form-logo-tag">Root Management</span>
              </div>
            </Link>
            <div className="form-title">Super Admin Login</div>
            <p className="form-sub">Enter credentials to unlock the management portal.</p>
            <div className={'err-msg' + (error ? ' show' : '')} id="errMsg">
              {error && (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>{' '}
                  {error}
                </>
              )}
            </div>
            <div className="field">
              <label htmlFor="email">Supervisor Email</label>
              <div className="inp-wrap">
                <span className="inp-icon">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>{' '}
                <input
                  type="email"
                  id="email"
                  className="finput"
                  placeholder="superuser@click2book.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="password">Access Key</label>
              <div className="inp-wrap">
                <span className="inp-icon">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>{' '}
                <input
                  type="password"
                  id="password"
                  className="finput"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <button className="btn-login" id="loginBtn" onClick={doLogin} disabled={busy} style={busy ? { opacity: 0.7 } : undefined}>
              {busy ? 'Authenticating...' : 'Unlock Portal'}{' '}
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
            <div className="secure-note">
              <span className="secure-dot" /> End-to-End Encrypted Session
            </div>
            <div style={{ textAlign: 'center', marginTop: 14, fontSize: '.85rem' }}>
              <Link to="/staff-access" style={{ color: '#64748b', textDecoration: 'none', fontWeight: 600 }}>
                ← Back to Staff Access
              </Link>
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: '20px', color: '#94a3b8', fontSize: '0.8rem', fontWeight: '600' }}>
            SYSTEM VERSION 2.4.0 • PRODUCTION
          </div>
        </div>
      </div>
    </div>
  );
}
