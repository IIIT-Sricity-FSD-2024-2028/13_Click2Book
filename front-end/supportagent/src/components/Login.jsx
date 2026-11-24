import React, { useState } from 'react';
import { Headphones, Mail, Lock, Eye, EyeOff, LogIn, ShieldCheck } from 'lucide-react';
import { API_BASE } from '../services/api';

const COMPREHENSIVE_AGENTS = [
  {
    id: 'SUPPORT001',
    name: 'Support Agent (Deepika)',
    email: 'support@click2book.com',
    aliases: [
      'support@click2book.in',
      'agent@click2book.com',
      'agent@click2book.in',
      'deepika@support.com',
      'deepika@click2book.com',
      'deepika@click2book.in',
      'support',
      'deepika',
      'support001',
      'sup001',
      's001',
    ],
    role: 'SUPPORT',
    avatar: 'SA',
    title: 'Senior Support Specialist',
    shift: 'General (09:00 - 18:00)',
  },
  {
    id: 'SUPPORT002',
    name: 'Agent Riya',
    email: 'riya@click2book.com',
    aliases: [
      'riya@click2book.in',
      'riya@support.com',
      'riya',
      'support002',
      'sup002',
      's002',
    ],
    role: 'SUPPORT',
    avatar: 'RS',
    title: 'Escalation Supervisor',
    shift: 'Morning (06:00 - 15:00)',
  },
  {
    id: 'SUPPORT003',
    name: 'Agent Karan',
    email: 'karan@click2book.com',
    aliases: [
      'karan@click2book.in',
      'karan@support.com',
      'karan',
      'support003',
      'sup003',
      's003',
    ],
    role: 'SUPPORT',
    avatar: 'KM',
    title: 'Customer Advocate',
    shift: 'Evening (14:00 - 23:00)',
  },
  {
    id: 'SUPPORT004',
    name: 'Vikram Singh',
    email: 'vikram@support.com',
    aliases: ['vikram@click2book.com', 'vikram', 's004'],
    role: 'SUPPORT',
    avatar: 'VS',
    title: 'Customer Support Representative',
    shift: 'Night (22:00 - 07:00)',
  },
];

export default function Login({ onLogin, initialError = '' }) {
  const [email, setEmail] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('c2b_saved_agent') || '';
    }
    return '';
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errorMsg, setErrorMsg] = useState(initialError);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const completeLogin = (matched) => {
    // Persist session across BOTH sessionStorage and localStorage for reliable multi-page navigation
    try {
      sessionStorage.setItem('c2b_loggedIn', 'true');
      sessionStorage.setItem('c2b_userName', matched.name);
      sessionStorage.setItem('c2b_userEmail', matched.email);
      sessionStorage.setItem('c2b_loggedInId', matched.id);
      sessionStorage.setItem('c2b_role', 'SUPPORT');
      sessionStorage.setItem('c2b_sessionVersion', String(matched.sessionVersion ?? 0));

      localStorage.setItem('c2b_loggedIn', 'true');
      localStorage.setItem('c2b_userName', matched.name);
      localStorage.setItem('c2b_userEmail', matched.email);
      localStorage.setItem('c2b_loggedInId', matched.id);
      localStorage.setItem('c2b_role', 'SUPPORT');
      localStorage.setItem('c2b_sessionVersion', String(matched.sessionVersion ?? 0));

      if (remember) {
        localStorage.setItem('c2b_saved_agent', matched.email);
      }
    } catch (_) {}

    setIsSubmitting(false);
    onLogin(matched);
  };

  const findAgentMatch = (identifier) => {
    const cleanId = (identifier || '').trim().toLowerCase();
    return COMPREHENSIVE_AGENTS.find((a) => (
        a.id.toLowerCase() === cleanId ||
        a.email.toLowerCase() === cleanId ||
        a.aliases.some((alias) => alias.toLowerCase() === cleanId)
      ));
  };

  const clearSupportSession = () => {
    for (const storage of [sessionStorage, localStorage]) {
      ['c2b_loggedIn', 'c2b_userName', 'c2b_userEmail', 'c2b_loggedInId', 'c2b_role', 'c2b_sessionVersion'].forEach((key) => storage.removeItem(key));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanInput = (email || '').trim();
    if (!cleanInput) {
      setErrorMsg('⚠️ Please enter your agent email or ID.');
      return;
    }

    if (!password) {
      setErrorMsg('⚠️ Please enter your password.');
      return;
    }

    const matched = findAgentMatch(cleanInput);
    const loginEmail = matched?.email || cleanInput;
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password }),
        signal: AbortSignal.timeout(10000),
      });
      const json = await response.json().catch(() => ({}));
      const userData = json?.data;
      if (!response.ok || !json.success || userData?.role !== 'SUPPORT') {
        const message = json.message || 'Invalid credentials. Please enter a valid support agent email and password.';
        if (message.includes('customer support account has been deactivated')) clearSupportSession();
        setErrorMsg(message);
        return;
      }
      completeLogin({
        ...matched,
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: 'SUPPORT',
        sessionVersion: userData.sessionVersion,
      });
    } catch (requestError) {
      setErrorMsg(requestError instanceof TypeError
        ? 'The service is temporarily unavailable. Please try again.'
        : requestError.message || 'Unable to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
          padding: '40px 36px',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 32px 80px rgba(0, 0, 0, 0.5)',
          color: '#fff',
        }}
      >
        {/* Header Icon & Brand */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
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
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginTop: '14px' }}>
            Agent Login
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '4px' }}>
            Secure authentication for authorized support agents
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
          {/* Email / ID field */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
              Agent Email or ID
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
              />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="support@click2book.com or SUPPORT001"
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
          <div style={{ marginBottom: '16px' }}>
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
                placeholder="Support@123"
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

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#94A3B8', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                style={{ accentColor: '#7C3AED' }}
              />
              Remember my session
            </label>
            <span style={{ fontSize: '0.76rem', color: '#C4B5FD', cursor: 'pointer' }}>
              Assigned Access
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

        {/* Security Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            marginTop: '22px',
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
