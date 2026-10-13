/* ──────────────────────────────────────────────────────────
   Click2Book – Service Provider API Service  (api.js)
   Mirrors the approach used in the support agent services/api.js
   ────────────────────────────────────────────────────────── */

const getHost = () =>
  (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'localhost'
    : location.hostname;

const API_BASE = () => `http://${getHost()}:3000/api`;

async function spFetch(path, options = {}) {
  const res = await fetch(API_BASE() + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-role': 'PROVIDER',
      ...(options.headers || {}),
    },
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Request failed');
  return json.data;
}

/* ── Auth ── */
export async function loginProvider(email, password) {
  try {
    const data = await spFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.role !== 'PROVIDER') throw new Error('Not a provider account');
    return { success: true, data };
  } catch (err) {
    // Offline fallback
    const providers = [
      { id: 'P001', name: 'APSRTC Travels',  email: 'apsrtc@gmail.com',   password: 'Apsrtc@123'  },
      { id: 'P002', name: 'KPN Tours',        email: 'kpn@gmail.com',      password: 'Kpn@123'     },
      { id: 'P004', name: 'SRS Travels',      email: 'srs@gmail.com',      password: 'Srs@123'     },
      { id: 'P005', name: 'VRL Travels',      email: 'vrl@gmail.com',      password: 'Vrl@123'     },
      { id: 'P006', name: 'Parveen Travels',  email: 'parveen@gmail.com',  password: 'Parveen@123' },
      { id: 'P008', name: 'Jabbar Travels',   email: 'jabbar@gmail.com',   password: 'Jabbar@123'  },
      { id: 'P009', name: 'Suresh Travels',   email: 'suresh@gmail.com',   password: 'Suresh@123'  },
      { id: 'P010', name: 'Ganesh Travels',   email: 'ganesh@gmail.com',   password: 'Ganesh@123'  },
    ];
    const matched = providers.find(
      (p) => p.email.toLowerCase() === email.toLowerCase() && p.password === password
    );
    if (!matched) throw new Error('Invalid credentials. Contact admin if you need access.');
    return { success: true, data: { ...matched, role: 'PROVIDER' }, offline: true };
  }
}

/* ── Dashboard Stats ── */
export function getDashboardData() {
  const localSchedules = JSON.parse(localStorage.getItem('c2b_bus_schedules') || '[]');
  const localBookings  = JSON.parse(localStorage.getItem('c2b_bookings') || '[]');

  const DEFAULT_BUSES = [
    { id: 'T001', tripId: 'T001', route: 'SriCity → Chennai', from: 'SriCity', to: 'Chennai', dep: '06:00 → 09:30', name: 'Volvo A/C B12', booked: 32, total: 40, status: 'Active' },
    { id: 'T002', tripId: 'T002', route: 'Tada → Vizag',      from: 'Tada',    to: 'Vizag',    dep: '14:00 → 17:30', name: 'Scania AC',     booked: 28, total: 45, status: 'Active' },
    { id: 'T003', tripId: 'T003', route: 'Tada → Hyderabad',  from: 'Tada',    to: 'Hyderabad', dep: '09:00 → 12:30', name: 'Volvo A/C B12', booked: 40, total: 40, status: 'Full'   },
    { id: 'T004', tripId: 'T004', route: 'Pune → Mumbai',     from: 'Pune',    to: 'Mumbai',   dep: '20:00 → 23:30', name: 'Sleeper Bus',   booked: 15, total: 36, status: 'Active' },
  ];

  const buses = [...DEFAULT_BUSES];

  localSchedules.forEach((s) => {
    const total = s.totalSeats || 40;
    buses.unshift({
      id: s.id || s.tripId,
      tripId: s.tripId || s.id,
      from: s.from || 'Origin',
      to: s.to || 'Destination',
      route: s.from && s.to ? `${s.from} → ${s.to}` : 'Custom Route',
      dep: `${s.departureTime || '08:00'} → ${s.arrivalTime || '12:00'}`,
      name: s.busName || 'Express Bus',
      booked: 0,
      total,
      status: 'Active',
      fare: s.fare || 500,
      revenue: 0,
    });
  });

  // Apply unique bookings
  const seenIds = new Set();
  localBookings.forEach((b) => {
    if (!b?.bookingId || seenIds.has(b.bookingId) || b.status === 'CANCELLED') return;
    seenIds.add(b.bookingId);
    const seatCount = Array.isArray(b.seats)
      ? b.seats.length
      : typeof b.seats === 'string'
      ? b.seats.split(',').length
      : 1;
    const matchBus = buses.find(
      (bus) =>
        (b.tripId && (bus.id === b.tripId || bus.tripId === b.tripId)) ||
        (b.busName && bus.name && bus.name.toLowerCase() === b.busName.toLowerCase()) ||
        (b.from && b.to && bus.from?.toLowerCase() === b.from.toLowerCase() && bus.to?.toLowerCase() === b.to.toLowerCase())
    );
    if (matchBus) {
      matchBus.booked = (matchBus.booked || 0) + seatCount;
      matchBus.revenue = (matchBus.revenue || 0) + (b.subtotal || matchBus.fare * seatCount || 500);
      matchBus.status = matchBus.booked >= matchBus.total ? 'Full' : 'Active';
    }
  });

  const totalPax = buses.reduce((acc, b) => acc + (b.booked || 0), 0);
  let totalRev = buses.reduce((acc, b) => acc + Math.round((b.revenue || 0) * 0.9), 0);
  if (totalRev === 0) totalRev = 18450;

  return { buses, totalPax, totalRev };
}

/* ── Schedules ── */
export function getLocalSchedules() {
  try {
    const raw = JSON.parse(localStorage.getItem('c2b_bus_schedules') || '[]');
    return raw.map((s, i) => ({
      tripId:         s.id || `LOCAL-${i + 1}`,
      source:         s.from || '—',
      destination:    s.to   || '—',
      via:            s.via  || '',
      departureTime:  s.departureTime || '—',
      arrivalTime:    s.arrivalTime   || '—',
      journeyDate:    s.journeyDate || (s.addedAt ? s.addedAt.split('T')[0] : '—'),
      busName:        s.busName || '—',
      vehicleType:    s.busType || '—',
      availableSeats: s.availableSeats != null ? s.availableSeats : Math.max(0, (s.totalSeats || 0) - (s.bookedSeats || 0)),
      totalSeats:     s.totalSeats || 0,
      fare:           s.fare || 0,
      status:         'SCHEDULED',
      isNew:          true,
    }));
  } catch (e) { return []; }
}

export async function fetchSchedulesFromAPI() {
  const localTrips = getLocalSchedules();
  try {
    const apiData = await spFetch('/trips', {});
    if (apiData?.length && (apiData[0]?.source || apiData[0]?.route)) {
      return { data: [...apiData, ...localTrips], isLive: true };
    }
    return { data: localTrips, isLive: false };
  } catch {
    return { data: localTrips, isLive: false };
  }
}

export async function saveSchedule(payload) {
  const providerId = sessionStorage.getItem('c2b_loggedInId') || 'P001';
  const { journeyDate, from, to, via, dep, arr, busName, busType, seats, fare } = payload;

  try {
    // Step 1 – Route
    const routeData = await spFetch('/routes', {
      method: 'POST',
      body: JSON.stringify({ source: from, destination: to, distance: 300, via }),
    });
    const routeId = routeData?.routeId ?? null;

    // Step 2 – Vehicle
    const vehList = await spFetch('/vehicles', {});
    const existingVeh = (vehList || []).find((v) => v.busName === busName || v.vehicleNumber === busName);
    let vehicleId;
    if (existingVeh) {
      vehicleId = existingVeh.vehicleId;
    } else {
      const vehData = await spFetch('/vehicles', {
        method: 'POST',
        body: JSON.stringify({
          providerId,
          vehicleNumber: busName.replace(/\s+/g, '').toUpperCase().slice(0, 10),
          vehicleType: busType,
          totalSeats: seats,
          remainingSeats: seats,
          busName,
          amenities: [],
          rating: 4.0,
          boardingPoint: from,
          droppingPoint: to,
        }),
      });
      vehicleId = vehData?.vehicleId ?? null;
    }

    // Step 3 – Schedule
    const schData = await spFetch('/schedules', {
      method: 'POST',
      body: JSON.stringify({
        routeId, providerId,
        departureTime: dep, arrivalTime: arr, journeyDate,
        arrivalTimeToDestination: arr, fare,
        ...(via ? { via } : {}),
      }),
    });
    const scheduleId = schData?.scheduleId ?? null;

    // Step 4 – Trip
    const tripData = await spFetch('/trips', {
      method: 'POST',
      body: JSON.stringify({ vehicleId, scheduleId }),
    });
    const tripId = tripData?.tripId || `TRIP_${Date.now()}`;

    _saveToLocalStorage({ tripId, vehicleId, scheduleId, providerId, ...payload });
    return { tripId, isLive: true };
  } catch {
    const tripId = `SCHED_${Date.now()}`;
    _saveToLocalStorage({ tripId, providerId, ...payload, vehicleId: null, scheduleId: null });
    return { tripId, isLive: false };
  }
}

function _saveToLocalStorage({ tripId, vehicleId, scheduleId, providerId, journeyDate, from, to, via, dep, arr, busName, busType, seats, fare }) {
  const schedules = JSON.parse(localStorage.getItem('c2b_bus_schedules') || '[]');
  schedules.push({
    id: tripId, tripId, vehicleId, scheduleId, providerId,
    from, to, via,
    departureTime: dep, arrivalTime: arr, journeyDate,
    busName, busType,
    totalSeats: seats, availableSeats: seats, bookedSeats: 0,
    fare, revenue: 0, operatorPayout: 0,
    addedAt: new Date().toISOString(),
  });
  localStorage.setItem('c2b_bus_schedules', JSON.stringify(schedules));
}

/* ── Seat Management ── */
export function getSeatData() {
  const localSchedules = JSON.parse(localStorage.getItem('c2b_bus_schedules') || '[]');
  const localBookings  = JSON.parse(localStorage.getItem('c2b_bookings') || '[]');

  let buses = localSchedules.map((s, idx) => ({
    id:            s.id || s.tripId || `BUS_${idx}`,
    tripId:        s.tripId || s.id || `BUS_${idx}`,
    route:         s.from && s.to ? `${s.from} → ${s.to}` : 'Custom Route',
    from:          s.from || 'Origin',
    to:            s.to   || 'Destination',
    time:          `${s.departureTime || '08:00'} → ${s.arrivalTime || '12:00'}`,
    name:          s.busName || 'Express Bus',
    type:          s.busType || 'AC',
    total:         s.totalSeats || 40,
    bookedSeatList: [],
    passengerMap:   {}, // seatId → { name, phone, bookingId, bookingDate, email }
  }));

  if (!buses.length) {
    buses = [
      { id: 'T001', tripId: 'T001', route: 'SriCity → Chennai', from: 'SriCity', to: 'Chennai', time: '06:00 → 09:30', name: 'Volvo A/C B12', type: 'AC', total: 40, bookedSeatList: [], passengerMap: {} },
      { id: 'T002', tripId: 'T002', route: 'Tada → Vizag',      from: 'Tada',    to: 'Vizag',    time: '14:00 → 17:30', name: 'Scania AC',     type: 'AC', total: 45, bookedSeatList: [], passengerMap: {} },
      { id: 'T003', tripId: 'T003', route: 'Pune → Mumbai',     from: 'Pune',    to: 'Mumbai',   time: '20:00 → 23:30', name: 'Sleeper Bus',   type: 'Sleeper', total: 36, bookedSeatList: [], passengerMap: {} },
    ];
  }

  const seenIds = new Set();
  localBookings.forEach((b) => {
    if (!b?.bookingId || seenIds.has(b.bookingId) || b.status === 'CANCELLED') return;
    seenIds.add(b.bookingId);
    const seatArr = Array.isArray(b.seats)
      ? b.seats
      : typeof b.seats === 'string'
      ? b.seats.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    const match = buses.find(
      (bus) =>
        (b.tripId && (bus.id === b.tripId || bus.tripId === b.tripId)) ||
        (b.busName && bus.name?.toLowerCase() === b.busName.toLowerCase()) ||
        (b.from && b.to && bus.from?.toLowerCase() === b.from.toLowerCase() && bus.to?.toLowerCase() === b.to.toLowerCase())
    );
    if (match) {
      match.bookedSeatList.push(...seatArr);
      // Build passenger map keyed by seatId
      const passengerInfo = {
        name:        b.passengerName || b.name || b.userName || b.customerName || 'Passenger',
        phone:       b.phone || b.mobile || b.contactNumber || b.passengerPhone || '—',
        email:       b.email || b.passengerEmail || '—',
        bookingId:   b.bookingId,
        bookingDate: b.bookingDate || b.createdAt || b.bookedAt || b.addedAt || '—',
        seats:       seatArr,
        fare:        b.subtotal || b.fare || b.amount || '—',
        status:      b.status || 'CONFIRMED',
      };
      seatArr.forEach((seatId) => {
        match.passengerMap[seatId] = passengerInfo;
      });
    }
  });

  return buses;
}

/* ── Confirm Trips / Live Trips ── */
export async function fetchLiveTrips(providerId) {
  try {
    const schedules = await spFetch(`/schedules?providerId=${encodeURIComponent(providerId)}`);
    const scheduleIds = (schedules || []).map((s) => s.scheduleId);
    const allTrips = await spFetch('/trips');
    let myTrips = (allTrips || []).filter((t) => scheduleIds.includes(t.scheduleId));
    if (!myTrips.length) myTrips = allTrips || [];

    const detailed = await Promise.all(
      myTrips.map(async (trip) => {
        try {
          return await spFetch(`/trips/${trip.tripId}`);
        } catch { return { trip, schedule: null, vehicle: null }; }
      })
    );
    return { data: detailed, isLive: true };
  } catch {
    const localStatuses = JSON.parse(localStorage.getItem('c2b_trip_statuses') || '{}');
    const mockTrips = [
      { trip: { tripId: 'T001', tripStatus: localStatuses['T001'] || 'SCHEDULED', vehicleId: 'MH01AB1234' }, schedule: { journeyDate: new Date().toISOString().split('T')[0], departureTime: '06:00', via: 'Expressway' }, route: { source: 'SriCity', destination: 'Chennai' }, vehicle: { vehicleNumber: 'MH01AB1234' } },
      { trip: { tripId: 'T002', tripStatus: localStatuses['T002'] || 'SCHEDULED', vehicleId: 'MH02CD5678' }, schedule: { journeyDate: new Date().toISOString().split('T')[0], departureTime: '20:00', via: 'Lonavala' }, route: { source: 'Pune', destination: 'Mumbai' }, vehicle: { vehicleNumber: 'MH02CD5678' } },
    ];
    return { data: mockTrips, isLive: false };
  }
}

export async function startTrip(tripId) {
  try { await spFetch(`/trips/${tripId}/confirm`, { method: 'PATCH' }); } catch {}
  const statuses = JSON.parse(localStorage.getItem('c2b_trip_statuses') || '{}');
  statuses[tripId] = 'IN_PROGRESS';
  localStorage.setItem('c2b_trip_statuses', JSON.stringify(statuses));
}

export async function endTrip(tripId) {
  try {
    await spFetch(`/trips/${tripId}/complete`, { method: 'PATCH' });
  } catch {
    try { await spFetch(`/trips/${tripId}/status`, { method: 'PATCH', body: JSON.stringify({ tripStatus: 'COMPLETED' }) }); } catch {}
  }
  const statuses = JSON.parse(localStorage.getItem('c2b_trip_statuses') || '{}');
  statuses[tripId] = 'COMPLETED';
  localStorage.setItem('c2b_trip_statuses', JSON.stringify(statuses));
}

export async function updateLocation(tripId, lat, lng, status, nextStop, providerId) {
  await spFetch(`/tracking/${tripId}`, {
    method: 'PATCH',
    body: JSON.stringify({ providerId, lat, lng, status, ...(nextStop ? { nextStop } : {}) }),
  });
}

/* ── Lost & Found ── */
export async function fetchLostFound(providerId) {
  try {
    const data = await spFetch(`/lost-found/provider/${encodeURIComponent(providerId)}`);
    return { data, isLive: true };
  } catch {
    return { data: [], isLive: false };
  }
}

export async function updateLostFoundStatus(itemId, status, foundNote) {
  await spFetch(`/lost-found/${itemId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, ...(foundNote ? { foundNote } : {}) }),
  });
}

/* ── Revenue ── */
export async function fetchRevenue(providerId) {
  try {
    const data = await spFetch(`/revenue?providerId=${encodeURIComponent(providerId)}`);
    return { data, isLive: true };
  } catch {
    // Fallback: compute from localStorage bookings
    const localBookings = JSON.parse(localStorage.getItem('c2b_bookings') || '[]');
    const localSchedules = JSON.parse(localStorage.getItem('c2b_bus_schedules') || '[]');
    return { data: null, localBookings, localSchedules, isLive: false };
  }
}

/* ── Notifications (static for now like original) ── */
export function getNotifications() {
  return [
    { id: 1, type: 'info', title: 'New Booking Received', message: '3 new seat bookings on SriCity → Chennai route (06:00 AM trip).', time: '5 mins ago', read: false },
    { id: 2, type: 'warn', title: 'Seat Capacity Alert', message: 'Tada → Hyderabad (09:00 AM) is now fully booked. 40/40 seats taken.', time: '30 mins ago', read: false },
    { id: 3, type: 'success', title: 'Trip Confirmed', message: 'Pune → Mumbai (20:00) trip has been confirmed by the system.', time: '1 hour ago', read: false },
  ];
}
