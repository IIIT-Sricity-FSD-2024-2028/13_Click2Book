/**
 * Super User CRUD panel backed by Redux Toolkit store.
 * Each portal passes its own table schemas (see src/lib/crudSchemas).
 * Access checks `auth.superUserAuth` in Redux memory; otherwise navigates to Super Admin login.
 */
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import DB from '../../lib/db';
import { isRemoteTable } from '../../lib/db/remote';
import { liveSync } from '../../lib/liveSync';
import {
  createTableRecordThunk,
  deleteTableRecordThunk,
  pullAllTablesThunk,
  resetAllTablesThunk,
  setCurrentTable,
  setPanelModal,
  setPanelOpen,
  setPendingDelete,
  setSearchFilter,
  showPanelToastThunk,
  updateTableRecordThunk,
} from '../../store/actions';
import Sidebar from './Sidebar';
import PageHeader from './PageHeader';
import SearchBar from './SearchBar';
import RecordCount from './RecordCount';
import HeaderActions from './HeaderActions';
import StatsRow from './StatsRow';
import DataTable from './DataTable';
import './SuperUserPanel.css';

/** Look up a record, retrying with a numeric key (seat numbers etc.). */
function getRecord(dbKey, pk) {
  let result = DB[dbKey].getById(pk);
  if (!result.success && !isNaN(Number(pk))) result = DB[dbKey].getById(Number(pk));
  return result;
}

function RecordForm({ schema, record, formRef, remote }) {
  const isEdit = record !== null;
  if (!schema.fields || schema.fields.length === 0) {
    return (
      <p style={{ color: '#6b7280', fontSize: 14, gridColumn: '1/-1' }}>
        This table is read-only — no fields to edit.
      </p>
    );
  }
  return (
    <form className="c2b-form" id="c2b-recordForm" ref={formRef} onSubmit={(e) => e.preventDefault()}>
      {schema.fields.map((field) => {
        const id = 'c2bf_' + field.key;
        // The backend assigns IDs to new records.
        const autoId = remote && !isEdit && field.key === schema.pkField;
        const common = {
          id,
          name: field.key,
          placeholder: autoId ? 'Assigned by backend' : field.label,
          required: field.required && !autoId,
          disabled: (isEdit || autoId) && field.key === schema.pkField,
          defaultValue: record ? (record[field.key] ?? '') : field.type === 'select' ? field.options[0] : '',
        };
        const full = field.key === 'comment' || field.key === 'description';
        return (
          <div key={field.key} className={'c2b-form-field' + (full ? ' full' : '')}>
            <label htmlFor={id}>
              {field.label}
              {field.required ? ' *' : ''}
            </label>
            {field.type === 'select' ? (
              <select {...common}>
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                {...common}
                type={['number', 'date', 'time'].includes(field.type) ? field.type : 'text'}
                {...(field.type === 'number' ? { step: '0.01', min: '0' } : {})}
              />
            )}
          </div>
        );
      })}
    </form>
  );
}

/**
 * `alwaysOpen` renders it as a full page (the Super Admin portal): no toggle button,
 * and the ✕ button calls `onClose` (logout) instead of hiding the panel.
 * `links` ([{ label, to }]) adds sidebar entries that open other pages.
 */
export default function SuperUserPanel({
  schemas,
  defaultTable,
  actorLabel = 'Actor Portal',
  hideToggle = false,
  alwaysOpen = false,
  onClose,
  links = [],
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const isAuthorised = useSelector((state) => state.auth.superUserAuth);
  const tablesState = useSelector((state) => state.tables);
  const { sync, saving } = tablesState;
  const {
    panelOpen,
    currentTable: storeTable,
    searchFilter: filter,
    modalRecord: modal,
    pendingDelete,
    toast,
  } = useSelector((state) => state.ui);

  const open = alwaysOpen || panelOpen;
  const currentTable = storeTable && schemas[storeTable] ? storeTable : defaultTable;
  const formRef = useRef(null);

  useEffect(() => {
    if (!storeTable || !schemas[storeTable]) {
      dispatch(setCurrentTable(defaultTable));
    }
  }, [defaultTable, schemas, storeTable, dispatch]);

  const schema = schemas[currentTable];
  const remote = schema ? isRemoteTable(schema.dbKey) : false;

  /* ── Keep the Redux cache in step with the backend ── */
  useEffect(() => {
    if (!open) return undefined;
    const pull = () => dispatch(pullAllTablesThunk());
    pull();
    const timer = setInterval(() => document.visibilityState === 'visible' && pull(), 10000);
    const unsubscribe = liveSync.subscribe(pull);
    window.addEventListener('focus', pull);
    return () => {
      clearInterval(timer);
      unsubscribe();
      window.removeEventListener('focus', pull);
    };
  }, [open, dispatch]);

  /* ── Auto-open for Super User (?superUser=open) ── */
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('superUser') === 'open' && isAuthorised) {
      dispatch(setPanelOpen(true));
      navigate(location.pathname, { replace: true });
    }
  }, [location.search, location.pathname, navigate, isAuthorised, dispatch]);

  const openPanel = (e) => {
    e?.preventDefault?.();
    if (isAuthorised) dispatch(setPanelOpen(true));
    else navigate('/super-admin/login', { state: { from: location.pathname + location.search } });
  };

  // Subscribe cleanly via Redux `tablesState` so edits/pulls re-render automatically.
  const allRecords = schema
    ? schema.getData
      ? schema.getData()
      : tablesState.tables[schema.dbKey] || []
    : [];

  const lc = filter.trim().toLowerCase();
  const filtered = lc
    ? allRecords.filter((r) =>
        schema.columns.some((col) =>
          String(r[col] ?? '')
            .toLowerCase()
            .includes(lc),
        ),
      )
    : allRecords;

  const showToast = (message, type = 'success') => dispatch(showPanelToastThunk(message, type));

  /* ── Add / Edit ── */
  const openAdd = () => {
    if (schema.readOnly) return showToast('This view is read-only.', 'error');
    dispatch(setPanelModal({ record: null }));
  };

  const openEdit = (pk) => {
    if (schema.readOnly) return showToast('This view is read-only.', 'error');
    const result = getRecord(schema.dbKey, pk);
    if (!result.success) return showToast('Record not found: ' + pk, 'error');
    dispatch(setPanelModal({ record: result.data }));
  };

  const save = async () => {
    const form = formRef.current;
    if (!form || saving) return;
    const isEdit = modal.record !== null;
    const formData = {};
    for (const field of schema.fields) {
      const el = form.elements[field.key];
      if (!el) continue;
      const val = el.value.trim();
      formData[field.key] = val === '' ? null : field.type === 'number' ? Number(val) : val;
    }

    for (const f of schema.fields.filter((f) => f.required)) {
      const el = form.elements[f.key];
      if (el && !el.disabled && !formData[f.key]) {
        showToast(`"${f.label}" is required.`, 'error');
        el.focus();
        return;
      }
    }

    const pk = isEdit ? (form.elements[schema.pkField]?.value ?? formData[schema.pkField]) : null;
    const result = isEdit
      ? await dispatch(updateTableRecordThunk(schema.dbKey, pk, formData, modal.record))
      : await dispatch(createTableRecordThunk(schema.dbKey, formData));

    if (result?.success) {
      dispatch(setPanelModal(null));
      showToast(result.message, 'success');
    } else {
      showToast(result?.error || 'Failed to save record.', 'error');
    }
  };

  /* ── Delete ── */
  const openDelete = (pkValue) => {
    if (schema.readOnly) return showToast('This view is read-only.', 'error');
    let check = DB[schema.dbKey].getById(pkValue);
    if (!check.success) {
      const asNum = Number(pkValue);
      if (!isNaN(asNum)) {
        check = DB[schema.dbKey].getById(asNum);
        if (check.success) pkValue = asNum;
      }
    }
    if (!check.success) return showToast('Record not found: ' + pkValue, 'error');
    dispatch(setPendingDelete({ pkField: schema.pkField, pkValue, dbKey: schema.dbKey }));
  };

  const confirmDelete = async () => {
    if (!pendingDelete || saving) return;
    const result = await dispatch(deleteTableRecordThunk(pendingDelete.dbKey, pendingDelete.pkValue));
    dispatch(setPendingDelete(null));
    if (result?.success) {
      showToast(result.message, 'success');
    } else {
      showToast(result?.error || 'Failed to delete record.', 'error');
    }
  };

  const resetDb = async () => {
    if (!remote && !window.confirm('⚠️ Reset ALL tables back to original mock data?\nEvery change will be lost.')) {
      return;
    }
    const r = await dispatch(resetAllTablesThunk(remote));
    showToast(r.message, r.offline || !r.success ? 'error' : 'success');
  };

  const selectTable = (key) => {
    dispatch(setCurrentTable(key));
  };

  // Rendered on <body> so the host page's scoped resets (padding: 0, fonts, colours) cannot reach it.
  return createPortal(
    <div id="c2b-wrapper">
      {!hideToggle && !alwaysOpen && (
        <button id="c2b-toggle-btn" title="Open Super User Portal" onClick={openPanel}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
          </svg>
          Super User
        </button>
      )}

      {/* Panel Backdrop */}
      <div
        id="c2b-root"
        className={(open ? 'c2b-open' : '') + (alwaysOpen ? ' c2b-page' : '')}
        onClick={(e) => !alwaysOpen && e.target === e.currentTarget && dispatch(setPanelOpen(false))}
      >
        <div id="c2b-panel">
          <Sidebar
            title={alwaysOpen ? 'Super Admin' : 'Super User'}
            subtitle={actorLabel}
            schemas={schemas}
            currentTable={currentTable}
            onSelect={selectTable}
            links={links}
          />

          {/* Main */}
          <div id="c2b-main">
            <div className="c2b-topbar">
              <PageHeader title={schema?.label ?? '—'} subtitle={schema?.subtitle || ''} />
              <div className="c2b-topbar-right">
                <SearchBar
                  schema={schema}
                  records={allRecords}
                  value={filter}
                  onChange={(val) => dispatch(setSearchFilter(val))}
                />
                <RecordCount count={filtered.length} />
                <HeaderActions
                  onAdd={openAdd}
                  onReset={resetDb}
                  alwaysOpen={alwaysOpen}
                  onLogout={onClose}
                  onClosePanel={() => dispatch(setPanelOpen(false))}
                />
              </div>
            </div>

            {remote && sync.state !== 'live' && (
              <div className={`c2b-sync-note c2b-sync-${sync.state}`} role="status">
                {sync.state === 'loading' && 'Loading live data from the backend…'}
                {sync.state === 'offline' && 'Backend offline (http://localhost:3000) — showing cached data. Changes cannot be saved.'}
                {sync.state === 'partial' && `Could not load from backend: ${sync.failed.join(', ')} — those tables show cached data.`}
              </div>
            )}

            <StatsRow schema={schema} />

            {/* Table Content */}
            <div id="c2b-content">
              {filtered.length === 0 ? (
                <div id="c2b-emptyState">
                  <div className="c2b-empty-icon">📭</div>
                  <p>{lc ? `No records match “${filter.trim()}”.` : 'No records found.'}</p>
                  {lc && (
                    <button className="c2b-btn c2b-btn-ghost" onClick={() => dispatch(setSearchFilter(''))}>
                      Clear search
                    </button>
                  )}
                </div>
              ) : (
                <DataTable schema={schema} records={filtered} onEdit={openEdit} onDelete={openDelete} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modal && (
        <div id="c2b-modalOverlay" onClick={(e) => e.target === e.currentTarget && dispatch(setPanelModal(null))}>
          <div className="c2b-modal">
            <div className="c2b-modal-header">
              <h3 id="c2b-modalTitle">
                {modal.record ? 'Edit' : 'Add'} {schema.label} Record
              </h3>
              <button className="c2b-btn-close" onClick={() => dispatch(setPanelModal(null))}>
                ✕
              </button>
            </div>
            <div className="c2b-modal-body">
              <RecordForm
                key={modal.record ? String(modal.record[schema.pkField]) : 'new'}
                schema={schema}
                record={modal.record}
                formRef={formRef}
                remote={remote}
              />
            </div>
            <div className="c2b-modal-footer">
              <button className="c2b-btn c2b-btn-ghost" onClick={() => dispatch(setPanelModal(null))}>
                Cancel
              </button>
              <button className="c2b-btn c2b-btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : 'Save Record'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {pendingDelete && (
        <div id="c2b-confirmOverlay" onClick={(e) => e.target === e.currentTarget && dispatch(setPendingDelete(null))}>
          <div className="c2b-confirm-box">
            <div className="c2b-confirm-icon">🗑️</div>
            <h3>Delete Record?</h3>
            <p>
              Delete {pendingDelete.pkField} = "{String(pendingDelete.pkValue)}"? This action cannot be undone.
            </p>
            <div className="c2b-confirm-actions">
              <button className="c2b-btn c2b-btn-ghost" onClick={() => dispatch(setPendingDelete(null))}>
                Cancel
              </button>
              <button className="c2b-btn c2b-btn-danger" onClick={confirmDelete} disabled={saving}>
                {saving ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <div id="c2b-toast" className={`c2b-t-${toast.type}${toast.show ? ' c2b-toast-show' : ''}`}>
        <span id="c2b-toastIcon">{toast.type === 'success' ? '✓' : '✕'}</span>
        <span id="c2b-toastMsg">{toast.message}</span>
      </div>
    </div>,
    document.body,
  );
}
