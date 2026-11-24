import { useCallback, useEffect, useState } from 'react';
import DataTable from './DataTable.jsx';
import StatusBadge from './StatusBadge.jsx';
import { apiFetch } from '../lib/api.js';

export default function ProvidersSection({ onAction, busy = false }) {
  const [providers, setProviders] = useState([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const load = useCallback(() => apiFetch('/providers').then((items) => { setProviders(items); setError(''); }).catch((cause) => setError(cause.message)), []);
  useEffect(() => { load(); }, [load]);

  const approve = async (provider) => {
    await onAction(() => apiFetch(`/providers/${provider.providerId}/approve`, { method: 'PATCH' }), `Provider ${provider.name} approved.`, 'Failed to approve provider.');
    load();
  };
  const toggleStatus = async (provider) => {
    const active = String(provider.status || 'ACTIVE').toUpperCase() === 'ACTIVE';
    if (active && !window.confirm(`Deactivate ${provider.name}? They will lose access and cannot accept new bookings.`)) return;
    await onAction(
      () => apiFetch(`/providers/${provider.providerId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: active ? 'INACTIVE' : 'ACTIVE' }),
      }),
      `Provider ${provider.name} ${active ? 'deactivated' : 'activated'}.`,
      'Failed to update provider status.',
    );
    load();
  };
  return (
    <section className="bookings-section" style={{ background: '#ffffff', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
      <div className="section-header" style={{ marginBottom: '20px' }}>
        <h2 className="section-title" style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Service Provider Directory</h2>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Review provider accounts and approval status</p>
        <input aria-label="Search providers" placeholder="Search provider name, email or ID" value={search} onChange={(event) => setSearch(event.target.value)} style={{ marginTop: 10, padding: '8px 14px', borderRadius: 8, border: '1px solid #cbd5e1', minWidth: 260 }} />
      </div>
      {error && <p className="admin-notice" role="alert">{error}</p>}
      <DataTable headers={['Provider ID', 'Provider', 'Email', 'Contact', 'Status', 'Actions']} emptyText="No service providers found.">
        {providers.filter((provider) => `${provider.providerId} ${provider.name} ${provider.email}`.toLowerCase().includes(search.toLowerCase())).map((provider) => (
          <tr key={provider.providerId} style={{ borderBottom: '1px solid #f1f5f9' }}>
            <td style={{ padding: '14px 18px', fontSize: '13px', fontWeight: 700, color: '#0B2447' }}>{provider.providerId}</td>
            <td style={{ padding: '14px 18px', fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{provider.name}</td>
            <td style={{ padding: '14px 18px', fontSize: '13px', color: '#475569' }}>{provider.email}</td>
            <td style={{ padding: '14px 18px', fontSize: '13px', color: '#64748b' }}>{provider.phoneNumber || '—'}</td>
            <td style={{ padding: '14px 18px' }}><StatusBadge status={!provider.approved ? 'pending' : String(provider.status || 'ACTIVE').toLowerCase()} /></td>
            <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
              {!provider.approved && <button type="button" disabled={busy} onClick={() => approve(provider)} style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, border: 'none', background: '#dcfce7', color: '#15803d', cursor: busy ? 'default' : 'pointer' }}>Approve</button>}
              {provider.approved && <button type="button" disabled={busy} onClick={() => toggleStatus(provider)} style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, border: 'none', background: String(provider.status || 'ACTIVE').toUpperCase() === 'ACTIVE' ? '#fee2e2' : '#dcfce7', color: String(provider.status || 'ACTIVE').toUpperCase() === 'ACTIVE' ? '#dc2626' : '#15803d', cursor: busy ? 'default' : 'pointer' }}>{String(provider.status || 'ACTIVE').toUpperCase() === 'ACTIVE' ? 'Deactivate' : 'Activate'}</button>}
            </td>
          </tr>
        ))}
      </DataTable>
    </section>
  );
}
