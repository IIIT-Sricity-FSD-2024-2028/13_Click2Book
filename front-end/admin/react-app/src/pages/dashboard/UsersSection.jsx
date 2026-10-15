import React, { useState } from 'react';
import DataTable from '../../components/DataTable.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { displayDate, humanize } from '../../lib/format.js';
import { USER_ROLES } from './sections.js';

export default function UsersSection({ users = [], onToggleStatus, busy = false }) {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const query = (search || '').toLowerCase();
  const filtered = users.filter((user) => {
    const searchable = `${user.name} ${user.email} ${user.id}`.toLowerCase();
    return searchable.includes(query) && (!role || user.role === role);
  });

  return (
    <section className="bookings-section" style={{ background: '#ffffff', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h2 className="section-title" style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Platform User Directory</h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Customers, service providers, system administrators, and support staff</p>
        </div>
        <div className="filter-bar" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <select
            className="filter-select"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              color: '#334155',
              background: '#fff',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="">All Roles</option>
            {USER_ROLES.map((item) => (
              <option key={item} value={item}>
                {humanize(item)}
              </option>
            ))}
          </select>
          <input
            className="filter-input"
            placeholder="Search by name, email or ID…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              minWidth: '240px',
              outline: 'none'
            }}
          />
        </div>
      </div>
      <DataTable headers={['User ID', 'Name', 'Email Address', 'Role', 'Phone Number', 'Account Status', 'Joined Date', 'Actions']} emptyText="No user accounts found matching your query.">
        {filtered.map((user) => {
          const active = user.status === 'active';
          return (
            <tr key={`${user.role}-${user.id}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '14px 18px', fontSize: '13px', fontWeight: 700, color: '#0B2447' }}>{user.id}</td>
              <td style={{ padding: '14px 18px', fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{user.name}</td>
              <td style={{ padding: '14px 18px', fontSize: '13px', color: '#475569' }}>{user.email}</td>
              <td style={{ padding: '14px 18px', fontSize: '13px', color: '#334155' }}>{humanize(user.role)}</td>
              <td style={{ padding: '14px 18px', fontSize: '13px', color: '#64748b' }}>{user.phone || '—'}</td>
              <td style={{ padding: '14px 18px' }}><StatusBadge status={user.status} /></td>
              <td style={{ padding: '14px 18px', fontSize: '13px', color: '#64748b' }}>{displayDate(user.joined)}</td>
              <td style={{ padding: '14px 18px' }}>
                <button
                  type="button"
                  disabled={!user.canToggle || busy}
                  onClick={() => onToggleStatus(user)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: user.canToggle && !busy ? 'pointer' : 'default',
                    border: 'none',
                    background: !user.canToggle ? '#f1f5f9' : active ? '#fee2e2' : '#dcfce7',
                    color: !user.canToggle ? '#94a3b8' : active ? '#dc2626' : '#16a34a',
                    opacity: busy && user.canToggle ? 0.6 : 1,
                    transition: 'opacity 0.2s'
                  }}
                >
                  {user.canToggle ? (active ? 'Deactivate' : 'Activate') : 'Managed'}
                </button>
              </td>
            </tr>
          );
        })}
      </DataTable>
    </section>
  );
}
