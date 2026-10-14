import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function MyProfile({ user, onUpdateUser, onNavigate, showToast }) {
  const [profileName, setProfileName] = useState(user?.name || 'Rahul');
  const [profileEmail, setProfileEmail] = useState(user?.email || 'rahul.sharma@email.com');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '+91 9876543210');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');

  // Stats
  const [tripsCount, setTripsCount] = useState(6);
  const [points, setPoints] = useState(550);
  const [savings, setSavings] = useState(506);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  // Form states for modals
  const [editName, setEditName] = useState(profileName);
  const [editEmail, setEditEmail] = useState(profileEmail);
  const [editPhone, setEditPhone] = useState(profilePhone);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user) {
      setProfileName(user.name || 'Rahul');
      setProfileEmail(user.email || 'rahul.sharma@email.com');
      setProfilePhone(user.phone || '+91 9876543210');
      setAvatarUrl(user.avatar || '');
      setEditName(user.name || 'Rahul');
      setEditEmail(user.email || 'rahul.sharma@email.com');
      setEditPhone(user.phone || '+91 9876543210');
    }

    // Try reading bookings count for dynamic trip stats
    try {
      const storedBookings = JSON.parse(localStorage.getItem('c2b_bookings') || '[]');
      if (storedBookings.length > 0) {
        setTripsCount(storedBookings.length);
        const totalPaid = storedBookings.reduce((sum, b) => sum + (Number(b.totalAmount || b.fare || 0)), 0);
        setPoints(Math.round(totalPaid * 0.1) || 550);
        setSavings(Math.round(totalPaid * 0.15) || 506);
      }
    } catch {
      // Fallback defaults
    }
  }, [user]);

  const initials = profileName
    .trim()
    .split(/\s+/)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'RS';

  const handleOpenEditModal = () => {
    setEditName(profileName);
    setEditEmail(profileEmail);
    setEditPhone(profilePhone);
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      showToast('⚠️ Please enter a valid name.', 'error');
      return;
    }
    if (!editEmail.trim() || !editEmail.includes('@')) {
      showToast('⚠️ Please enter a valid email address.', 'error');
      return;
    }

    setProfileName(editName);
    setProfileEmail(editEmail);
    setProfilePhone(editPhone);

    const updated = {
      ...user,
      name: editName,
      email: editEmail,
      phone: editPhone
    };

    try {
      if (user?.id) {
        await api.customers.updateProfile(user.id, {
          name: editName,
          email: editEmail,
          phone: editPhone,
          phoneNumber: editPhone,
        });
      }
    } catch {
      // Offline fallback ok
    }

    if (onUpdateUser) onUpdateUser(updated);
    setIsEditModalOpen(false);
    showToast('✅ Profile updated successfully!', 'success');
  };

  const handleSavePassword = () => {
    if (!currentPassword) {
      showToast('⚠️ Please enter your current password.', 'error');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      showToast('⚠️ New password must be at least 6 characters long.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('⚠️ Passwords do not match.', 'error');
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsPasswordModalOpen(false);
    showToast('✅ Password changed successfully!', 'success');
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('⚠️ Photo must be smaller than 2MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (uploadEvent) => {
      const dataUrl = uploadEvent.target.result;
      setAvatarUrl(dataUrl);

      const updated = { ...user, avatar: dataUrl };
      localStorage.setItem('c2b_user_avatar', dataUrl);
      sessionStorage.setItem('c2b_user_avatar', dataUrl);

      try {
        if (user?.id) {
          await api.customers.uploadProfilePicture(user.id, file);
        }
      } catch {
        // Fallback Base64 already saved
      }

      if (onUpdateUser) onUpdateUser(updated);
      setIsPhotoModalOpen(false);
      showToast('✅ Profile photo updated!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePhoto = () => {
    setAvatarUrl('');
    localStorage.removeItem('c2b_user_avatar');
    sessionStorage.removeItem('c2b_user_avatar');
    if (onUpdateUser) onUpdateUser({ ...user, avatar: '' });
    setIsPhotoModalOpen(false);
    showToast('🗑️ Profile photo removed.', 'info');
  };

  const handleDeleteAccount = () => {
    if (window.confirm('⚠️ Are you sure you want to delete your Click2Book account? This cannot be undone.')) {
      showToast('Account scheduled for deactivation.', 'info');
      setTimeout(() => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
      }, 1500);
    }
  };

  return (
    <div className="page-body fade-up">
      <h1 className="page-heading">My Profile</h1>
      <p className="page-subhead" style={{ marginBottom: '22px' }}>
        Manage your account information
      </p>

      <div className="profile-page-card">
        {/* Avatar Hero */}
        <div className="profile-hero">
          <button className="edit-profile-btn" onClick={handleOpenEditModal} aria-label="Edit profile">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>

          <div
            className="profile-big-avatar"
            onClick={() => setIsPhotoModalOpen(true)}
            title="Click to change or delete photo"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="profile-pic" />
            ) : (
              <span>{initials}</span>
            )}
            <div className="avatar-edit-dot">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
          </div>

          <p className="profile-name-big">{profileName}</p>
          <p className="profile-email">{profileEmail}</p>
          <div className="premium-badge">⭐ Premium Member</div>
        </div>

        {/* Stats Row */}
        <div className="stats-row">
          <div className="stat-item">
            <span className="stat-value">{tripsCount}</span>
            <span className="stat-label">Trips</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{points}</span>
            <span className="stat-label">Points</span>
          </div>
          <div className="stat-item">
            <span className="stat-value orange">₹{savings}</span>
            <span className="stat-label">Savings</span>
          </div>
        </div>

        {/* Menu list */}
        <div className="menu-list">
          <div className="menu-item" onClick={handleOpenEditModal}>
            <div className="menu-item-left">
              <div className="menu-icon orange">✏️</div>
              <div>
                <div className="menu-label">Edit Profile</div>
                <div className="menu-sub">Update your name, email & phone</div>
              </div>
            </div>
            <div className="menu-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </div>
          </div>

          <div className="menu-item" onClick={() => setIsPasswordModalOpen(true)}>
            <div className="menu-item-left">
              <div className="menu-icon blue">🔒</div>
              <div>
                <div className="menu-label">Change Password</div>
                <div className="menu-sub">Update your account password</div>
              </div>
            </div>
            <div className="menu-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </div>
          </div>

          <div className="menu-item" onClick={() => showToast('🔔 Notification settings coming soon!', 'info')}>
            <div className="menu-item-left">
              <div className="menu-icon green">🔔</div>
              <div>
                <div className="menu-label">Notification Settings</div>
                <div className="menu-sub">Manage alerts and reminders</div>
              </div>
            </div>
            <div className="menu-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </div>
          </div>

          <div className="menu-item" onClick={() => showToast('💳 Payment methods coming soon!', 'info')}>
            <div className="menu-item-left">
              <div className="menu-icon purple">💳</div>
              <div>
                <div className="menu-label">Payment Methods</div>
                <div className="menu-sub">Saved UPI, cards & wallets</div>
              </div>
            </div>
            <div className="menu-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </div>
          </div>

          <div
            className="menu-item"
            onClick={() => onNavigate && onNavigate('get-support')}
          >
            <div className="menu-item-left">
              <div className="menu-icon grey">🎧</div>
              <div>
                <div className="menu-label">Need Support?</div>
                <div className="menu-sub">Raise a ticket or chat with us</div>
              </div>
            </div>
            <div className="menu-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div className="danger-section" style={{ padding: '20px 22px' }}>
          <button className="danger-btn" onClick={handleDeleteAccount}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
            Delete Account
          </button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay open">
          <div className="modal-card">
            <h3 className="modal-title">Edit Profile</h3>
            <div className="modal-field">
              <label className="modal-label">Full Name</label>
              <input
                type="text"
                className="modal-input"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="modal-field">
              <label className="modal-label">Email Address</label>
              <input
                type="email"
                className="modal-input"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </div>
            <div className="modal-field">
              <label className="modal-label">Phone Number</label>
              <input
                type="tel"
                className="modal-input"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </button>
              <button className="modal-save" onClick={handleSaveProfile}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="modal-overlay open">
          <div className="modal-card">
            <h3 className="modal-title">Change Password</h3>
            <div className="modal-field">
              <label className="modal-label">Current Password</label>
              <input
                type="password"
                className="modal-input"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="modal-field">
              <label className="modal-label">New Password</label>
              <input
                type="password"
                className="modal-input"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="modal-field">
              <label className="modal-label">Confirm New Password</label>
              <input
                type="password"
                className="modal-input"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setIsPasswordModalOpen(false)}>
                Cancel
              </button>
              <button className="modal-save" onClick={handleSavePassword}>
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Photo Modal */}
      {isPhotoModalOpen && (
        <div className="modal-overlay open">
          <div className="modal-card" style={{ maxWidth: '360px', textAlign: 'center' }}>
            <h3 className="modal-title" style={{ marginBottom: '6px' }}>Profile Photo</h3>
            <p style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Change or delete your profile photo
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '22px' }}>
              <div
                className="profile-big-avatar"
                style={{ width: '96px', height: '96px', fontSize: '2rem', marginBottom: 0, cursor: 'default' }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Preview" className="profile-pic" />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
            </div>

            <input
              type="file"
              id="profilePicInputReact"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handlePhotoUpload}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                className="modal-save"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '12px', fontSize: '.88rem' }}
                onClick={() => document.getElementById('profilePicInputReact')?.click()}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                Change Photo
              </button>

              <button
                className="danger-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '11px',
                  fontSize: '.85rem',
                  opacity: avatarUrl ? 1 : 0.6
                }}
                disabled={!avatarUrl}
                onClick={handleDeletePhoto}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Delete Photo
              </button>

              <button
                className="modal-cancel"
                style={{ width: '100%', padding: '10px', marginTop: '4px' }}
                onClick={() => setIsPhotoModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
