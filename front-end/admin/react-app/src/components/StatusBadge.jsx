import React from 'react';
import { humanize } from '../lib/format.js';

const STATUS_CONFIGS = {
  confirmed: { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' },
  active: { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' },
  resolved: { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' },
  approved: { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' },
  pending: { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
  processing: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  open: { bg: '#fee2e2', text: '#b91c1c', border: '#fecaca' },
  cancelled: { bg: '#fee2e2', text: '#b91c1c', border: '#fecaca' },
  inactive: { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' },
  rejected: { bg: '#fee2e2', text: '#b91c1c', border: '#fecaca' },
  refund: { bg: '#f3e8ff', text: '#6b21a8', border: '#e9d5ff' },
  refunded: { bg: '#f3e8ff', text: '#6b21a8', border: '#e9d5ff' },
};

export default function StatusBadge({ status }) {
  const norm = String(status || '').toLowerCase();
  const config = STATUS_CONFIGS[norm] || { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' };

  return (
    <span
      className={`badge badge-${norm}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: '9999px',
        fontSize: '11px',
        fontWeight: 600,
        backgroundColor: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
        lineHeight: 1.4,
        letterSpacing: '0.01em',
        textTransform: 'capitalize'
      }}
    >
      {humanize(String(status || 'Unknown'))}
    </span>
  );
}
