import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import useEnterKey from '../hooks/useEnterKey';
import EyeIcon from '../components/EyeIcon';
import { apiRequest } from '../lib/http';
import './Login.css';

const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
/** Used only when the backend is unreachable. */
const OFFLINE_ADMINS = [{ id: 'ADMIN001', name: 'Admin', email: 'admin@click2book.com', password: 'Admin@123' }];

function storeAdminSession(remember, user) {
  for (const store of new Set([sessionStorage, remember ? localStorage : sessionStorage])) {
    store.setItem('c2b_loggedIn', 'true');
    store.setItem('c2b_userName', user.name);
    store.setItem('c2b_userEmail', user.email);
    store.setItem('c2b_loggedInId', user.id);
    store.setItem('c2b_role', 'ADMIN');
    // Role + permissions decide which console sections this admin sees.
    store.setItem('c2b_adminRole', user.adminRole || 'SUPER_ADMIN');
    store.setItem('c2b_adminPermissions', JSON.stringify(user.permissions || []));
  }
}

const ShieldIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function doLogin() {
    setError('');
    const mail = email.trim();
    if (!mail) return setError('Please enter your admin email.');
    if (!EMAIL_RE.test(mail)) return setError('Please enter a valid email address (e.g. admin@click2book.com).');
    if (!password) return setError('Please enter your password.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    setBusy(true);
    const fail = () => {
      setError('Invalid credentials. Check your admin email and password.');
      setBusy(false);
    };
    try {
      const json = await apiRequest('/auth/login', { method: 'POST', role: null, raw: true, body: { email: mail, password } }).catch(
        (err) => {
          if (err instanceof TypeError) throw err; // offline
          return { success: false, message: err.message };
        },
      );
      if (!json.success || json.data.role !== 'ADMIN') {
        fail();
        if (json.message) setError(json.message);
        return;
      }
      storeAdminSession(remember, json.data);
      navigate('/admin/admin-dashboard');
      return;
    } catch (err) {
      console.warn('Backend offline, falling back to known admin accounts:', err.message);
    }
    const matched = OFFLINE_ADMINS.find((u) => u.email.toLowerCase() === mail.toLowerCase() && u.password === password);
    if (!matched) return fail();
    storeAdminSession(remember, matched);
    setTimeout(() => navigate('/admin/admin-dashboard'), 600);
  }
  useEnterKey(doLogin);
  usePageTitle('Admin Login – Click2Book');

  return (
    <div className="pg-admin-login">
      <div className="page">
        {/* LEFT PANEL */}
        <div className="left">
          <div className="bg-icon">🛡️</div>
          <div className="left-content">
            <div className="portal-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>{' '}
              Administrator Portal
            </div>
            <h1 className="left-h">
              System
              <br />
              Command Center
            </h1>
            <p className="left-sub">Full platform control, user management, and comprehensive analytics at your fingertips.</p>
            <div className="feat-list">
              <div className="feat-item">
                <div className="feat-dot">👥</div>
                Complete User Management
              </div>
              <div className="feat-item">
                <div className="feat-dot">⚙️</div>
                System Configuration Control
              </div>
              <div className="feat-item">
                <div className="feat-dot">📊</div>
                Advanced Analytics & Reports
              </div>
              <div className="feat-item">
                <div className="feat-dot">🖥️</div>
                Infrastructure Monitoring
              </div>
            </div>
          </div>
        </div>
        {/* RIGHT PANEL */}
        <div className="right">
          <div className="form-box">
            <Link to="/" className="form-logo" title="Go to home page" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="form-logo-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div className="form-logo-text">
                <span className="form-logo-name">CLICK2BOOK</span> <span className="form-logo-tag">Admin Access</span>
              </div>
            </Link>
            <div className="form-title">Administrator Login</div>
            <p className="form-sub">Secure access to system administration dashboard</p>
            <div className={'err-msg' + (error ? ' show' : '')} id="errMsg">
              {error && '⚠️ ' + error}
            </div>
            <div className="field">
              <label htmlFor="email">Admin Email</label>
              <div className="inp-wrap">
                <span className="inp-icon">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </span>{' '}
                <input
                  type="email"
                  id="email"
                  className="finput"
                  placeholder="admin@click2book.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="inp-wrap">
                <span className="inp-icon">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>{' '}
                <input
                  type={showPass ? 'text' : 'password'}
                  id="password"
                  className="finput"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />{' '}
                <button className="eye-btn" type="button" onClick={() => setShowPass((v) => !v)} id="eyeBtn" aria-label="Toggle password">
                  <EyeIcon open={showPass} />
                </button>
              </div>
            </div>
            <div className="row2">
              <label className="chk-wrap">
                <input type="checkbox" id="remember" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember me
              </label>{' '}
              <a
                href="mailto:admin@click2book.com?subject=Admin%20password%20reset"
                className="link-sm"
                title="Admin passwords are reset by a Super Admin"
              >
                Forgot Password?
              </a>
            </div>
            <button className="btn-login" id="loginBtn" onClick={doLogin} disabled={busy}>
              <ShieldIcon /> {busy ? 'Authenticating…' : 'Access Admin Dashboard'}
            </button>
            <div className="secure-note">
              <span className="secure-dot" /> This is a secure admin portal. All activities are monitored and logged.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
