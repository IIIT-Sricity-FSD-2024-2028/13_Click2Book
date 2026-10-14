// Read models the dashboard builds from the shared localStorage store.
import { DB } from '../data/store.js';

export { DB };

export function getRows(table) {
  return DB[table]?.getAll() || [];
}

export function getBookings() {
  return DB.bookings.getAll().map((booking) => {
    const customer = DB.customers.getById(booking.customer_id);
    const trip = DB.trips.getById(booking.trip_id);
    let route = booking._from && booking._to ? `${booking._from} → ${booking._to}` : 'Unknown Route';
    if (trip.success) {
      const schedules = DB.schedules.find((schedule) => schedule.schedule_id === trip.data.schedule_id);
      const routes = DB.routes.find((item) => item.route_id === schedules[0]?.route_id);
      if (routes[0]) route = `${routes[0].source} → ${routes[0].destination}`;
    }
    const payments = DB.payments.find((payment) => payment.booking_id === booking.booking_id);
    return {
      id: booking.booking_id,
      customer: customer?.success ? customer.data.name : booking._customerName || booking.customer_id,
      route,
      date: booking.booking_date || booking._journeyDate,
      seats: booking._seats || '—',
      status: String(booking.booking_status || 'confirmed').toLowerCase(),
      amount: payments[0]?.amount ?? Number(booking._total) ?? 0,
    };
  }).reverse();
}

export function getUsers() {
  return [
    ...DB.customers.getAll().map((user) => ({ id: user.customer_id, name: user.name, email: user.email, role: 'customer', phone: user.phone_number || '—', status: user.status || 'active', joined: '2026-01-01' })),
    ...DB.admins.getAll().map((user) => ({ id: user.admin_id, name: user.name, email: user.email, role: 'admin', phone: '—', status: 'active', joined: '2025-09-01' })),
    ...DB.serviceProviders.getAll().map((user) => ({ id: user.provider_id, name: user.name, email: user.email, role: 'service_provider', phone: '—', status: 'active', joined: '2025-10-01' })),
    ...DB.customerSupport.getAll().map((user) => ({ id: user.supporter_id, name: user.name, email: user.email, role: 'support', phone: '—', status: 'active', joined: '2025-11-01' })),
  ];
}

export function getRefunds() {
  return DB.refunds.getAll().map((refund) => {
    const booking = DB.bookings.getById(refund.booking_id);
    const customer = booking.success ? DB.customers.getById(booking.data.customer_id) : null;
    return {
      id: `RF-${refund.booking_id}`,
      bookingId: refund.booking_id,
      customer: customer?.success ? customer.data.name : refund.booking_id,
      amount: refund.refund_amount || 0,
      reason: 'Customer requested cancellation',
      date: refund.refund_date,
      status: String(refund.refund_status || 'pending').toLowerCase(),
    };
  });
}
