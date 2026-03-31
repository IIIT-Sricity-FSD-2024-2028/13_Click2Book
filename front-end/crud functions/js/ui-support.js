/**
 * ============================================================
 *  Click2Book — ui-support.js
 *  Actor: CUSTOMER SUPPORT (simulated as S001 — Deepika Rao)
 *
 *  What a support agent can do:
 *    Support Requests — full CRUD, close tickets
 *    Customers        — search & view customer records
 *    Bookings         — reference view (read-only)
 *    Refunds          — create & manage refunds
 * ============================================================
 */

/* Simulated logged-in support agent */
const CURRENT_SUPPORTER_ID = "S001";

const TABLE_SCHEMAS = {

  /* ── SUPPORT REQUESTS ─────────────────────────────────── */
  supportRequests: {
    label: "Support Requests",
    subtitle: `All tickets — agent ${CURRENT_SUPPORTER_ID}`,
    dbKey: "supportRequests",
    pkField: "request_id",
    columns: ["request_id","customer_id","supporter_id","description","status","created_date"],
    fields: [
      { key:"request_id",   label:"Request ID",   type:"text",   required:true  },
      { key:"customer_id",  label:"Customer ID",  type:"text",   required:true  },
      { key:"supporter_id", label:"Supporter ID", type:"text",   required:false },
      { key:"description",  label:"Description",  type:"text",   required:false },
      { key:"status",       label:"Status",       type:"select", required:true,
        options:["OPEN","RESOLVED"] },
      { key:"created_date", label:"Created Date", type:"date",   required:true  },
    ],
    stats: () => {
      const a = DB.supportRequests.getAll();
      const mine = a.filter(r => r.supporter_id === CURRENT_SUPPORTER_ID);
      return [
        { label:"All Tickets", value: a.length,                                      cls:"accent"  },
        { label:"Open",        value: a.filter(s=>s.status==="OPEN").length,         cls:"warning" },
        { label:"Resolved",    value: a.filter(s=>s.status==="RESOLVED").length,     cls:"success" },
        { label:"My Assigned", value: mine.length,                                   cls:"info"    },
      ];
    }
  },

  /* ── CUSTOMERS ────────────────────────────────────────── */
  customers: {
    label: "Customer Lookup",
    subtitle: "Search and view customer profiles",
    dbKey: "customers",
    pkField: "customer_id",
    readOnly: true,
    columns: ["customer_id","name","email","age","gender","phone_number"],
    fields: [],
    stats: () => {
      const a = DB.customers.getAll();
      return [
        { label:"Total Customers", value: a.length, cls:"accent" },
      ];
    }
  },

  /* ── BOOKINGS (reference) ─────────────────────────────── */
  bookings: {
    label: "Booking Reference",
    subtitle: "Read-only booking lookup for support context",
    dbKey: "bookings",
    pkField: "booking_id",
    readOnly: true,
    columns: ["booking_id","customer_id","trip_id","booking_date","booking_status"],
    fields: [],
    stats: () => {
      const a = DB.bookings.getAll();
      return [
        { label:"Total",     value: a.length,                                           cls:"accent"  },
        { label:"Confirmed", value: a.filter(b=>b.booking_status==="CONFIRMED").length, cls:"success" },
        { label:"Cancelled", value: a.filter(b=>b.booking_status==="CANCELLED").length, cls:"danger"  },
      ];
    }
  },

  /* ── REFUNDS ──────────────────────────────────────────── */
  refunds: {
    label: "Refunds",
    subtitle: "Process and manage customer refunds",
    dbKey: "refunds",
    pkField: "booking_id",
    columns: ["booking_id","admin_id","refund_amount","refund_status","refund_date"],
    fields: [
      { key:"booking_id",    label:"Booking ID",  type:"text",   required:true },
      { key:"admin_id",      label:"Agent ID",    type:"text",   required:true },
      { key:"refund_amount", label:"Refund (₹)",  type:"number", required:true },
      { key:"refund_status", label:"Status",      type:"select", required:true,
        options:["REQUESTED","PROCESSING","COMPLETED","REJECTED"] },
      { key:"refund_date",   label:"Date",        type:"date",   required:true },
    ],
    stats: () => {
      const a = DB.refunds.getAll();
      const total = a.filter(r=>r.refund_status==="COMPLETED")
                     .reduce((s,r)=>s+r.refund_amount, 0);
      return [
        { label:"Total",        value: a.length,                                           cls:"accent"  },
        { label:"Completed",    value: a.filter(r=>r.refund_status==="COMPLETED").length,  cls:"success" },
        { label:"Processing",   value: a.filter(r=>r.refund_status==="PROCESSING").length, cls:"warning" },
        { label:"Amount Out",   value: "₹" + total.toFixed(0),                            cls:"info"    },
      ];
    }
  },

  /* ── REVIEWS (read-only escalation review) ─────────────── */
  reviews: {
    label: "Customer Reviews",
    subtitle: "Monitor customer feedback",
    dbKey: "reviews",
    pkField: "review_id",
    readOnly: true,
    columns: ["review_id","customer_id","rating","comment","review_date"],
    fields: [],
    stats: () => {
      const a = DB.reviews.getAll();
      const avg = a.length
        ? (a.reduce((s,r)=>s+r.rating,0)/a.length).toFixed(1) : "—";
      return [
        { label:"Reviews",    value: a.length, cls:"accent"  },
        { label:"Avg Rating", value: avg,      cls:"success" },
      ];
    }
  },

};

/* ── Bootstrap ────────────────────────────────────────────── */
initUI("supportRequests", "Support Agent Portal");
