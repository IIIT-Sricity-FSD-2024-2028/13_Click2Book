import { useState } from 'react';
import DataTable from '../../components/DataTable.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { displayDate, humanize } from '../../lib/format.js';
import { USER_ROLES } from './sections.js';

export default function UsersSection({ users, onToggleStatus }) {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const query = search.toLowerCase();
  const filtered = users.filter((user) => {
    const searchable = `${user.name} ${user.email} ${user.id}`.toLowerCase();
    return searchable.includes(query) && (!role || user.role === role);
  });

  return (
    <section className="bookings-section">
      <div className="section-header">
        <h2 className="section-title">User Accounts</h2>
        <div className="filter-bar">
          <select className="filter-select" value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="">All Roles</option>
            {USER_ROLES.map((item) => <option key={item} value={item}>{humanize(item)}</option>)}
          </select>
          <input className="filter-input" placeholder="Search name / email…" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
      </div>
      <DataTable headers={['User ID', 'Name', 'Email', 'Role', 'Phone', 'Status', 'Joined', 'Action']}>
        {filtered.map((user) => {
          const active = user.status === 'active';
          return (
            <tr key={`${user.role}-${user.id}`}>
              <td>{user.id}</td>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{humanize(user.role)}</td>
              <td>{user.phone}</td>
              <td><StatusBadge status={user.status} /></td>
              <td>{displayDate(user.joined)}</td>
              <td>
                <button className={`action-btn ${active ? 'btn-danger' : 'btn-success'}`} type="button" disabled={!user.canToggle} onClick={() => onToggleStatus(user)}>
                  {user.canToggle ? (active ? 'Deactivate' : 'Activate') : 'Managed elsewhere'}
                </button>
              </td>
            </tr>
          );
        })}
      </DataTable>
    </section>
  );
}
