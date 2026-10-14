import React, { useState } from 'react';
import { Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight, ShieldCheck, X } from 'lucide-react';
import { API } from '../services/api';
import { DEMO_USERS } from '../services/mockData';

export default function Login({
  isOpen,
  onClose,
  onLoginSuccess,
  showToast,
  initialPanel = 'login',
  promptMessage = '',
}) {
  if (!isOpen) return null;

  const [panel, setPanel] = useState(initialPanel);

  React.useEffect(() => {
    if (isOpen) {
      setPanel(initialPanel || 'login');
      setErrorMsg('');
    }
  }, [isOpen, initialPanel]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const [forgotEmail, setForgotEmail] = useState('');

  const handleQuickDemo = (demo) => {
    setLoginEmail(demo.email);
    setLoginPassword(demo.password);
    setErrorMsg('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!loginEmail.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    if (!loginPassword) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      let user = null;
      try {
        const res = await API.auth.login(loginEmail.trim(), loginPassword);
        user = res;
      } catch (err) {
        console.warn('Backend login fallback used:', err.message);
      }

      // If backend offline or failed, check demo/local storage users
      if (!user) {
        const registered = JSON.parse(localStorage.getItem('c2b_registered_users') || '[]');
        const allUsers = [...registered, ...DEMO_USERS];
        const match = allUsers.find(
          (u) => u.email.toLowerCase() === loginEmail.trim().toLowerCase() && u.password === loginPassword
        );

        if (match) {
          user = {
            id: match.id,
            name: match.name,
            email: match.email,
            role: match.role || 'CUSTOMER',
          };
        } else {
          // Allow login by deriving name from email if password meets 6-char rule
          if (loginPassword.length >= 6) {
            const prefix = loginEmail.split('@')[0];
            const derivedName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
            user = {
              id: 'C_' + Date.now(),
              name: derivedName,
              email: loginEmail,
              role: 'CUSTOMER',
            };
          } else {
            throw new Error('Invalid email or password.');
          }
        }
      }

      // Persist to session and localStorage
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('c2b_loggedIn', 'true');
      storage.setItem('c2b_userName', user.name);
      storage.setItem('c2b_userEmail', user.email || '');
      storage.setItem('c2b_loggedInId', user.id || user.customerId || 'C001');
      storage.setItem('c2b_userId', user.id || user.customerId || 'C001');
      storage.setItem('c2b_role', user.role || 'CUSTOMER');

      sessionStorage.setItem('c2b_loggedIn', 'true');
      sessionStorage.setItem('c2b_userName', user.name);
      sessionStorage.setItem('c2b_userEmail', user.email || '');
      sessionStorage.setItem('c2b_loggedInId', user.id || user.customerId || 'C001');
      sessionStorage.setItem('c2b_userId', user.id || user.customerId || 'C001');
      sessionStorage.setItem('c2b_role', user.role || 'CUSTOMER');

      showToast(`Welcome back, ${user.name}!`, 'success');
      onLoginSuccess({
        id: user.id || user.customerId || 'C001',
        name: user.name,
        email: user.email,
        role: user.role || 'CUSTOMER',
        isLoggedIn: true,
      });
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!signupName.trim()) { setErrorMsg('Please enter your full name.'); return; }
    if (/\d/.test(signupName)) { setErrorMsg('Name must not contain numbers.'); return; }
    if (!signupEmail.trim()) { setErrorMsg('Please enter a valid email address.'); return; }
    if (!signupPhone.trim()) { setErrorMsg('Please enter your phone number.'); return; }
    const digits = signupPhone.replace(/[\s\-\+\(\)]/g, '');
    if (!/^\d{10,13}$/.test(digits)) { setErrorMsg('Phone number must be 10–13 digits.'); return; }
    if (!signupPassword || signupPassword.length < 6) { setErrorMsg('Password must be at least 6 characters.'); return; }

    setLoading(true);
    try {
      const newId = 'C_' + Date.now();
      let createdUser = {
        id: newId,
        name: signupName.trim(),
        email: signupEmail.trim().toLowerCase(),
        phone: digits,
        role: 'CUSTOMER',
      };

      try {
        const res = await API.auth.register(signupName.trim(), signupEmail.trim(), signupPassword, digits);
        if (res && res.customerId) {
          createdUser.id = res.customerId;
          createdUser.name = res.name || createdUser.name;
        }
      } catch (err) {
        console.warn('Backend signup fallback used:', err.message);
      }

      // Save locally
      const registered = JSON.parse(localStorage.getItem('c2b_registered_users') || '[]');
      registered.unshift({ ...createdUser, password: signupPassword });
      localStorage.setItem('c2b_registered_users', JSON.stringify(registered));

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

      showToast('Account created successfully! Welcome to Click2Book.', 'success');
      onLoginSuccess({ ...createdUser, isLoggedIn: true });
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Account registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = (e) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    setErrorMsg('');
    setSuccessMsg('Reset link sent to ' + forgotEmail + '. Check your inbox.');
    setTimeout(() => {
      setPanel('login');
      setSuccessMsg('');
    }, 2500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '460px', padding: '32px' }} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '18px', right: '18px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
        >
          <X size={20} />
        </button>

        {promptMessage && (
          <div
            style={{
              background: '#eff6ff',
              border: '1.5px solid #bfdbfe',
              borderRadius: '10px',
              padding: '10px 14px',
              marginBottom: '16px',
              color: '#1e40af',
              fontSize: '0.84rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            ℹ️ {promptMessage}
          </div>
        )}

        {/* Panel 1: LOGIN */}
        {panel === 'login' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '22px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <ShieldCheck size={28} />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>Customer Sign In</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Access your bookings, saved seats, and special offers.</p>
            </div>

            {errorMsg && (
              <div style={{ background: '#fff1f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', fontSize: '0.82rem', color: '#ef4444', fontWeight: 600, marginBottom: '14px' }}>
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="pax-field">
                <label className="pax-label">EMAIL ADDRESS</label>
                <div className="pax-input-wrap">
                  <Mail size={16} className="pax-icon" />
                  <input
                    type="email"
                    className="pax-input"
                    placeholder="you@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="pax-field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="pax-label">PASSWORD</label>
                  <button
                    type="button"
                    onClick={() => { setErrorMsg(''); setPanel('forgot'); }}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', marginBottom: '4px' }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="pax-input-wrap">
                  <Lock size={16} className="pax-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="pax-input"
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
                <input
                  type="checkbox"
                  id="rememberCheck"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="rememberCheck" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  Keep me signed in
                </label>
              </div>

              <button type="submit" className="btn-orange" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In to Account'} <ArrowRight size={16} />
              </button>
            </form>

            {/* Quick Demo Fillers */}
            <div style={{ marginTop: '20px', padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>Quick Demo Customer Logins:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {DEMO_USERS.map((demo) => (
                  <button
                    key={demo.id}
                    type="button"
                    onClick={() => handleQuickDemo(demo)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '50px',
                      border: '1px solid #cbd5e1',
                      background: '#fff',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      color: '#1e293b',
                    }}
                  >
                    {demo.name.split(' ')[0]} ({demo.id})
                  </button>
                ))}
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => { setErrorMsg(''); setPanel('signup'); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}
              >
                Create Account
              </button>
            </div>
          </div>
        )}

        {/* Panel 2: SIGN UP */}
        {panel === 'signup' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>Create Your Account</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Join Click2Book for instant ticket booking and tracking.</p>
            </div>

            {errorMsg && (
              <div style={{ background: '#fff1f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', fontSize: '0.82rem', color: '#ef4444', fontWeight: 600, marginBottom: '14px' }}>
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleSignup}>
              <div className="pax-field">
                <label className="pax-label">FULL NAME</label>
                <div className="pax-input-wrap">
                  <User size={16} className="pax-icon" />
                  <input
                    type="text"
                    className="pax-input"
                    placeholder="Rahul Sharma"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="pax-field">
                <label className="pax-label">EMAIL ADDRESS</label>
                <div className="pax-input-wrap">
                  <Mail size={16} className="pax-icon" />
                  <input
                    type="email"
                    className="pax-input"
                    placeholder="you@example.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="pax-field">
                <label className="pax-label">PHONE NUMBER</label>
                <div className="pax-input-wrap">
                  <Phone size={16} className="pax-icon" />
                  <input
                    type="tel"
                    className="pax-input"
                    placeholder="9876543210"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="pax-field">
                <label className="pax-label">PASSWORD (MIN 6 CHARACTERS)</label>
                <div className="pax-input-wrap">
                  <Lock size={16} className="pax-icon" />
                  <input
                    type="password"
                    className="pax-input"
                    placeholder="Create a password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-orange" style={{ width: '100%', marginTop: '6px' }} disabled={loading}>
                {loading ? 'Registering…' : 'Create My Account'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setErrorMsg(''); setPanel('login'); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}
              >
                Sign In
              </button>
            </div>
          </div>
        )}

        {/* Panel 3: FORGOT PASSWORD */}
        {panel === 'forgot' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>Reset Password</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Enter your registered email and we'll send a reset link.</p>
            </div>

            {errorMsg && (
              <div style={{ background: '#fff1f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', fontSize: '0.82rem', color: '#ef4444', fontWeight: 600, marginBottom: '14px' }}>
                ⚠️ {errorMsg}
              </div>
            )}
            {successMsg && (
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '10px 14px', fontSize: '0.82rem', color: '#16a34a', fontWeight: 600, marginBottom: '14px' }}>
                ✅ {successMsg}
              </div>
            )}

            <form onSubmit={handleForgot}>
              <div className="pax-field">
                <label className="pax-label">EMAIL ADDRESS</label>
                <div className="pax-input-wrap">
                  <Mail size={16} className="pax-icon" />
                  <input
                    type="email"
                    className="pax-input"
                    placeholder="your-email@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-orange" style={{ width: '100%', marginTop: '6px' }}>
                Send Reset Link
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.82rem' }}>
              <button
                type="button"
                onClick={() => { setErrorMsg(''); setPanel('login'); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}
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
