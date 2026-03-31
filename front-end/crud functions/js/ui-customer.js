/**
 * ============================================================
 *  Click2Book — ui-customer.js
 *  Actor: CUSTOMER (simulated as C001 — Aakash Sharma)
 *
 *  What a customer can do:
 *    My Bookings  — view + cancel own bookings (create new)
 *    My Payments  — view payments for own bookings (read-only)
 *    My Reviews   — full CRUD on own reviews
 *    Support Reqs — create + view own support requests
 *    Cancellations— view own cancellations (read-only)
 * ============================================================
 */

/* Simulated logged-in customer */
const CURRENT_CUSTOMER_ID = "C001";

const TABLE_SCHEMAS = {

  /* ── MY BOOKINGS ──────────────────────────────────────── */
  myBookings: {
    label: "My Bookings",
    subtitle: `Bookings for customer ${CURRENT_CUSTOMER_ID}`,
    dbKey: "bookings",
    pkField: "booking_id",
    /* Scoped to this customer only */
    getData: () => DB.bookings.find(b => b.customer_id === CURRENT_CUSTOMER_ID),
    columns: ["booking_id","trip_id","offer_id","booking_date","booking_status","irctc_id"],
    fields: [
      { key:"booking_id",     label:"Booking ID",   type:"text",   required:true  },
      { key:"customer_id",    label:"Customer ID",  type:"text",   required:true  },
      { key:"trip_id",        label:"Trip ID",      type:"text",   required:true  },
      { key:"offer_id",       label:"Offer ID",     type:"text",   required:false },
      { key:"booking_date",   label:"Booking Date", type:"date",   required:true  },
      { key:"booking_status", label:"Status",       type:"select", required:true,
        options:["PENDING","CONFIRMED","CANCELLED","COMPLETED"] },
      { key:"irctc_id",       label:"IRCTC ID",     type:"text",   required:false },
    ],
    stats: () => {
      const a = DB.bookings.find(b => b.customer_id === CURRENT_CUSTOMER_ID);
      return [
        { label:"Total",     value: a.length,                                           cls:"accent"  },
        { label:"Confirmed", value: a.filter(b=>b.booking_status==="CONFIRMED").length, cls:"success" },
        { label:"Pending",   value: a.filter(b=>b.booking_status==="PENDING").length,   cls:"warning" },
        { label:"Cancelled", value: a.filter(b=>b.booking_status==="CANCELLED").length, cls:"danger"  },
      ];
    }
  },

  /* ── MY PAYMENTS ──────────────────────────────────────── */
  myPayments: {
    label: "My Payments",
    subtitle: "Payments linked to your bookings",
    dbKey: "payments",
    pkField: "payment_id",
    readOnly: true,
    getData: () => {
      /* Get all booking IDs belonging to this customer */
      const myBookingIds = new Set(
        DB.bookings.find(b => b.customer_id === CURRENT_CUSTOMER_ID).map(b => b.booking_id)
      );
      return DB.payments.find(p => myBookingIds.has(p.booking_id));
    },
    columns: ["payment_id","booking_id","amount","discount_amount","payment_method","payment_status","payment_date"],
    fields: [],
    stats: () => {
      const myBookingIds = new Set(
        DB.bookings.find(b => b.customer_id === CURRENT_CUSTOMER_ID).map(b => b.booking_id)
      );
      const a = DB.payments.find(p => myBookingIds.has(p.booking_id));
      const total = a.filter(p=>p.payment_status==="SUCCESS").reduce((s,p)=>s+p.amount,0);
      return [
        { label:"Transactions", value: a.length,                                         cls:"accent"  },
        { label:"Paid",         value: a.filter(p=>p.payment_status==="SUCCESS").length,  cls:"success" },
        { label:"Total Spent",  value: "₹" + total.toFixed(0),                          cls:"info"    },
      ];
    }
  },

  /* ── MY REVIEWS ───────────────────────────────────────── */
  myReviews: {
    label: "My Reviews",
    subtitle: "Write and manage your reviews",
    dbKey: "reviews",
    pkField: "review_id",
    getData: () => DB.reviews.find(r => r.customer_id === CURRENT_CUSTOMER_ID),
    columns: ["review_id","rating","comment","review_date"],
    fields: [
      { key:"review_id",   label:"Review ID",    type:"text",   required:true  },
      { key:"customer_id", label:"Customer ID",  type:"text",   required:true  },
      { key:"rating",      label:"Rating (1-5)", type:"number", required:true  },
      { key:"comment",     label:"Comment",      type:"text",   required:false },
      { key:"review_date", label:"Date",         type:"date",   required:true  },
    ],
    stats: () => {
      const a = DB.reviews.find(r => r.customer_id === CURRENT_CUSTOMER_ID);
      const avg = a.length
        ? (a.reduce((s,r)=>s+r.rating,0)/a.length).toFixed(1) : "—";
      return [
        { label:"Reviews",    value: a.length, cls:"accent"  },
        { label:"Avg Rating", value: avg,      cls:"success" },
      ];
    }
  },

  /* ── MY SUPPORT REQUESTS ──────────────────────────────── */
  mySupportRequests: {
    label: "Support Requests",
    subtitle: "Raise and track your support tickets",
    dbKey: "supportRequests",
    pkField: "request_id",
    getData: () => DB.supportRequests.find(r => r.customer_id === CURRENT_CUSTOMER_ID),
    columns: ["request_id","description","status","created_date"],
    fields: [
      { key:"request_id",   label:"Request ID",  type:"text",   required:true  },
      { key:"customer_id",  label:"Customer ID", type:"text",   required:true  },
      { key:"description",  label:"Description", type:"text",   required:false },
      { key:"status",       label:"Status",      type:"select", required:true,
        options:["OPEN","RESOLVED"] },
      { key:"created_date", label:"Date",        type:"date",   required:true  },
    ],
    stats: () => {
      const a = DB.supportRequests.find(r => r.customer_id === CURRENT_CUSTOMER_ID);
      return [
        { label:"Total",    value: a.length,                                     cls:"accent"  },
        { label:"Open",     value: a.filter(s=>s.status==="OPEN").length,        cls:"warning" },
        { label:"Resolved", value: a.filter(s=>s.status==="RESOLVED").length,    cls:"success" },
      ];
    }
  },

  /* ── MY CANCELLATIONS ─────────────────────────────────── */
  myCancellations: {
    label: "My Cancellations",
    subtitle: "Cancelled bookings",
    dbKey: "cancellations",
    pkField: "booking_id",
    readOnly: true,
    getData: () => {
      const myBookingIds = new Set(
        DB.bookings.find(b => b.customer_id === CURRENT_CUSTOMER_ID).map(b => b.booking_id)
      );
      return DB.cancellations.find(c => myBookingIds.has(c.booking_id));
    },
    columns: ["booking_id","cancel_date"],
    fields: [],
    stats: () => {
      const myBookingIds = new Set(
        DB.bookings.find(b => b.customer_id === CURRENT_CUSTOMER_ID).map(b => b.booking_id)
      );
      const a = DB.cancellations.find(c => myBookingIds.has(c.booking_id));
      return [{ label:"Cancellations", value: a.length, cls:"danger" }];
    }
  },

  /* ── AVAILABLE TRIPS (browse) ─────────────────────────── */
  browseTrips: {
    label: "Browse Trips",
    subtitle: "All available trips to book",
    dbKey: "trips",
    pkField: "trip_id",
    readOnly: true,
    getData: () => DB.trips.find(t => t.trip_status === "SCHEDULED" || t.trip_status === "IN_PROGRESS"),
    columns: ["trip_id","schedule_id","vehicle_id","trip_status"],
    fields: [],
    stats: () => {
      const a = DB.trips.getAll();
      return [
        { label:"Available",   value: a.filter(t=>t.trip_status==="SCHEDULED").length,   cls:"success" },
        { label:"In Progress", value: a.filter(t=>t.trip_status==="IN_PROGRESS").length, cls:"warning" },
      ];
    }
  },

};

/* ── Bootstrap ────────────────────────────────────────────── */
initUI("myBookings", "Customer Portal");

/* ── Hide the Data Manager button on all customer pages ────── */
(function() {
  const style = document.createElement('style');
  style.textContent = '#c2b-toggle-btn { display: none !important; }';
  document.head.appendChild(style);
})();
