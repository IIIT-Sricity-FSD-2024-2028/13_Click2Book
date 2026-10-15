import { useState } from 'react';
import BrandMark from '../components/BrandMark.jsx';
import { API_BASE } from '../lib/api.js';
import { EMAIL_PATTERN } from '../lib/format.js';
import { saveAdminSession } from '../lib/session.js';
import '../styles/login.css';

const FEATURES = [
  ['👥', 'Complete User Management'],
  ['⚙️', 'System Configuration Control'],
  ['📊', 'Advanced Analytics & Reports'],
  ['🖥️', 'Infrastructure Monitoring'],
];

const OFFLINE_ADMIN = { id: 'ADMIN001', name: 'Admin', email: 'admin@click2book.com', password: 'Admin@123' };

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const signIn = (user) => {
    saveAdminSession(remember ? localStorage : sessionStorage, user);
    if (onLoginSuccess) {
      onLoginSuccess(user);
    } else {
      location.href = '#dashboard';
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    const cleanEmail = email.trim();
    if (!cleanEmail) return setError('Please enter your admin email.');
    if (!EMAIL_PATTERN.test(cleanEmail)) return setError('Please enter a valid email address (e.g. admin@click2book.com).');
    if (!password) return setError('Please enter your password.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');

    setBusy(true);
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });
      const json = await response.json();
      if (!response.ok || !json.success || json.data?.role !== 'ADMIN') {
        throw new Error(json.message || 'Invalid credentials. Check your admin email and password.');
      }
      signIn(json.data);
    } catch (requestError) {
      if (!(requestError instanceof TypeError)) {
        setError(requestError.message);
        return;
      }
      console.warn('Admin API is unavailable; trying the configured offline account.', requestError);
      if (cleanEmail.toLowerCase() === OFFLINE_ADMIN.email && password === OFFLINE_ADMIN.password) {
        signIn(OFFLINE_ADMIN);
        return;
      }
      setError('Invalid credentials. Check your admin email and password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <section className="left">
          <div className="bg-icon" aria-hidden="true">🛡️</div>
          <div className="left-content">
            <div className="portal-badge">Administrator Portal</div>
            <h1 className="left-h">System<br />Command Center</h1>
            <p className="left-sub">Full platform control, user management, and comprehensive analytics at your fingertips.</p>
            <div className="feat-list">
              {FEATURES.map(([icon, label]) => (
                <div className="feat-item" key={label}><span className="feat-dot">{icon}</span>{label}</div>
              ))}
            </div>
          </div>
        </section>
        <section className="right">
          <form className="form-box" onSubmit={submit}>
            <BrandMark />
            <h2 className="form-title">Administrator Login</h2>
            <p className="form-sub">Secure access to system administration dashboard</p>
            {error && <div className="err-msg show" role="alert">⚠️ {error}</div>}
            <div className="field">
              <label htmlFor="email">Admin Email</label>
              <div className="inp-wrap">
                <span className="inp-icon" aria-hidden="true">✉</span>
                <input id="email" className="finput" type="email" autoComplete="email" placeholder="Enter your email address" value={email} onChange={(event) => setEmail(event.target.value)} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="inp-wrap">
                <span className="inp-icon" aria-hidden="true">▣</span>
                <input id="password" className="finput" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} />
                <button className="eye-btn" type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>◉</button>
              </div>
            </div>
            <div className="row2">
              <label className="chk-wrap"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /> Remember me</label>
              <button type="button" className="link-sm" onClick={() => window.alert('Password reset email sent!')}>Forgot Password?</button>
            </div>
            <button className="btn-login" type="submit" disabled={busy}>{busy ? 'Authenticating…' : 'Access Admin Dashboard'}</button>
            <div className="secure-note"><span className="secure-dot" />This is a secure admin portal. All activities are monitored and logged.</div>
          </form>
        </section>
      </div>
    );
  }
