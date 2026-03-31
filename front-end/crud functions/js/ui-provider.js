/**
 * ============================================================
 *  Click2Book — ui-provider.js
 *  Actor: SERVICE PROVIDER (simulated as P001 — RedBus Travels)
 *
 *  What a provider can do:
 *    My Vehicles  — CRUD on own fleet
 *    Routes       — CRUD on routes
 *    My Schedules — CRUD on own schedules
 *    My Trips     — view + update trip status
 *    My Offers    — CRUD on own offers
 * ============================================================
 */

/* Simulated logged-in provider */
const CURRENT_PROVIDER_ID = "P001";

const TABLE_SCHEMAS = {

  /* ── MY VEHICLES ──────────────────────────────────────── */
  myVehicles: {
    label: "My Fleet",
    subtitle: `Vehicles operated by provider ${CURRENT_PROVIDER_ID}`,
    dbKey: "vehicles",
    pkField: "vehicle_id",
    getData: () => DB.vehicles.find(v => v.provider_id === CURRENT_PROVIDER_ID),
    columns: ["vehicle_id","vehicle_number","vehicle_type","total_seats","remaining_seats"],
    fields: [
      { key:"vehicle_id",      label:"Vehicle ID",   type:"text",   required:true },
      { key:"provider_id",     label:"Provider ID",  type:"text",   required:true },
      { key:"vehicle_number",  label:"Reg. Number",  type:"text",   required:true },
      { key:"vehicle_type",    label:"Type",         type:"select", required:true,
        options:["AC","Non-AC","No preference"] },
      { key:"total_seats",     label:"Total Seats",  type:"number", required:true },
      { key:"remaining_seats", label:"Remaining",    type:"number", required:true },
    ],
    stats: () => {
      const a = DB.vehicles.find(v => v.provider_id === CURRENT_PROVIDER_ID);
      const totalSeats = a.reduce((s,v)=>s+v.total_seats,0);
      const remSeats   = a.reduce((s,v)=>s+v.remaining_seats,0);
      return [
        { label:"Vehicles",    value: a.length,    cls:"accent"  },
        { label:"Total Seats", value: totalSeats,  cls:"info"    },
        { label:"Available",   value: remSeats,    cls:"success" },
        { label:"Booked",      value: totalSeats - remSeats, cls:"warning" },
      ];
    }
  },

  /* ── ROUTES ───────────────────────────────────────────── */
  routes: {
    label: "Routes",
    subtitle: "Manage travel routes",
    dbKey: "routes",
    pkField: "route_id",
    columns: ["route_id","source","destination","distance"],
    fields: [
      { key:"route_id",    label:"Route ID",      type:"text",   required:true },
      { key:"source",      label:"Source",        type:"text",   required:true },
      { key:"destination", label:"Destination",   type:"text",   required:true },
      { key:"distance",    label:"Distance (km)", type:"number", required:true },
    ],
    stats: () => {
      const a = DB.routes.getAll();
      const mx = a.reduce((m,r)=>r.distance>m?r.distance:m,0);
      return [
        { label:"Total Routes",  value: a.length, cls:"accent" },
        { label:"Longest (km)", value: mx,        cls:"info"   },
      ];
    }
  },

  /* ── MY SCHEDULES ─────────────────────────────────────── */
  mySchedules: {
    label: "My Schedules",
    subtitle: `Schedules operated by provider ${CURRENT_PROVIDER_ID}`,
    dbKey: "schedules",
    pkField: "schedule_id",
    getData: () => DB.schedules.find(s => s.provider_id === CURRENT_PROVIDER_ID),
    columns: ["schedule_id","route_id","departure_time","arrival_time","journey_date"],
    fields: [
      { key:"schedule_id",                 label:"Schedule ID",   type:"text", required:true },
      { key:"route_id",                    label:"Route ID",      type:"text", required:true },
      { key:"provider_id",                 label:"Provider ID",   type:"text", required:true },
      { key:"departure_time",              label:"Departure",     type:"time", required:true },
      { key:"arrival_time",                label:"Arrival",       type:"time", required:true },
      { key:"journey_date",                label:"Journey Date",  type:"date", required:true },
      { key:"arrival_time_to_destination", label:"Dest. Arrival", type:"time", required:true },
    ],
    stats: () => {
      const a = DB.schedules.find(s => s.provider_id === CURRENT_PROVIDER_ID);
      return [{ label:"My Schedules", value: a.length, cls:"accent" }];
    }
  },

  /* ── MY TRIPS ─────────────────────────────────────────── */
  myTrips: {
    label: "My Trips",
    subtitle: "Trips on your vehicles — update status",
    dbKey: "trips",
    pkField: "trip_id",
    getData: () => {
      /* Get schedule IDs belonging to this provider */
      const myScheduleIds = new Set(
        DB.schedules.find(s => s.provider_id === CURRENT_PROVIDER_ID)
          .map(s => s.schedule_id)
      );
      return DB.trips.find(t => myScheduleIds.has(t.schedule_id));
    },
    columns: ["trip_id","schedule_id","vehicle_id","trip_status"],
    fields: [
      { key:"trip_id",     label:"Trip ID",     type:"text",   required:true },
      { key:"schedule_id", label:"Schedule ID", type:"text",   required:true },
      { key:"vehicle_id",  label:"Vehicle ID",  type:"text",   required:true },
      { key:"trip_status", label:"Status",      type:"select", required:true,
        options:["SCHEDULED","DELAYED","IN_PROGRESS","COMPLETED","CANCELLED"] },
    ],
    stats: () => {
      const myScheduleIds = new Set(
        DB.schedules.find(s => s.provider_id === CURRENT_PROVIDER_ID)
          .map(s => s.schedule_id)
      );
      const a = DB.trips.find(t => myScheduleIds.has(t.schedule_id));
      return [
        { label:"Total",       value: a.length,                                           cls:"accent"  },
        { label:"Scheduled",   value: a.filter(t=>t.trip_status==="SCHEDULED").length,    cls:"info"    },
        { label:"In Progress", value: a.filter(t=>t.trip_status==="IN_PROGRESS").length,  cls:"warning" },
        { label:"Completed",   value: a.filter(t=>t.trip_status==="COMPLETED").length,    cls:"success" },
      ];
    }
  },

  /* ── MY OFFERS ────────────────────────────────────────── */
  myOffers: {
    label: "My Offers",
    subtitle: `Discount offers by provider ${CURRENT_PROVIDER_ID}`,
    dbKey: "offers",
    pkField: "offer_id",
    getData: () => DB.offers.find(o => o.provider_id === CURRENT_PROVIDER_ID),
    columns: ["offer_id","offer_code","discount_percentage","start_date","end_date","status"],
    fields: [
      { key:"offer_id",            label:"Offer ID",    type:"text",   required:true },
      { key:"provider_id",         label:"Provider ID", type:"text",   required:true },
      { key:"offer_code",          label:"Offer Code",  type:"text",   required:true },
      { key:"discount_percentage", label:"Discount %",  type:"number", required:true },
      { key:"start_date",          label:"Start Date",  type:"date",   required:true },
      { key:"end_date",            label:"End Date",    type:"date",   required:true },
      { key:"status",              label:"Status",      type:"select", required:true,
        options:["ACTIVE","INACTIVE","EXPIRED","SUSPENDED"] },
    ],
    stats: () => {
      const a = DB.offers.find(o => o.provider_id === CURRENT_PROVIDER_ID);
      return [
        { label:"Total",    value: a.length,                                cls:"accent"  },
        { label:"Active",   value: a.filter(o=>o.status==="ACTIVE").length, cls:"success" },
        { label:"Expired",  value: a.filter(o=>o.status==="EXPIRED").length, cls:"danger" },
      ];
    }
  },

  /* ── BOOKINGS ON MY TRIPS (read-only) ──────────────────── */
  tripBookings: {
    label: "Trip Bookings",
    subtitle: "Bookings made on your trips",
    dbKey: "bookings",
    pkField: "booking_id",
    readOnly: true,
    getData: () => {
      const myScheduleIds = new Set(
        DB.schedules.find(s => s.provider_id === CURRENT_PROVIDER_ID)
          .map(s => s.schedule_id)
      );
      const myTripIds = new Set(
        DB.trips.find(t => myScheduleIds.has(t.schedule_id))
          .map(t => t.trip_id)
      );
      return DB.bookings.find(b => myTripIds.has(b.trip_id));
    },
    columns: ["booking_id","customer_id","trip_id","booking_date","booking_status"],
    fields: [],
    stats: () => {
      const myScheduleIds = new Set(
        DB.schedules.find(s => s.provider_id === CURRENT_PROVIDER_ID)
          .map(s => s.schedule_id)
      );
      const myTripIds = new Set(
        DB.trips.find(t => myScheduleIds.has(t.schedule_id))
          .map(t => t.trip_id)
      );
      const a = DB.bookings.find(b => myTripIds.has(b.trip_id));
      return [
        { label:"Total Bookings", value: a.length,                                           cls:"accent"  },
        { label:"Confirmed",      value: a.filter(b=>b.booking_status==="CONFIRMED").length,  cls:"success" },
        { label:"Cancelled",      value: a.filter(b=>b.booking_status==="CANCELLED").length,  cls:"danger"  },
      ];
    }
  },

};

/* ── Bootstrap ────────────────────────────────────────────── */
initUI("myVehicles", "Service Provider Portal");
