import React from 'react';

export default function BrandMark({ superuser = false }) {
  return (
    <div className="form-logo">
      <div className="form-logo-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {superuser ? (
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          ) : (
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          )}
        </svg>
      </div>
      <div className="form-logo-text">
        <span className="form-logo-name">Click2Book</span>
        <span className="form-logo-tag">{superuser ? 'Super User Portal' : 'Admin Portal'}</span>
      </div>
    </div>
  );
}
