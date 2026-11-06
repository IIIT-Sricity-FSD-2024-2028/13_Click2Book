/* ──────────────────────────────────────────────────────────
   Click2Book – Service Provider API Service  (api.js)
   Mirrors the approach used in the support agent services/api.js
   ────────────────────────────────────────────────────────── */

import { liveSync } from './liveSync';

const getHost = () =>
  (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'localhost'
    : location.hostname;

const API_BASE = () => `http://${getHost()}:3000/api`;

async function spFetch(path, options = {}) {
  const url = path.startsWith('/api') ? path : `/api${path}`;
  let res;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-role': 'PROVIDER',
        ...(options.headers || {}),
      },
    });
  } catch {
    res = await fetch(`http://${getHost()}:3000/api${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-role': 'PROVIDER',
        ...(options.headers || {}),
      },
    });
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) throw new Error(json.message || `Request failed (${res.status})`);
  return json.data !== undefined ? json.data : json;
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
  const statuses       = JSON.parse(localStorage.getItem('c2b_trip_statuses') || '{}');

  const DEFAULT_BUSES = [
    { id: 'T001', tripId: 'T001', route: 'SriCity → Chennai', from: 'SriCity', to: 'Chennai', dep: '06:00 → 09:30', name: 'Volvo A/C B12', booked: 32, total: 40, status: statuses['T001'] || 'Active' },
    { id: 'T002', tripId: 'T002', route: 'Tada → Vizag',      from: 'Tada',    to: 'Vizag',    dep: '14:00 → 17:30', name: 'Scania AC',     booked: 28, total: 45, status: statuses['T002'] || 'Active' },
    { id: 'T003', tripId: 'T003', route: 'Tada → Hyderabad',  from: 'Tada',    to: 'Hyderabad', dep: '09:00 → 12:30', name: 'Volvo A/C B12', booked: 40, total: 40, status: statuses['T003'] || 'Full'   },
    { id: 'T004', tripId: 'T004', route: 'Pune → Mumbai',     from: 'Pune',    to: 'Mumbai',   dep: '20:00 → 23:30', name: 'Sleeper Bus',   booked: 15, total: 36, status: statuses['T004'] || 'Active' },
  ];

  const buses = [...DEFAULT_BUSES];

  localSchedules.forEach((s) => {
    const tid = s.id || s.tripId;
    const total = s.totalSeats || 40;
    const tripStatus = statuses[tid] || s.status || 'Active';
    // If bus already exists in DEFAULT_BUSES, update it
    const existingIdx = buses.findIndex(b => b.id === tid || b.tripId === tid);
    const busItem = {
      id: tid,
      tripId: tid,
      from: s.from || 'Origin',
      to: s.to || 'Destination',
      route: s.from && s.to ? `${s.from} → ${s.to}` : 'Custom Route',
      dep: `${s.departureTime || '08:00'} → ${s.arrivalTime || '12:00'}`,
      name: s.busName || 'Express Bus',
      booked: s.bookedSeats || 0,
      total,
      status: tripStatus === 'IN_PROGRESS' ? 'In Progress' : (s.bookedSeats >= total ? 'Full' : 'Active'),
      fare: s.fare || 500,
      revenue: s.revenue || 0,
    };
    if (existingIdx >= 0) {
      buses[existingIdx] = { ...buses[existingIdx], ...busItem };
    } else {
      buses.unshift(busItem);
    }
  });

  // Apply unique bookings
  const seenIds = new Set();
  localBookings.forEach((b) => {
    if (!b?.bookingId || seenIds.has(b.bookingId) || b.status === 'CANCELLED' || b.booking_status === 'CANCELLED') return;
    seenIds.add(b.bookingId);
    const seatCount = Array.isArray(b.seat_list)
      ? b.seat_list.length
      : Array.isArray(b.seats)
      ? b.seats.length
      : typeof b.seats === 'string'
      ? b.seats.split(',').length
      : (b.passengerCount || 1);

    const matchBus = buses.find(
      (bus) =>
        (b.tripId && (bus.id === b.tripId || bus.tripId === b.tripId)) ||
        (b.busName && bus.name && bus.name.toLowerCase() === b.busName.toLowerCase()) ||
        (b.from && b.to && bus.from?.toLowerCase() === b.from.toLowerCase() && bus.to?.toLowerCase() === b.to.toLowerCase())
    );
    if (matchBus) {
      matchBus.booked = (matchBus.booked || 0) + seatCount;
      const bAmount = Number(b.total) || Number(b.amount) || Number(b.subtotal) || (matchBus.fare * seatCount) || 500;
      matchBus.revenue = (matchBus.revenue || 0) + bAmount;
      if (matchBus.status !== 'In Progress') {
        matchBus.status = matchBus.booked >= matchBus.total ? 'Full' : 'Active';
      }
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
    const statuses = JSON.parse(localStorage.getItem('c2b_trip_statuses') || '{}');
    const completions = JSON.parse(localStorage.getItem('c2b_trip_completions') || '{}');
    const localBookings = JSON.parse(localStorage.getItem('c2b_bookings') || '[]');

    return raw.map((s, i) => {
      const tripId = s.id || s.tripId || `LOCAL-${i + 1}`;
      const status = statuses[tripId] || s.status || 'SCHEDULED';
      const totalSeats = s.totalSeats || 40;

      // Count bookings for this trip from c2b_bookings
      const tripBookings = localBookings.filter((b) =>
        (b.status !== 'CANCELLED' && b.booking_status !== 'CANCELLED') &&
        (b.tripId === tripId || (b.busName && s.busName && b.busName.toLowerCase() === s.busName.toLowerCase()))
      );
      const bookedFromBookings = tripBookings.reduce((sum, b) => {
        const c = Array.isArray(b.seat_list) ? b.seat_list.length : (b.seats ? b.seats.split(',').length : 1);
        return sum + c;
      }, 0);
      const bookedSeats = Math.max(s.bookedSeats || 0, bookedFromBookings);
      const availableSeats = Math.max(0, totalSeats - bookedSeats);
      const fare = s.fare || 0;
      const bookingRev = tripBookings.reduce((sum, b) => sum + (Number(b.total) || Number(b.amount) || Number(b.subtotal) || (fare * (Array.isArray(b.seat_list) ? b.seat_list.length : 1))), 0);
      const revenue = Math.max(s.revenue || 0, bookingRev || (bookedSeats * fare));

      return {
        tripId,
        source:         s.from || '—',
        destination:    s.to   || '—',
        via:            s.via  || '',
        departureTime:  s.departureTime || '—',
        arrivalTime:    s.arrivalTime   || '—',
        journeyDate:    s.journeyDate || (s.addedAt ? s.addedAt.split('T')[0] : '—'),
        busName:        s.busName || '—',
        vehicleType:    s.busType || '—',
        availableSeats,
        totalSeats,
        bookedSeats,
        fare,
        revenue,
        status,
        isNew:          true,
        completedAt:    completions[tripId] || s.completedAt || null,
        addedAt:        s.addedAt || null,
      };
    });
  } catch (e) { return []; }
}

export async function fetchSchedulesFromAPI() {
  const localTrips = getLocalSchedules();
  const statuses = JSON.parse(localStorage.getItem('c2b_trip_statuses') || '{}');
  const completions = JSON.parse(localStorage.getItem('c2b_trip_completions') || '{}');

  // Hardcoded sample trips for offline demo with realistic dates across the last few days
  const now = Date.now();
  const dayMs = 86400000;
  const sampleFallback = [
    {
      tripId: 'T001', source: 'SriCity', destination: 'Chennai', via: 'Expressway',
      departureTime: '06:00', arrivalTime: '09:30',
      journeyDate: new Date(now).toISOString().split('T')[0],
      busName: 'Volvo A/C B12', vehicleType: 'Volvo AC', totalSeats: 40, bookedSeats: 32, availableSeats: 8,
      fare: 650, revenue: 20800, status: statuses['T001'] || 'SCHEDULED', isNew: false,
      completedAt: completions['T001'] || null,
    },
    {
      tripId: 'T002', source: 'Pune', destination: 'Mumbai', via: 'Lonavala',
      departureTime: '20:00', arrivalTime: '23:30',
      journeyDate: new Date(now).toISOString().split('T')[0],
      busName: 'Scania AC', vehicleType: 'AC Seater', totalSeats: 45, bookedSeats: 28, availableSeats: 17,
      fare: 500, revenue: 14000, status: statuses['T002'] || 'SCHEDULED', isNew: false,
      completedAt: completions['T002'] || null,
    },
    {
      tripId: 'T003', source: 'Tada', destination: 'Hyderabad', via: 'Nellore',
      departureTime: '18:00', arrivalTime: '06:00',
      journeyDate: new Date(now - 2 * dayMs).toISOString().split('T')[0],
      busName: 'Garuda Plus AC', vehicleType: 'Volvo AC', totalSeats: 42, bookedSeats: 40, availableSeats: 2,
      fare: 900, revenue: 36000, status: statuses['T003'] || 'COMPLETED', isNew: false,
      completedAt: completions['T003'] || new Date(now - 2 * dayMs).toISOString(),
    },
    {
      tripId: 'T004', source: 'Bangalore', destination: 'Chennai', via: 'Hosur',
      departureTime: '14:00', arrivalTime: '20:30',
      journeyDate: new Date(now - 4 * dayMs).toISOString().split('T')[0],
      busName: 'InterCity Express', vehicleType: 'Sleeper AC', totalSeats: 36, bookedSeats: 34, availableSeats: 2,
      fare: 750, revenue: 25500, status: statuses['T004'] || 'COMPLETED', isNew: false,
      completedAt: completions['T004'] || new Date(now - 4 * dayMs).toISOString(),
    },
  ];

  try {
    const apiData = await spFetch('/trips', {});
    if (apiData?.length && (apiData[0]?.source || apiData[0]?.route)) {
      const mappedApi = apiData.map((t) => ({
        ...t,
        status: statuses[t.tripId] || t.status || 'SCHEDULED',
        completedAt: completions[t.tripId] || t.completedAt || null,
      }));
      return { data: [...mappedApi, ...localTrips], isLive: true };
    }
    const localIds = new Set(localTrips.map((lt) => lt.tripId));
    const extraSample = sampleFallback.filter((st) => !localIds.has(st.tripId));
    return { data: [...localTrips, ...extraSample], isLive: false };
  } catch {
    const localIds = new Set(localTrips.map((lt) => lt.tripId));
    const extraSample = sampleFallback.filter((st) => !localIds.has(st.tripId));
    return { data: [...localTrips, ...extraSample], isLive: false };
  }
}

export async function saveSchedule(payload) {
  const loggedId = sessionStorage.getItem('c2b_loggedInId') || localStorage.getItem('c2b_loggedInId');
  const providerId = (loggedId && /^P\d+$/.test(loggedId)) ? loggedId : 'P001';
  const { journeyDate, from, to, via, dep, arr, busName, busType, seats, fare } = payload;
  const todayStr = new Date().toISOString().split('T')[0];
  const validJourneyDate = journeyDate || todayStr;

  try {
    // Step 1 – Route
    const routeData = await spFetch('/routes', {
      method: 'POST',
      body: JSON.stringify({ source: from.trim(), destination: to.trim(), distance: 300, ...(via ? { via } : {}) }),
    });
    const routeId = routeData?.routeId || routeData?.data?.routeId || 'R001';

    // Step 2 – Vehicle
    const normalizedVehicleType = (() => {
      if (!busType) return 'AC';
      if (busType === 'Sleeper AC' || busType === 'AC Sleeper') return 'AC Sleeper';
      if (busType === 'Volvo AC') return 'Volvo AC';
      if (busType === 'Non-AC') return 'Non-AC';
      if (busType === 'Semi-Sleeper') return 'Semi-Sleeper';
      if (busType === 'AC Seater') return 'AC Seater';
      if (busType === 'Luxury') return 'Luxury';
      return busType;
    })();

    const cleanVehicleNum = (((busName || 'BUS').replace(/[^A-Za-z0-9]/g, '').toUpperCase()) + '0000').slice(0, 10);
    let vehicleId = null;

    try {
      const vehList = await spFetch('/vehicles', {});
      const existingVeh = (Array.isArray(vehList) ? vehList : []).find((v) =>
        v.vehicleNumber?.toUpperCase() === cleanVehicleNum.toUpperCase() ||
        (v.busName && busName && v.busName.toLowerCase() === busName.toLowerCase()) ||
        v.vehicleNumber?.toUpperCase() === busName.toUpperCase()
      );
      if (existingVeh?.vehicleId) {
        vehicleId = existingVeh.vehicleId;
      }
    } catch (e) {
      console.warn('Vehicle lookup note:', e);
    }

    if (!vehicleId) {
      const vehData = await spFetch('/vehicles', {
        method: 'POST',
        body: JSON.stringify({
          providerId,
          vehicleNumber: cleanVehicleNum,
          vehicleType: normalizedVehicleType,
          totalSeats: Number(seats) || 40,
          remainingSeats: Number(seats) || 40,
          busName: busName || 'Express Bus',
          amenities: ['AC', 'WiFi'],
          rating: 4.5,
          boardingPoint: from.trim(),
          droppingPoint: to.trim(),
        }),
      });
      vehicleId = vehData?.vehicleId || vehData?.data?.vehicleId || 'V001';
    }

    // Step 3 – Schedule
    const schData = await spFetch('/schedules', {
      method: 'POST',
      body: JSON.stringify({
        routeId,
        providerId,
        departureTime: dep || '08:00',
        arrivalTime: arr || '12:00',
        journeyDate: validJourneyDate,
        arrivalTimeToDestination: arr || '12:00',
        fare: Number(fare) || 500,
        ...(via ? { via } : {}),
      }),
    });
    const scheduleId = schData?.scheduleId || schData?.data?.scheduleId || 'SCH001';

    // Step 4 – Trip
    const tripData = await spFetch('/trips', {
      method: 'POST',
      body: JSON.stringify({ vehicleId, scheduleId }),
    });
    const canonicalTripId = tripData?.tripId || tripData?.data?.tripId;
    if (!canonicalTripId || !/^T\d+$/.test(canonicalTripId)) {
      throw new Error(`Invalid canonical trip ID returned: ${canonicalTripId}`);
    }

    _saveToLocalStorage({ tripId: canonicalTripId, backendTripId: canonicalTripId, vehicleId, scheduleId, providerId, ...payload });
    return { tripId: canonicalTripId, isLive: true };
  } catch (err) {
    console.warn('saveSchedule error/fallback:', err?.message || err);
    // If backend failed, retain payload but do not generate fake TRIP_ if we can avoid it
    const tripId = `TRIP_${Date.now()}`;
    _saveToLocalStorage({ tripId, backendTripId: null, providerId, ...payload, vehicleId: null, scheduleId: null });
    return { tripId, isLive: false };
  }
}

function _saveToLocalStorage({ tripId, backendTripId, vehicleId, scheduleId, providerId, journeyDate, from, to, via, dep, arr, busName, busType, seats, fare }) {
  const schedules = JSON.parse(localStorage.getItem('c2b_bus_schedules') || '[]');
  const canonicalId = backendTripId || (tripId && /^T\d+$/.test(tripId) ? tripId : null);
  const effectiveId = canonicalId || tripId;
  const idx = schedules.findIndex((s) => (s.id || s.tripId) === effectiveId);
  const item = {
    id: effectiveId,
    tripId: effectiveId,
    backendTripId: canonicalId,
    vehicleId, scheduleId, providerId,
    from, to, via,
    departureTime: dep, arrivalTime: arr, journeyDate,
    busName, busType,
    totalSeats: Number(seats) || 40, availableSeats: Number(seats) || 40, bookedSeats: 0,
    fare: Number(fare) || 500, revenue: 0, operatorPayout: 0,
    status: 'SCHEDULED',
    addedAt: new Date().toISOString(),
  };
  if (idx >= 0) {
    schedules[idx] = { ...schedules[idx], ...item };
  } else {
    schedules.push(item);
  }
  localStorage.setItem('c2b_bus_schedules', JSON.stringify(schedules));
  try { window.dispatchEvent(new Event('storage')); } catch {}
  try { liveSync.syncSchedule(item); } catch {}
}

/* ── Edit / Update a locally-stored schedule ── */
export function updateLocalSchedule(tripId, { from, to, via, dep, arr, busName, busType, seats, fare, journeyDate }) {
  const schedules = JSON.parse(localStorage.getItem('c2b_bus_schedules') || '[]');
  const idx = schedules.findIndex((s) => (s.id || s.tripId) === tripId);
  const newTotal = seats || 40;

  if (idx === -1) {
    schedules.push({
      id: tripId, tripId,
      from, to, via,
      departureTime: dep, arrivalTime: arr, journeyDate,
      busName, busType,
      totalSeats: newTotal,
      availableSeats: newTotal,
      bookedSeats: 0,
      fare, revenue: 0,
      status: 'SCHEDULED',
      updatedAt: new Date().toISOString(),
    });
  } else {
    const existing = schedules[idx];
    const bookedSeats = existing.bookedSeats || 0;
    const newAvail = Math.max(0, newTotal - bookedSeats);
    schedules[idx] = {
      ...existing,
      from, to, via,
      departureTime: dep, arrivalTime: arr, journeyDate,
      busName, busType,
      totalSeats: newTotal,
      availableSeats: newAvail,
      fare,
      updatedAt: new Date().toISOString(),
    };
  }
  localStorage.setItem('c2b_bus_schedules', JSON.stringify(schedules));
  try { window.dispatchEvent(new Event('storage')); } catch {}
  try { liveSync.syncSchedule(schedules[idx === -1 ? schedules.length - 1 : idx]); } catch {}
  return true;
}

/* ── Helper: check if a trip's departure time has arrived or passed ── */
export function isDepartureTimeReached(journeyDate, departureTime) {
  try {
    if (!departureTime || departureTime === '—') return false;
    const cleanTime = String(departureTime).split('→')[0].trim();
    const timeMatch = cleanTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!timeMatch) return false;
    let hh = parseInt(timeMatch[1], 10);
    const mm = parseInt(timeMatch[2], 10);
    const meridiem = (timeMatch[3] || '').toUpperCase();
    if (meridiem === 'PM' && hh < 12) hh += 12;
    if (meridiem === 'AM' && hh === 12) hh = 0;

    const now = new Date();
    let y = now.getFullYear();
    let m = now.getMonth();
    let d = now.getDate();

    if (journeyDate) {
      const dateStr = String(journeyDate).split('T')[0];
      const dateParts = dateStr.split('-').map(Number);
      if (dateParts.length >= 3) {
        y = dateParts[0];
        m = dateParts[1] - 1;
        d = dateParts[2];
      }
    }

    const depDate = new Date(y, m, d, hh, mm, 0, 0);
    if (isNaN(depDate.getTime())) return false;
    return now >= depDate;
  } catch {
    return false;
  }
}

/* ── Central Auto-start: Any trip whose starting time is reached auto-starts ── */
export function autoStartDueTrips(additionalTrips = []) {
  const localSchedules = JSON.parse(localStorage.getItem('c2b_bus_schedules') || '[]');
  const statuses = JSON.parse(localStorage.getItem('c2b_trip_statuses') || '{}');
  let changed = false;
  const autoStarted = [];

  // Check schedules in c2b_bus_schedules
  localSchedules.forEach((s) => {
    const tid = s.id || s.tripId;
    if (!tid) return;
    const curStatus = statuses[tid] || s.status || 'SCHEDULED';
    if (curStatus === 'SCHEDULED' && isDepartureTimeReached(s.journeyDate, s.departureTime)) {
      statuses[tid] = 'IN_PROGRESS';
      s.status = 'IN_PROGRESS';
      changed = true;
      autoStarted.push({
        tripId: tid,
        busName: s.busName || 'Bus',
        from: s.from,
        to: s.to,
        time: s.departureTime,
      });
    }
  });

  // Check sample or live trips
  (additionalTrips || []).forEach((item) => {
    const trip = item.trip || item;
    const sched = item.schedule || item;
    const tid = trip?.tripId || item?.tripId;
    if (!tid) return;
    const curStatus = statuses[tid] || trip?.tripStatus || item?.status || 'SCHEDULED';
    const jDate = sched?.journeyDate || item?.journeyDate;
    const depTime = sched?.departureTime || item?.departureTime;

    if (curStatus === 'SCHEDULED' && isDepartureTimeReached(jDate, depTime)) {
      statuses[tid] = 'IN_PROGRESS';
      changed = true;
      autoStarted.push({
        tripId: tid,
        busName: item.busName || item.vehicle?.busName || 'Bus',
        from: item.source || sched?.from || item.from,
        to: item.destination || sched?.to || item.to,
        time: depTime,
      });
      try { spFetch(`/trips/${tid}/confirm`, { method: 'PATCH' }).catch(() => {}); } catch {}
    }
  });

  if (changed) {
    localStorage.setItem('c2b_trip_statuses', JSON.stringify(statuses));
    localStorage.setItem('c2b_bus_schedules', JSON.stringify(localSchedules));
    try { window.dispatchEvent(new Event('storage')); } catch {}
    autoStarted.forEach((item) => {
      try { liveSync.syncTripStatus(item.tripId, 'IN_PROGRESS'); } catch {}
    });
  }

  return autoStarted;
}

/* ── Cancel/Delete a schedule (marks as CANCELLED and stores in cancelled list) ── */
export function deleteLocalSchedule(tripId, tripMeta = {}) {
  try {
    // Mark status as CANCELLED
    const statuses = JSON.parse(localStorage.getItem('c2b_trip_statuses') || '{}');
    statuses[tripId] = 'CANCELLED';
    localStorage.setItem('c2b_trip_statuses', JSON.stringify(statuses));

    // Store in cancelled schedules list for display in Cancelled tab
    const cancelled = JSON.parse(localStorage.getItem('c2b_cancelled_schedules') || '[]');
    // Upsert: always store/update with latest meta so details are never blank
    const existingIdx = cancelled.findIndex((c) => c.tripId === tripId);
    const cancelledEntry = {
      tripId,
      source:        tripMeta.source        || tripMeta.from        || '—',
      destination:   tripMeta.destination   || tripMeta.to          || '—',
      via:           tripMeta.via           || '',
      departureTime: tripMeta.departureTime || '—',
      arrivalTime:   tripMeta.arrivalTime   || '—',
      journeyDate:   tripMeta.journeyDate   || '—',
      busName:       tripMeta.busName       || '—',
      vehicleType:   tripMeta.vehicleType   || tripMeta.busType     || '—',
      totalSeats:    tripMeta.totalSeats    || 0,
      fare:          tripMeta.fare          || 0,
      cancelledAt:   new Date().toISOString(),
    };
    if (existingIdx >= 0) {
      cancelled[existingIdx] = cancelledEntry;
    } else {
      cancelled.push(cancelledEntry);
    }
    localStorage.setItem('c2b_cancelled_schedules', JSON.stringify(cancelled));

    // Also remove from active local schedules (c2b_bus_schedules)
    const raw = JSON.parse(localStorage.getItem('c2b_bus_schedules') || '[]');
    const filtered = raw.filter((s) => s.id !== tripId && s.tripId !== tripId);
    localStorage.setItem('c2b_bus_schedules', JSON.stringify(filtered));

    // Clean up completions for this trip
    const completions = JSON.parse(localStorage.getItem('c2b_trip_completions') || '{}');
    delete completions[tripId];
    localStorage.setItem('c2b_trip_completions', JSON.stringify(completions));

    try { window.dispatchEvent(new Event('storage')); } catch {}
    return true;
  } catch {
    return false;
  }
}

/* ── Get all cancelled schedules ── */
export function getCancelledSchedules() {
  try {
    const all = JSON.parse(localStorage.getItem('c2b_cancelled_schedules') || '[]');
    // Filter out stale entries that were saved without bus details (from earlier buggy version)
    const valid = all.filter((c) => c.busName && c.busName !== '-' && c.busName !== '—');
    // If we filtered some out, persist the cleaned list
    if (valid.length !== all.length) {
      localStorage.setItem('c2b_cancelled_schedules', JSON.stringify(valid));
    }
    return valid;
  } catch {
    return [];
  }
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

function getLocalTripsForConfirm(localStatuses) {
  try {
    const localSchedules = JSON.parse(localStorage.getItem('c2b_bus_schedules') || '[]');
    return localSchedules.map((s, idx) => {
      const tripId = s.tripId || s.id || `LOCAL_T_${idx + 1}`;
      const status = localStatuses[tripId] || 'SCHEDULED';
      return {
        trip: {
          tripId,
          tripStatus: status,
          vehicleId: s.vehicleId || s.busName || `BUS-${idx + 1}`,
        },
        schedule: {
          scheduleId: s.scheduleId || tripId,
          journeyDate: s.journeyDate || (s.addedAt ? s.addedAt.split('T')[0] : new Date().toISOString().split('T')[0]),
          departureTime: s.departureTime || '08:00',
          arrivalTime: s.arrivalTime || '12:00',
          via: s.via || '',
          from: s.from || 'Origin',
          to: s.to || 'Destination',
        },
        route: {
          source: s.from || 'Origin',
          destination: s.to || 'Destination',
        },
        vehicle: {
          vehicleNumber: s.vehicleId || s.busName || `BUS-${idx + 1}`,
          busName: s.busName || 'Express Bus',
        },
      };
    });
  } catch {
    return [];
  }
}

/* ── Confirm Trips / Live Trips ── */
export async function fetchLiveTrips(providerId) {
  const localStatuses = JSON.parse(localStorage.getItem('c2b_trip_statuses') || '{}');
  const localTrips = getLocalTripsForConfirm(localStatuses);

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
    const existingIds = new Set(detailed.map((d) => d?.trip?.tripId).filter(Boolean));
    const extraLocal = localTrips.filter((lt) => !existingIds.has(lt.trip.tripId));
    return { data: [...detailed, ...extraLocal], isLive: true };
  } catch {
    const mockTrips = [
      { trip: { tripId: 'T001', tripStatus: localStatuses['T001'] || 'SCHEDULED', vehicleId: 'MH01AB1234' }, schedule: { journeyDate: new Date().toISOString().split('T')[0], departureTime: '06:00', via: 'Expressway' }, route: { source: 'SriCity', destination: 'Chennai' }, vehicle: { vehicleNumber: 'MH01AB1234' } },
      { trip: { tripId: 'T002', tripStatus: localStatuses['T002'] || 'SCHEDULED', vehicleId: 'MH02CD5678' }, schedule: { journeyDate: new Date().toISOString().split('T')[0], departureTime: '20:00', via: 'Lonavala' }, route: { source: 'Pune', destination: 'Mumbai' }, vehicle: { vehicleNumber: 'MH02CD5678' } },
    ];
    const existingMockIds = new Set(mockTrips.map((m) => m.trip.tripId));
    const extraLocal = localTrips.filter((lt) => !existingMockIds.has(lt.trip.tripId));
    return { data: [...mockTrips, ...extraLocal], isLive: false };
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

  const completions = JSON.parse(localStorage.getItem('c2b_trip_completions') || '{}');
  completions[tripId] = new Date().toISOString();
  localStorage.setItem('c2b_trip_completions', JSON.stringify(completions));
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

/* ── Destination & Route Requests / Approved Network ── */
export const APPROVED_MAJOR_CITIES = [
  'Bangalore',
  'Chennai',
  'Coimbatore',
  'Delhi',
  'Goa',
  'Hyderabad',
  'Jaipur',
  'Madurai',
  'Mumbai',
  'Mysore',
  'Nellore',
  'Pune',
  'SriCity',
  'Tada',
  'Tirupati',
  'Vijayawada',
  'Visakhapatnam',
];

export function getApprovedCities() {
  try {
    const custom = JSON.parse(localStorage.getItem('c2b_approved_cities') || '[]');
    const all = Array.from(new Set([...APPROVED_MAJOR_CITIES, ...custom])).sort((a, b) =>
      a.localeCompare(b)
    );
    return all;
  } catch {
    return APPROVED_MAJOR_CITIES;
  }
}

export function getDestinationRequests() {
  try {
    const stored = JSON.parse(localStorage.getItem('c2b_destination_requests') || 'null');
    if (!stored || !Array.isArray(stored)) {
      const initial = [
        {
          requestId: 'REQ_1710001001',
          cityName: 'Warangal',
          state: 'Telangana',
          hubType: 'Major District Headquarters',
          connectingRoutes: 'Hyderabad ↔ Warangal',
          reason: 'High tech & student commuter corridor passenger volume',
          providerId: 'P001',
          providerName: 'Kiran Travels',
          status: 'PENDING',
          submittedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        },
      ];
      localStorage.setItem('c2b_destination_requests', JSON.stringify(initial));
      return initial;
    }
    return stored;
  } catch {
    return [];
  }
}

export function submitDestinationRequest({ cityName, state, hubType, connectingRoutes, reason }) {
  const cleanCity = (cityName || '').trim();
  if (!cleanCity) throw new Error('City / Town name is required.');
  if (cleanCity.length < 2) throw new Error('City name must be at least 2 characters.');
  if (/^\d+$/.test(cleanCity)) throw new Error('City name cannot be numeric only.');

  const approved = getApprovedCities();
  if (approved.some((c) => c.toLowerCase() === cleanCity.toLowerCase())) {
    throw new Error(`"${cleanCity}" is already an approved destination in the platform network.`);
  }

  const requests = getDestinationRequests();
  const pending = requests.find(
    (r) => r.cityName.toLowerCase() === cleanCity.toLowerCase() && r.status === 'PENDING'
  );
  if (pending) {
    throw new Error(`A request for "${cleanCity}" is already pending admin review.`);
  }

  const loggedId = sessionStorage.getItem('c2b_loggedInId') || localStorage.getItem('c2b_loggedInId') || 'P001';
  const loggedName = localStorage.getItem('c2b_userName') || 'Kiran Travels';

  const newReq = {
    requestId: `REQ_${Date.now()}`,
    cityName: cleanCity,
    state: state || 'Andhra Pradesh',
    hubType: hubType || 'Major Town / District Hub',
    connectingRoutes: (connectingRoutes || '').trim(),
    reason: (reason || '').trim() || 'New operational corridor demand',
    providerId: loggedId,
    providerName: loggedName,
    status: 'PENDING',
    submittedAt: new Date().toISOString(),
  };

  requests.unshift(newReq);
  localStorage.setItem('c2b_destination_requests', JSON.stringify(requests));
  return newReq;
}

export function approveDestinationRequest(requestId) {
  const requests = getDestinationRequests();
  const idx = requests.findIndex((r) => r.requestId === requestId);
  if (idx === -1) throw new Error('Request not found');

  const req = requests[idx];
  req.status = 'APPROVED';
  req.approvedAt = new Date().toISOString();
  localStorage.setItem('c2b_destination_requests', JSON.stringify(requests));

  const custom = JSON.parse(localStorage.getItem('c2b_approved_cities') || '[]');
  if (!custom.some((c) => c.toLowerCase() === req.cityName.toLowerCase())) {
    custom.push(req.cityName);
    localStorage.setItem('c2b_approved_cities', JSON.stringify(custom));
  }

  return req;
}

export function rejectDestinationRequest(requestId) {
  const requests = getDestinationRequests();
  const idx = requests.findIndex((r) => r.requestId === requestId);
  if (idx === -1) throw new Error('Request not found');

  requests[idx].status = 'REJECTED';
  requests[idx].rejectedAt = new Date().toISOString();
  localStorage.setItem('c2b_destination_requests', JSON.stringify(requests));
  return requests[idx];
}

/* ── Coupons & Promotional Tokens Module ── */
export function getProviderCoupons() {
  try {
    const stored = JSON.parse(localStorage.getItem('c2b_provider_coupons') || 'null');
    if (!stored || !Array.isArray(stored) || stored.length === 0) {
      const now = Date.now();
      const initialCoupons = [
        {
          id: 'CPN-101',
          code: 'GROUPRIDE20',
          title: 'Bulk Booking Super Saver (3+ Tickets)',
          providerId: 'P001',
          providerName: 'Kiran Travels',
          ruleType: 'TICKET_COUNT',
          minTicketCount: 3,
          discountType: 'PERCENTAGE',
          discountValue: 20,
          maxDiscountAmount: 300,
          minBookingFare: 500,
          maxQuota: 25,
          usedCount: 18,
          corridor: 'ALL',
          status: 'ACTIVE',
          startDate: new Date(now - 86400000 * 5).toISOString().split('T')[0],
          expiryDate: new Date(now + 86400000 * 25).toISOString().split('T')[0],
          createdAt: new Date(now - 86400000 * 5).toISOString(),
          redemptions: [
            { redemptionId: 'RED-801', customerName: 'Arjun Swaminathan', customerEmail: 'arjun.s@gmail.com', bookingId: 'BK-9941', tripRoute: 'SriCity → Chennai', ticketsBooked: 3, discountAmount: 240, redeemedAt: new Date(now - 3600000 * 4).toISOString() },
            { redemptionId: 'RED-802', customerName: 'Deepak Patel', customerEmail: 'deepak.p@gmail.com', bookingId: 'BK-9948', tripRoute: 'Pune → Mumbai', ticketsBooked: 4, discountAmount: 300, redeemedAt: new Date(now - 3600000 * 12).toISOString() },
            { redemptionId: 'RED-803', customerName: 'Meera Nambiar', customerEmail: 'meera.n@gmail.com', bookingId: 'BK-9962', tripRoute: 'Bangalore → Chennai', ticketsBooked: 3, discountAmount: 225, redeemedAt: new Date(now - 3600000 * 24).toISOString() },
          ],
        },
        {
          id: 'CPN-102',
          code: 'LOYALPASS150',
          title: 'Frequent Commuter Loyalty Token',
          providerId: 'P001',
          providerName: 'Kiran Travels',
          ruleType: 'REGULAR_CUSTOMER',
          regularCustomerMinTrips: 2,
          discountType: 'FLAT',
          discountValue: 150,
          maxDiscountAmount: 150,
          minBookingFare: 400,
          maxQuota: 15,
          usedCount: 12,
          corridor: 'SriCity → Chennai',
          status: 'ACTIVE',
          startDate: new Date(now - 86400000 * 3).toISOString().split('T')[0],
          expiryDate: new Date(now + 86400000 * 20).toISOString().split('T')[0],
          createdAt: new Date(now - 86400000 * 3).toISOString(),
          redemptions: [
            { redemptionId: 'RED-811', customerName: 'Vikram Joshi', customerEmail: 'vikram.j@gmail.com', bookingId: 'BK-9802', tripRoute: 'SriCity → Chennai', ticketsBooked: 1, discountAmount: 150, redeemedAt: new Date(now - 3600000 * 6).toISOString() },
            { redemptionId: 'RED-812', customerName: 'Sneha Rao', customerEmail: 'sneha.r@gmail.com', bookingId: 'BK-9855', tripRoute: 'SriCity → Chennai', ticketsBooked: 2, discountAmount: 150, redeemedAt: new Date(now - 3600000 * 18).toISOString() },
          ],
        },
        {
          id: 'CPN-103',
          code: 'EARLYBIRD10',
          title: 'First 10 Commuters Flash Token',
          providerId: 'P001',
          providerName: 'Kiran Travels',
          ruleType: 'ANY_BOOKING',
          discountType: 'FLAT',
          discountValue: 100,
          maxDiscountAmount: 100,
          minBookingFare: 300,
          maxQuota: 10,
          usedCount: 10,
          corridor: 'ALL',
          status: 'EXHAUSTED',
          startDate: new Date(now - 86400000 * 7).toISOString().split('T')[0],
          expiryDate: new Date(now + 86400000 * 10).toISOString().split('T')[0],
          createdAt: new Date(now - 86400000 * 7).toISOString(),
          redemptions: [
            { redemptionId: 'RED-821', customerName: 'Rohan Sharma', customerEmail: 'rohan.s@gmail.com', bookingId: 'BK-9611', tripRoute: 'Tada → Hyderabad', ticketsBooked: 2, discountAmount: 100, redeemedAt: new Date(now - 86400000 * 2).toISOString() },
            { redemptionId: 'RED-822', customerName: 'Ananya Roy', customerEmail: 'ananya.r@gmail.com', bookingId: 'BK-9625', tripRoute: 'Pune → Mumbai', ticketsBooked: 1, discountAmount: 100, redeemedAt: new Date(now - 86400000 * 3).toISOString() },
          ],
        },
      ];
      localStorage.setItem('c2b_provider_coupons', JSON.stringify(initialCoupons));
      syncCouponsToCustomerEnd(initialCoupons);
      return initialCoupons;
    }
    return stored;
  } catch {
    return [];
  }
}

function syncCouponsToCustomerEnd(coupons) {
  try {
    const activeForCustomers = (coupons || []).filter(
      (c) => c.status === 'ACTIVE' && Number(c.usedCount || 0) < Number(c.maxQuota || 9999)
    );
    localStorage.setItem('c2b_active_coupons', JSON.stringify(activeForCustomers));
  } catch {}
}

export async function createProviderCoupon(payload) {
  const code = (payload.code || '').trim().toUpperCase();
  if (!code) throw new Error('Coupon code is required.');
  if (code.length < 3) throw new Error('Coupon code must be at least 3 characters.');

  const coupons = getProviderCoupons();
  if (coupons.some((c) => c.code.toUpperCase() === code)) {
    throw new Error(`Coupon code "${code}" already exists.`);
  }

  const maxQuota = parseInt(payload.maxQuota, 10);
  if (!maxQuota || isNaN(maxQuota) || maxQuota < 1) {
    throw new Error('Please set a valid redemption limit (at least 1 user).');
  }

  const discountVal = parseInt(payload.discountValue, 10);
  if (!discountVal || isNaN(discountVal) || discountVal < 1) {
    throw new Error('Please enter a valid discount value.');
  }

  const loggedId = sessionStorage.getItem('c2b_loggedInId') || localStorage.getItem('c2b_loggedInId') || 'P001';
  const loggedName = localStorage.getItem('c2b_userName') || 'Kiran Travels';

  const newCoupon = {
    id: `CPN-${Date.now()}`,
    code,
    title: (payload.title || '').trim() || `${code} Promotion`,
    providerId: loggedId,
    providerName: loggedName,
    ruleType: payload.ruleType || 'ANY_BOOKING',
    minTicketCount: payload.ruleType === 'TICKET_COUNT' ? Math.max(1, parseInt(payload.minTicketCount || 2, 10)) : undefined,
    regularCustomerMinTrips: payload.ruleType === 'REGULAR_CUSTOMER' ? Math.max(1, parseInt(payload.regularCustomerMinTrips || 2, 10)) : undefined,
    discountType: payload.discountType || 'PERCENTAGE',
    discountValue: discountVal,
    maxDiscountAmount: payload.maxDiscountAmount ? parseInt(payload.maxDiscountAmount, 10) : (payload.discountType === 'PERCENTAGE' ? 250 : discountVal),
    minBookingFare: payload.minBookingFare ? parseInt(payload.minBookingFare, 10) : 0,
    maxQuota,
    usedCount: 0,
    corridor: payload.corridor || 'ALL',
    status: 'ACTIVE',
    startDate: payload.startDate || new Date().toISOString().split('T')[0],
    expiryDate: payload.expiryDate || (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString().split('T')[0]; })(),
    createdAt: new Date().toISOString(),
    redemptions: [],
  };

  coupons.unshift(newCoupon);
  localStorage.setItem('c2b_provider_coupons', JSON.stringify(coupons));
  syncCouponsToCustomerEnd(coupons);

  try {
    await spFetch('/offers', {
      method: 'POST',
      body: JSON.stringify({
        providerId: loggedId,
        offerCode: code,
        discountPercentage: payload.discountType === 'PERCENTAGE' ? discountVal : 15,
        flatDiscount: payload.discountType === 'FLAT' ? discountVal : undefined,
        minFare: newCoupon.minBookingFare,
        startDate: newCoupon.startDate,
        endDate: newCoupon.expiryDate,
      }),
    });
  } catch (e) {
    console.info('Backend /offers sync note (stored locally):', e?.message);
  }

  return newCoupon;
}

export function toggleCouponStatus(couponId) {
  const coupons = getProviderCoupons();
  const idx = coupons.findIndex((c) => c.id === couponId);
  if (idx === -1) throw new Error('Coupon not found');

  const cur = coupons[idx];
  if (cur.status === 'EXHAUSTED') {
    throw new Error('This coupon has exhausted its customer redemption limit and cannot be re-activated without increasing quota.');
  }

  cur.status = cur.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
  localStorage.setItem('c2b_provider_coupons', JSON.stringify(coupons));
  syncCouponsToCustomerEnd(coupons);
  return cur;
}

export function deleteProviderCoupon(couponId) {
  const coupons = getProviderCoupons().filter((c) => c.id !== couponId);
  localStorage.setItem('c2b_provider_coupons', JSON.stringify(coupons));
  syncCouponsToCustomerEnd(coupons);
  return true;
}

export function simulateCustomerRedemption(couponId) {
  const coupons = getProviderCoupons();
  const idx = coupons.findIndex((c) => c.id === couponId);
  if (idx === -1) throw new Error('Coupon not found');

  const coupon = coupons[idx];
  if (coupon.status === 'EXHAUSTED' || coupon.usedCount >= coupon.maxQuota) {
    throw new Error(`Coupon "${coupon.code}" has already reached its limit of ${coupon.maxQuota} people. It is removed from the customer portal.`);
  }

  if (coupon.status === 'PAUSED') {
    throw new Error(`Coupon "${coupon.code}" is currently paused.`);
  }

  const SAMPLE_PASSENGERS = [
    { name: 'Kavita Sundaram', email: 'kavita.sundaram@gmail.com' },
    { name: 'Aditya Deshmukh', email: 'aditya.deshmukh@yahoo.com' },
    { name: 'Pooja Venkatesh', email: 'pooja.v@outlook.com' },
    { name: 'Manish Chawla', email: 'manish.chawla@gmail.com' },
    { name: 'Swati Mukherjee', email: 'swati.m@gmail.com' },
    { name: 'Karthik Narayanan', email: 'karthik.n@gmail.com' },
  ];
  const p = SAMPLE_PASSENGERS[Math.floor(Math.random() * SAMPLE_PASSENGERS.length)];
  const ticketsBooked = coupon.ruleType === 'TICKET_COUNT' ? Math.max(3, coupon.minTicketCount || 3) : Math.floor(Math.random() * 2) + 1;
  const basePricePerTicket = 600;
  const totalBase = ticketsBooked * basePricePerTicket;
  const discountAmt = coupon.discountType === 'PERCENTAGE'
    ? Math.min(coupon.maxDiscountAmount || 300, Math.round((totalBase * coupon.discountValue) / 100))
    : coupon.discountValue;

  const newRedemption = {
    redemptionId: `RED-${Math.floor(1000 + Math.random() * 9000)}`,
    customerName: p.name,
    customerEmail: p.email,
    bookingId: `BK-${Math.floor(10000 + Math.random() * 90000)}`,
    tripRoute: coupon.corridor === 'ALL' ? 'SriCity → Chennai' : coupon.corridor,
    ticketsBooked,
    discountAmount: discountAmt,
    redeemedAt: new Date().toISOString(),
  };

  coupon.usedCount = (coupon.usedCount || 0) + 1;
  coupon.redemptions = [newRedemption, ...(coupon.redemptions || [])];

  let exhausted = false;
  if (coupon.usedCount >= coupon.maxQuota) {
    coupon.status = 'EXHAUSTED';
    exhausted = true;
  }

  localStorage.setItem('c2b_provider_coupons', JSON.stringify(coupons));
  syncCouponsToCustomerEnd(coupons);

  return { coupon, redemption: newRedemption, exhausted };
}

/* ──────────────────────────────────────────────────────────
   Bus Reviews & Ratings Module (Multi-Actor Data Contract)
   Stored in 'c2b_bus_reviews' and synchronized with backend /reviews
   ────────────────────────────────────────────────────────── */

const DEFAULT_SEED_REVIEWS = [
  {
    reviewId: 'REV-001',
    tripId: 'T001',
    busName: 'Volvo A/C B12',
    route: 'SriCity → Chennai',
    customerId: 'C001',
    customerName: 'Rahul Sharma',
    bookingId: 'BK-88210',
    seatNumber: '14A',
    rating: 5,
    categories: { punctuality: 5, cleanliness: 5, comfort: 5, staff: 4 },
    comment: 'Extremely smooth journey! Bus arrived right on time at SriCity pickup point. Clean blankets and charging port working perfectly.',
    reviewDate: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    providerReply: 'Thank you for traveling with us Rahul! We take pride in punctual departures and clean coaches. Safe travels!',
    repliedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    providerName: 'Kiran Travels',
    verifiedBooking: true,
  },
  {
    reviewId: 'REV-002',
    tripId: 'T001',
    busName: 'Volvo A/C B12',
    route: 'SriCity → Chennai',
    customerId: 'C002',
    customerName: 'Priya Patel',
    bookingId: 'BK-88245',
    seatNumber: '08B',
    rating: 4,
    categories: { punctuality: 4, cleanliness: 5, comfort: 4, staff: 5 },
    comment: 'Good journey overall. Driver was polite and drove safely. Reached Chennai slightly late due to highway traffic, but very comfortable.',
    reviewDate: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    providerReply: 'Thank you Priya! Highway traffic near Koyambedu can sometimes add a few minutes, but passenger safety and comfort are always our priority.',
    repliedAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    providerName: 'Kiran Travels',
    verifiedBooking: true,
  },
  {
    reviewId: 'REV-003',
    tripId: 'T002',
    busName: 'Scania AC',
    route: 'Tada → Vizag',
    customerId: 'C003',
    customerName: 'Amit Kumar',
    bookingId: 'BK-87912',
    seatNumber: '21C',
    rating: 3,
    categories: { punctuality: 3, cleanliness: 4, comfort: 3, staff: 4 },
    comment: 'AC was a bit too cold in the night and the departure was delayed by 15 minutes. Otherwise the seating was decent.',
    reviewDate: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    providerReply: null,
    repliedAt: null,
    providerName: 'Kiran Travels',
    verifiedBooking: true,
  },
  {
    reviewId: 'REV-004',
    tripId: 'T003',
    busName: 'Volvo A/C B12',
    route: 'Tada → Hyderabad',
    customerId: 'C004',
    customerName: 'Sneha Reddy',
    bookingId: 'BK-89011',
    seatNumber: '05A',
    rating: 5,
    categories: { punctuality: 5, cleanliness: 5, comfort: 5, staff: 5 },
    comment: 'Top notch service! Best bus operator on this route. Water bottle provided and seats recline fully. Will definitely book again.',
    reviewDate: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    providerReply: 'Glad you loved the hospitality Sneha! See you again on your next trip.',
    repliedAt: new Date(Date.now() - 70 * 3600 * 1000).toISOString(),
    providerName: 'Kiran Travels',
    verifiedBooking: true,
  },
  {
    reviewId: 'REV-005',
    tripId: 'T004',
    busName: 'Sleeper Bus',
    route: 'Pune → Mumbai',
    customerId: 'C005',
    customerName: 'Vikram Deshmukh',
    bookingId: 'BK-89240',
    seatNumber: 'U4',
    rating: 4,
    categories: { punctuality: 4, cleanliness: 4, comfort: 4, staff: 4 },
    comment: 'Comfortable sleeper berth and on-time arrival at Dadar. Smooth driving during nighttime.',
    reviewDate: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
    providerReply: null,
    repliedAt: null,
    providerName: 'Kiran Travels',
    verifiedBooking: true,
  },
];

export function getBusReviews(providerId, tripId) {
  let reviews = [];
  try {
    const raw = localStorage.getItem('c2b_bus_reviews');
    if (raw) {
      reviews = JSON.parse(raw);
    } else {
      reviews = [...DEFAULT_SEED_REVIEWS];
      localStorage.setItem('c2b_bus_reviews', JSON.stringify(reviews));
    }
  } catch (e) {
    reviews = [...DEFAULT_SEED_REVIEWS];
  }

  // Background fetch to sync any reviews posted via backend API
  (async () => {
    try {
      const backendReviews = await spFetch('/reviews');
      if (Array.isArray(backendReviews) && backendReviews.length > 0) {
        let changed = false;
        backendReviews.forEach((br) => {
          const exists = reviews.some((r) => r.reviewId === br.reviewId || (r.tripId === br.tripId && r.customerId === br.customerId && r.reviewDate === br.reviewDate));
          if (!exists) {
            reviews.unshift({
              reviewId: br.reviewId || `REV-${Date.now()}`,
              tripId: br.tripId || 'T001',
              busName: br.tripId === 'T001' ? 'Volvo A/C B12' : br.tripId === 'T002' ? 'Scania AC' : 'Express Bus',
              route: br.tripId === 'T001' ? 'SriCity → Chennai' : br.tripId === 'T002' ? 'Tada → Vizag' : 'Active Route',
              customerId: br.customerId || 'C001',
              customerName: br.customerId === 'C001' ? 'Rahul Sharma' : br.customerId === 'C002' ? 'Priya Patel' : 'Verified Traveler',
              bookingId: `BK-${Math.floor(10000 + Math.random() * 90000)}`,
              seatNumber: '12A',
              rating: br.rating || 5,
              categories: { punctuality: br.rating || 5, cleanliness: br.rating || 5, comfort: br.rating || 4, staff: 5 },
              comment: br.comment || 'Good journey experience.',
              reviewDate: br.reviewDate ? new Date(br.reviewDate).toISOString() : new Date().toISOString(),
              providerReply: null,
              repliedAt: null,
              providerName: 'Kiran Travels',
              verifiedBooking: true,
            });
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem('c2b_bus_reviews', JSON.stringify(reviews));
        }
      }
    } catch {}
  })();

  if (tripId && tripId !== 'ALL') {
    return reviews.filter((r) => r.tripId === tripId);
  }

  return reviews;
}

export async function submitCustomerReview(payload) {
  if (!payload || !payload.tripId) {
    throw new Error('Trip ID is required to submit a review.');
  }

  const ratingNum = Math.min(5, Math.max(1, parseInt(payload.rating || 5, 10)));
  const reviews = getBusReviews();

  // Look up bus info if not provided
  const schedules = JSON.parse(localStorage.getItem('c2b_bus_schedules') || '[]');
  const matchedSchedule = schedules.find((s) => (s.id || s.tripId) === payload.tripId);
  const busName = payload.busName || matchedSchedule?.busName || (payload.tripId === 'T001' ? 'Volvo A/C B12' : payload.tripId === 'T002' ? 'Scania AC' : payload.tripId === 'T003' ? 'Volvo A/C B12' : payload.tripId === 'T004' ? 'Sleeper Bus' : 'Express Bus');
  const route = payload.route || (matchedSchedule ? `${matchedSchedule.from} → ${matchedSchedule.to}` : (payload.tripId === 'T001' ? 'SriCity → Chennai' : payload.tripId === 'T002' ? 'Tada → Vizag' : payload.tripId === 'T003' ? 'Tada → Hyderabad' : payload.tripId === 'T004' ? 'Pune → Mumbai' : 'Intercity Route'));

  const reviewId = `REV-${Date.now()}`;
  const newReview = {
    reviewId,
    tripId: payload.tripId,
    busName,
    route,
    customerId: payload.customerId || 'C001',
    customerName: payload.customerName || 'Passenger',
    bookingId: payload.bookingId || `BK-${Math.floor(10000 + Math.random() * 90000)}`,
    seatNumber: payload.seatNumber || '14B',
    rating: ratingNum,
    categories: {
      punctuality: payload.categories?.punctuality ?? ratingNum,
      cleanliness: payload.categories?.cleanliness ?? ratingNum,
      comfort: payload.categories?.comfort ?? ratingNum,
      staff: payload.categories?.staff ?? ratingNum,
    },
    comment: (payload.comment || '').trim() || 'Pleasant journey, on-time bus and clean cabin.',
    reviewDate: new Date().toISOString(),
    providerReply: null,
    repliedAt: null,
    providerName: 'Kiran Travels',
    verifiedBooking: true,
  };

  reviews.unshift(newReview);
  localStorage.setItem('c2b_bus_reviews', JSON.stringify(reviews));

  // Sync to NestJS backend if available
  try {
    await spFetch('/reviews', {
      method: 'POST',
      body: JSON.stringify({
        customerId: newReview.customerId,
        tripId: newReview.tripId,
        rating: newReview.rating,
        comment: newReview.comment,
      }),
    });
  } catch (e) {
    console.info('Backend /reviews note (saved locally):', e?.message);
  }

  // Cross-actor notification
  try {
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('c2b_sync', {
      detail: { type: 'REVIEW_SUBMITTED', payload: newReview },
    }));
  } catch {}

  return newReview;
}

export function replyToReview(reviewId, replyText, providerName = 'Kiran Travels') {
  if (!replyText || !replyText.trim()) {
    throw new Error('Reply comment cannot be empty.');
  }

  const reviews = getBusReviews();
  const idx = reviews.findIndex((r) => r.reviewId === reviewId);
  if (idx === -1) {
    throw new Error('Review not found.');
  }

  reviews[idx].providerReply = replyText.trim();
  reviews[idx].repliedAt = new Date().toISOString();
  reviews[idx].providerName = providerName || 'Kiran Travels';

  localStorage.setItem('c2b_bus_reviews', JSON.stringify(reviews));

  try {
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('c2b_sync', {
      detail: { type: 'REVIEW_REPLIED', payload: reviews[idx] },
    }));
  } catch {}

  return reviews[idx];
}

export function deleteReviewReply(reviewId) {
  const reviews = getBusReviews();
  const idx = reviews.findIndex((r) => r.reviewId === reviewId);
  if (idx === -1) throw new Error('Review not found.');

  reviews[idx].providerReply = null;
  reviews[idx].repliedAt = null;

  localStorage.setItem('c2b_bus_reviews', JSON.stringify(reviews));

  try {
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('c2b_sync', {
      detail: { type: 'REVIEW_REPLIED', payload: reviews[idx] },
    }));
  } catch {}

  return reviews[idx];
}

export function getProviderFleetRatingSummary(providerId) {
  const reviews = getBusReviews(providerId);
  const totalReviews = reviews.length;
  if (totalReviews === 0) {
    return {
      totalReviews: 0,
      averageRating: 0,
      starCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      starPercentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      categoryAverages: { punctuality: 0, cleanliness: 0, comfort: 0, staff: 0 },
      repliedCount: 0,
      pendingCount: 0,
      responseRate: 0,
      positivePercentage: 0,
    };
  }

  const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sumRating = 0;
  let sumPunctuality = 0;
  let sumCleanliness = 0;
  let sumComfort = 0;
  let sumStaff = 0;
  let repliedCount = 0;

  reviews.forEach((r) => {
    const stars = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
    starCounts[stars] = (starCounts[stars] || 0) + 1;
    sumRating += (r.rating || 5);

    const cat = r.categories || {};
    sumPunctuality += (cat.punctuality ?? r.rating ?? 5);
    sumCleanliness += (cat.cleanliness ?? r.rating ?? 5);
    sumComfort += (cat.comfort ?? r.rating ?? 5);
    sumStaff += (cat.staff ?? r.rating ?? 5);

    if (r.providerReply) repliedCount++;
  });

  const averageRating = parseFloat((sumRating / totalReviews).toFixed(1));
  const categoryAverages = {
    punctuality: parseFloat((sumPunctuality / totalReviews).toFixed(1)),
    cleanliness: parseFloat((sumCleanliness / totalReviews).toFixed(1)),
    comfort: parseFloat((sumComfort / totalReviews).toFixed(1)),
    staff: parseFloat((sumStaff / totalReviews).toFixed(1)),
  };

  const starPercentages = {
    5: Math.round((starCounts[5] / totalReviews) * 100),
    4: Math.round((starCounts[4] / totalReviews) * 100),
    3: Math.round((starCounts[3] / totalReviews) * 100),
    2: Math.round((starCounts[2] / totalReviews) * 100),
    1: Math.round((starCounts[1] / totalReviews) * 100),
  };

  const positiveCount = (starCounts[5] || 0) + (starCounts[4] || 0);
  const positivePercentage = Math.round((positiveCount / totalReviews) * 100);
  const responseRate = Math.round((repliedCount / totalReviews) * 100);
  const pendingCount = totalReviews - repliedCount;

  return {
    totalReviews,
    averageRating,
    starCounts,
    starPercentages,
    categoryAverages,
    repliedCount,
    pendingCount,
    responseRate,
    positivePercentage,
  };
}

/* ──────────────────────────────────────────────────────────
   Customer Inter-Actor Helpers (Coupons & Tokens)
   ────────────────────────────────────────────────────────── */

export function getActiveCouponsForCustomer(context = {}) {
  const stored = JSON.parse(localStorage.getItem('c2b_active_coupons') || '[]');
  const now = new Date();

  return stored
    .filter((c) => {
      if (c.status !== 'ACTIVE') return false;
      if (c.usedCount >= c.maxQuota) return false;
      if (c.expiryDate && new Date(c.expiryDate) < now) return false;
      return true;
    })
    .map((c) => {
      const remainingQuota = Math.max(0, (c.maxQuota || 1) - (c.usedCount || 0));
      let eligible = true;
      let reason = '';

      if (c.ruleType === 'TICKET_COUNT' && context.ticketCount) {
        if (context.ticketCount < (c.minTicketCount || 1)) {
          eligible = false;
          reason = `Requires booking at least ${c.minTicketCount} tickets.`;
        }
      }

      if (c.ruleType === 'REGULAR_CUSTOMER' && context.pastTripsCount !== undefined) {
        if (context.pastTripsCount < (c.regularCustomerMinTrips || 2)) {
          eligible = false;
          reason = `Available for regular commuters with ${c.regularCustomerMinTrips}+ prior trips.`;
        }
      }

      return {
        ...c,
        remainingQuota,
        eligible,
        reason,
      };
    });
}

export function redeemCouponAtCustomer(couponCode, bookingContext = {}) {
  const coupons = getProviderCoupons();
  const cleanCode = (couponCode || '').trim().toUpperCase();
  const idx = coupons.findIndex((c) => (c.code || '').toUpperCase() === cleanCode);

  if (idx === -1) {
    throw new Error(`Coupon code "${couponCode}" is invalid or does not exist.`);
  }

  const coupon = coupons[idx];
  if (coupon.status === 'EXHAUSTED' || coupon.usedCount >= coupon.maxQuota) {
    throw new Error(`Coupon "${coupon.code}" limit of ${coupon.maxQuota} users has been reached and is no longer available.`);
  }

  if (coupon.status === 'PAUSED') {
    throw new Error(`Coupon "${coupon.code}" is currently paused by the service provider.`);
  }

  const ticketsBooked = bookingContext.ticketCount || 1;
  if (coupon.ruleType === 'TICKET_COUNT' && ticketsBooked < (coupon.minTicketCount || 1)) {
    throw new Error(`Coupon "${coupon.code}" requires booking at least ${coupon.minTicketCount} tickets.`);
  }

  const totalBaseFare = bookingContext.baseFare || (ticketsBooked * 600);
  if (coupon.minBookingFare && totalBaseFare < coupon.minBookingFare) {
    throw new Error(`Minimum booking fare of ₹${coupon.minBookingFare} required to use coupon "${coupon.code}".`);
  }

  const discountAmount = coupon.discountType === 'PERCENTAGE'
    ? Math.min(coupon.maxDiscountAmount || 300, Math.round((totalBaseFare * coupon.discountValue) / 100))
    : coupon.discountValue;

  const redemption = {
    redemptionId: `RED-${Math.floor(1000 + Math.random() * 9000)}`,
    customerName: bookingContext.customerName || 'Passenger',
    customerEmail: bookingContext.customerEmail || 'customer@gmail.com',
    bookingId: bookingContext.bookingId || `BK-${Math.floor(10000 + Math.random() * 90000)}`,
    tripRoute: bookingContext.route || (coupon.corridor === 'ALL' ? 'SriCity → Chennai' : coupon.corridor),
    ticketsBooked,
    discountAmount,
    redeemedAt: new Date().toISOString(),
  };

  coupon.usedCount = (coupon.usedCount || 0) + 1;
  coupon.redemptions = [redemption, ...(coupon.redemptions || [])];

  let exhausted = false;
  if (coupon.usedCount >= coupon.maxQuota) {
    coupon.status = 'EXHAUSTED';
    exhausted = true;
  }

  localStorage.setItem('c2b_provider_coupons', JSON.stringify(coupons));
  syncCouponsToCustomerEnd(coupons);

  return {
    success: true,
    discountAmount,
    couponCode: coupon.code,
    remainingQuota: Math.max(0, coupon.maxQuota - coupon.usedCount),
    exhausted,
  };
}

/* ──────────────────────────────────────────────────────────
   Direct Window Global Bridge for Customer & Testing
   Allows customer team member to access reviews & coupons directly
   via window.Click2BookReviewAPI and window.Click2BookCouponAPI
   ────────────────────────────────────────────────────────── */
if (typeof window !== 'undefined') {
  window.Click2BookReviewAPI = {
    getAll: (tripId) => getBusReviews(undefined, tripId),
    submit: (payload) => submitCustomerReview(payload),
    reply: (reviewId, text, name) => replyToReview(reviewId, text, name),
    deleteReply: (reviewId) => deleteReviewReply(reviewId),
    getSummary: () => getProviderFleetRatingSummary(),
  };

  window.Click2BookCouponAPI = {
    getAllActive: (context) => getActiveCouponsForCustomer(context),
    redeem: (code, ctx) => redeemCouponAtCustomer(code, ctx),
    simulate: (couponId) => simulateCustomerRedemption(couponId),
  };
}


