import React, { useState } from 'react';
import { loginProvider } from '../services/api';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!email.trim()) return 'Please enter your provider email.';
    const emailReg = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!emailReg.test(email)) return 'Please enter a valid email address (e.g. provider@company.com).';
    if (!password) return 'Please enter your password.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const validationErr = validate();
    if (validationErr) { setError(validationErr); return; }
    setLoading(true);
    try {
      const result = await loginProvider(email.trim(), password);
      const user = result.data;
      sessionStorage.setItem('c2b_loggedIn',    'true');
      sessionStorage.setItem('c2b_userName',    user.name);
      sessionStorage.setItem('c2b_userEmail',   user.email);
      sessionStorage.setItem('c2b_loggedInId',  user.id);
      sessionStorage.setItem('c2b_role',        'PROVIDER');
      if (remember) {
        localStorage.setItem('c2b_loggedIn',    'true');
        localStorage.setItem('c2b_userName',    user.name);
        localStorage.setItem('c2b_userEmail',   user.email);
        localStorage.setItem('c2b_loggedInId',  user.id);
      }
      onLogin(user);
    } catch (err) {
      setError(err.message || 'Invalid credentials. Contact admin if you need access.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* ── Left: Form ── */}
      <div className="login-left">
        <div className="login-form-wrapper">
          {/* Logo */}
          <div className="login-logo">
            <div className="login-logo-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
            </div>
            <div className="login-logo-text">
              <div className="logo-name">CLICK<span>2</span>BOOK</div>
              <div className="logo-tag">PROVIDER ACCESS</div>
            </div>
          </div>

          {/* Titles */}
          <div className="login-titles">
            <h1>Provider Login</h1>
            <p>Access your fleet management dashboard</p>
          </div>

          {/* Status card */}
          <div className="status-card">
            <div>
              <span className="status-label-text">SYSTEM STATUS</span>
              <div className="status-msg">
                <span className="status-dot" />
                All Systems Operational
              </div>
            </div>
            <div>
              <div className="uptime-val">98%</div>
              <div className="uptime-lbl">Uptime</div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="alert alert-error">
              ⚠️ {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="sp-email">Provider Email</label>
              <div className="input-wrap">
                <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <input
                  id="sp-email"
                  type="email"
                  className="form-control"
                  placeholder="provider@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="sp-password">Password</label>
              <div className="input-wrap">
                <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  id="sp-password"
                  type={showPass ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button type="button" className="toggle-pass" onClick={() => setShowPass(!showPass)} aria-label="Toggle password">
                  {showPass ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-wrap" style={{cursor:'pointer'}}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  style={{marginRight:4}}
                />
                <span style={{fontSize:'0.83rem'}}>Remember me</span>
              </label>
              <a href="#" className="forgot-link">Forgot Password?</a>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
              style={{padding:'0.875rem', fontSize:'1rem'}}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
              {loading ? 'Authenticating…' : 'Access Provider Dashboard'}
            </button>
          </form>

          <div className="login-footer">
            🚌 Powering seamless travel experiences across the network
          </div>
        </div>
      </div>

      {/* ── Right: Info panel ── */}
      <div className="login-right">
        <div className="right-content">
          <div className="portal-badge">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
              <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
            Service Provider Portal
          </div>
          <h1 className="right-heading">Manage Your<br />Fleet &amp; Routes</h1>
          <p className="right-desc">Complete control over schedules, bookings, and seat management for your transportation services.</p>

          <div className="login-stats-grid">
            {[
              { icon: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>, label: 'Active Routes', val: '6' },
              { icon: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, label: "Today's Trips", val: '12' },
              { icon: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, label: 'Seat Bookings', val: '277' },
              { icon: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>, label: 'Revenue', val: '10,982/-' },
            ].map(({ icon, label, val }) => (
              <div key={label} className="login-stat-box">
                <div className="stat-box-header">{icon}{label}</div>
                <div className="stat-box-val">{val}</div>
              </div>
            ))}
          </div>

          <ul className="features-list">
            <li>Real-time seat availability updates</li>
            <li>Comprehensive booking management</li>
            <li>Schedule &amp; route optimization</li>
            <li>Performance analytics &amp; reports</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
