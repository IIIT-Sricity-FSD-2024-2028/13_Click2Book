/**
 * ============================================================
 *  CLICK2BOOK — Full Mock Database
 *  Mirrors: online_ticket_booking SQL schema
 *  All data is stored in-memory (no backend).
 * ============================================================
 */

// ── CUSTOMER ─────────────────────────────────────────────────
let customers = [
  { customer_id: "C001", name: "Aakash Sharma",   email: "aakash@email.com",   password: "pass123",  age: 24, gender: "MALE",   phone_number: "9876543210" },
  { customer_id: "C002", name: "Priya Nair",      email: "priya@email.com",    password: "pass456",  age: 31, gender: "FEMALE", phone_number: "9123456780" },
  { customer_id: "C003", name: "Rahul Verma",     email: "rahul@email.com",    password: "pass789",  age: 27, gender: "MALE",   phone_number: "9988776655" },
  { customer_id: "C004", name: "Sneha Patel",     email: "sneha@email.com",    password: "passabc",  age: 22, gender: "FEMALE", phone_number: "8877665544" },
  { customer_id: "C005", name: "Arjun Mehta",     email: "arjun@email.com",    password: "passxyz",  age: 35, gender: "MALE",   phone_number: "7766554433" }
];

// ── ADMIN ─────────────────────────────────────────────────────
let admins = [
  { admin_id: "A001", name: "Super Admin",    email: "admin@click2book.com",  password: "adminpass" },
  { admin_id: "A002", name: "Ops Manager",    email: "ops@click2book.com",    password: "opspass"   }
];

// ── SERVICE PROVIDER ─────────────────────────────────────────
let serviceProviders = [
  { provider_id: "P001", name: "RedBus Travels",      email: "redbus@provider.com",   password: "rbpass"  },
  { provider_id: "P002", name: "Indian Railways",     email: "irctc@provider.com",    password: "irpass"  },
  { provider_id: "P003", name: "VRL Logistics",       email: "vrl@provider.com",      password: "vrlpass" }
];

// ── CUSTOMER SUPPORT ─────────────────────────────────────────
let customerSupport = [
  { supporter_id: "S001", name: "Deepika Rao",    email: "deepika@support.com", password: "sup123" },
  { supporter_id: "S002", name: "Vikram Singh",   email: "vikram@support.com",  password: "sup456" }
];

// ── VEHICLE ───────────────────────────────────────────────────
let vehicles = [
  { vehicle_id: "V001", provider_id: "P001", vehicle_number: "KA-01-AB-1234", vehicle_type: "AC",            total_seats: 40, remaining_seats: 12 },
  { vehicle_id: "V002", provider_id: "P001", vehicle_number: "MH-02-CD-5678", vehicle_type: "Non-AC",        total_seats: 50, remaining_seats: 30 },
  { vehicle_id: "V003", provider_id: "P002", vehicle_number: "TN-03-EF-9012", vehicle_type: "AC",            total_seats: 72, remaining_seats: 5  },
  { vehicle_id: "V004", provider_id: "P003", vehicle_number: "DL-04-GH-3456", vehicle_type: "No preference", total_seats: 60, remaining_seats: 60 }
];

// ── SEAT (weak entity — composite PK: vehicle_id + seat_number) ──
let seats = [
  { vehicle_id: "V001", seat_number: 1,  seat_status: "BOOKED"    },
  { vehicle_id: "V001", seat_number: 2,  seat_status: "AVAILABLE" },
  { vehicle_id: "V001", seat_number: 3,  seat_status: "BOOKED"    },
  { vehicle_id: "V002", seat_number: 1,  seat_status: "AVAILABLE" },
  { vehicle_id: "V002", seat_number: 2,  seat_status: "AVAILABLE" },
  { vehicle_id: "V003", seat_number: 10, seat_status: "BOOKED"    },
  { vehicle_id: "V003", seat_number: 11, seat_status: "AVAILABLE" }
];

// ── ROUTE ─────────────────────────────────────────────────────
let routes = [
  { route_id: "R001", source: "Bangalore",  destination: "Mumbai",    distance: 980  },
  { route_id: "R002", source: "Delhi",      destination: "Chennai",   distance: 2175 },
  { route_id: "R003", source: "Pune",       destination: "Hyderabad", distance: 560  },
  { route_id: "R004", source: "Kolkata",    destination: "Jaipur",    distance: 1480 }
];

// ── SCHEDULE ──────────────────────────────────────────────────
let schedules = [
  { schedule_id: "SC001", route_id: "R001", provider_id: "P001", departure_time: "08:00",  arrival_time: "20:00", journey_date: "2026-04-01", arrival_time_to_destination: "20:30" },
  { schedule_id: "SC002", route_id: "R002", provider_id: "P002", departure_time: "22:30",  arrival_time: "06:00", journey_date: "2026-04-02", arrival_time_to_destination: "06:15" },
  { schedule_id: "SC003", route_id: "R003", provider_id: "P003", departure_time: "06:00",  arrival_time: "14:00", journey_date: "2026-04-03", arrival_time_to_destination: "14:30" },
  { schedule_id: "SC004", route_id: "R004", provider_id: "P001", departure_time: "15:00",  arrival_time: "11:00", journey_date: "2026-04-04", arrival_time_to_destination: "11:30" }
];

// ── TRIP ──────────────────────────────────────────────────────
let trips = [
  { trip_id: "T001", schedule_id: "SC001", vehicle_id: "V001", trip_status: "SCHEDULED"   },
  { trip_id: "T002", schedule_id: "SC002", vehicle_id: "V003", trip_status: "IN_PROGRESS" },
  { trip_id: "T003", schedule_id: "SC003", vehicle_id: "V004", trip_status: "COMPLETED"   },
  { trip_id: "T004", schedule_id: "SC004", vehicle_id: "V002", trip_status: "DELAYED"     }
];

// ── OFFER ─────────────────────────────────────────────────────
let offers = [
  { offer_id: "O001", provider_id: "P001", offer_code: "SUMMER20",  discount_percentage: 20, start_date: "2026-03-01", end_date: "2026-06-30", status: "ACTIVE"   },
  { offer_id: "O002", provider_id: "P002", offer_code: "RAIL10",    discount_percentage: 10, start_date: "2026-01-01", end_date: "2026-03-31", status: "EXPIRED"  },
  { offer_id: "O003", provider_id: "P003", offer_code: "NEWUSER15", discount_percentage: 15, start_date: "2026-04-01", end_date: "2026-12-31", status: "INACTIVE" }
];

// ── IRCTC ─────────────────────────────────────────────────────
let irctcRecords = [
  { irctc_id: "IRCTC001", verification_status: "VERIFIED",     irctc_username: "aakash_s",  linked_phone_number: 9876543210 },
  { irctc_id: "IRCTC002", verification_status: "IN_PROGRESS",  irctc_username: "priya_n",   linked_phone_number: 9123456780 },
  { irctc_id: "IRCTC003", verification_status: "FAILED",       irctc_username: "rahul_v",   linked_phone_number: 9988776655 }
];

// ── BOOKING ───────────────────────────────────────────────────
let bookings = [
  { booking_id: "B001", customer_id: "C001", trip_id: "T001", offer_id: "O001", booking_date: "2026-03-20", booking_status: "CONFIRMED", irctc_id: null       },
  { booking_id: "B002", customer_id: "C002", trip_id: "T002", offer_id: null,   booking_date: "2026-03-21", booking_status: "PENDING",   irctc_id: "IRCTC002" },
  { booking_id: "B003", customer_id: "C003", trip_id: "T003", offer_id: "O002", booking_date: "2026-03-22", booking_status: "COMPLETED", irctc_id: "IRCTC003" },
  { booking_id: "B004", customer_id: "C004", trip_id: "T004", offer_id: null,   booking_date: "2026-03-23", booking_status: "CANCELLED", irctc_id: null       },
  { booking_id: "B005", customer_id: "C005", trip_id: "T001", offer_id: "O003", booking_date: "2026-03-24", booking_status: "CONFIRMED", irctc_id: null       }
];

// ── PAYMENT ───────────────────────────────────────────────────
let payments = [
  { payment_id: "PAY001", booking_id: "B001", amount: 1000.00, discount_amount: 200.00, payment_method: "UPI",          payment_status: "SUCCESS",  payment_date: "2026-03-20" },
  { payment_id: "PAY002", booking_id: "B002", amount: 800.50,  discount_amount: 0.00,   payment_method: "Net Banking",  payment_status: "PENDING",  payment_date: "2026-03-21" },
  { payment_id: "PAY003", booking_id: "B003", amount: 2500.00, discount_amount: 250.00, payment_method: "Credit Card",  payment_status: "SUCCESS",  payment_date: "2026-03-22" },
  { payment_id: "PAY004", booking_id: "B004", amount: 550.00,  discount_amount: 0.00,   payment_method: "Debit Card",   payment_status: "REFUNDED", payment_date: "2026-03-23" },
  { payment_id: "PAY005", booking_id: "B005", amount: 2720.00, discount_amount: 480.00, payment_method: "UPI",          payment_status: "SUCCESS",  payment_date: "2026-03-24" }
];

// ── CANCELLATION ──────────────────────────────────────────────
let cancellations = [
  { booking_id: "B004", cancel_date: "2026-03-24" }
];

// ── REFUND ────────────────────────────────────────────────────
let refunds = [
  { booking_id: "B004", admin_id: "A001", refund_amount: 385.00, refund_status: "COMPLETED", refund_date: "2026-03-25" }
];

// ── REVIEW ────────────────────────────────────────────────────
let reviews = [
  { review_id: "REV001", customer_id: "C001", rating: 5, comment: "Excellent service, very comfortable ride!", review_date: "2026-03-25" },
  { review_id: "REV002", customer_id: "C003", rating: 4, comment: "Good trip, minor delay at start.",          review_date: "2026-03-26" }
];

// ── SUPPORT REQUEST ───────────────────────────────────────────
let supportRequests = [
  { request_id: "REQ001", customer_id: "C004", supporter_id: "S001", description: "Need help with cancellation refund.",     status: "RESOLVED", created_date: "2026-03-24" },
  { request_id: "REQ002", customer_id: "C002", supporter_id: "S002", description: "Unable to complete payment for booking.",  status: "OPEN",     created_date: "2026-03-25" }
];

// ── REPORT ────────────────────────────────────────────────────
let reports = [
  { admin_id: "A001", report_date: "2026-03-25", total_booking: 5, total_revenue: 7570.50 },
  { admin_id: "A001", report_date: "2026-03-26", total_booking: 2, total_revenue: 2100.00 }
];
