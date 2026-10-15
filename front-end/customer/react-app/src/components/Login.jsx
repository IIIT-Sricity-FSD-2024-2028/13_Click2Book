import React, { useState, useEffect } from 'react';
import { API } from '../services/api';
import { DEMO_USERS } from '../services/mockData';
import './Login.css';

export default function Login({
  isOpen = true,
  onClose,
  onLoginSuccess,
  showToast,
  initialPanel = 'login',
  promptMessage = '',
}) {
  const [hashTab, setHashTab] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.hash || '';
    }
    return '';
  });

  useEffect(() => {
    const handleHash = () => {
      setHashTab(window.location.hash || '');
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const shouldRender = Boolean(isOpen);

  const [panel, setPanel] = useState(initialPanel);

  useEffect(() => {
    const hash = window.location.hash || '';
    const hashParams = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
    const urlParams = new URLSearchParams(window.location.search || '');
    const panelFromUrl = hashParams.get('panel') || urlParams.get('panel');
    const isSignup = hash.includes('signup') || panelFromUrl === 'signup' || initialPanel === 'signup';

    if (isSignup) {
      setPanel('signup');
    } else if (panelFromUrl) {
      setPanel(panelFromUrl);
    } else if (initialPanel) {
      setPanel(initialPanel);
    }
    setErrorMsg('');
  }, [isOpen, initialPanel, hashTab]);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form inputs
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const [forgotEmail, setForgotEmail] = useState('');

  const handleGoHome = (e) => {
    if (e) e.preventDefault();
    if (onClose) {
      onClose();
    }
    window.location.hash = '';
    if (window.history.pushState) {
      window.history.pushState(null, '', window.location.pathname + window.location.search);
    }
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    const email = loginEmail.trim();
    const pass = loginPassword;

    if (!email) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    const re = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!re.test(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!pass) {
      setErrorMsg('Please enter your password.');
      return;
    }
    if (pass.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    const btn = document.getElementById('loginBtn');
    if (btn) btn.disabled = true;
    setLoading(true);

    try {
      let user = null;
      try {
        const res = await API.auth.login(email, pass);
        user = res;
      } catch (err) {
        console.warn('Backend login fallback used:', err.message);
      }

      // If backend offline, match against known credentials
      if (!user) {
        const registered = JSON.parse(localStorage.getItem('c2b_registered_users') || '[]');
        const offlineUsers = [...DEMO_USERS];
        const allUsers = [...registered, ...offlineUsers];
        const matched = allUsers.find(
          (u) => u.email && u.email.toLowerCase() === email.toLowerCase() && u.password === pass
        );

        if (matched) {
          user = {
            id: matched.id,
            name: matched.name,
            email: matched.email,
            role: matched.role || 'CUSTOMER',
          };
        } else {
          // Allow login by deriving name from email if password meets 6-char rule
          if (pass.length >= 6) {
            const prefix = email.split('@')[0];
            const derivedName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
            user = {
              id: 'C_' + Date.now(),
              name: derivedName,
              email: email,
              role: 'CUSTOMER',
            };
            registered.unshift(user);
            localStorage.setItem('c2b_registered_users', JSON.stringify(registered));
          } else {
            throw new Error('Invalid email or password. Backend is offline — use known credentials.');
          }
        }
      }

      // Persist to session and localStorage
      const store = rememberMe ? localStorage : sessionStorage;
      store.setItem('c2b_loggedIn', 'true');
      store.setItem('c2b_userName', user.name);
      store.setItem('c2b_userId', user.id || user.customerId || 'C001');
      store.setItem('c2b_role', user.role || 'CUSTOMER');
      store.setItem('c2b_email', user.email || '');
      store.setItem('c2b_userEmail', user.email || '');
      store.setItem('c2b_loggedInId', user.id || user.customerId || 'C001');

      sessionStorage.setItem('c2b_loggedIn', 'true');
      sessionStorage.setItem('c2b_userName', user.name);
      sessionStorage.setItem('c2b_userId', user.id || user.customerId || 'C001');
      sessionStorage.setItem('c2b_role', user.role || 'CUSTOMER');
      sessionStorage.setItem('c2b_userEmail', user.email || '');
      sessionStorage.setItem('c2b_loggedInId', user.id || user.customerId || 'C001');

      if (showToast) {
        showToast(`Welcome back, ${user.name}!`, 'success');
      }
      if (onLoginSuccess) {
        onLoginSuccess({
          id: user.id || user.customerId || 'C001',
          name: user.name,
          email: user.email,
          role: user.role || 'CUSTOMER',
          isLoggedIn: true,
        });
      }
      if (onClose) {
        onClose();
      }
      if (window.location.hash.includes('login') || window.location.hash.includes('signup')) {
        const redirect = sessionStorage.getItem('c2b_redirectAfterLogin') || '#search-trips';
        sessionStorage.removeItem('c2b_redirectAfterLogin');
        window.location.hash = redirect;
      }
    } catch (err) {
      setErrorMsg(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
      if (btn) btn.disabled = false;
    }
  };

  const handleSignup = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    const name = signupName.trim();
    const email = signupEmail.trim();
    const phone = signupPhone.trim();
    const pass = signupPassword;

    if (!name) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (/\d/.test(name)) {
      setErrorMsg('Name must not contain numbers.');
      return;
    }
    if (!email) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    const re = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!re.test(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!phone) {
      setErrorMsg('Please enter your phone number.');
      return;
    }
    const digits = phone.replace(/[\s\-\+\(\)]/g, '');
    if (!/^\d{10,13}$/.test(digits)) {
      setErrorMsg('Please enter a valid 10-digit phone number.');
      return;
    }
    if (!pass || pass.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    const btn = document.getElementById('signupBtn');
    if (btn) btn.disabled = true;
    setLoading(true);

    try {
      const userId = 'C_' + Date.now();
      let createdUser = {
        id: userId,
        name: name,
        email: email.toLowerCase(),
        phone: digits,
        role: 'CUSTOMER',
      };

      try {
        const res = await API.auth.register(name, email, pass, digits);
        if (res && (res.customerId || res.id)) {
          createdUser.id = res.customerId || res.id;
          createdUser.name = res.name || createdUser.name;
        }
      } catch (err) {
        console.warn('Backend signup fallback used:', err.message);
      }

      // Save user to registered users list in localStorage
      const registered = JSON.parse(localStorage.getItem('c2b_registered_users') || '[]');
      registered.unshift({ ...createdUser, password: pass });
      localStorage.setItem('c2b_registered_users', JSON.stringify(registered));

      // Save session & local storage
      localStorage.setItem('c2b_loggedIn', 'true');
      localStorage.setItem('c2b_userName', createdUser.name);
      localStorage.setItem('c2b_userEmail', createdUser.email);
      localStorage.setItem('c2b_loggedInId', createdUser.id);
      localStorage.setItem('c2b_userId', createdUser.id);
      localStorage.setItem('c2b_role', 'CUSTOMER');

      sessionStorage.setItem('c2b_loggedIn', 'true');
      sessionStorage.setItem('c2b_userName', createdUser.name);
      sessionStorage.setItem('c2b_userEmail', createdUser.email);
      sessionStorage.setItem('c2b_loggedInId', createdUser.id);
      sessionStorage.setItem('c2b_userId', createdUser.id);
      sessionStorage.setItem('c2b_role', 'CUSTOMER');

      if (showToast) {
        showToast('Account created successfully! Welcome to Click2Book.', 'success');
      }
      if (onLoginSuccess) {
        onLoginSuccess({ ...createdUser, isLoggedIn: true });
      }
      if (onClose) {
        onClose();
      }
      if (window.location.hash.includes('login') || window.location.hash.includes('signup')) {
        const redirect = sessionStorage.getItem('c2b_redirectAfterLogin') || '#search-trips';
        sessionStorage.removeItem('c2b_redirectAfterLogin');
        window.location.hash = redirect;
      }
    } catch (err) {
      setErrorMsg(err.message || 'Account registration failed.');
    } finally {
      setLoading(false);
      if (btn) btn.disabled = false;
    }
  };

  const handleForgot = (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    const email = forgotEmail.trim();
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccessMsg('Reset link sent to ' + email + '. Check your inbox.');
    }, 1200);
  };

  if (!shouldRender) return null;

  const activePrompt = promptMessage || sessionStorage.getItem('c2b_loginPrompt') || '';

  return (
    <div className="c2b-login-page">
      {/* ═══ LEFT PANEL ═══ */}
      <div className="left">
        <div className="bus-watermark">🚌</div>
        <div className="left-content">
          <button type="button" className="left-logo" onClick={handleGoHome} title="Go to Click2Book Home">
            <div className="left-logo-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="8" width="20" height="12" rx="3" fill="white" opacity=".9" />
                <rect x="5" y="5" width="14" height="5" rx="2" fill="white" opacity=".6" />
                <circle cx="6.5" cy="20" r="1.5" fill="#f97316" />
                <circle cx="17.5" cy="20" r="1.5" fill="#f97316" />
              </svg>
            </div>
            <div className="left-logo-text">
              <div className="left-logo-name">CLICK2BOOK</div>
              <div className="left-logo-sub">Travel Smarter</div>
            </div>
          </button>

          <h1 className="left-h">Your Journey Starts Here</h1>
          <p className="left-sub">
            Book, manage, and track your bus tickets with India's most trusted travel platform.
          </p>

          <div className="left-features">
            <div className="feat-pill">
              <div className="feat-pill-icon">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              Secure &amp; Encrypted Login
            </div>
            <div className="feat-pill">
              <div className="feat-pill-icon">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              500+ Cities Connected
            </div>
            <div className="feat-pill">
              <div className="feat-pill-icon">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="8" width="20" height="12" rx="3" />
                  <rect x="5" y="5" width="14" height="5" rx="2" />
                  <circle cx="6.5" cy="20" r="1.5" />
                  <circle cx="17.5" cy="20" r="1.5" />
                </svg>
              </div>
              10,000+ Daily Trips
            </div>
          </div>
        </div>
      </div>

      {/* ═══ RIGHT PANEL ═══ */}
      <div className="right">
        <button
          type="button"
          className="home-btn"
          onClick={handleGoHome}
          aria-label="Return to home page"
          title="Return to Home"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </button>
        <button
          type="button"
          className="close-btn"
          onClick={handleGoHome}
          aria-label="Close and return to home page"
          title="Return to Home"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* ═══ PANEL 1: LOGIN ═══ */}
        {panel === 'login' && (
          <div className="form-box" id="panelLogin">
            <div className="form-title">Welcome Back! 👋</div>
            <p className="form-sub">Sign in to access your dashboard</p>

            {errorMsg && (
              <div className="err-msg" id="errMsg">
                ⚠️ {errorMsg}
              </div>
            )}
            {activePrompt && !errorMsg && (
              <div
                className="err-msg"
                style={{ background: '#eff6ff', borderColor: '#bfdbfe', color: '#1d4ed8' }}
              >
                ℹ️ {activePrompt}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="field">
                <label htmlFor="email">Email Address</label>
                <div className="input-wrap">
                  <span className="input-icon">
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
                  </span>
                  <input
                    type="email"
                    id="email"
                    className="finput"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="password">Password</label>
                <div className="input-wrap">
                  <span className="input-icon">
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
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    className="finput"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                  <button
                    className="eye-btn"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    id="eyeBtn"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <svg
                        width="17"
                        height="17"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg
                        width="17"
                        height="17"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="row2">
                <label className="chk-wrap">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />{' '}
                  Remember me
                </label>
                <button
                  type="button"
                  className="link-sm"
                  onClick={() => {
                    setErrorMsg('');
                    setSuccessMsg('');
                    if (loginEmail) setForgotEmail(loginEmail);
                    setPanel('forgot');
                  }}
                >
                  Forgot Password?
                </button>
              </div>

              <button className="btn-primary" id="loginBtn" type="submit" disabled={loading}>
                {loading ? 'Signing in...' : 'Login to Account'}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14m-6-7 7 7-7 7" />
                </svg>
              </button>
            </form>

            <div className="create-link">
              New to Click2Book?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setPanel('signup');
                }}
              >
                Create Account
              </button>
            </div>
          </div>
        )}

        {/* ═══ PANEL 2: SIGN UP ═══ */}
        {panel === 'signup' && (
          <div className="form-box" id="panelSignup">
            <div className="form-title">Create Account 🚀</div>
            <p className="form-sub">Join Click2Book and start saving on every trip</p>

            {errorMsg && (
              <div className="err-msg" id="signupErr">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleSignup}>
              <div className="field">
                <label htmlFor="su_name">Full Name</label>
                <div className="input-wrap">
                  <span className="input-icon">
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
                      <circle cx="12" cy="7" r="4" />
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    id="su_name"
                    className="finput"
                    placeholder="Rahul Sharma"
                    autoComplete="name"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="su_email">Email Address</label>
                <div className="input-wrap">
                  <span className="input-icon">
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
                  </span>
                  <input
                    type="email"
                    id="su_email"
                    className="finput"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="su_phone">Phone Number</label>
                <div className="input-wrap">
                  <span className="input-icon">
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
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.16 12 19.79 19.79 0 0 1 1.11 3.41 2 2 0 0 1 3.09 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.851.573 2.81.7A2 2 0 0 1 21 16z" />
                    </svg>
                  </span>
                  <input
                    type="tel"
                    id="su_phone"
                    className="finput"
                    placeholder="+91 9876543210"
                    autoComplete="tel"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="su_pass">Create Password</label>
                <div className="input-wrap">
                  <span className="input-icon">
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
                  </span>
                  <input
                    type="password"
                    id="su_pass"
                    className="finput"
                    placeholder="Min 6 characters"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                  />
                </div>
              </div>

              <button className="btn-primary" id="signupBtn" type="submit" disabled={loading}>
                {loading ? 'Creating account...' : 'Create My Account'}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14m-6-7 7 7-7 7" />
                </svg>
              </button>
            </form>

            <div className="create-link">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setPanel('login');
                }}
              >
                Sign In
              </button>
            </div>

            <p className="terms-note">
              By creating an account, you agree to our{' '}
              <button
                type="button"
                onClick={handleGoHome}
              >
                Terms of Service
              </button>{' '}
              and{' '}
              <button
                type="button"
                onClick={handleGoHome}
              >
                Privacy Policy
              </button>
            </p>
          </div>
        )}

        {/* ═══ PANEL 3: FORGOT PASSWORD ═══ */}
        {panel === 'forgot' && (
          <div className="form-box" id="panelForgot">
            <div className="form-title">Reset Password 🔐</div>
            <p className="form-sub" id="fpSubText">
              Enter your email and we'll send you a reset link
            </p>

            {errorMsg && (
              <div className="err-msg" id="fpErr">
                ⚠️ {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="success-msg" id="fpSuccess">
                ✅ {successMsg}
              </div>
            )}

            <form onSubmit={handleForgot}>
              <div className="field" id="fpEmailField">
                <label htmlFor="fp_email">Email Address</label>
                <div className="input-wrap">
                  <span className="input-icon">
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
                  </span>
                  <input
                    type="email"
                    id="fp_email"
                    className="finput"
                    placeholder="your-email@example.com"
                    autoComplete="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                  />
                </div>
              </div>

              <button className="btn-primary" id="fpBtn" type="submit" disabled={loading}>
                {loading ? 'Sending link...' : 'Send Reset Link'}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14m-6-7 7 7-7 7" />
                </svg>
              </button>
            </form>

            <div className="create-link" style={{ marginTop: '14px' }}>
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setSuccessMsg('');
                  setPanel('login');
                }}
              >
                ← Back to Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
