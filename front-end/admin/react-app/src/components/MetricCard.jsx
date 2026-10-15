import React from 'react';

export default function MetricCard({ label, value, delta, accent = '#f97316', icon }) {
  return (
    <div className="stat-card" style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '22px 24px',
      background: '#ffffff',
      borderRadius: '14px',
      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
      position: 'relative',
      overflow: 'hidden',
      border: '1px solid #f1f5f9'
    }}>
      {icon && (
        <div className="stat-icon-wrap" style={{
          width: '46px',
          height: '46px',
          borderRadius: '12px',
          background: `${accent}15`,
          color: accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '22px',
          flexShrink: 0
        }}>
          {icon}
        </div>
      )}
      <div className="stat-body" style={{ flex: 1 }}>
        {delta && (
          <div className="stat-delta" style={{
            fontSize: '12px',
            fontWeight: 600,
            color: accent,
            marginBottom: '4px',
            letterSpacing: '0.02em'
          }}>
            {delta}
          </div>
        )}
        <div className="stat-value" style={{
          fontSize: '26px',
          fontWeight: 800,
          color: '#0f172a',
          lineHeight: 1.15
        }}>
          {value}
        </div>
        <div className="stat-label" style={{
          fontSize: '13px',
          color: '#64748b',
          marginTop: '4px',
          fontWeight: 500
        }}>
          {label}
        </div>
      </div>
      <div
        className="stat-decorator"
        style={{
          position: 'absolute',
          right: '-20px',
          bottom: '-20px',
          width: '90px',
          height: '90px',
          borderRadius: '50%',
          backgroundColor: accent,
          opacity: 0.08,
          pointerEvents: 'none'
        }}
      />
    </div>
  );
}
