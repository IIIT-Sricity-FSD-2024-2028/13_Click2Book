/** Read models for the admin dashboard, joined from the mock localStorage DB. */
import DB from '../../lib/db';

export function getUsers() {
  const customers = DB.customers.getAll().map((c) => ({ id: c.customer_id, status: c.status || 'active' }));
  const others = [...DB.admins.getAll(), ...DB.serviceProviders.getAll(), ...DB.customerSupport.getAll()].map(() => ({ status: 'active' }));
  return [...customers, ...others];
}

/** Newest-first bookings for the Recent Bookings table. */
export function getRecentBookings(limit = 10) {
  return DB.bookings
    .getAll()
    .slice()
    .reverse()
    .slice(0, limit)
    .map((b) => {
      const cust = DB.customers.getById(b.customer_id);
      let route = b._from && b._to ? `${b._from} → ${b._to}` : 'Unknown';
      const trip = DB.trips.getById(b.trip_id);
      if (trip.success) {
        const sched = DB.schedules.find((s) => s.schedule_id === trip.data.schedule_id)[0];
        const rt = sched && DB.routes.find((r) => r.route_id === sched.route_id)[0];
        if (rt) route = `${rt.source} → ${rt.destination}`;
      }
      const pays = DB.payments.find((p) => p.booking_id === b.booking_id);
      return {
        id: b.booking_id,
        customer: b._customerName || (cust.success ? cust.data.name : b.customer_id),
        route,
        date: b._journeyDate || b.booking_date,
        status: (b.booking_status || 'confirmed').toLowerCase(),
        amount: pays.length ? pays[0].amount : Number(b._total) || 0,
      };
    });
}

export function getProviders() {
  let providers = DB.serviceProviders.getAll().map((p) => ({
    id: p.provider_id,
    name: p.name,
    email: p.email,
    phone: p.phone_number || p.phone || '—',
    trips: DB.trips.find((t) => DB.schedules.find((s) => s.schedule_id === t.schedule_id)[0]?.provider_id === p.provider_id).length,
    status: 'active',
    joined: '2025-10-01',
  }));
  if (!providers.length) {
    try {
      providers = JSON.parse(localStorage.getItem('c2b_providers') || '[]').map((p) => ({
        id: p.provider_id || p.id || '—',
        name: p.name || '—',
        email: p.email || '—',
        phone: p.phone || '—',
        trips: 0,
        status: 'active',
        joined: p.joinedAt ? p.joinedAt.split('T')[0] : '—',
      }));
    } catch {
      /* ignore */
    }
  }
  return providers;
}

const STATUS = {
  confirmed: ['badge-confirmed', 'Confirmed'],
  pending: ['badge-pending', 'Pending'],
  cancelled: ['badge-cancelled', 'Cancelled'],
  refund_pending: ['badge-refund', 'Refund Pending'],
  completed: ['badge-confirmed', 'Completed'],
  active: ['badge-confirmed', 'Active'],
  inactive: ['badge-cancelled', 'Inactive'],
  approved: ['badge-confirmed', 'Approved'],
  rejected: ['badge-cancelled', 'Rejected'],
};

export function StatusBadge({ status }) {
  const [cls, label] = STATUS[status] || ['badge-pending', status];
  return <span className={`badge ${cls}`}>{label}</span>;
}
