import React, { useState } from 'react';
import { Headphones, Mail, Lock, Eye, EyeOff, LogIn, ArrowLeft, ShieldCheck } from 'lucide-react';
import { INITIAL_AGENTS } from '../services/mockData';
import { navigateToStaffPortal, getStaffPortalUrl } from '../services/api';

export default function Login({ onLogin }) {
  const staffPortalUrl = getStaffPortalUrl();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim()) {
      setErrorMsg('⚠️ Please enter your agent email.');
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg('⚠️ Please enter a valid email address (e.g. agent@click2book.in).');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg('⚠️ Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const matched = INITIAL_AGENTS.find(
        (a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password
      );

      if (!matched) {
        setErrorMsg('⚠️ Invalid credentials. Use your assigned agent email and password.');
        setIsSubmitting(false);
        return;
      }

      // Persist in session
      sessionStorage.setItem('c2b_loggedIn', 'true');
      sessionStorage.setItem('c2b_userName', matched.name);
      sessionStorage.setItem('c2b_userEmail', matched.email);
      sessionStorage.setItem('c2b_loggedInId', matched.id);
      sessionStorage.setItem('c2b_role', 'SUPPORT');

      if (remember) {
        localStorage.setItem('c2b_saved_agent', matched.email);
      }

      onLogin(matched);
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(145deg, #0D1B2A 0%, #130d24 55%, #1a0e35 100%)',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background glow effects */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '15%',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '15%',
          right: '15%',
          width: '360px',
          height: '360px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(249, 115, 22, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Back button */}
      <a
        href={staffPortalUrl}
        onClick={navigateToStaffPortal}
        id="back-to-staff-portal"
        aria-label="Back to Staff Portal"
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '7px',
          padding: '8px 16px',
          borderRadius: '50px',
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#E2E8F0',
          fontSize: '0.8rem',
          fontWeight: 600,
          textDecoration: 'none',
          zIndex: 9999,
          cursor: 'pointer',
          pointerEvents: 'auto',
          userSelect: 'none',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.16)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <ArrowLeft size={14} style={{ pointerEvents: 'none' }} />
        <span style={{ pointerEvents: 'none' }}>Back to Staff Portal</span>
      </a>

      {/* Login Card */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: '460px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1.5px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          padding: '42px 38px',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 32px 80px rgba(0, 0, 0, 0.5)',
          color: '#fff',
        }}
      >
        {/* Header Icon & Brand */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #5b21b6, #7C3AED)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(124, 58, 237, 0.45)',
              marginBottom: '14px',
            }}
          >
            <Headphones size={32} color="#fff" />
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 900, letterSpacing: '-0.5px' }}>
            CLICK<span style={{ color: '#F97316' }}>2</span>BOOK
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '20px',
              background: 'rgba(124, 58, 237, 0.2)',
              border: '1px solid rgba(124, 58, 237, 0.4)',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: '#DDD6FE',
              marginTop: '8px',
            }}
          >
            Customer Support Agent Portal
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginTop: '16px' }}>
            Agent Login
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '4px' }}>
            Secure React portal authentication for support staff
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMsg && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '0.8rem',
              color: '#F87171',
              fontWeight: 600,
              marginBottom: '18px',
            }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email field */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
              Agent Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@click2book.com"
                required
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 40px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1.5px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '0.88rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Password field */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  padding: '12px 42px 12px 40px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1.5px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '0.88rem',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  display: 'flex',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#94A3B8', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                style={{ accentColor: '#7C3AED' }}
              />
              Remember my session
            </label>
            <span style={{ fontSize: '0.78rem', color: '#C4B5FD', cursor: 'pointer' }}>
              Need Help?
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '13px',
              fontSize: '0.92rem',
              borderRadius: '10px',
            }}
          >
            <LogIn size={16} />
            {isSubmitting ? 'Authenticating Agent…' : 'Login to Support Panel'}
          </button>
        </form>

        <hr
          style={{
            border: 'none',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            margin: '22px 0 16px',
          }}
        />

        <a
          href={staffPortalUrl}
          onClick={navigateToStaffPortal}
          id="back-to-staff-portal-footer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '0.82rem',
            color: '#94A3B8',
            textDecoration: 'none',
            transition: 'color 0.2s',
            cursor: 'pointer',
            padding: '6px',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
        >
          <ArrowLeft size={15} style={{ pointerEvents: 'none' }} />
          <span style={{ pointerEvents: 'none' }}>Back to Staff Access Portal</span>
        </a>

        {/* Security Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            marginTop: '20px',
            fontSize: '0.72rem',
            color: '#64748B',
          }}
        >
          <ShieldCheck size={14} color="#22C55E" />
          <span>All support actions are logged with supervisor audit trail</span>
        </div>
      </div>
    </div>
  );
}
