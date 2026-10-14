import { Link } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import BusLogoIcon from '../components/BusLogoIcon';
import './StaffAccess.css';

export default function StaffAccess() {
  usePageTitle('Staff Access Portal – Click2Book');

  return (
    <div className="pg-landing-staff-access">
      {/* background dots */}
      <div className="dot" style={{ width: '70px', height: '70px', bottom: '15%', left: '8%', animationDuration: '18s' }} />
      <div
        className="dot"
        style={{ width: '45px', height: '45px', bottom: '40%', right: '10%', animationDuration: '22s', animationDelay: '4s' }}
      />
      <div
        className="dot"
        style={{ width: '25px', height: '25px', bottom: '65%', left: '22%', animationDuration: '16s', animationDelay: '2s' }}
      />
      <div
        className="dot"
        style={{ width: '55px', height: '55px', bottom: '25%', right: '28%', animationDuration: '20s', animationDelay: '6s' }}
      />
      {/* MAIN CARD */}
      <div className="card">
        {/* Card Header */}
        <div className="card-header">
          <Link to="/" className="logo-row" title="Go to home page" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="logo-icon">
              <BusLogoIcon size={26} />
            </div>
            <span className="logo-name">CLICK2BOOK</span>
          </Link>
          <div className="portal-badge">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>{' '}
            Staff Access Portal
          </div>
        </div>
        {/* Card Body */}
        <div className="card-body">
          <h1 className="body-title">Welcome to Staff Portal</h1>
          <p className="body-sub">Select your role to access your dedicated dashboard</p>
          <div className="roles-grid">
            {/* Super Admin portal */}
            <Link to="/super-admin/login" className="role-card superadmin" id="superAdminCard">
              <div className="role-icon-wrap">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0b2447"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <ellipse cx="12" cy="5" rx="9" ry="3" />
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                  <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
                </svg>
              </div>
              <div className="role-name">Super Admin</div>
              <p className="role-desc">Platform data console and revenue: manage every table, edit or remove any record, reset demo data</p>
              <span className="role-link">
                Access Portal{' '}
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14m-6-7 7 7-7 7" />
                </svg>
              </span>
            </Link>
          </div>
          {/* Security Notice */}
          <div className="security-notice">
            <div className="sec-icon">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#f97316"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div className="sec-text">
              <strong>Secure Staff Access</strong>{' '}
              <span>This portal is for authorized staff only. All activities are monitored and logged for security purposes.</span>
            </div>
          </div>
          {/* Customer Link */}
          <div className="customer-link">
            Looking for customer login? <Link to="/login">Go to Customer Login →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
