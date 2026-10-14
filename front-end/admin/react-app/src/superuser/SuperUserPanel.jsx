import { useEffect, useRef, useState } from 'react';
import { DB } from '../lib/db.js';
import { SUPER_USER_AUTH_KEY, SUPER_USER_LOGIN_PATH } from '../lib/session.js';
import '../styles/super-user-panel.css';
import ConfirmDelete from './ConfirmDelete.jsx';
import RecordModal from './RecordModal.jsx';
import { DEFAULT_TABLE, TABLE_SCHEMAS } from './tableSchemas.js';

const MONEY_COLUMNS = ['amount', 'discount_amount', 'refund_amount'];

function isBadgeColumn(column) {
  return column.includes('status') || column === 'gender';
}

function CellValue({ column, value, isPk }) {
  if (isBadgeColumn(column)) {
    const cls = String(value ?? 'none').replace(/\s/g, '_');
    return <span className={`c2b-badge c2b-badge-${cls}`}>{value ?? '—'}</span>;
  }
  if (MONEY_COLUMNS.includes(column) || column.endsWith('_amount')) {
    return value != null ? `₹${Number(value).toFixed(2)}` : '—';
  }
  if (column === 'rating') return value ? '★'.repeat(Number(value)) : '—';
  if (isPk) return <span style={{ fontWeight: 700, color: '#0B2447' }}>{value ?? '—'}</span>;
  return value ?? '—';
}

// The super-user login page sends us back with ?superUser=open once
// unlocked. That unlock lasts for this page view only.
function readUnlockRequest() {
  const requested = new URLSearchParams(location.search).get('superUser') === 'open';
  return requested && sessionStorage.getItem(SUPER_USER_AUTH_KEY) === 'true';
}

export default function SuperUserPanel({ actorLabel = 'Super User Portal', onDataChange }) {
  const [unlocked] = useState(readUnlockRequest);
  const [open, setOpen] = useState(unlocked);
  const [tableKey, setTableKey] = useState(DEFAULT_TABLE);
  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState(null); // { record } — record null means "add"
  const [pendingDelete, setPendingDelete] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success', visible: false });
  const [, setVersion] = useState(0);
  const toastTimer = useRef();

  useEffect(() => {
    sessionStorage.removeItem(SUPER_USER_AUTH_KEY);
    if (new URLSearchParams(location.search).has('superUser')) {
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const schema = TABLE_SCHEMAS[tableKey];
  const table = DB[schema.dbKey];
  const rows = table.getAll();
  const query = filter.toLowerCase();
  const filtered = filter
    ? rows.filter((row) => schema.columns.some((column) => String(row[column] ?? '').toLowerCase().includes(query)))
    : rows;

  const showToast = (message, type = 'success') => {
    clearTimeout(toastTimer.current);
    setToast({ message, type, visible: true });
    toastTimer.current = setTimeout(() => setToast((current) => ({ ...current, visible: false })), 3200);
  };

  const afterMutation = (result, onSuccess) => {
    if (!result.success) {
      showToast(result.error, 'error');
      return;
    }
    onSuccess?.();
    setVersion((value) => value + 1);
    onDataChange?.();
    showToast(result.message, 'success');
  };

  const openPanel = () => {
    if (unlocked) setOpen(true);
    else location.href = SUPER_USER_LOGIN_PATH;
  };

  const selectTable = (key) => {
    setTableKey(key);
    setFilter('');
  };

  const saveRecord = (data) => {
    const result = editing.record
      ? table.update(editing.record[schema.pkField], data)
      : table.create(data);
    afterMutation(result, () => setEditing(null));
  };

  const confirmDelete = () => {
    const { dbKey, pkValue } = pendingDelete;
    setPendingDelete(null);
    afterMutation(DB[dbKey].delete(pkValue));
  };

  const resetDatabase = () => {
    if (!window.confirm('⚠️ Reset ALL tables back to original mock data?\nEvery change will be lost.')) return;
    afterMutation(DB.resetAll());
  };

  return (
    <>
      {unlocked && (
        <div className="admin-notice superuser-ready">Super user access enabled. Use the Super User button to manage system entities.</div>
      )}

      <button id="c2b-toggle-btn" type="button" title="Open Super User Portal" onClick={openPanel}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
        </svg>
        Super User
      </button>

      <div id="c2b-root" className={open ? 'c2b-open' : ''} onClick={(event) => event.target === event.currentTarget && setOpen(false)}>
        <div id="c2b-panel" role="dialog" aria-modal="true" aria-label="Super User Portal">
          <div id="c2b-sidebar">
            <div className="c2b-brand">
              <h3>📈 Super User</h3>
              <p>{actorLabel}</p>
            </div>
            <nav className="c2b-nav">
              {Object.entries(TABLE_SCHEMAS).map(([key, item]) => (
                <div
                  key={key}
                  role="button"
                  tabIndex={0}
                  className={`c2b-nav-item${key === tableKey ? ' active' : ''}`}
                  onClick={() => selectTable(key)}
                  onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && selectTable(key)}
                >
                  {item.label}
                </div>
              ))}
            </nav>
          </div>

          <div id="c2b-main">
            <div className="c2b-topbar">
              <div className="c2b-topbar-left">
                <h2 id="c2b-tableTitle">{schema.label}</h2>
                <p id="c2b-tableSubtitle">{schema.subtitle}</p>
              </div>
              <div className="c2b-topbar-right">
                <div className="c2b-search">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                  </svg>
                  <input id="c2b-searchInput" type="text" placeholder="Search…" aria-label={`Search ${schema.label}`} value={filter} onChange={(event) => setFilter(event.target.value)} />
                </div>
                <span id="c2b-recordCount">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
                <button type="button" className="c2b-btn c2b-btn-primary" onClick={() => setEditing({ record: null })}>+ Add Record</button>
                <button type="button" className="c2b-btn c2b-btn-danger" onClick={resetDatabase}>⚠ Reset DB</button>
                <button type="button" className="c2b-btn-close" title="Close Panel" aria-label="Close panel" onClick={() => setOpen(false)}>✕</button>
              </div>
            </div>

            <div id="c2b-statsBar">
              {schema.stats(rows).map((stat) => (
                <div className="c2b-stat-card" key={stat.label}>
                  <span className="c2b-stat-label">{stat.label}</span>
                  <span className={`c2b-stat-value ${stat.cls || ''}`}>{stat.value}</span>
                </div>
              ))}
            </div>

            <div id="c2b-content">
              {filtered.length === 0 ? (
                <div id="c2b-emptyState">
                  <div className="c2b-empty-icon">📭</div>
                  <p>No records found.</p>
                </div>
              ) : (
                <div className="c2b-table-wrap">
                  <table id="c2b-dataTable">
                    <thead>
                      <tr>
                        {schema.columns.map((column) => <th key={column}>{column.replace(/_/g, ' ')}</th>)}
                        <th aria-label="Actions" />
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((record) => {
                        const pk = record[schema.pkField];
                        return (
                          <tr key={String(pk)}>
                            {schema.columns.map((column) => (
                              <td key={column}><CellValue column={column} value={record[column]} isPk={column === schema.pkField} /></td>
                            ))}
                            <td>
                              <div className="c2b-td-actions">
                                <button type="button" className="c2b-btn-icon edit" title="Edit" aria-label={`Edit ${pk}`} onClick={() => setEditing({ record })}>✏️</button>
                                <button type="button" className="c2b-btn-icon trash" title="Delete" aria-label={`Delete ${pk}`} onClick={() => setPendingDelete({ dbKey: schema.dbKey, pkField: schema.pkField, pkValue: pk })}>🗑️</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {editing && (
        <RecordModal
          key={`${tableKey}-${editing.record?.[schema.pkField] ?? 'new'}`}
          schema={schema}
          record={editing.record}
          onClose={() => setEditing(null)}
          onSave={saveRecord}
          onInvalid={(message) => showToast(message, 'error')}
        />
      )}

      {pendingDelete && (
        <ConfirmDelete
          pkField={pendingDelete.pkField}
          pkValue={pendingDelete.pkValue}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        />
      )}

      <div id="c2b-toast" className={`c2b-t-${toast.type}${toast.visible ? ' c2b-toast-show' : ''}`} role="status" aria-live="polite">
        <span id="c2b-toastIcon">{toast.type === 'success' ? '✓' : '✕'}</span>
        <span id="c2b-toastMsg">{toast.message}</span>
      </div>
    </>
  );
}
