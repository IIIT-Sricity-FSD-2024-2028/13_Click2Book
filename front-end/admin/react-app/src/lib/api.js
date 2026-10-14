const API_HOST = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
  ? 'localhost'
  : location.hostname;

export const API_BASE = `http://${API_HOST}:3000/api`;

export async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', 'x-role': 'ADMIN', ...options.headers },
  });
  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.message || `Request failed (${response.status})`);
  }
  return json.data;
}

export async function loadAdminDashboardData() {
  const [bookings, payments, refunds, customers, trips, schedules, routes, providers] = await Promise.all([
    apiFetch('/bookings'),
    apiFetch('/payments'),
    apiFetch('/refunds'),
    apiFetch('/customers'),
    apiFetch('/trips'),
    apiFetch('/schedules'),
    apiFetch('/routes'),
    apiFetch('/providers'),
  ]);

  const paymentByBooking = new Map(payments.map((payment) => [payment.bookingId, payment]));
  const customerById = new Map(customers.map((customer) => [customer.customerId, customer]));
  const routeById = new Map(routes.map((route) => [route.routeId, route]));
  const scheduleById = new Map(schedules.map((schedule) => [schedule.scheduleId, schedule]));
  const tripById = new Map(trips.map((trip) => [trip.tripId, trip]));
  const activeTripStatuses = new Set(['SCHEDULED', 'IN_PROGRESS']);
  const activeVehicleIds = new Set(trips
    .filter((trip) => activeTripStatuses.has(String(trip.tripStatus || '').toUpperCase()))
    .map((trip) => trip.vehicleId));
  const busesByRoute = new Map();
  trips.forEach((trip) => {
    if (!activeTripStatuses.has(String(trip.tripStatus || '').toUpperCase())) return;
    const routeId = scheduleById.get(trip.scheduleId)?.routeId;
    if (!routeId) return;
    if (!busesByRoute.has(routeId)) busesByRoute.set(routeId, new Set());
    busesByRoute.get(routeId).add(trip.vehicleId);
  });
  const dashboardRoutes = routes.map((route) => ({
    ...route,
    activeBuses: busesByRoute.get(route.routeId)?.size || 0,
  }));

  const dashboardBookings = bookings.map((booking) => {
    const trip = tripById.get(booking.tripId);
    const schedule = scheduleById.get(trip?.scheduleId);
    const route = routeById.get(schedule?.routeId);
    const payment = paymentByBooking.get(booking.bookingId);
    const customer = customerById.get(booking.customerId);
    return {
      id: booking.bookingId,
      customer: customer?.name || booking.customerId,
      route: route ? `${route.source} → ${route.destination}` : 'Unknown Route',
      date: booking.bookingDate,
      seats: booking.seatNumber ?? '—',
      status: String(booking.bookingStatus || 'pending').toLowerCase(),
      amount: Number(payment?.amount || 0),
      paymentStatus: payment?.paymentStatus || 'PENDING',
    };
  }).reverse();

  const dashboardRefunds = refunds.map((refund) => {
    const booking = bookings.find((item) => item.bookingId === refund.bookingId);
    const customer = booking && customerById.get(booking.customerId);
    const status = String(refund.refundStatus || 'REQUESTED').toUpperCase();
    return {
      id: `RF-${refund.bookingId}`,
      bookingId: refund.bookingId,
      customer: customer?.name || booking?.customerId || refund.bookingId,
      amount: Number(refund.refundAmount || 0),
      reason: refund.reviewReason || 'Exceptional refund request requires review.',
      date: refund.refundDate,
      status: ({ REQUESTED: 'pending', PROCESSING: 'processing', COMPLETED: 'approved', REJECTED: 'rejected' })[status] || status.toLowerCase(),
    };
  }).reverse();

  const dashboardUsers = [
    ...customers.map((user) => ({ id: user.customerId, name: user.name, email: user.email, role: 'customer', phone: user.phoneNumber || '—', status: String(user.status || 'ACTIVE').toLowerCase(), joined: user.createdAt || '—', canToggle: true })),
    ...providers.map((user) => ({ id: user.providerId, name: user.name, email: user.email, role: 'service_provider', phone: user.phoneNumber || '—', status: user.approved === false ? 'inactive' : 'active', joined: user.createdAt || '—', canToggle: false })),
  ];

  const today = new Date();
  const revenueByDay = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (6 - index));
    const date = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    const paymentsForDay = payments
      .filter((payment) => payment.paymentDate === date && (payment.paymentStatus === 'SUCCESS' || payment.paymentStatus === 'REFUNDED'))
      .reduce((total, payment) => total + Number(payment.amount || 0), 0);
    const refundsForDay = refunds
      .filter((refund) => refund.refundDate === date && (refund.refundStatus === 'PROCESSING' || refund.refundStatus === 'COMPLETED'))
      .reduce((total, refund) => total + Number(refund.refundAmount || 0), 0);
    return {
      date,
      label: day.toLocaleDateString(undefined, { weekday: 'short' }),
      amount: Math.max(0, paymentsForDay - refundsForDay),
    };
  });

  return {
    bookings: dashboardBookings,
    refunds: dashboardRefunds,
    users: dashboardUsers,
    routes: dashboardRoutes,
    revenueByDay,
    totalRevenue: Math.max(
      0,
      payments
        .filter((payment) => payment.paymentStatus === 'SUCCESS' || payment.paymentStatus === 'REFUNDED')
        .reduce((total, payment) => total + Number(payment.amount || 0), 0)
      - refunds
        .filter((refund) => refund.refundStatus === 'PROCESSING' || refund.refundStatus === 'COMPLETED')
        .reduce((total, refund) => total + Number(refund.refundAmount || 0), 0),
    ),
    activeBuses: activeVehicleIds.size,
  };
}
