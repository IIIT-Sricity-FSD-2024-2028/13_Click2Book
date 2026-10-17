const API_HOST = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
  ? 'localhost'
  : location.hostname;

export const API_BASE = `http://${API_HOST}:3000/api`;

export async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    ...(String(options.method || 'GET').toUpperCase() === 'GET' && options.cache === undefined ? { cache: 'no-store' } : {}),
    headers: { 'Content-Type': 'application/json', 'x-role': 'ADMIN', ...options.headers },
  });
  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.message || `Request failed (${response.status})`);
  }
  return json.data;
}

export async function loadAdminDashboardData() {
  const [bookings, payments, refunds, customers, trips, schedules, routes, providers, supportStaff] = await Promise.all([
    apiFetch('/bookings'),
    apiFetch('/payments'),
    apiFetch('/refunds'),
    apiFetch('/customers'),
    apiFetch('/trips'),
    apiFetch('/schedules'),
    apiFetch('/routes'),
    apiFetch('/providers'),
    apiFetch('/support-staff'),
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
  const durationByRoute = new Map();

  trips.forEach((trip) => {
    const schedule = scheduleById.get(trip.scheduleId);
    const routeId = schedule?.routeId;
    if (activeTripStatuses.has(String(trip.tripStatus || '').toUpperCase()) && routeId) {
      if (!busesByRoute.has(routeId)) busesByRoute.set(routeId, new Set());
      busesByRoute.get(routeId).add(trip.vehicleId);
    }
    if (routeId && trip.duration && !durationByRoute.has(routeId)) {
      durationByRoute.set(routeId, trip.duration);
    }
  });

  schedules.forEach((sch) => {
    if (sch.routeId && sch.departureTime && sch.arrivalTime && !durationByRoute.has(sch.routeId)) {
      const depParts = sch.departureTime.split(':').map(Number);
      const arrParts = sch.arrivalTime.split(':').map(Number);
      if (!isNaN(depParts[0]) && !isNaN(arrParts[0])) {
        let diffMins = (arrParts[0] * 60 + (arrParts[1] || 0)) - (depParts[0] * 60 + (depParts[1] || 0));
        if (diffMins <= 0) diffMins += 24 * 60;
        const h = Math.floor(diffMins / 60);
        const m = diffMins % 60;
        durationByRoute.set(sch.routeId, `${h}h ${String(m).padStart(2, '0')}m`);
      }
    }
  });

  const dashboardRoutes = routes.map((route) => {
    let dur = durationByRoute.get(route.routeId);
    if (!dur && route.distance) {
      const estHours = Math.floor(route.distance / 60);
      const estMins = Math.round((route.distance % 60) * 0.8);
      dur = `${estHours}h ${String(estMins).padStart(2, '0')}m`;
    }
    return {
      ...route,
      duration: dur || '—',
      activeBuses: busesByRoute.get(route.routeId)?.size || 0,
    };
  });

  const localBookings = (() => {
    try {
      return JSON.parse(localStorage.getItem('c2b_bookings') || '[]');
    } catch (_) {
      return [];
    }
  })();
  const localByBookingId = new Map(localBookings.map((b) => [b.bookingId || b.booking_id, b]));

  const dashboardBookings = bookings.map((booking) => {
    const trip = tripById.get(booking.tripId);
    const schedule = scheduleById.get(trip?.scheduleId);
    const route = routeById.get(schedule?.routeId);
    const payment = paymentByBooking.get(booking.bookingId);
    const customer = customerById.get(booking.customerId);
    const local = localByBookingId.get(booking.bookingId);

    const routeStr = local?.from && local?.to
      ? `${local.from} → ${local.to}`
      : route
      ? `${route.source} → ${route.destination}`
      : trip?.route || (trip?.source && trip?.destination ? `${trip.source} → ${trip.destination}` : 'Unknown Route');

    const customerName = local?.customerName || local?.passengerName || customer?.name || booking.customerId;
    const amountVal = Number(payment?.amount || local?.total || local?.amount || schedule?.fare || trip?.fare || 0);

    return {
      id: booking.bookingId,
      customer: customerName,
      route: routeStr,
      date: booking.bookingDate || local?.journeyDate || local?.date,
      seats: local?.seats || (Array.isArray(local?.seat_list) ? local.seat_list.join(', ') : booking.seatNumber ?? '—'),
      status: String(booking.bookingStatus || local?.status || 'pending').toLowerCase(),
      amount: amountVal,
      paymentStatus: payment?.paymentStatus || (booking.bookingStatus === 'CONFIRMED' ? 'SUCCESS' : 'PENDING'),
      paymentId: payment?.paymentId || (local ? `PAY-${booking.bookingId}` : undefined),
      paymentDate: payment?.paymentDate || booking.bookingDate,
    };
  }).reverse();

  const refundBookingIds = new Set(refunds.map((refund) => refund.bookingId));
  const dashboardRefunds = [
    ...refunds.map((refund) => {
      const booking = bookings.find((item) => item.bookingId === refund.bookingId);
      const customer = booking && customerById.get(booking.customerId);
      const local = localByBookingId.get(refund.bookingId);
      const status = String(refund.refundStatus || 'REQUESTED').toUpperCase();
      return {
        id: `RF-${refund.bookingId}`,
        bookingId: refund.bookingId,
        customer: local?.customerName || customer?.name || booking?.customerId || refund.bookingId,
        amount: Number(refund.refundAmount || 0),
        reason: refund.cancellationReason || refund.reviewReason || 'Customer requested cancellation',
        date: refund.refundDate || refund.createdAt,
        completedDate: refund.completedDate || refund.refundDate,
        status: ({ REQUESTED: 'pending', PROCESSING: 'processing', COMPLETED: 'refunded', APPROVED: 'approved', REJECTED: 'rejected' })[status] || status.toLowerCase(),
      };
    }),
    ...payments
      .filter((payment) => payment.paymentStatus === 'REFUNDED' && !refundBookingIds.has(payment.bookingId))
      .map((payment) => {
        const booking = bookings.find((item) => item.bookingId === payment.bookingId);
        const customer = booking && customerById.get(booking.customerId);
        const local = localByBookingId.get(payment.bookingId);
        return {
          id: `RF-${payment.bookingId}`,
          bookingId: payment.bookingId,
          customer: local?.customerName || customer?.name || booking?.customerId || payment.bookingId,
          amount: Number(payment.amount || 0),
          reason: 'Booking cancelled & payment refunded',
          date: payment.paymentDate,
          status: 'refunded',
        };
      }),
  ].reverse();

  const dashboardUsers = [
    ...customers.map((user) => ({ id: user.customerId, name: user.name, email: user.email, role: 'customer', phone: user.phoneNumber || '—', status: String(user.status || 'ACTIVE').toLowerCase(), joined: user.createdAt || '—', canToggle: true })),
    ...providers.map((user) => ({ id: user.providerId, name: user.name, email: user.email, role: 'service_provider', phone: user.phoneNumber || '—', status: String(user.status || (user.approved ? 'ACTIVE' : 'INACTIVE')).toLowerCase(), joined: user.createdAt || '—', canToggle: true })),
    ...supportStaff.map((user) => ({ id: user.supporterId, name: user.name, email: user.email, role: 'support', phone: user.phoneNumber || '—', status: String(user.status || 'ACTIVE').toLowerCase(), joined: user.createdAt || '—', canToggle: true })),
  ];

  const today = new Date();
  const revenueByDay = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (6 - index));
    const date = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    const paymentsForDay = payments
      .filter((payment) => String(payment.paymentDate || '').slice(0, 10) === date && (payment.paymentStatus === 'SUCCESS' || payment.paymentStatus === 'REFUNDED'))
      .reduce((total, payment) => total + Number(payment.amount || 0), 0);
    const refundsForDay = refunds
      .filter((refund) => String(refund.completedDate || refund.refundDate || '').slice(0, 10) === date && refund.refundStatus === 'COMPLETED')
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
        .filter((refund) => refund.refundStatus === 'COMPLETED')
        .reduce((total, refund) => total + Number(refund.refundAmount || 0), 0),
    ),
    activeBuses: activeVehicleIds.size,
  };
}

export async function loadAdminRevenueData() {
  const fetchRevenueSource = (path) => apiFetch(path, { cache: 'no-store', signal: AbortSignal.timeout(10000) });
  const [bookings, payments, refunds] = await Promise.all([
    fetchRevenueSource('/bookings'),
    fetchRevenueSource('/payments'),
    fetchRevenueSource('/refunds'),
  ]);
  const customers = await fetchRevenueSource('/customers').catch(() => []);
  const customerById = new Map(customers.map((customer) => [customer.customerId, customer]));
  const paymentByBooking = new Map(payments.map((payment) => [payment.bookingId, payment]));
  const refundBookingIds = new Set(refunds.map((refund) => refund.bookingId));
  const paidPayments = payments.filter((payment) => ['SUCCESS', 'REFUNDED'].includes(String(payment.paymentStatus).toUpperCase()));

  const localBookings = (() => {
    try {
      return JSON.parse(localStorage.getItem('c2b_bookings') || '[]');
    } catch (_) {
      return [];
    }
  })();
  const localByBookingId = new Map(localBookings.map((b) => [b.bookingId || b.booking_id, b]));

  const completedRefunds = [
    ...refunds.filter((refund) => String(refund.refundStatus).toUpperCase() === 'COMPLETED').map((refund) => ({
      id: `RF-${refund.bookingId}`,
      bookingId: refund.bookingId,
      customer: localByBookingId.get(refund.bookingId)?.customerName || customerById.get(bookings.find((booking) => booking.bookingId === refund.bookingId)?.customerId)?.name || refund.bookingId,
      amount: Number(refund.refundAmount || 0),
      date: refund.refundDate || refund.createdAt,
      completedDate: refund.completedDate || refund.refundDate,
      status: 'refunded',
    })),
    ...payments.filter((payment) => payment.paymentStatus === 'REFUNDED' && !refundBookingIds.has(payment.bookingId)).map((payment) => ({
      id: `RF-${payment.bookingId}`,
      bookingId: payment.bookingId,
      customer: localByBookingId.get(payment.bookingId)?.customerName || customerById.get(bookings.find((booking) => booking.bookingId === payment.bookingId)?.customerId)?.name || payment.bookingId,
      amount: Number(payment.amount || 0),
      date: payment.paymentDate,
      status: 'refunded',
    })),
  ];
  const revenueBookings = bookings.map((booking) => {
    const payment = paymentByBooking.get(booking.bookingId);
    const customer = customerById.get(booking.customerId);
    const local = localByBookingId.get(booking.bookingId);
    return {
      id: booking.bookingId,
      customer: local?.customerName || local?.passengerName || customer?.name || booking.customerId,
      date: booking.bookingDate || local?.journeyDate || local?.date,
      amount: Number(payment?.amount || local?.total || local?.amount || 0),
      paymentStatus: payment?.paymentStatus || (booking.bookingStatus === 'CONFIRMED' ? 'SUCCESS' : 'PENDING'),
      paymentId: payment?.paymentId || (local ? `PAY-${booking.bookingId}` : undefined),
      paymentDate: payment?.paymentDate || booking.bookingDate,
    };
  });
  const gross = paidPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const refunded = completedRefunds.reduce((sum, refund) => sum + Number(refund.amount || 0), 0);
  return {
    bookings: revenueBookings,
    refunds: completedRefunds,
    grossRevenue: gross,
    totalRefunds: refunded,
    totalRevenue: Math.max(0, gross - refunded),
  };
}
