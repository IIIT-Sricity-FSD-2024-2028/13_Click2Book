export default function BrandMark({ superuser }) {
  return (
    <div className="form-logo" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
      <div
        className="form-logo-icon"
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #0B2447, #19376D)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(11,36,71,0.2)',
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      </div>
      <div className="form-logo-text" style={{ display: 'flex', flexDirection: 'column' }}>
        <span className="form-logo-name" style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.5px', color: '#0B2447' }}>
          CLICK2BOOK
        </span>
        <span className="form-logo-tag" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {superuser ? 'Root Management' : 'Admin Access'}
        </span>
      </div>
    </div>
  );
}
