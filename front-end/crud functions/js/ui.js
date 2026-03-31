/**
 * ============================================================
 *  Click2Book — UI Layer
 *
 *  This file ONLY handles DOM interactions.
 *  All data reads/writes go through DB.* (script.js).
 *  mock_data.js supplies the raw arrays.
 * ============================================================
 */

/* ── Table Schema Definitions ──────────────────────────────── */

/**
 * Defines how each table is displayed and what fields the
 * Add / Edit form should render.
 *
 * field types: text | number | date | time | select | readonly
 */
const TABLE_SCHEMAS = {

  bookings: {
    label: "Bookings",
    subtitle: "Manage BOOKING records",
    dbKey: "bookings",
    pkField: "booking_id",
    columns: ["booking_id","customer_id","trip_id","offer_id","booking_date","booking_status","irctc_id"],
    fields: [
      { key:"booking_id",     label:"Booking ID",     type:"text",   required:true  },
      { key:"customer_id",    label:"Customer ID",    type:"text",   required:true  },
      { key:"trip_id",        label:"Trip ID",        type:"text",   required:true  },
      { key:"offer_id",       label:"Offer ID",       type:"text",   required:false },
      { key:"booking_date",   label:"Booking Date",   type:"date",   required:true  },
      { key:"booking_status", label:"Status",         type:"select", required:true,
        options:["PENDING","CONFIRMED","CANCELLED","COMPLETED"] },
      { key:"irctc_id",       label:"IRCTC ID",       type:"text",   required:false },
    ],
    stats: () => {
      const all = DB.bookings.getAll();
      return [
        { label:"Total",     value: all.length,                                            cls:"accent"  },
        { label:"Confirmed", value: all.filter(b=>b.booking_status==="CONFIRMED").length,  cls:"success" },
        { label:"Pending",   value: all.filter(b=>b.booking_status==="PENDING").length,    cls:"warning" },
        { label:"Cancelled", value: all.filter(b=>b.booking_status==="CANCELLED").length,  cls:"danger"  },
      ];
    }
  },

  customers: {
    label: "Customers",
    subtitle: "Manage CUSTOMER records",
    dbKey: "customers",
    pkField: "customer_id",
    columns: ["customer_id","name","email","age","gender","phone_number"],
    fields: [
      { key:"customer_id",   label:"Customer ID",  type:"text",   required:true  },
      { key:"name",          label:"Full Name",     type:"text",   required:true  },
      { key:"email",         label:"Email",         type:"text",   required:true  },
      { key:"password",      label:"Password",      type:"text",   required:true  },
      { key:"age",           label:"Age",           type:"number", required:false },
      { key:"gender",        label:"Gender",        type:"select", required:false,
        options:["MALE","FEMALE","OTHER","PREFER_NOT_TO_SAY"] },
      { key:"phone_number",  label:"Phone Number",  type:"text",   required:false },
    ],
    stats: () => {
      const all = DB.customers.getAll();
      const gMap = all.reduce((m,c)=>{ m[c.gender]=(m[c.gender]||0)+1; return m; }, {});
      return [
        { label:"Total",   value: all.length,           cls:"accent"  },
        { label:"Male",    value: gMap["MALE"]    || 0, cls:"info"    },
        { label:"Female",  value: gMap["FEMALE"]  || 0, cls:"warning" },
      ];
    }
  },

  trips: {
    label: "Trips",
    subtitle: "Manage TRIP records",
    dbKey: "trips",
    pkField: "trip_id",
    columns: ["trip_id","schedule_id","vehicle_id","trip_status"],
    fields: [
      { key:"trip_id",      label:"Trip ID",      type:"text",   required:true },
      { key:"schedule_id",  label:"Schedule ID",  type:"text",   required:true },
      { key:"vehicle_id",   label:"Vehicle ID",   type:"text",   required:true },
      { key:"trip_status",  label:"Status",       type:"select", required:true,
        options:["SCHEDULED","DELAYED","IN_PROGRESS","COMPLETED","CANCELLED"] },
    ],
    stats: () => {
      const all = DB.trips.getAll();
      return [
        { label:"Total",       value: all.length,                                          cls:"accent"  },
        { label:"Scheduled",   value: all.filter(t=>t.trip_status==="SCHEDULED").length,   cls:"info"    },
        { label:"In Progress", value: all.filter(t=>t.trip_status==="IN_PROGRESS").length, cls:"warning" },
        { label:"Completed",   value: all.filter(t=>t.trip_status==="COMPLETED").length,   cls:"success" },
      ];
    }
  },

  payments: {
    label: "Payments",
    subtitle: "Manage PAYMENT records",
    dbKey: "payments",
    pkField: "payment_id",
    columns: ["payment_id","booking_id","amount","discount_amount","payment_method","payment_status","payment_date"],
    fields: [
      { key:"payment_id",      label:"Payment ID",      type:"text",   required:true },
      { key:"booking_id",      label:"Booking ID",      type:"text",   required:true },
      { key:"amount",          label:"Amount (₹)",       type:"number", required:true },
      { key:"discount_amount", label:"Discount (₹)",     type:"number", required:false },
      { key:"payment_method",  label:"Method",           type:"select", required:true,
        options:["UPI","Net Banking","Credit Card","Debit Card","Cash"] },
      { key:"payment_status",  label:"Status",           type:"select", required:true,
        options:["PENDING","SUCCESS","FAILED","REFUNDED"] },
      { key:"payment_date",    label:"Payment Date",     type:"date",   required:true },
    ],
    stats: () => {
      const all = DB.payments.getAll();
      const total = all.filter(p=>p.payment_status==="SUCCESS").reduce((s,p)=>s+p.amount,0);
      return [
        { label:"Total",   value: all.length,                                          cls:"accent"  },
        { label:"Success", value: all.filter(p=>p.payment_status==="SUCCESS").length,  cls:"success" },
        { label:"Pending", value: all.filter(p=>p.payment_status==="PENDING").length,  cls:"warning" },
        { label:"Revenue", value: "₹" + total.toFixed(0),                             cls:"info"    },
      ];
    }
  },

  vehicles: {
    label: "Vehicles",
    subtitle: "Manage VEHICLE records",
    dbKey: "vehicles",
    pkField: "vehicle_id",
    columns: ["vehicle_id","provider_id","vehicle_number","vehicle_type","total_seats","remaining_seats"],
    fields: [
      { key:"vehicle_id",       label:"Vehicle ID",    type:"text",   required:true },
      { key:"provider_id",      label:"Provider ID",   type:"text",   required:true },
      { key:"vehicle_number",   label:"Reg. Number",   type:"text",   required:true },
      { key:"vehicle_type",     label:"Type",          type:"select", required:true,
        options:["AC","Non-AC","No preference"] },
      { key:"total_seats",      label:"Total Seats",   type:"number", required:true },
      { key:"remaining_seats",  label:"Remaining",     type:"number", required:true },
    ],
    stats: () => {
      const all = DB.vehicles.getAll();
      return [
        { label:"Total",      value: all.length,                                        cls:"accent"  },
        { label:"AC",         value: all.filter(v=>v.vehicle_type==="AC").length,        cls:"success" },
        { label:"Non-AC",     value: all.filter(v=>v.vehicle_type==="Non-AC").length,    cls:"warning" },
      ];
    }
  },

  routes: {
    label: "Routes",
    subtitle: "Manage ROUTE records",
    dbKey: "routes",
    pkField: "route_id",
    columns: ["route_id","source","destination","distance"],
    fields: [
      { key:"route_id",     label:"Route ID",     type:"text",   required:true },
      { key:"source",       label:"Source",        type:"text",   required:true },
      { key:"destination",  label:"Destination",   type:"text",   required:true },
      { key:"distance",     label:"Distance (km)", type:"number", required:true },
    ],
    stats: () => {
      const all = DB.routes.getAll();
      const maxDist = all.reduce((m,r)=> r.distance > m ? r.distance : m, 0);
      return [
        { label:"Total Routes", value: all.length,  cls:"accent" },
        { label:"Longest (km)", value: maxDist,      cls:"info"   },
      ];
    }
  },

  schedules: {
    label: "Schedules",
    subtitle: "Manage SCHEDULE records",
    dbKey: "schedules",
    pkField: "schedule_id",
    columns: ["schedule_id","route_id","provider_id","departure_time","arrival_time","journey_date"],
    fields: [
      { key:"schedule_id",                  label:"Schedule ID",    type:"text",  required:true },
      { key:"route_id",                     label:"Route ID",       type:"text",  required:true },
      { key:"provider_id",                  label:"Provider ID",    type:"text",  required:true },
      { key:"departure_time",               label:"Departure Time", type:"time",  required:true },
      { key:"arrival_time",                 label:"Arrival Time",   type:"time",  required:true },
      { key:"journey_date",                 label:"Journey Date",   type:"date",  required:true },
      { key:"arrival_time_to_destination",  label:"Dest. Arrival",  type:"time",  required:true },
    ],
    stats: () => {
      const all = DB.schedules.getAll();
      return [
        { label:"Schedules", value: all.length, cls:"accent" },
      ];
    }
  },

  offers: {
    label: "Offers",
    subtitle: "Manage OFFER records",
    dbKey: "offers",
    pkField: "offer_id",
    columns: ["offer_id","offer_code","discount_percentage","start_date","end_date","status"],
    fields: [
      { key:"offer_id",            label:"Offer ID",      type:"text",   required:true },
      { key:"provider_id",         label:"Provider ID",   type:"text",   required:true },
      { key:"offer_code",          label:"Offer Code",    type:"text",   required:true },
      { key:"discount_percentage", label:"Discount %",    type:"number", required:true },
      { key:"start_date",          label:"Start Date",    type:"date",   required:true },
      { key:"end_date",            label:"End Date",      type:"date",   required:true },
      { key:"status",              label:"Status",        type:"select", required:true,
        options:["ACTIVE","INACTIVE","EXPIRED","SUSPENDED"] },
    ],
    stats: () => {
      const all = DB.offers.getAll();
      return [
        { label:"Total",    value: all.length,                                     cls:"accent"  },
        { label:"Active",   value: all.filter(o=>o.status==="ACTIVE").length,      cls:"success" },
        { label:"Expired",  value: all.filter(o=>o.status==="EXPIRED").length,     cls:"danger"  },
      ];
    }
  },

  serviceProviders: {
    label: "Service Providers",
    subtitle: "Manage SERVICE_PROVIDER records",
    dbKey: "serviceProviders",
    pkField: "provider_id",
    columns: ["provider_id","name","email"],
    fields: [
      { key:"provider_id", label:"Provider ID", type:"text", required:true },
      { key:"name",        label:"Name",         type:"text", required:true },
      { key:"email",       label:"Email",        type:"text", required:true },
      { key:"password",    label:"Password",     type:"text", required:true },
    ],
    stats: () => {
      return [ { label:"Providers", value: DB.serviceProviders.getAll().length, cls:"accent" } ];
    }
  },

  reviews: {
    label: "Reviews",
    subtitle: "Manage REVIEW records",
    dbKey: "reviews",
    pkField: "review_id",
    columns: ["review_id","customer_id","rating","comment","review_date"],
    fields: [
      { key:"review_id",   label:"Review ID",    type:"text",   required:true },
      { key:"customer_id", label:"Customer ID",  type:"text",   required:true },
      { key:"rating",      label:"Rating (1-5)", type:"number", required:true },
      { key:"comment",     label:"Comment",      type:"text",   required:false },
      { key:"review_date", label:"Review Date",  type:"date",   required:true },
    ],
    stats: () => {
      const all = DB.reviews.getAll();
      const avg = all.length ? (all.reduce((s,r)=>s+r.rating,0)/all.length).toFixed(1) : "—";
      return [
        { label:"Reviews",    value: all.length, cls:"accent" },
        { label:"Avg Rating", value: avg,         cls:"success" },
      ];
    }
  },

  supportRequests: {
    label: "Support Requests",
    subtitle: "Manage SUPPORT_REQUEST records",
    dbKey: "supportRequests",
    pkField: "request_id",
    columns: ["request_id","customer_id","supporter_id","status","created_date"],
    fields: [
      { key:"request_id",   label:"Request ID",   type:"text",   required:true },
      { key:"customer_id",  label:"Customer ID",  type:"text",   required:true },
      { key:"supporter_id", label:"Supporter ID", type:"text",   required:false },
      { key:"description",  label:"Description",  type:"text",   required:false },
      { key:"status",       label:"Status",        type:"select", required:true,
        options:["OPEN","RESOLVED"] },
      { key:"created_date", label:"Created Date", type:"date",   required:true },
    ],
    stats: () => {
      const all = DB.supportRequests.getAll();
      return [
        { label:"Total",    value: all.length,                                       cls:"accent"  },
        { label:"Open",     value: all.filter(s=>s.status==="OPEN").length,          cls:"warning" },
        { label:"Resolved", value: all.filter(s=>s.status==="RESOLVED").length,      cls:"success" },
      ];
    }
  },

  refunds: {
    label: "Refunds",
    subtitle: "Manage REFUND records",
    dbKey: "refunds",
    pkField: "booking_id",
    columns: ["booking_id","admin_id","refund_amount","refund_status","refund_date"],
    fields: [
      { key:"booking_id",    label:"Booking ID",    type:"text",   required:true },
      { key:"admin_id",      label:"Admin ID",      type:"text",   required:true },
      { key:"refund_amount", label:"Refund (₹)",    type:"number", required:true },
      { key:"refund_status", label:"Status",        type:"select", required:true,
        options:["REQUESTED","PROCESSING","COMPLETED","REJECTED"] },
      { key:"refund_date",   label:"Refund Date",   type:"date",   required:true },
    ],
    stats: () => {
      const all = DB.refunds.getAll();
      return [
        { label:"Total",      value: all.length,                                        cls:"accent" },
        { label:"Completed",  value: all.filter(r=>r.refund_status==="COMPLETED").length, cls:"success" },
      ];
    }
  }
};


/* ── UI State ───────────────────────────────────────────────── */
let currentTable  = "bookings";  // active table key
let currentFilter = "";          // live search string
let pendingDelete = null;        // { pkField, pkValue }
let isEditMode    = false;

/* ── DOM Refs ───────────────────────────────────────────────── */
const tableTitle    = document.getElementById("tableTitle");
const tableSubtitle = document.getElementById("tableSubtitle");
const statsBar      = document.getElementById("statsBar");
const tableHead     = document.getElementById("tableHead");
const tableBody     = document.getElementById("tableBody");
const emptyState    = document.getElementById("emptyState");
const dataTable     = document.getElementById("dataTable");
const recordCount   = document.getElementById("recordCount");
const searchInput   = document.getElementById("searchInput");

const modalOverlay  = document.getElementById("modalOverlay");
const modalTitle    = document.getElementById("modalTitle");
const recordForm    = document.getElementById("recordForm");
const saveRecord    = document.getElementById("saveRecord");

const confirmOverlay = document.getElementById("confirmOverlay");
const confirmText    = document.getElementById("confirmText");
const confirmDeleteBtn = document.getElementById("confirmDelete");

const toast    = document.getElementById("toast");
const toastIcon = document.getElementById("toastIcon");
const toastMsg  = document.getElementById("toastMsg");

const sidebarEl = document.getElementById("sidebar");


/* ═══════════════════════════════════════════════════════════
   CORE RENDER ─ renderTable()
═══════════════════════════════════════════════════════════ */

/**
 * Renders the table for the currently active schema.
 * Reads data via DB[schema.dbKey].getAll() then filters client-side.
 */
function renderTable() {
  const schema = TABLE_SCHEMAS[currentTable];
  if (!schema) return;

  // Update page header
  tableTitle.textContent    = schema.label;
  tableSubtitle.textContent = schema.subtitle;

  // Stats bar
  renderStats(schema);

  // Fetch all records via DB object
  const allRecords = DB[schema.dbKey].getAll();

  // Filter records client-side
  const lc = currentFilter.toLowerCase();
  const filtered = currentFilter
    ? allRecords.filter(r =>
        schema.columns.some(col => String(r[col] ?? "").toLowerCase().includes(lc))
      )
    : allRecords;

  // Record count badge
  recordCount.textContent = `${filtered.length} record${filtered.length !== 1 ? "s" : ""}`;

  // Table head
  tableHead.innerHTML = "";
  const trHead = document.createElement("tr");
  [...schema.columns, "actions"].forEach(col => {
    const th    = document.createElement("th");
    th.textContent = col === "actions" ? "" : col.replace(/_/g," ");
    trHead.appendChild(th);
  });
  tableHead.appendChild(trHead);

  // Table body
  tableBody.innerHTML = "";

  if (filtered.length === 0) {
    emptyState.classList.remove("hidden");
    dataTable.classList.add("hidden");
    return;
  }

  emptyState.classList.add("hidden");
  dataTable.classList.remove("hidden");

  filtered.forEach(record => {
    const tr = document.createElement("tr");

    schema.columns.forEach(col => {
      const td  = document.createElement("td");
      const val = record[col];

      // Status / enum badge
      if (col.includes("status") || col === "gender" || col === "verification_status") {
        td.innerHTML = `<span class="badge badge-${val ?? "—"}">${val ?? "—"}</span>`;
      } else if (col.includes("amount") || col === "discount_amount" || col === "refund_amount") {
        td.textContent = val != null ? "₹" + Number(val).toFixed(2) : "—";
      } else if (col === "rating") {
        td.textContent = val ? "★".repeat(val) : "—";
      } else {
        td.textContent = val ?? "—";
        if (col === schema.pkField) td.style.fontWeight = "600";
      }

      tr.appendChild(td);
    });

    // Actions column
    const tdAct = document.createElement("td");
    tdAct.innerHTML = `
      <div class="td-actions">
        <button class="btn-icon edit" title="Edit" onclick="openEditModal(${JSON.stringify(record[schema.pkField])})">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
        <button class="btn-icon trash" title="Delete" onclick="openDeleteConfirm(${JSON.stringify(record[schema.pkField])})">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>`;
    tr.appendChild(tdAct);
    tableBody.appendChild(tr);
  });
}


/* ── Stats Render ───────────────────────────────────────────── */
function renderStats(schema) {
  statsBar.innerHTML = "";
  const stats = schema.stats();
  stats.forEach(stat => {
    const card = document.createElement("div");
    card.className = "stat-card";
    card.innerHTML = `
      <span class="stat-label">${stat.label}</span>
      <span class="stat-value ${stat.cls}">${stat.value}</span>`;
    statsBar.appendChild(card);
  });
}


/* ═══════════════════════════════════════════════════════════
   FORM — Build + Open for ADD / EDIT
═══════════════════════════════════════════════════════════ */

function buildForm(schema, record = null) {
  recordForm.innerHTML = "";
  isEditMode = record !== null;

  schema.fields.forEach(field => {
    const wrapper = document.createElement("div");
    wrapper.className = "form-field" + (field.key === "comment" || field.key === "description" ? " full" : "");

    const label = document.createElement("label");
    label.setAttribute("for", "ff_" + field.key);
    label.textContent = field.label;

    let input;
    if (field.type === "select") {
      input = document.createElement("select");
      field.options.forEach(opt => {
        const o = document.createElement("option");
        o.value = opt;
        o.textContent = opt;
        if (record && record[field.key] === opt) o.selected = true;
        input.appendChild(o);
      });
    } else {
      input = document.createElement("input");
      input.type = field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "time" ? "time" : "text";
      if (field.type === "number") {
        input.step = "0.01";
        input.min  = "0";
      }
      if (record) input.value = record[field.key] ?? "";
    }

    input.id   = "ff_" + field.key;
    input.name = field.key;
    input.placeholder = field.label;
    if (field.required) input.required = true;

    // Disable PK field on edit
    if (isEditMode && field.key === schema.pkField) {
      input.disabled = true;
    }

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    recordForm.appendChild(wrapper);
  });
}

/** Opens the ADD modal */
function openAddModal() {
  const schema = TABLE_SCHEMAS[currentTable];
  modalTitle.textContent = `Add ${schema.label} Record`;
  buildForm(schema, null);
  modalOverlay.classList.remove("hidden");
}

/** Opens the EDIT modal pre-filled with existing record data */
window.openEditModal = function(pkValue) {
  const schema = TABLE_SCHEMAS[currentTable];
  const result = DB[schema.dbKey].getById(pkValue);
  if (!result.success) { showToast(result.error, "error"); return; }

  modalTitle.textContent = `Edit ${schema.label} Record`;
  buildForm(schema, result.data);
  modalOverlay.classList.remove("hidden");
};

function closeModal() {
  modalOverlay.classList.add("hidden");
  recordForm.innerHTML = "";
}


/* ═══════════════════════════════════════════════════════════
   SAVE RECORD — CREATE or UPDATE via DB.*
═══════════════════════════════════════════════════════════ */
saveRecord.addEventListener("click", () => {
  const schema = TABLE_SCHEMAS[currentTable];
  const formData = {};

  // Collect form values
  schema.fields.forEach(field => {
    const el = document.getElementById("ff_" + field.key);
    if (!el) return;
    let val = el.value.trim();
    if (val === "") {
      formData[field.key] = null;
    } else if (field.type === "number") {
      formData[field.key] = Number(val);
    } else {
      formData[field.key] = val;
    }
  });

  // Validation
  const requiredFields = schema.fields.filter(f => f.required);
  for (const f of requiredFields) {
    const el = document.getElementById("ff_" + f.key);
    if (el && !el.disabled && !formData[f.key]) {
      showToast(`"${f.label}" is required.`, "error");
      el.focus();
      return;
    }
  }

  let result;
  if (isEditMode) {
    const pkVal = formData[schema.pkField];
    // pkField is disabled, read from the disabled input directly
    const pkEl  = document.getElementById("ff_" + schema.pkField);
    const pk    = pkEl ? pkEl.value : pkVal;
    result = DB[schema.dbKey].update(pk, formData);
  } else {
    result = DB[schema.dbKey].create(formData);
  }

  if (result.success) {
    closeModal();
    renderTable();
    showToast(result.message, "success");
  } else {
    showToast(result.error, "error");
  }
});


/* ═══════════════════════════════════════════════════════════
   DELETE — confirm dialog then DB.*
═══════════════════════════════════════════════════════════ */

window.openDeleteConfirm = function(pkValue) {
  const schema = TABLE_SCHEMAS[currentTable];
  pendingDelete = { pkField: schema.pkField, pkValue };
  confirmText.textContent = `Delete ${schema.pkField} = "${pkValue}"? This action cannot be undone.`;
  confirmOverlay.classList.remove("hidden");
};

confirmDeleteBtn.addEventListener("click", () => {
  if (!pendingDelete) return;
  const schema = TABLE_SCHEMAS[currentTable];
  const result = DB[schema.dbKey].delete(pendingDelete.pkValue);

  confirmOverlay.classList.add("hidden");
  pendingDelete = null;

  if (result.success) {
    renderTable();
    showToast(result.message, "success");
  } else {
    showToast(result.error, "error");
  }
});

document.getElementById("cancelDelete").addEventListener("click", () => {
  confirmOverlay.classList.add("hidden");
  pendingDelete = null;
});


/* ═══════════════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════════════ */
let _toastTimer;
function showToast(message, type = "success") {
  clearTimeout(_toastTimer);
  toastMsg.textContent = message;
  toast.className = `toast t-${type}`;
  toastIcon.className = type === "success"
    ? "fa-solid fa-circle-check"
    : "fa-solid fa-circle-exclamation";

  // Force reflow to re-trigger animation
  void toast.offsetWidth;
  setTimeout(() => toast.classList.remove("hidden"), 10);

  _toastTimer = setTimeout(() => toast.classList.add("hidden"), 3200);
}


/* ═══════════════════════════════════════════════════════════
   NAVIGATION — Sidebar
═══════════════════════════════════════════════════════════ */
document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));
    item.classList.add("active");
    currentTable  = item.dataset.table;
    currentFilter = "";
    searchInput.value = "";
    renderTable();
  });
});

// Sidebar toggle for mobile
document.getElementById("sidebarToggle").addEventListener("click", () => {
  sidebarEl.classList.toggle("open");
});

// Close sidebar when clicking outside on mobile
document.addEventListener("click", e => {
  if (window.innerWidth <= 768 &&
      sidebarEl.classList.contains("open") &&
      !sidebarEl.contains(e.target) &&
      !document.getElementById("sidebarToggle").contains(e.target)) {
    sidebarEl.classList.remove("open");
  }
});


/* ── Search / Filter ────────────────────────────────────────── */
searchInput.addEventListener("input", e => {
  currentFilter = e.target.value;
  renderTable();
});


/* ── Add Record button ──────────────────────────────────────── */
document.getElementById("addRecordBtn").addEventListener("click", openAddModal);

/* ── Reset Database button ──────────────────────────────────── */
document.getElementById("resetDbBtn").addEventListener("click", () => {
  if (confirm("⚠️ Reset ALL tables back to original mock data?\nThis will erase every change you have made.")) {
    const result = DB.resetAll();
    if (result.success) {
      renderTable();
      showToast("Database reset to original mock data.", "success");
    } else {
      showToast(result.error, "error");
    }
  }
});

/* ── Modal close buttons ────────────────────────────────────── */
document.getElementById("closeModal").addEventListener("click", closeModal);
document.getElementById("cancelModal").addEventListener("click", closeModal);

// Close on overlay click
modalOverlay.addEventListener("click", e => { if (e.target === modalOverlay) closeModal(); });
confirmOverlay.addEventListener("click", e => {
  if (e.target === confirmOverlay) {
    confirmOverlay.classList.add("hidden");
    pendingDelete = null;
  }
});


/* ── Bootstrap ──────────────────────────────────────────────── */
renderTable();
