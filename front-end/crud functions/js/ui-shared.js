/**
 * ============================================================
 *  Click2Book — ui-shared.js  (Dynamic Panel Edition)
 *
 *  Injects a self-contained CRUD manager panel into whatever
 *  page loads these scripts. The existing page HTML/CSS is
 *  NEVER touched — the panel is appended to <body>.
 *
 *  LOAD ORDER:
 *    1. mock_data.js   → seed arrays
 *    2. script.js      → window.DB
 *    3. ui-shared.js   → this file
 *    4. ui-admin.js | ui-customer.js | ui-provider.js | ui-support.js
 *       → defines TABLE_SCHEMAS, calls initUI(defaultTable, actorLabel)
 * ============================================================
 */

/* ── Embedded CSS (injected into <head>) ───────────────────── */
const _C2B_CSS = `
/* ===========================================================
   Click2Book — CRUD Panel Styles
   All selectors scoped to #c2b-root or .c2b-* to avoid
   conflicts with the host page.
=========================================================== */
#c2b-root *, #c2b-modalOverlay *, #c2b-confirmOverlay *, #c2b-toast {
  box-sizing: border-box;
  font-family: 'Inter', system-ui, sans-serif;
}

/* ── Toggle Button ── */
#c2b-toggle-btn {
  position: fixed; bottom: 28px; right: 28px; z-index: 8888;
  background: linear-gradient(135deg, #0B2447 0%, #19376D 100%);
  color: #fff; border: none; border-radius: 50px;
  padding: 13px 24px; font-size: 13px; font-weight: 600;
  cursor: pointer; box-shadow: 0 6px 24px rgba(11,36,71,.45);
  display: flex; align-items: center; gap: 9px;
  transition: transform .2s, box-shadow .2s;
}
#c2b-toggle-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 32px rgba(11,36,71,.55);
}

/* ── Panel Backdrop ── */
#c2b-root {
  position: fixed; inset: 0; z-index: 9000;
  background: rgba(0,0,0,.52); backdrop-filter: blur(5px);
  display: flex; align-items: center; justify-content: center;
  opacity: 0; pointer-events: none;
  transition: opacity .25s ease;
}
#c2b-root.c2b-open { opacity: 1; pointer-events: all; }

/* ── Panel Box ── */
#c2b-panel {
  width: 95vw; max-width: 1420px; height: 90vh;
  background: #f1f5f9; border-radius: 18px;
  overflow: hidden; display: flex;
  box-shadow: 0 32px 100px rgba(0,0,0,.38);
  transform: translateY(28px) scale(.97);
  transition: transform .28s cubic-bezier(.16,1,.3,1);
}
#c2b-root.c2b-open #c2b-panel { transform: translateY(0) scale(1); }

/* ── Sidebar ── */
#c2b-sidebar {
  width: 220px; background: #0B2447; color: #fff;
  display: flex; flex-direction: column; flex-shrink: 0;
  overflow-y: auto;
}
.c2b-brand {
  padding: 22px 18px 16px;
  border-bottom: 1px solid rgba(255,255,255,.1);
}
.c2b-brand h3 {
  margin: 0; font-size: 11px; font-weight: 700;
  color: #F97316; letter-spacing: 1.2px; text-transform: uppercase;
}
.c2b-brand p { margin: 4px 0 0; font-size: 12px; color: rgba(255,255,255,.45); }
.c2b-nav { flex: 1; padding: 10px 0; }
.c2b-nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 11px 18px; font-size: 13px; font-weight: 500;
  color: rgba(255,255,255,.6); cursor: pointer;
  border-left: 3px solid transparent;
  transition: all .15s; user-select: none;
}
.c2b-nav-item:hover { color: #fff; background: rgba(255,255,255,.07); }
.c2b-nav-item.active {
  color: #F97316; background: rgba(249,115,22,.13);
  border-left-color: #F97316;
}

/* ── Main Area ── */
#c2b-main {
  flex: 1; display: flex; flex-direction: column;
  overflow: hidden; background: #f1f5f9;
}

/* ── Topbar ── */
.c2b-topbar {
  padding: 14px 22px; background: #fff;
  border-bottom: 1px solid #e2e8f0;
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
}
.c2b-topbar-left { flex: 1; min-width: 0; }
#c2b-tableTitle  { margin: 0; font-size: 17px; font-weight: 700; color: #0B2447; }
#c2b-tableSubtitle { margin: 3px 0 0; font-size: 12px; color: #6b7280; }
.c2b-topbar-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.c2b-search { position: relative; display: flex; align-items: center; }
.c2b-search svg { position: absolute; left: 10px; color: #9ca3af; pointer-events: none; }
#c2b-searchInput {
  border: 1px solid #e2e8f0; border-radius: 8px;
  padding: 8px 12px 8px 34px; font-size: 13px;
  background: #f8fafc; color: #374151; outline: none;
  width: 210px; transition: border .15s;
}
#c2b-searchInput:focus { border-color: #F97316; background: #fff; }
#c2b-recordCount {
  background: #f1f5f9; color: #64748b; border-radius: 20px;
  padding: 5px 12px; font-size: 12px; font-weight: 500;
  white-space: nowrap;
}
.c2b-btn {
  border: none; border-radius: 8px; padding: 8px 15px;
  font-size: 13px; font-weight: 600; cursor: pointer;
  display: flex; align-items: center; gap: 6px;
  transition: all .15s; white-space: nowrap;
}
.c2b-btn-primary { background: #F97316; color: #fff; }
.c2b-btn-primary:hover { background: #ea6c10; transform: translateY(-1px); }
.c2b-btn-ghost { background: transparent; color: #6b7280; border: 1px solid #e2e8f0; }
.c2b-btn-ghost:hover { background: #f1f5f9; }
.c2b-btn-danger { background: #fef2f2; color: #ef4444; border: 1px solid #fee2e2; }
.c2b-btn-danger:hover { background: #fee2e2; }
.c2b-btn-close {
  background: transparent; border: none; color: #94a3b8;
  font-size: 22px; cursor: pointer; padding: 2px 8px; line-height: 1;
  border-radius: 6px; transition: all .15s; font-weight: 300;
}
.c2b-btn-close:hover { background: #f1f5f9; color: #374151; }

/* ── Stats Bar ── */
#c2b-statsBar {
  display: flex; gap: 12px; padding: 12px 22px;
  background: #fff; border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap; min-height: 58px;
}
.c2b-stat-card {
  background: #f8fafc; border-radius: 10px;
  padding: 8px 18px; border: 1px solid #e2e8f0;
  display: flex; flex-direction: column; gap: 2px;
}
.c2b-stat-label { font-size: 11px; color: #94a3b8; font-weight: 600; letter-spacing: .4px; }
.c2b-stat-value { font-size: 20px; font-weight: 700; color: #0B2447; }
.c2b-stat-value.accent  { color: #F97316; }
.c2b-stat-value.success { color: #22c55e; }
.c2b-stat-value.warning { color: #f59e0b; }
.c2b-stat-value.danger  { color: #ef4444; }
.c2b-stat-value.info    { color: #3b82f6; }

/* ── Content / Table ── */
#c2b-content { flex: 1; overflow-y: auto; padding: 20px 22px; }
#c2b-emptyState {
  display: flex; flex-direction: column; align-items: center;
  padding: 70px 20px; color: #94a3b8; text-align: center;
}
#c2b-emptyState .c2b-empty-icon { font-size: 52px; margin-bottom: 14px; }
#c2b-emptyState p { font-size: 14px; margin: 0; }
.c2b-table-wrap {
  overflow-x: auto; border-radius: 12px;
  border: 1px solid #e2e8f0; background: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,.04);
}
#c2b-dataTable { width: 100%; border-collapse: collapse; font-size: 13px; }
#c2b-dataTable th {
  background: #f8fafc; padding: 12px 14px; text-align: left;
  font-size: 11px; font-weight: 700; color: #64748b;
  text-transform: uppercase; letter-spacing: .6px;
  border-bottom: 1px solid #e2e8f0; white-space: nowrap;
}
#c2b-dataTable td {
  padding: 12px 14px; border-bottom: 1px solid #f1f5f9;
  color: #374151; vertical-align: middle;
}
#c2b-dataTable tr:last-child td { border-bottom: none; }
#c2b-dataTable tr:hover td { background: #fafbfc; }
.c2b-td-actions { display: flex; gap: 6px; align-items: center; }
.c2b-btn-icon {
  width: 30px; height: 30px; border-radius: 7px; border: none;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 13px; transition: all .15s;
}
.c2b-btn-icon.edit  { background: #eff6ff; color: #3b82f6; }
.c2b-btn-icon.edit:hover  { background: #dbeafe; }
.c2b-btn-icon.trash { background: #fef2f2; color: #ef4444; }
.c2b-btn-icon.trash:hover { background: #fee2e2; }

/* ── Status Badges ── */
.c2b-badge {
  display: inline-block; padding: 3px 10px; border-radius: 20px;
  font-size: 11px; font-weight: 600; letter-spacing: .3px;
}
.c2b-badge-CONFIRMED, .c2b-badge-SUCCESS, .c2b-badge-COMPLETED,
.c2b-badge-ACTIVE, .c2b-badge-VERIFIED, .c2b-badge-RESOLVED,
.c2b-badge-SCHEDULED    { background:#dcfce7; color:#16a34a; }
.c2b-badge-PENDING, .c2b-badge-IN__PROGRESS, .c2b-badge-PROCESSING,
.c2b-badge-DELAYED, .c2b-badge-IN_PROGRESS  { background:#fff7ed; color:#ea580c; }
.c2b-badge-CANCELLED, .c2b-badge-FAILED, .c2b-badge-REJECTED,
.c2b-badge-EXPIRED      { background:#fef2f2; color:#dc2626; }
.c2b-badge-MALE         { background:#eff6ff; color:#2563eb; }
.c2b-badge-FEMALE       { background:#fdf4ff; color:#9333ea; }
.c2b-badge-INACTIVE     { background:#f3f4f6; color:#6b7280; }
.c2b-badge-REFUNDED     { background:#f0fdf4; color:#15803d; }
.c2b-badge-OPEN         { background:#fff7ed; color:#c2410c; }
.c2b-badge-none         { background:#f1f5f9; color:#64748b; }
.c2b-ro-badge {
  background: rgba(100,116,139,.12); color: #64748b;
  font-size: 11px; border-radius: 4px; padding: 2px 8px;
}

/* ── Add / Edit Modal ── */
#c2b-modalOverlay {
  position: fixed; inset: 0; z-index: 9100;
  background: rgba(0,0,0,.55); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
}
.c2b-modal {
  background: #fff; border-radius: 16px;
  width: 560px; max-width: 96vw; max-height: 88vh; overflow-y: auto;
  box-shadow: 0 24px 80px rgba(0,0,0,.32);
  animation: c2b-slide-up .25s ease;
}
@keyframes c2b-slide-up {
  from { transform: translateY(24px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}
.c2b-modal-header {
  padding: 20px 24px; border-bottom: 1px solid #e2e8f0;
  display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; background: #fff; z-index: 1;
}
.c2b-modal-header h3 { margin: 0; font-size: 16px; font-weight: 700; color: #0B2447; }
.c2b-modal-body { padding: 24px; }
.c2b-form { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.c2b-form-field { display: flex; flex-direction: column; gap: 6px; }
.c2b-form-field.full { grid-column: 1 / -1; }
.c2b-form-field label { font-size: 12px; font-weight: 600; color: #374151; }
.c2b-form-field input, .c2b-form-field select {
  border: 1px solid #e2e8f0; border-radius: 8px;
  padding: 9px 12px; font-size: 13px; color: #374151;
  outline: none; transition: border .15s; width: 100%;
  background: #f8fafc;
}
.c2b-form-field input:focus, .c2b-form-field select:focus {
  border-color: #F97316; background: #fff;
}
.c2b-form-field input:disabled { opacity: .55; cursor: not-allowed; }
.c2b-modal-footer {
  padding: 16px 24px; border-top: 1px solid #e2e8f0;
  display: flex; justify-content: flex-end; gap: 10px;
  position: sticky; bottom: 0; background: #fff;
}

/* ── Confirm Delete ── */
#c2b-confirmOverlay {
  position: fixed; inset: 0; z-index: 9200;
  background: rgba(0,0,0,.55); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
}
.c2b-confirm-box {
  background: #fff; border-radius: 16px; padding: 36px 32px;
  width: 420px; max-width: 95vw; text-align: center;
  box-shadow: 0 24px 80px rgba(0,0,0,.3);
  animation: c2b-slide-up .25s ease;
}
.c2b-confirm-box .c2b-confirm-icon { font-size: 48px; margin-bottom: 16px; }
.c2b-confirm-box h3 { margin: 0 0 10px; font-size: 20px; color: #0B2447; }
.c2b-confirm-box p { color: #6b7280; font-size: 13px; margin-bottom: 28px; line-height: 1.5; }
.c2b-confirm-actions { display: flex; gap: 12px; justify-content: center; }

/* ── Toast ── */
#c2b-toast {
  position: fixed; bottom: 100px; right: 28px; z-index: 9999;
  background: #1e293b; color: #fff; border-radius: 12px;
  padding: 13px 20px; font-size: 13px; font-weight: 500;
  display: flex; align-items: center; gap: 10px;
  box-shadow: 0 8px 32px rgba(0,0,0,.28);
  min-width: 240px; max-width: 380px;
  transform: translateY(20px); opacity: 0;
  transition: all .3s ease; pointer-events: none;
}
#c2b-toast.c2b-toast-show { transform: translateY(0); opacity: 1; }
#c2b-toast.c2b-t-success #c2b-toastIcon { color: #22c55e; font-size: 16px; }
#c2b-toast.c2b-t-error   #c2b-toastIcon { color: #ef4444; font-size: 16px; }

/* ── Utility ── */
.c2b-hidden { display: none !important; }
`;

/* ── UI State ──────────────────────────────────────────────── */
let currentTable  = "";
let currentFilter = "";
let pendingDelete = null;
let isEditMode    = false;

/* ── DOM refs (populated in _bindDOMRefs) ──────────────────── */
let _tableTitle, _tableSubtitle, _statsBar, _tableHead, _tableBody,
    _emptyState, _tableWrap, _recordCount, _searchInput,
    _modalOverlay, _modalTitle, _recordForm, _saveRecord,
    _confirmOverlay, _confirmText, _confirmDeleteBtn,
    _toast, _toastIcon, _toastMsg;


/* ═══════════════════════════════════════════════════════════
   INJECT — called once inside initUI()
═══════════════════════════════════════════════════════════ */

function _injectStyles() {
  const el = document.createElement('style');
  el.id = 'c2b-injected-styles';
  el.textContent = _C2B_CSS;
  document.head.appendChild(el);
}

function _buildNavHTML() {
  return Object.entries(TABLE_SCHEMAS).map(([key, schema]) =>
    `<div class="c2b-nav-item" data-c2b-table="${key}">${schema.label}</div>`
  ).join('');
}

function _injectHTML(actorLabel) {
  const wrapper = document.createElement('div');
  wrapper.id = 'c2b-wrapper';
  wrapper.innerHTML = `
  <!-- Toggle Button -->
  <button id="c2b-toggle-btn" title="Open Super User Portal">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
    </svg>
    Super User
  </button>

  <!-- Panel Backdrop -->
  <div id="c2b-root">
    <div id="c2b-panel">

      <!-- Sidebar -->
      <div id="c2b-sidebar">
        <div class="c2b-brand">
          <h3>📈 Super User</h3>
          <p>${actorLabel}</p>
        </div>
        <nav class="c2b-nav">${_buildNavHTML()}</nav>
      </div>

      <!-- Main -->
      <div id="c2b-main">
        <!-- Topbar -->
        <div class="c2b-topbar">
          <div class="c2b-topbar-left">
            <h2 id="c2b-tableTitle">—</h2>
            <p id="c2b-tableSubtitle"></p>
          </div>
          <div class="c2b-topbar-right">
            <div class="c2b-search">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input id="c2b-searchInput" type="text" placeholder="Search…" />
            </div>
            <span id="c2b-recordCount" class="c2b-badge-count" style="background:#f1f5f9;color:#64748b;border-radius:20px;padding:5px 12px;font-size:12px;font-weight:500;">0 records</span>
            <button id="c2b-addRecordBtn" class="c2b-btn c2b-btn-primary">+ Add Record</button>
            <button id="c2b-resetDbBtn"   class="c2b-btn c2b-btn-danger">⚠ Reset DB</button>
            <button id="c2b-closeBtn"     class="c2b-btn-close" title="Close Panel">✕</button>
          </div>
        </div>

        <!-- Stats Bar -->
        <div id="c2b-statsBar"></div>

        <!-- Table Content -->
        <div id="c2b-content">
          <div id="c2b-emptyState" class="c2b-hidden">
            <div class="c2b-empty-icon">📭</div>
            <p>No records found.</p>
          </div>
          <div class="c2b-table-wrap" id="c2b-tableWrap">
            <table id="c2b-dataTable">
              <thead id="c2b-tableHead"></thead>
              <tbody id="c2b-tableBody"></tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  </div>

  <!-- Add / Edit Modal -->
  <div id="c2b-modalOverlay" class="c2b-hidden">
    <div class="c2b-modal">
      <div class="c2b-modal-header">
        <h3 id="c2b-modalTitle">Add Record</h3>
        <button class="c2b-btn-close" id="c2b-closeModal">✕</button>
      </div>
      <div class="c2b-modal-body">
        <div class="c2b-form" id="c2b-recordForm"></div>
      </div>
      <div class="c2b-modal-footer">
        <button class="c2b-btn c2b-btn-ghost"   id="c2b-cancelModal">Cancel</button>
        <button class="c2b-btn c2b-btn-primary"  id="c2b-saveRecord">Save Record</button>
      </div>
    </div>
  </div>

  <!-- Confirm Delete -->
  <div id="c2b-confirmOverlay" class="c2b-hidden">
    <div class="c2b-confirm-box">
      <div class="c2b-confirm-icon">🗑️</div>
      <h3>Delete Record?</h3>
      <p id="c2b-confirmText">This action cannot be undone.</p>
      <div class="c2b-confirm-actions">
        <button class="c2b-btn c2b-btn-ghost"   id="c2b-cancelDelete">Cancel</button>
        <button class="c2b-btn c2b-btn-danger"  id="c2b-confirmDelete">Yes, Delete</button>
      </div>
    </div>
  </div>

  <!-- Toast -->
  <div id="c2b-toast">
    <span id="c2b-toastIcon">✓</span>
    <span id="c2b-toastMsg"></span>
  </div>
  `;
  document.body.appendChild(wrapper);
}

function _bindDOMRefs() {
  _tableTitle      = document.getElementById('c2b-tableTitle');
  _tableSubtitle   = document.getElementById('c2b-tableSubtitle');
  _statsBar        = document.getElementById('c2b-statsBar');
  _tableHead       = document.getElementById('c2b-tableHead');
  _tableBody       = document.getElementById('c2b-tableBody');
  _emptyState      = document.getElementById('c2b-emptyState');
  _tableWrap       = document.getElementById('c2b-tableWrap');
  _recordCount     = document.getElementById('c2b-recordCount');
  _searchInput     = document.getElementById('c2b-searchInput');
  _modalOverlay    = document.getElementById('c2b-modalOverlay');
  _modalTitle      = document.getElementById('c2b-modalTitle');
  _recordForm      = document.getElementById('c2b-recordForm');
  _saveRecord      = document.getElementById('c2b-saveRecord');
  _confirmOverlay  = document.getElementById('c2b-confirmOverlay');
  _confirmText     = document.getElementById('c2b-confirmText');
  _confirmDeleteBtn = document.getElementById('c2b-confirmDelete');
  _toast    = document.getElementById('c2b-toast');
  _toastIcon = document.getElementById('c2b-toastIcon');
  _toastMsg  = document.getElementById('c2b-toastMsg');
}


/* ═══════════════════════════════════════════════════════════
   RENDER TABLE
═══════════════════════════════════════════════════════════ */
function renderTable() {
  const schema = TABLE_SCHEMAS[currentTable];
  if (!schema) return;

  _tableTitle.textContent    = schema.label;
  _tableSubtitle.textContent = schema.subtitle || '';

  _renderStats(schema);

  const allRecords = schema.getData
    ? schema.getData()
    : DB[schema.dbKey].getAll();

  const lc = currentFilter.toLowerCase();
  const filtered = currentFilter
    ? allRecords.filter(r =>
        schema.columns.some(col => String(r[col] ?? '').toLowerCase().includes(lc))
      )
    : allRecords;

  _recordCount.textContent = `${filtered.length} record${filtered.length !== 1 ? 's' : ''}`;

  /* Head */
  _tableHead.innerHTML = '';
  const trHead = document.createElement('tr');
  [...schema.columns, 'actions'].forEach(col => {
    const th = document.createElement('th');
    th.textContent = col === 'actions' ? '' : col.replace(/_/g, ' ');
    trHead.appendChild(th);
  });
  _tableHead.appendChild(trHead);

  /* Body */
  _tableBody.innerHTML = '';

  if (filtered.length === 0) {
    _emptyState.classList.remove('c2b-hidden');
    _tableWrap.classList.add('c2b-hidden');
    return;
  }

  _emptyState.classList.add('c2b-hidden');
  _tableWrap.classList.remove('c2b-hidden');

  const readOnly = schema.readOnly === true;

  filtered.forEach(record => {
    const tr = document.createElement('tr');

    schema.columns.forEach(col => {
      const td  = document.createElement('td');
      const val = record[col];

      if (col.includes('status') || col === 'gender' || col === 'verification_status') {
        const cls = (val ?? 'none').replace(/\s/g, '_');
        td.innerHTML = `<span class="c2b-badge c2b-badge-${cls}">${val ?? '—'}</span>`;
      } else if (col === 'amount' || col === 'discount_amount' || col === 'refund_amount' || col.endsWith('_amount')) {
        td.textContent = val != null ? '₹' + Number(val).toFixed(2) : '—';
      } else if (col === 'rating') {
        td.textContent = val ? '★'.repeat(Number(val)) : '—';
      } else {
        td.textContent = val ?? '—';
        if (col === schema.pkField) { td.style.fontWeight = '700'; td.style.color = '#0B2447'; }
      }

      tr.appendChild(td);
    });

    /* Actions column */
    const tdAct = document.createElement('td');
    if (readOnly) {
      tdAct.innerHTML = `<div class="c2b-td-actions"><span class="c2b-ro-badge">read-only</span></div>`;
    } else {
      const pk = record[schema.pkField];
      // Use data attributes to avoid any quote-escaping issues with JSON.stringify inside onclick
      const editBtn  = document.createElement('button');
      editBtn.className = 'c2b-btn-icon edit';
      editBtn.title     = 'Edit';
      editBtn.textContent = '✏️';
      editBtn.dataset.pk  = pk;
      editBtn.addEventListener('click', () => c2bOpenEdit(pk));

      const delBtn   = document.createElement('button');
      delBtn.className  = 'c2b-btn-icon trash';
      delBtn.title      = 'Delete';
      delBtn.textContent = '🗑️';
      delBtn.dataset.pk  = pk;
      delBtn.addEventListener('click', () => c2bOpenDelete(pk));

      const wrap = document.createElement('div');
      wrap.className = 'c2b-td-actions';
      wrap.appendChild(editBtn);
      wrap.appendChild(delBtn);
      tdAct.appendChild(wrap);
    }
    tr.appendChild(tdAct);
    _tableBody.appendChild(tr);
  });
}

function _renderStats(schema) {
  _statsBar.innerHTML = '';
  const stats = schema.stats ? schema.stats() : [];
  stats.forEach(stat => {
    const card = document.createElement('div');
    card.className = 'c2b-stat-card';
    card.innerHTML = `
      <span class="c2b-stat-label">${stat.label}</span>
      <span class="c2b-stat-value ${stat.cls || ''}">${stat.value}</span>`;
    _statsBar.appendChild(card);
  });
}


/* ═══════════════════════════════════════════════════════════
   FORM — Build + open Add / Edit
═══════════════════════════════════════════════════════════ */
function _buildForm(schema, record = null) {
  _recordForm.innerHTML = '';
  isEditMode = record !== null;

  if (!schema.fields || schema.fields.length === 0) {
    _recordForm.innerHTML = '<p style="color:#6b7280;font-size:13px;grid-column:1/-1">This table is read-only — no fields to edit.</p>';
    return;
  }

  schema.fields.forEach(field => {
    const wrapper = document.createElement('div');
    wrapper.className = 'c2b-form-field' +
      (field.key === 'comment' || field.key === 'description' ? ' full' : '');

    const label = document.createElement('label');
    label.setAttribute('for', 'c2bf_' + field.key);
    label.textContent = field.label + (field.required ? ' *' : '');

    let input;
    if (field.type === 'select') {
      input = document.createElement('select');
      field.options.forEach(opt => {
        const o = document.createElement('option');
        o.value = opt; o.textContent = opt;
        if (record && record[field.key] === opt) o.selected = true;
        input.appendChild(o);
      });
    } else {
      input = document.createElement('input');
      input.type = field.type === 'number' ? 'number'
                 : field.type === 'date'   ? 'date'
                 : field.type === 'time'   ? 'time' : 'text';
      if (field.type === 'number') { input.step = '0.01'; input.min = '0'; }
      if (record) input.value = record[field.key] ?? '';
    }

    input.id          = 'c2bf_' + field.key;
    input.name        = field.key;
    input.placeholder = field.label;
    if (field.required) input.required = true;
    if (isEditMode && field.key === schema.pkField) input.disabled = true;

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    _recordForm.appendChild(wrapper);
  });
}

function _openAddModal() {
  const schema = TABLE_SCHEMAS[currentTable];
  if (schema && schema.readOnly) { showToast('This view is read-only.', 'error'); return; }
  _modalTitle.textContent = `Add ${schema.label} Record`;
  _buildForm(schema, null);
  _modalOverlay.classList.remove('c2b-hidden');
}

window.c2bOpenEdit = function(pkValue) {
  const schema = TABLE_SCHEMAS[currentTable];
  if (schema && schema.readOnly) { showToast('This view is read-only.', 'error'); return; }
  // Try strict match first, then coerce to number if string didn't match
  let result = DB[schema.dbKey].getById(pkValue);
  if (!result.success) {
    const asNum = Number(pkValue);
    if (!isNaN(asNum)) result = DB[schema.dbKey].getById(asNum);
  }
  if (!result.success) { showToast('Record not found: ' + pkValue, 'error'); return; }
  _modalTitle.textContent = `Edit ${schema.label} Record`;
  _buildForm(schema, result.data);
  _modalOverlay.classList.remove('c2b-hidden');
};

function _closeModal() {
  _modalOverlay.classList.add('c2b-hidden');
  _recordForm.innerHTML = '';
}


/* ═══════════════════════════════════════════════════════════
   SAVE — Create or Update
═══════════════════════════════════════════════════════════ */
function _bindSave() {
  _saveRecord.addEventListener('click', () => {
    const schema   = TABLE_SCHEMAS[currentTable];
    const formData = {};

    schema.fields.forEach(field => {
      const el = document.getElementById('c2bf_' + field.key);
      if (!el) return;
      const val = el.value.trim();
      formData[field.key] = val === '' ? null
                          : field.type === 'number' ? Number(val) : val;
    });

    for (const f of schema.fields.filter(f => f.required)) {
      const el = document.getElementById('c2bf_' + f.key);
      if (el && !el.disabled && !formData[f.key]) {
        showToast(`"${f.label}" is required.`, 'error');
        el.focus(); return;
      }
    }

    let result;
    if (isEditMode) {
      const pkEl = document.getElementById('c2bf_' + schema.pkField);
      let pk = pkEl ? pkEl.value : formData[schema.pkField];
      // Try update; if string pk doesn't match, try as number
      result = DB[schema.dbKey].update(pk, formData);
      if (!result.success) {
        const asNum = Number(pk);
        if (!isNaN(asNum)) result = DB[schema.dbKey].update(asNum, formData);
      }
    } else {
      result = DB[schema.dbKey].create(formData);
    }

    if (result.success) {
      _closeModal(); renderTable(); showToast(result.message, 'success');
    } else {
      showToast(result.error, 'error');
    }
  });
}


/* ═══════════════════════════════════════════════════════════
   DELETE — Confirm then remove
═══════════════════════════════════════════════════════════ */
window.c2bOpenDelete = function(pkValue) {
  const schema = TABLE_SCHEMAS[currentTable];
  if (schema && schema.readOnly) { showToast('This view is read-only.', 'error'); return; }
  // Verify record exists before showing confirm dialog
  let check = DB[schema.dbKey].getById(pkValue);
  if (!check.success) {
    const asNum = Number(pkValue);
    if (!isNaN(asNum)) check = DB[schema.dbKey].getById(asNum);
    if (check.success) pkValue = asNum; // coerce to number if needed
  }
  if (!check.success) { showToast('Record not found: ' + pkValue, 'error'); return; }
  pendingDelete = { pkField: schema.pkField, pkValue, dbKey: schema.dbKey };
  _confirmText.textContent = `Delete ${schema.pkField} = "${pkValue}"? This action cannot be undone.`;
  _confirmOverlay.classList.remove('c2b-hidden');
};

function _bindDelete() {
  _confirmDeleteBtn.addEventListener('click', () => {
    if (!pendingDelete) return;
    // Use the dbKey stored at delete-open time for safety
    const dbKey = pendingDelete.dbKey || TABLE_SCHEMAS[currentTable].dbKey;
    const result = DB[dbKey].delete(pendingDelete.pkValue);
    _confirmOverlay.classList.add('c2b-hidden');
    pendingDelete = null;
    if (result.success) { renderTable(); showToast(result.message, 'success'); }
    else showToast(result.error, 'error');
  });
  document.getElementById('c2b-cancelDelete').addEventListener('click', () => {
    _confirmOverlay.classList.add('c2b-hidden');
    pendingDelete = null;
  });
}


/* ═══════════════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════════════ */
let _toastTimer;
function showToast(message, type = 'success') {
  clearTimeout(_toastTimer);
  _toastMsg.textContent  = message;
  _toast.className       = `c2b-t-${type}`;
  _toastIcon.textContent = type === 'success' ? '✓' : '✕';
  void _toast.offsetWidth;
  setTimeout(() => _toast.classList.add('c2b-toast-show'), 10);
  _toastTimer = setTimeout(() => _toast.classList.remove('c2b-toast-show'), 3200);
}
window.showToast = showToast;


/* ═══════════════════════════════════════════════════════════
   INIT — Entry point called by each actor file
   initUI(defaultTable, actorLabel)
═══════════════════════════════════════════════════════════ */
function initUI(defaultTable, actorLabel = 'Actor Portal') {
  _injectStyles();
  _injectHTML(actorLabel);
  _bindDOMRefs();

  currentTable  = defaultTable;
  currentFilter = '';

  /* ── Panel open / close ── */
  const root   = document.getElementById('c2b-root');
  document.getElementById('c2b-toggle-btn').addEventListener('click', () => {
    if (sessionStorage.getItem('superUserAuth') === 'true') {
      root.classList.add('c2b-open');
    } else {
      window.location.href = 'super-user-login.html';
    }
  });
  document.getElementById('c2b-closeBtn').addEventListener('click', () =>
    root.classList.remove('c2b-open')
  );
  root.addEventListener('click', e => {
    if (e.target === root) root.classList.remove('c2b-open');
  });

  /* ── Nav items ── */
  document.querySelectorAll('.c2b-nav-item').forEach(item => {
    if (item.dataset.c2bTable === currentTable) item.classList.add('active');
    item.addEventListener('click', () => {
      document.querySelectorAll('.c2b-nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      currentTable  = item.dataset.c2bTable;
      currentFilter = '';
      _searchInput.value = '';
      renderTable();
    });
  });

  /* ── Search ── */
  _searchInput.addEventListener('input', e => {
    currentFilter = e.target.value;
    renderTable();
  });

  /* ── Add Record ── */
  document.getElementById('c2b-addRecordBtn').addEventListener('click', _openAddModal);

  /* ── Reset DB ── */
  document.getElementById('c2b-resetDbBtn').addEventListener('click', () => {
    if (confirm('⚠️ Reset ALL tables back to original mock data?\nEvery change will be lost.')) {
      const r = DB.resetAll();
      renderTable();
      showToast(r.success ? 'Database reset to mock data.' : r.error, r.success ? 'success' : 'error');
    }
  });

  /* ── Modal close ── */
  document.getElementById('c2b-closeModal').addEventListener('click', _closeModal);
  document.getElementById('c2b-cancelModal').addEventListener('click', _closeModal);
  _modalOverlay.addEventListener('click', e => { if (e.target === _modalOverlay) _closeModal(); });
  _confirmOverlay.addEventListener('click', e => {
    if (e.target === _confirmOverlay) { _confirmOverlay.classList.add('c2b-hidden'); pendingDelete = null; }
  });

  _bindSave();
  _bindDelete();

  /* ── Initial render ── */
  renderTable();

  /* ── Auto-open for Super User ── */
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('superUser') === 'open' && sessionStorage.getItem('superUserAuth') === 'true') {
    root.classList.add('c2b-open');
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}
