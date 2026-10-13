import { useState } from 'react';
import { Card, EmptyRow, Modal, Pill, Table, matches } from '../components/ui';
import { adminActions } from '../lib/adminData';

export const PERMISSIONS = [
  ['MANAGE_ADMINS', 'Manage admins'],
  ['MANAGE_PROVIDERS', 'Providers & buses'],
  ['MANAGE_CUSTOMERS', 'Customers'],
  ['MANAGE_BOOKINGS', 'Bookings'],
  ['VIEW_REPORTS', 'Analytics & reports'],
  ['MANAGE_FINANCE', 'Finance'],
  ['MANAGE_SUPPORT', 'Support oversight'],
  ['MANAGE_SETTINGS', 'Platform settings'],
];

export const ROLE_DEFAULTS = {
  SUPER_ADMIN: PERMISSIONS.map(([p]) => p),
  ADMIN: ['MANAGE_PROVIDERS', 'MANAGE_CUSTOMERS', 'MANAGE_BOOKINGS', 'VIEW_REPORTS', 'MANAGE_SUPPORT'],
  FINANCE: ['VIEW_REPORTS', 'MANAGE_FINANCE'],
  SUPPORT_LEAD: ['MANAGE_SUPPORT', 'MANAGE_BOOKINGS'],
};

const ROLE_LABEL = { SUPER_ADMIN: 'Super Admin', ADMIN: 'Admin', FINANCE: 'Finance', SUPPORT_LEAD: 'Support Lead' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function AdminForm({ initial, onCancel, onSave, saving }) {
  const editing = !!initial;
  const [f, setF] = useState(() => ({
    name: initial?.name || '',
    email: initial?.email || '',
    password: '',
    role: initial?.role || 'ADMIN',
    permissions: initial?.permissions || ROLE_DEFAULTS.ADMIN,
  }));
  const [error, setError] = useState('');
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const setRole = (e) => setF((x) => ({ ...x, role: e.target.value, permissions: ROLE_DEFAULTS[e.target.value] }));
  const toggle = (p) =>
    setF((x) => ({ ...x, permissions: x.permissions.includes(p) ? x.permissions.filter((y) => y !== p) : [...x.permissions, p] }));

  const submit = () => {
    if (f.name.trim().length < 2) return setError('Enter a name.');
    if (!EMAIL_RE.test(f.email.trim())) return setError('Enter a valid email.');
    if (!editing && f.password.length < 6) return setError('Password must be at least 6 characters.');
    if (editing && f.password && f.password.length < 6) return setError('New password must be at least 6 characters.');
    if (!f.permissions.length) return setError('Give the account at least one permission.');
    setError('');
    const body = {
      name: f.name.trim(),
      email: f.email.trim(),
      role: f.role,
      permissions: f.role === 'SUPER_ADMIN' ? ROLE_DEFAULTS.SUPER_ADMIN : f.permissions,
    };
    if (f.password) body.password = f.password;
    onSave(body);
  };

  return (
    <Modal
      title={editing ? `Edit ${initial.name}` : 'Create admin account'}
      onClose={onCancel}
      footer={
        <>
          <button className="action-btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className="action-btn btn-primary" id="saveAdminBtn" onClick={submit} disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create admin'}
          </button>
        </>
      }
    >
      <div className="form-grid">
        <label>
          Name
          <input id="adminFormName" value={f.name} onChange={set('name')} />
        </label>
        <label>
          Email
          <input id="adminFormEmail" type="email" value={f.email} onChange={set('email')} />
        </label>
        <label>
          {editing ? 'New password (leave blank to keep)' : 'Password'}
          <input id="adminFormPassword" type="password" value={f.password} onChange={set('password')} autoComplete="new-password" />
        </label>
        <label>
          Role
          <select id="adminFormRole" value={f.role} onChange={setRole}>
            {Object.entries(ROLE_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="perm-title">Permissions {f.role === 'SUPER_ADMIN' && <small>(Super Admin always has every permission)</small>}</div>
      <div className="perm-grid">
        {PERMISSIONS.map(([p, label]) => (
          <label key={p} className="perm-item">
            <input
              type="checkbox"
              checked={f.role === 'SUPER_ADMIN' || f.permissions.includes(p)}
              disabled={f.role === 'SUPER_ADMIN'}
              onChange={() => toggle(p)}
            />
            {label}
          </label>
        ))}
      </div>
      {error && <div className="form-error">⚠️ {error}</div>}
    </Modal>
  );
}

export default function Admins({ ctx }) {
  const { data, q, act, busy } = ctx;
  const [editing, setEditing] = useState(null); // null | 'new' | admin
  const [saving, setSaving] = useState(false);
  const [actorFilter, setActorFilter] = useState('');
  const myEmail = (sessionStorage.getItem('c2b_userEmail') || localStorage.getItem('c2b_userEmail') || '').toLowerCase();

  const admins = data.admins.filter((a) => matches(q, a.adminId, a.name, a.email, a.role, a.status));
  const activity = data.activity.filter((e) => matches(actorFilter.toLowerCase(), e.actor, e.action, e.path));

  const save = async (body) => {
    setSaving(true);
    const ok = await act(
      editing === 'new' ? 'new' : editing.adminId,
      editing === 'new' ? `Admin ${body.name} created.` : `${body.name} updated.`,
      () => (editing === 'new' ? adminActions.createAdmin(body) : adminActions.updateAdmin(editing.adminId, body)),
    );
    setSaving(false);
    if (ok) setEditing(null);
  };

  return (
    <>
      <Card
        title="Admin Accounts"
        count={admins.length}
        id="adminsCard"
        actions={
          <button className="action-btn btn-primary" id="newAdminBtn" onClick={() => setEditing('new')}>
            + New admin
          </button>
        }
      >
        <Table head={['Admin ID', 'Name', 'Email', 'Role', 'Permissions', 'Status', 'Last login', 'Actions']} id="adminsTable">
          {admins.length === 0 ? (
            <EmptyRow icon="🛡️" message={ctx.live ? 'No admins match.' : 'Admin accounts need the backend.'} />
          ) : (
            admins.map((a) => {
              const self = a.email.toLowerCase() === myEmail;
              return (
                <tr key={a.adminId}>
                  <td className="booking-id">{a.adminId}</td>
                  <td>
                    <strong>{a.name}</strong> {self && <Pill tone="blue">You</Pill>}
                  </td>
                  <td>{a.email}</td>
                  <td>
                    <Pill tone={a.role === 'SUPER_ADMIN' ? 'purple' : 'blue'}>{ROLE_LABEL[a.role] || a.role}</Pill>
                  </td>
                  <td className="perm-cell" title={(a.permissions || []).join(', ')}>
                    {a.role === 'SUPER_ADMIN' ? 'All' : `${(a.permissions || []).length} of ${PERMISSIONS.length}`}
                  </td>
                  <td>
                    <Pill tone={a.status === 'ACTIVE' ? 'green' : 'red'}>{a.status === 'ACTIVE' ? 'Active' : 'Deactivated'}</Pill>
                  </td>
                  <td>{a.lastLoginAt ? a.lastLoginAt.replace('T', ' ').slice(0, 16) : 'Never'}</td>
                  <td className="actions-cell">
                    <button className="action-btn btn-ghost" onClick={() => setEditing(a)} disabled={busy === a.adminId}>
                      Edit
                    </button>{' '}
                    {a.status === 'ACTIVE' ? (
                      <button
                        className="action-btn btn-warn"
                        disabled={busy === a.adminId || self}
                        title={self ? 'You cannot deactivate your own account' : ''}
                        onClick={() =>
                          act(
                            a.adminId,
                            `${a.name} deactivated.`,
                            () => adminActions.deactivateAdmin(a.adminId),
                            `Deactivate ${a.name}? They will not be able to log in.`,
                          )
                        }
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        className="action-btn btn-success"
                        disabled={busy === a.adminId}
                        onClick={() => act(a.adminId, `${a.name} activated.`, () => adminActions.activateAdmin(a.adminId))}
                      >
                        Activate
                      </button>
                    )}{' '}
                    <button
                      className="action-btn btn-danger"
                      disabled={busy === a.adminId || self}
                      title={self ? 'You cannot delete your own account' : ''}
                      onClick={() =>
                        act(
                          a.adminId,
                          `${a.name} deleted.`,
                          () => adminActions.deleteAdmin(a.adminId),
                          `Delete admin ${a.name} (${a.email})? This cannot be undone.`,
                        )
                      }
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </Table>
      </Card>

      <Card
        title="Admin Activity"
        count={activity.length}
        id="activityCard"
        actions={
          <input
            className="filter-input"
            id="activityFilter"
            placeholder="Filter by admin or action…"
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
          />
        }
      >
        <p className="card-note">
          Every change made from an admin account (create, update, approve, cancel, delete…). Read-only views are not logged.
        </p>
        <Table head={['When', 'Admin', 'Action', 'Endpoint', 'Result']} id="activityTable">
          {activity.length === 0 ? (
            <EmptyRow icon="📜" message="No admin activity recorded since the server started." />
          ) : (
            activity.map((e) => (
              <tr key={e.id}>
                <td>{e.at.replace('T', ' ').slice(0, 19)}</td>
                <td>{e.actor}</td>
                <td>{e.action}</td>
                <td>
                  <code>
                    {e.method} {e.path}
                  </code>
                </td>
                <td>
                  <Pill tone={e.status < 400 ? 'green' : 'red'}>{e.status < 400 ? `OK ${e.status}` : `Failed ${e.status}`}</Pill>
                </td>
              </tr>
            ))
          )}
        </Table>
      </Card>

      {editing && (
        <AdminForm initial={editing === 'new' ? null : editing} onCancel={() => setEditing(null)} onSave={save} saving={saving} />
      )}
    </>
  );
}
