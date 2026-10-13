import React, { useState, useEffect } from 'react';

const PANES = [
  { id: 'account',       label: 'Account',       icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  { id: 'profile',       label: 'Profile',       icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg> },
  { id: 'security',      label: 'Security',      icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> },
  { id: 'notifications', label: 'Notifications', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
  { id: 'payment',       label: 'Payment',       icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
  { id: 'help',          label: 'Help',          icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
  { id: 'appearance',    label: 'Appearance',    icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg> },
  { id: 'privacy',       label: 'Privacy',       icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
];

function Toggle({ on, onToggle }) {
  return (
    <div className={`toggle-switch ${on ? 'on' : ''}`} onClick={onToggle} role="switch" aria-checked={on} tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onToggle()} />
  );
}

export default function Settings({ provider, showToast }) {
  const [activePane, setActivePane] = useState('account');
  const [notifs, setNotifs] = useState({ bookings: true, capacity: true, confirmed: true, promotions: false });
  const [dark, setDark] = useState(false);
  const [compact, setCompact] = useState(false);
  const [form, setForm] = useState({
    name: provider?.name || sessionStorage.getItem('c2b_userName') || '',
    email: provider?.email || sessionStorage.getItem('c2b_userEmail') || '',
    phone: '', company: '', gst: '',
  });

  const handleSave = (section) => {
    showToast(`${section} settings saved successfully.`, 'success');
  };

  const setF = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h3>Settings</h3>
        <p>Manage your account preferences</p>
      </div>

      <div className="settings-layout">
        {/* Sidebar menu */}
        <div className="settings-sidebar-menu">
          {PANES.map((p) => (
            <button
              key={p.id}
              className={`settings-menu-item ${activePane === p.id ? 'active' : ''}`}
              onClick={() => setActivePane(p.id)}
            >
              {p.icon}
              {p.label}
            </button>
          ))}
        </div>

        {/* Pane content */}
        <div className="settings-content">
          {/* ── Account ── */}
          {activePane === 'account' && (
            <>
              <div className="settings-card">
                <h2>Account Information</h2>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Account Type</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Standard Provider</div>
                  </div>
                  <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>Upgrade to Premium</button>
                </div>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem' }}>Account Statistics</h3>
                <div className="account-stats">
                  {[{ num: '24', lbl: 'Total Bookings' }, { num: '2', lbl: 'Active Trips' }, { num: 'Jan 2024', lbl: 'Member Since' }].map((s) => (
                    <div key={s.lbl} className="account-stat-box">
                      <div className="account-stat-num">{s.num}</div>
                      <div className="account-stat-lbl">{s.lbl}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="settings-card">
                <h2>Danger Zone</h2>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.87rem' }}>Delete Account</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Permanently delete your account and all data</div>
                  </div>
                  <button className="btn btn-danger" style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                    onClick={() => showToast('Account deletion requires admin approval.', 'info')}>
                    Delete Account
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ── Profile ── */}
          {activePane === 'profile' && (
            <div className="settings-card">
              <h2>Profile Information</h2>
              <div className="form-row" style={{ marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Full Name / Company Name</label>
                  <input className="form-control no-icon" value={form.name} onChange={setF('name')} placeholder="e.g. APSRTC Travels" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input className="form-control no-icon" type="email" value={form.email} onChange={setF('email')} placeholder="provider@company.com" />
                </div>
              </div>
              <div className="form-row" style={{ marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input className="form-control no-icon" value={form.phone} onChange={setF('phone')} placeholder="+91 98765 43210" />
                </div>
                <div className="form-group">
                  <label className="form-label">GST Number</label>
                  <input className="form-control no-icon" value={form.gst} onChange={setF('gst')} placeholder="e.g. 29ABCDE1234F1Z5" />
                </div>
              </div>
              <button className="btn btn-primary" onClick={() => handleSave('Profile')}>Save Profile</button>
            </div>
          )}

          {/* ── Security ── */}
          {activePane === 'security' && (
            <div className="settings-card">
              <h2>Security Settings</h2>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input className="form-control no-icon" type="password" placeholder="Enter current password" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input className="form-control no-icon" type="password" placeholder="Min 8 characters" />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input className="form-control no-icon" type="password" placeholder="Repeat new password" />
                </div>
              </div>
              <button className="btn btn-primary" onClick={() => handleSave('Security')}>Update Password</button>
            </div>
          )}

          {/* ── Notifications ── */}
          {activePane === 'notifications' && (
            <div className="settings-card">
              <h2>Notification Preferences</h2>
              {[
                { key: 'bookings',   label: 'New Bookings',      sub: 'Get notified when passengers book seats on your trips' },
                { key: 'capacity',   label: 'Capacity Alerts',   sub: 'Alert when a bus reaches 80%+ occupancy' },
                { key: 'confirmed',  label: 'Trip Confirmations', sub: 'Notification when system confirms a trip' },
                { key: 'promotions', label: 'Promotions',        sub: 'Platform updates and promotional messages' },
              ].map(({ key, label, sub }) => (
                <div key={key} className="toggle-row">
                  <div>
                    <div className="toggle-label">{label}</div>
                    <div className="toggle-sub">{sub}</div>
                  </div>
                  <Toggle on={notifs[key]} onToggle={() => setNotifs((n) => ({ ...n, [key]: !n[key] }))} />
                </div>
              ))}
              <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => handleSave('Notification')}>Save Preferences</button>
            </div>
          )}

          {/* ── Payment ── */}
          {activePane === 'payment' && (
            <div className="settings-card">
              <h2>Payment &amp; Payout Settings</h2>
              <div className="form-group">
                <label className="form-label">Bank Account Number</label>
                <input className="form-control no-icon" placeholder="Enter account number" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">IFSC Code</label>
                  <input className="form-control no-icon" placeholder="e.g. SBIN0001234" />
                </div>
                <div className="form-group">
                  <label className="form-label">UPI ID</label>
                  <input className="form-control no-icon" placeholder="provider@upi" />
                </div>
              </div>
              <button className="btn btn-primary" onClick={() => handleSave('Payment')}>Save Payment Info</button>
            </div>
          )}

          {/* ── Help ── */}
          {activePane === 'help' && (
            <div className="settings-card">
              <h2>Help &amp; Support</h2>
              {[
                { q: 'How do I add a new bus schedule?', a: 'Go to "Add Schedule" from the sidebar. Fill in route, timing, vehicle and fare details.' },
                { q: 'How is revenue calculated?', a: '90% of gross ticket sales is your net payout. Platform retains 10% commission.' },
                { q: 'What if the backend is offline?', a: 'All data is saved locally and synced automatically once the backend is back online.' },
                { q: 'How do I track my trips live?', a: 'Go to "Confirm Trips" → click "Start Trip" → update GPS location or use the Simulate button.' },
              ].map(({ q, a }) => (
                <div key={q} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.87rem', marginBottom: 4 }}>Q: {q}</div>
                  <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>A: {a}</div>
                </div>
              ))}
              <div style={{ marginTop: '1rem' }}>
                <div style={{ fontWeight: 600, fontSize: '0.87rem', marginBottom: 6 }}>Contact Support</div>
                <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>📧 support@click2book.in · 📞 1800-XXX-XXXX (Toll Free)</div>
              </div>
            </div>
          )}

          {/* ── Appearance ── */}
          {activePane === 'appearance' && (
            <div className="settings-card">
              <h2>Appearance</h2>
              <div className="toggle-row">
                <div>
                  <div className="toggle-label">Dark Mode</div>
                  <div className="toggle-sub">Switch to a darker color theme</div>
                </div>
                <Toggle on={dark} onToggle={() => { setDark((d) => !d); showToast('Dark mode toggle coming soon!', 'info'); }} />
              </div>
              <div className="toggle-row">
                <div>
                  <div className="toggle-label">Compact View</div>
                  <div className="toggle-sub">Reduce spacing for more content on screen</div>
                </div>
                <Toggle on={compact} onToggle={() => setCompact((c) => !c)} />
              </div>
            </div>
          )}

          {/* ── Privacy ── */}
          {activePane === 'privacy' && (
            <div className="settings-card">
              <h2>Privacy &amp; Data</h2>
              <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                Click2Book collects booking data, route information, and usage analytics to improve our platform.
                Your personal data is never sold to third parties.
              </p>
              <div className="toggle-row">
                <div>
                  <div className="toggle-label">Usage Analytics</div>
                  <div className="toggle-sub">Help us improve the platform with anonymous usage data</div>
                </div>
                <Toggle on={true} onToggle={() => showToast('Analytics preference updated.', 'info')} />
              </div>
              <div style={{ marginTop: '1rem' }}>
                <button className="btn btn-secondary" onClick={() => showToast('Data export request submitted.', 'success')} style={{ marginRight: 8 }}>
                  Export My Data
                </button>
                <button className="btn btn-outline" onClick={() => showToast('Privacy policy — visit click2book.in/privacy', 'info')}>
                  View Privacy Policy
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
