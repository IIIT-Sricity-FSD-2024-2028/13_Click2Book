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
    if (s.isSegment) return;
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
    const primaryOnly = raw.filter((s) => !s.isSegment);
    const statuses = JSON.parse(localStorage.getItem('c2b_trip_statuses') || '{}');
    const completions = JSON.parse(localStorage.getItem('c2b_trip_completions') || '{}');
    const localBookings = JSON.parse(localStorage.getItem('c2b_bookings') || '[]');

    return primaryOnly.map((s, i) => {
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

      const parsedStops = Array.isArray(s.intermediateStops)
        ? s.intermediateStops
        : (s.via ? s.via.split(',').map((x) => x.trim()).filter(Boolean) : []);

      return {
        tripId,
        source:            s.from || '—',
        destination:       s.to   || '—',
        via:               s.via  || '',
        intermediateStops: parsedStops,
        allStops:          s.allStops || [s.from, ...parsedStops, s.to].filter(Boolean),
        departureTime:     s.departureTime || '—',
        arrivalTime:       s.arrivalTime   || '—',
        journeyDate:       s.journeyDate || (s.addedAt ? s.addedAt.split('T')[0] : '—'),
        busName:           s.busName || '—',
        vehicleType:       s.busType || '—',
        availableSeats,
        totalSeats,
        bookedSeats,
        fare,
        revenue,
        status,
        isNew:             true,
        completedAt:       completions[tripId] || s.completedAt || null,
        addedAt:           s.addedAt || null,
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
      const localIds = new Set(localTrips.map((lt) => lt.tripId));
      const extraApi = mappedApi.filter((at) => !localIds.has(at.tripId));
      return { data: [...localTrips, ...extraApi], isLive: true };
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
  const {
    journeyDate,
    from,
    to,
    via,
    intermediateStops,
    dep,
    arr,
    busName,
    busType,
    seats,
    fare,
    corridorId,
    corridorName,
    routeStops,
    encodedPolyline,
  } = payload;
  const todayStr = new Date().toISOString().split('T')[0];
  const validJourneyDate = journeyDate || todayStr;

  // Derive intermediate stops array and effective via string
  const stopsList = Array.isArray(intermediateStops)
    ? intermediateStops.map((s) => String(s).trim()).filter(Boolean)
    : typeof via === 'string' && via.trim()
    ? via.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const effectiveVia = (via && String(via).trim()) ? String(via).trim() : stopsList.join(', ');

  try {
    // Step 1 – Route (send origin, destination, corridorId, and intermediate stops via string to backend)
    const routeData = await spFetch('/routes', {
      method: 'POST',
      body: JSON.stringify({
        source: from.trim(),
        destination: to.trim(),
        distance: 300,
        ...(effectiveVia ? { via: effectiveVia } : {}),
        ...(corridorId ? { selectedCorridorId: corridorId } : {}),
      }),
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

    // Step 3 – Schedule (stores route, timings, fare, corridor and intermediate stops via)
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
        ...(effectiveVia ? { via: effectiveVia } : {}),
        ...(corridorId ? { corridorId } : {}),
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

    _saveToLocalStorage({
      tripId: canonicalTripId,
      backendTripId: canonicalTripId,
      vehicleId,
      scheduleId,
      providerId,
      ...payload,
      via: effectiveVia,
      intermediateStops: stopsList,
      corridorId: corridorId || null,
      corridorName: corridorName || null,
      routeStops: Array.isArray(routeStops) ? routeStops : [],
      encodedPolyline: encodedPolyline || null,
    });
    return { tripId: canonicalTripId, isLive: true };
  } catch (err) {
    console.warn('saveSchedule error/fallback:', err?.message || err);
    // If backend failed, retain payload and save locally with intermediate stops & corridor
    const tripId = `TRIP_${Date.now()}`;
    _saveToLocalStorage({
      tripId,
      backendTripId: null,
      providerId,
      ...payload,
      via: effectiveVia,
      intermediateStops: stopsList,
      corridorId: corridorId || null,
      corridorName: corridorName || null,
      routeStops: Array.isArray(routeStops) ? routeStops : [],
      encodedPolyline: encodedPolyline || null,
      vehicleId: null,
      scheduleId: null,
    });
    return { tripId, isLive: false };
  }
}

function _saveToLocalStorage({
  tripId,
  backendTripId,
  vehicleId,
  scheduleId,
  providerId,
  journeyDate,
  from,
  to,
  via,
  intermediateStops,
  dep,
  arr,
  busName,
  busType,
  seats,
  fare,
  corridorId,
  corridorName,
  routeStops,
  encodedPolyline,
}) {
  const schedules = JSON.parse(localStorage.getItem('c2b_bus_schedules') || '[]');
  const canonicalId = backendTripId || (tripId && /^T\d+$/.test(tripId) ? tripId : null);
  const effectiveId = canonicalId || tripId;

  const stopsList = Array.isArray(intermediateStops)
    ? intermediateStops.map((s) => String(s).trim()).filter(Boolean)
    : typeof via === 'string' && via.trim()
    ? via.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const effectiveVia = (via && String(via).trim()) ? String(via).trim() : stopsList.join(', ');
  const fullStops = [from.trim(), ...stopsList, to.trim()];

  // Filter out any stale subsegments belonging to this trip
  const cleanSchedules = schedules.filter(
    (s) => s.parentTripId !== effectiveId && !String(s.id).startsWith(`${effectiveId}_SEG_`)
  );

  const primaryItem = {
    id: effectiveId,
    tripId: effectiveId,
    backendTripId: canonicalId,
    vehicleId,
    scheduleId,
    providerId,
    from: from.trim(),
    to: to.trim(),
    via: effectiveVia,
    intermediateStops: stopsList,
    allStops: fullStops,
    corridorId: corridorId || null,
    corridorName: corridorName || null,
    routeStops: Array.isArray(routeStops) ? routeStops : [],
    encodedPolyline: encodedPolyline || null,
    departureTime: dep,
    arrivalTime: arr,
    journeyDate,
    busName: busName || 'Express Bus',
    busType: busType || 'AC',
    totalSeats: Number(seats) || 40,
    availableSeats: Number(seats) || 40,
    bookedSeats: 0,
    fare: Number(fare) || 500,
    revenue: 0,
    operatorPayout: 0,
    status: 'SCHEDULED',
    isPrimaryRoute: true,
    addedAt: new Date().toISOString(),
  };

  const idx = cleanSchedules.findIndex((s) => (s.id || s.tripId) === effectiveId);
  if (idx >= 0) {
    cleanSchedules[idx] = { ...cleanSchedules[idx], ...primaryItem };
  } else {
    cleanSchedules.push(primaryItem);
  }

  // Multi-Stop Route Segment Generator:
  // If intermediate stations exist, generate all bookable sub-route pairs on this same bus.
  // E.g. Chennai -> Nayudupeta -> Nellore -> Kavali -> Ongole generates bookable trips
  // for (Chennai->Nellore), (Nayudupeta->Ongole), (Nellore->Kavali), etc., all sharing the same canonicalTripId!
  if (fullStops.length > 2) {
    let totalMins = 360;
    try {
      const [dh, dm] = (dep || '08:00').split(':').map(Number);
      const [ah, am] = (arr || '14:00').split(':').map(Number);
      let diff = (ah * 60 + am) - (dh * 60 + dm);
      if (diff < 0) diff += 24 * 60;
      if (diff > 0) totalMins = diff;
    } catch {}

    const intervals = fullStops.length - 1;
    const minsPerHop = Math.round(totalMins / intervals);

    const getTimeAtStop = (stopIdx) => {
      try {
        const [dh, dm] = (dep || '08:00').split(':').map(Number);
        const stopMinutes = (dh * 60 + dm) + (stopIdx * minsPerHop);
        const h = Math.floor((stopMinutes / 60) % 24);
        const m = Math.floor(stopMinutes % 60);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      } catch { return dep; }
    };

    const baseFare = Number(fare) || 500;

    for (let i = 0; i < fullStops.length - 1; i++) {
      for (let j = i + 1; j < fullStops.length; j++) {
        // Skip the main full route since primaryItem covers it
        if (i === 0 && j === fullStops.length - 1) continue;

        const segFrom = fullStops[i];
        const segTo = fullStops[j];
        const subStops = fullStops.slice(i + 1, j);
        const segVia = subStops.join(', ');
        const segDep = getTimeAtStop(i);
        const segArr = getTimeAtStop(j);
        const hopCount = j - i;
        const segFare = Math.max(120, Math.round((baseFare * hopCount) / intervals));

        cleanSchedules.push({
          id: `${effectiveId}_SEG_${i}_${j}`,
          tripId: effectiveId, // Links to canonical trip so all customer bookings match this bus!
          segmentId: `${effectiveId}_SEG_${i}_${j}`,
          parentTripId: effectiveId,
          isSegment: true,
          backendTripId: canonicalId,
          vehicleId,
          scheduleId,
          providerId,
          from: segFrom,
          to: segTo,
          via: segVia,
          intermediateStops: subStops,
          allStops: fullStops,
          departureTime: segDep,
          arrivalTime: segArr,
          journeyDate,
          busName: busName || 'Express Bus',
          busType: busType || 'AC',
          totalSeats: Number(seats) || 40,
          availableSeats: Number(seats) || 40,
          bookedSeats: 0,
          fare: segFare,
          revenue: 0,
          operatorPayout: 0,
          status: 'SCHEDULED',
          addedAt: new Date().toISOString(),
        });
      }
    }
  }

  localStorage.setItem('c2b_bus_schedules', JSON.stringify(cleanSchedules));
  try { window.dispatchEvent(new Event('storage')); } catch {}
  try { window.dispatchEvent(new CustomEvent('c2b_sync', { detail: { type: 'SCHEDULE_UPDATED', payload: primaryItem } })); } catch {}
  try { liveSync.syncSchedule(primaryItem); } catch {}
}

/* ── Edit / Update a locally-stored schedule ── */
export function updateLocalSchedule(tripId, { from, to, via, intermediateStops, dep, arr, busName, busType, seats, fare, journeyDate }) {
  const stopsList = Array.isArray(intermediateStops)
    ? intermediateStops.map((s) => String(s).trim()).filter(Boolean)
    : typeof via === 'string' && via.trim()
    ? via.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const effectiveVia = (via && String(via).trim()) ? String(via).trim() : stopsList.join(', ');

  _saveToLocalStorage({
    tripId,
    backendTripId: /^T\d+$/.test(tripId) ? tripId : null,
    vehicleId: null,
    scheduleId: null,
    providerId: 'P001',
    from,
    to,
    via: effectiveVia,
    intermediateStops: stopsList,
    dep,
    arr,
    busName,
    busType,
    seats,
    fare,
    journeyDate,
  });
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

    // Also remove from active local schedules (c2b_bus_schedules) including subsegments
    const raw = JSON.parse(localStorage.getItem('c2b_bus_schedules') || '[]');
    const filtered = raw.filter(
      (s) => s.id !== tripId && s.tripId !== tripId && s.parentTripId !== tripId && !String(s.id).startsWith(`${tripId}_SEG_`)
    );
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

  let buses = localSchedules.map((s, idx) => {
    const isSleeper = (s.busType || '').toLowerCase().includes('sleeper') && !(s.busType || '').toLowerCase().includes('semi');
    return {
      id:            s.id || s.tripId || `BUS_${idx}`,
      tripId:        s.tripId || s.id || `BUS_${idx}`,
      route:         s.from && s.to ? `${s.from} → ${s.to}` : 'Custom Route',
      from:          s.from || 'Origin',
      to:            s.to   || 'Destination',
      time:          `${s.departureTime || '08:00'} → ${s.arrivalTime || '12:00'}`,
      name:          s.busName || 'Express Bus',
      type:          s.busType || 'AC',
      total:         s.totalSeats || (isSleeper ? 30 : 40),
      fare:          s.fare || (isSleeper ? 1483 : 650),
      bookedSeatList: [],
      passengerMap:   {}, // seatId → { name, phone, bookingId, bookingDate, email }
    };
  });

  if (!buses.length) {
    buses = [
      { id: 'T001', tripId: 'T001', route: 'SriCity → Chennai', from: 'SriCity', to: 'Chennai', time: '06:00 → 09:30', name: 'Volvo A/C B12', type: 'Volvo AC', total: 40, fare: 650, bookedSeatList: ['A1', 'A2', 'C1'], passengerMap: { 'A1': { name: 'Priya Sharma', phone: '9876543210', gender: 'female', fare: 650, bookingId: 'BK-101', bookingDate: new Date().toISOString() }, 'A2': { name: 'Rahul Verma', phone: '9845123456', gender: 'male', fare: 650, bookingId: 'BK-102', bookingDate: new Date().toISOString() } } },
      { id: 'T002', tripId: 'T002', route: 'Tada → Vizag',      from: 'Tada',    to: 'Vizag',    time: '14:00 → 17:30', name: 'Scania AC',     type: 'Semi-Sleeper', total: 40, fare: 750, bookedSeatList: ['B1', 'B2'], passengerMap: {} },
      { id: 'T003', tripId: 'T003', route: 'Pune → Mumbai',     from: 'Pune',    to: 'Mumbai',   time: '20:00 → 23:30', name: 'Royal Sleeper AC',   type: 'Sleeper AC', total: 30, fare: 1483, bookedSeatList: ['L1', 'L3', 'U2'], passengerMap: { 'L1': { name: 'Ananya Rao', phone: '9988776655', gender: 'female', fare: 1483, bookingId: 'BK-301', bookingDate: new Date().toISOString() } } },
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
    let match = buses.find(
      (bus) =>
        (b.tripId && (bus.id === b.tripId || bus.tripId === b.tripId)) ||
        (b.busName && bus.name && (bus.name.toLowerCase() === b.busName.toLowerCase() || bus.name.toLowerCase().includes(b.busName.toLowerCase()) || b.busName.toLowerCase().includes(bus.name.toLowerCase()))) ||
        (b.from && b.to && bus.from && bus.to && bus.from.toLowerCase() === b.from.toLowerCase() && bus.to.toLowerCase() === b.to.toLowerCase())
    );
    if (!match) {
      const isSleeper = (b.busType || '').toLowerCase().includes('sleeper') && !(b.busType || '').toLowerCase().includes('semi');
      const newTripId = b.tripId || `BUS_${buses.length + 1}`;
      match = {
        id:            newTripId,
        tripId:        newTripId,
        route:         b.from && b.to ? `${b.from} → ${b.to}` : 'Custom Route',
        from:          b.from || 'Origin',
        to:            b.to   || 'Destination',
        time:          `${b.departureTime || '08:00'} → ${b.arrivalTime || '12:00'}`,
        name:          b.busName || 'Express Bus',
        type:          b.busType || 'AC',
        total:         b.totalSeats || (isSleeper ? 30 : 40),
        fare:          b.fare || (isSleeper ? 1483 : 650),
        bookedSeatList: [],
        passengerMap:   {},
      };
      buses.push(match);
    }
    if (match) {
      match.bookedSeatList.push(...seatArr);
      // Build passenger map keyed by seatId
      const passengerInfo = {
        name:        b.passengerName || b.name || b.userName || b.customerName || (Array.isArray(b.passengers) && b.passengers[0]?.name) || 'Passenger',
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

/* ── Blocked seats: get/set per trip ── */
export function getBlockedSeatsForTrip(tripId) {
  try {
    const all = JSON.parse(localStorage.getItem('c2b_blocked_seats') || '{}');
    return all[tripId] || [];
  } catch { return []; }
}

export function setBlockedSeatsForTrip(tripId, seatIds) {
  try {
    const all = JSON.parse(localStorage.getItem('c2b_blocked_seats') || '{}');
    all[tripId] = seatIds;
    localStorage.setItem('c2b_blocked_seats', JSON.stringify(all));
    try { window.dispatchEvent(new Event('storage')); } catch {}
    return true;
  } catch { return false; }
}

export function blockSeat(tripId, seatId) {
  const current = getBlockedSeatsForTrip(tripId);
  if (!current.includes(seatId)) {
    setBlockedSeatsForTrip(tripId, [...current, seatId]);
  }
}

export function unblockSeat(tripId, seatId, bookedSeatList = []) {
  // Never unblock a confirmed booking
  if (bookedSeatList.includes(seatId)) {
    throw new Error(`Seat ${seatId} has an active confirmed booking and cannot be unblocked.`);
  }
  const current = getBlockedSeatsForTrip(tripId);
  setBlockedSeatsForTrip(tripId, current.filter(s => s !== seatId));
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

  try {
    const bookings = JSON.parse(localStorage.getItem('c2b_bookings') || '[]');
    let changed = false;
    bookings.forEach((b) => {
      if (b.tripId === tripId || b.trip_id === tripId) {
        b.tripStatus = 'COMPLETED';
        b.completedAt = completions[tripId];
        changed = true;
      }
    });
    if (changed) {
      localStorage.setItem('c2b_bookings', JSON.stringify(bookings));
    }
  } catch (e) {}

  try {
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('c2b_sync', {
      detail: { type: 'TRIP_STATUS_UPDATED', tripId, status: 'COMPLETED' }
    }));
  } catch (e) {}
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
  'Adilabad',
  'Agra',
  'Ahmedabad',
  'Ajmer',
  'Alappuzha',
  'Amritsar',
  'Anantapur',
  'Aurangabad',
  'Bangalore',
  'Belgaum',
  'Bellary',
  'Bhavnagar',
  'Bhopal',
  'Bhubaneswar',
  'Calicut',
  'Chandigarh',
  'Chennai',
  'Chikmagalur',
  'Chittoor',
  'Coimbatore',
  'Cuttack',
  'Davanagere',
  'Dehradun',
  'Delhi',
  'Dindigul',
  'Eluru',
  'Erode',
  'Goa',
  'Gokarna',
  'Gulbarga',
  'Guntur',
  'Gurgaon',
  'Guwahati',
  'Gwalior',
  'Hampi',
  'Haridwar',
  'Hassan',
  'Hubli',
  'Hyderabad',
  'Indore',
  'Jabalpur',
  'Jaipur',
  'Jamnagar',
  'Jamshedpur',
  'Jodhpur',
  'Kadapa',
  'Kakinada',
  'Kannur',
  'Kanpur',
  'Kanyakumari',
  'Karimnagar',
  'Khammam',
  'Kochi',
  'Kodaikanal',
  'Kolhapur',
  'Kolkata',
  'Kollam',
  'Kota',
  'Kurnool',
  'Lucknow',
  'Ludhiana',
  'Madurai',
  'Mahabaleshwar',
  'Mahbubnagar',
  'Manali',
  'Mangalore',
  'Munnar',
  'Mumbai',
  'Mysore',
  'Nagpur',
  'Nalgonda',
  'Nashik',
  'Nellore',
  'Nizamabad',
  'Noida',
  'Ongole',
  'Ooty',
  'Palakkad',
  'Patna',
  'Pondicherry',
  'Prayagraj',
  'Pune',
  'Puri',
  'Raipur',
  'Rajahmundry',
  'Rajkot',
  'Ramagundam',
  'Rameswaram',
  'Ranchi',
  'Rishikesh',
  'Salem',
  'Shimla',
  'Shimoga',
  'Shirdi',
  'Siliguri',
  'Solapur',
  'SriCity',
  'Surat',
  'Suryapet',
  'Tada',
  'Thanjavur',
  'Thiruvananthapuram',
  'Thrissur',
  'Tiruchirappalli',
  'Tirunelveli',
  'Tirupati',
  'Udaipur',
  'Udupi',
  'Vadodara',
  'Varanasi',
  'Vellore',
  'Vijayawada',
  'Visakhapatnam',
  'Vizianagaram',
  'Warangal',
  'Wayanad',
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

/* ── OpenStreetMap Nominatim Live Search & Location Management ── */

export async function searchOsmLocations(query) {
  const clean = (query || '').trim();
  if (!clean || clean.length < 2) return [];

  // 1. Try NestJS backend proxy first (enforces caching, rate limiting, India filter)
  try {
    const res = await spFetch(`/locations/osm-search?query=${encodeURIComponent(clean)}`);
    const items = Array.isArray(res) ? res : res.data || [];
    if (items.length > 0) return items;
  } catch (e) {
    console.info('Backend /locations/osm-search note (using client fallback):', e?.message);
  }

  // 2. Client fallback with session cache to respect Nominatim policy
  const cacheKey = `c2b_osm_${clean.toLowerCase()}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {}
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      clean,
    )}&format=json&addressdetails=1&countrycodes=in&limit=8&accept-language=en`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Click2Book-BusReservationSystem/1.0 (contact: admin@click2book.local)',
        Accept: 'application/json',
      },
    });

    if (res.ok) {
      const raw = await res.json();
      const approved = getApprovedCities();
      const pendingReqs = getDestinationRequests();

      const formatted = raw.map((item) => {
        const addr = item.address || {};
        const name =
          addr.city ||
          addr.town ||
          addr.village ||
          addr.bus_stop ||
          addr.suburb ||
          item.name ||
          item.display_name.split(',')[0].trim();

        const isApproved = approved.some((c) => c.toLowerCase() === name.toLowerCase());
        const hasPending = pendingReqs.some(
          (r) =>
            (r.cityName?.toLowerCase() === name.toLowerCase() || String(r.osmId) === String(item.osm_id)) &&
            r.status === 'PENDING',
        );

        let locType = item.type || item.class || 'town';
        if (item.class === 'highway' && item.type === 'bus_stop') locType = 'bus_stop';
        if (addr.bus_stop) locType = 'bus_stop';

        return {
          name,
          displayName: item.display_name,
          osmId: String(item.osm_id),
          osmType: item.osm_type || 'node',
          locationType: locType,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          state: addr.state || '',
          address: addr,
          isAlreadyApproved: isApproved,
          hasPendingRequest: hasPending,
        };
      });

      sessionStorage.setItem(cacheKey, JSON.stringify(formatted));
      return formatted;
    }
  } catch {}

  // 3. Fallback: match local approved cities
  const approved = getApprovedCities();
  return approved
    .filter((c) => c.toLowerCase().includes(clean.toLowerCase()))
    .map((c) => ({
      name: c,
      displayName: `${c}, India`,
      osmId: '7998900',
      locationType: 'city',
      latitude: 17.0,
      longitude: 78.0,
      isAlreadyApproved: true,
      hasPendingRequest: false,
    }));
}

export async function submitOsmLocationRequest({
  osmId,
  osmType = 'node',
  cityName,
  displayName,
  locationType = 'city',
  latitude,
  longitude,
  state = 'Andhra Pradesh',
  hubType,
  connectingRoutes = '',
  reason = 'New operational corridor demand',
  address = {},
}) {
  const cleanCity = (cityName || '').trim();
  if (!cleanCity) throw new Error('Location name is required.');
  if (!osmId) throw new Error('OpenStreetMap ID is required. Please select a verified location from the search suggestions.');

  const approved = getApprovedCities();
  if (approved.some((c) => c.toLowerCase() === cleanCity.toLowerCase())) {
    throw new Error(`"${cleanCity}" is already an approved destination in the platform network.`);
  }

  const requests = getDestinationRequests();
  const pending = requests.find(
    (r) =>
      (r.cityName?.toLowerCase() === cleanCity.toLowerCase() || String(r.osmId) === String(osmId)) &&
      r.status === 'PENDING',
  );
  if (pending) {
    throw new Error(`A request for "${cleanCity}" (OSM ID: ${osmId}) is already pending admin review.`);
  }

  const loggedId = sessionStorage.getItem('c2b_loggedInId') || localStorage.getItem('c2b_loggedInId') || 'P001';
  const loggedName = localStorage.getItem('c2b_userName') || 'Kiran Travels';

  const newReq = {
    requestId: `REQ_${Date.now()}`,
    osmId: String(osmId),
    osmType,
    cityName: cleanCity,
    name: cleanCity,
    displayName: displayName || `${cleanCity}, ${state}, India`,
    locationType: locationType || hubType || 'city',
    hubType: hubType || locationType || 'Major Town / District Hub',
    latitude: Number(latitude) || 0,
    longitude: Number(longitude) || 0,
    state,
    address,
    connectingRoutes: (connectingRoutes || '').trim(),
    reason: (reason || '').trim() || 'New operational corridor demand',
    providerId: loggedId,
    providerName: loggedName,
    status: 'PENDING',
    submittedAt: new Date().toISOString(),
  };

  requests.unshift(newReq);
  localStorage.setItem('c2b_destination_requests', JSON.stringify(requests));

  // Sync to NestJS backend if available
  try {
    await spFetch('/locations/requests', {
      method: 'POST',
      body: JSON.stringify({
        osmId: String(osmId),
        osmType,
        name: cleanCity,
        displayName: newReq.displayName,
        locationType: newReq.locationType,
        latitude: newReq.latitude,
        longitude: newReq.longitude,
        address,
        state,
        providerId: loggedId,
        providerName: loggedName,
        connectingRoutes: newReq.connectingRoutes,
        reason: newReq.reason,
      }),
    });
  } catch (e) {
    console.info('Backend /locations/requests sync note (saved locally):', e?.message);
  }

  try {
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('c2b_sync', { detail: { type: 'LOCATION_REQUEST_CREATED', payload: newReq } }));
  } catch {}

  return newReq;
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

/* ──────────────────────────────────────────────────────────
   Feature: Route Corridor Selection & Intermediate Bus Stops
   Coordinates Database, Discovery Engine, Stop Suggestions &
   Strict Route Progress Validation
   ────────────────────────────────────────────────────────── */

export const CITY_COORDINATES = {
  'chennai': { name: 'Chennai', lat: 13.0827, lng: 80.2707, state: 'Tamil Nadu' },
  'cmbt koyambedu': { name: 'CMBT Koyambedu', lat: 13.0694, lng: 80.2057, state: 'Tamil Nadu' },
  'tada': { name: 'Tada', lat: 13.5937, lng: 80.0335, state: 'Andhra Pradesh' },
  'sricity': { name: 'SriCity', lat: 13.5300, lng: 80.0300, state: 'Andhra Pradesh' },
  'sullurpeta': { name: 'Sullurpeta', lat: 13.7008, lng: 80.0210, state: 'Andhra Pradesh' },
  'nayudupeta': { name: 'Nayudupeta', lat: 13.9056, lng: 79.9026, state: 'Andhra Pradesh' },
  'gudur': { name: 'Gudur', lat: 14.1463, lng: 79.8504, state: 'Andhra Pradesh' },
  'nellore': { name: 'Nellore', lat: 14.4426, lng: 79.9865, state: 'Andhra Pradesh' },
  'kavali': { name: 'Kavali', lat: 14.9132, lng: 79.9930, state: 'Andhra Pradesh' },
  'singarayakonda': { name: 'Singarayakonda', lat: 15.2500, lng: 80.0300, state: 'Andhra Pradesh' },
  'ongole': { name: 'Ongole', lat: 15.5057, lng: 80.0499, state: 'Andhra Pradesh' },
  'chirala': { name: 'Chirala', lat: 15.8246, lng: 80.3521, state: 'Andhra Pradesh' },
  'bapatla': { name: 'Bapatla', lat: 15.9042, lng: 80.4674, state: 'Andhra Pradesh' },
  'chilakaluripet': { name: 'Chilakaluripet', lat: 16.0892, lng: 80.1672, state: 'Andhra Pradesh' },
  'guntur': { name: 'Guntur', lat: 16.3067, lng: 80.4365, state: 'Andhra Pradesh' },
  'vijayawada': { name: 'Vijayawada', lat: 16.5062, lng: 80.6480, state: 'Andhra Pradesh' },
  'eluru': { name: 'Eluru', lat: 16.7107, lng: 81.0952, state: 'Andhra Pradesh' },
  'rajahmundry': { name: 'Rajahmundry', lat: 17.0005, lng: 81.8040, state: 'Andhra Pradesh' },
  'visakhapatnam': { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185, state: 'Andhra Pradesh' },
  'tiruvallur': { name: 'Tiruvallur', lat: 13.1432, lng: 79.9083, state: 'Tamil Nadu' },
  'tiruttani': { name: 'Tiruttani', lat: 13.1764, lng: 79.6102, state: 'Tamil Nadu' },
  'nagari': { name: 'Nagari', lat: 13.3308, lng: 79.5843, state: 'Andhra Pradesh' },
  'puttur': { name: 'Puttur', lat: 13.4414, lng: 79.5539, state: 'Andhra Pradesh' },
  'renigunta': { name: 'Renigunta', lat: 13.6333, lng: 79.5167, state: 'Andhra Pradesh' },
  'tirupati': { name: 'Tirupati', lat: 13.6288, lng: 79.4192, state: 'Andhra Pradesh' },
  'srikalahasti': { name: 'Srikalahasti', lat: 13.7500, lng: 79.7000, state: 'Andhra Pradesh' },
  'bangalore': { name: 'Bangalore', lat: 12.9716, lng: 77.5946, state: 'Karnataka' },
  'hosur': { name: 'Hosur', lat: 12.7409, lng: 77.8253, state: 'Tamil Nadu' },
  'krishnagiri': { name: 'Krishnagiri', lat: 12.5186, lng: 78.2138, state: 'Tamil Nadu' },
  'ambur': { name: 'Ambur', lat: 12.7904, lng: 78.7166, state: 'Tamil Nadu' },
  'vellore': { name: 'Vellore', lat: 12.9165, lng: 79.1325, state: 'Tamil Nadu' },
  'ranipet': { name: 'Ranipet', lat: 12.9272, lng: 79.3330, state: 'Tamil Nadu' },
  'kanchipuram': { name: 'Kanchipuram', lat: 12.8342, lng: 79.7036, state: 'Tamil Nadu' },
  'sriperumbudur': { name: 'Sriperumbudur', lat: 12.9691, lng: 79.9416, state: 'Tamil Nadu' },
  'kolar': { name: 'Kolar', lat: 13.1367, lng: 78.1340, state: 'Karnataka' },
  'mulbagal': { name: 'Mulbagal', lat: 13.1639, lng: 78.3966, state: 'Karnataka' },
  'palamaner': { name: 'Palamaner', lat: 13.2000, lng: 78.7500, state: 'Andhra Pradesh' },
  'chittoor': { name: 'Chittoor', lat: 13.2172, lng: 79.1003, state: 'Andhra Pradesh' },
  'hyderabad': { name: 'Hyderabad', lat: 17.3850, lng: 78.4867, state: 'Telangana' },
  'suryapet': { name: 'Suryapet', lat: 17.1439, lng: 79.6239, state: 'Telangana' },
  'kodad': { name: 'Kodad', lat: 16.9961, lng: 79.9678, state: 'Telangana' },
  'nandigama': { name: 'Nandigama', lat: 16.7667, lng: 80.3000, state: 'Andhra Pradesh' },
  'mumbai': { name: 'Mumbai', lat: 19.0760, lng: 72.8777, state: 'Maharashtra' },
  'pune': { name: 'Pune', lat: 18.5204, lng: 73.8567, state: 'Maharashtra' },
  'lonavala': { name: 'Lonavala', lat: 18.7557, lng: 73.4091, state: 'Maharashtra' },
  'khandala': { name: 'Khandala', lat: 18.7614, lng: 73.3748, state: 'Maharashtra' },
  'panvel': { name: 'Panvel', lat: 18.9894, lng: 73.1175, state: 'Maharashtra' },
  'navi mumbai': { name: 'Navi Mumbai', lat: 19.0330, lng: 73.0297, state: 'Maharashtra' },
};

export function getCityCoords(name) {
  if (!name) return null;
  const key = String(name).trim().toLowerCase();
  return CITY_COORDINATES[key] || null;
}

// Haversine distance in kilometers
export function calculateGeoDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/* ── Registered Provider Fleet for Step 1 ── */
export function getRegisteredBuses() {
  return [
    {
      vehicleNumber: 'AP 03 TC 1001',
      busName: 'Volvo A/C Multi-Axle B12',
      busType: 'Volvo AC',
      totalSeats: 40,
      seatingType: '2+2 Pushback / Semi-Sleeper',
      amenities: ['WiFi', 'AC', 'USB Charging', 'Blankets', 'Emergency Exit'],
      rating: 4.8,
      status: 'Active',
    },
    {
      vehicleNumber: 'AP 03 TC 2002',
      busName: 'Scania Touring HD Luxury',
      busType: 'AC Seater',
      totalSeats: 45,
      seatingType: '2+2 Ergonomic Recliner',
      amenities: ['AC', 'USB Charging', 'Water Bottle', 'Luggage Compartment'],
      rating: 4.6,
      status: 'Active',
    },
    {
      vehicleNumber: 'AP 03 TC 3003',
      busName: 'Mercedes-Benz Super Luxury',
      busType: 'Sleeper AC',
      totalSeats: 36,
      seatingType: '2+1 Sleeper Berths',
      amenities: ['AC', 'Personal TV', 'Reading Lights', 'Pillow & Blanket'],
      rating: 4.9,
      status: 'Active',
    },
    {
      vehicleNumber: 'AP 03 TC 4004',
      busName: 'Ashok Leyland Viking Express',
      busType: 'Non-AC',
      totalSeats: 48,
      seatingType: '2+2 Standard Seater',
      amenities: ['Overhead Luggage Rack', 'Emergency Exits', 'First Aid'],
      rating: 4.3,
      status: 'Active',
    },
    {
      vehicleNumber: 'AP 03 TC 5005',
      busName: 'BharatBenz High-Deck Coach',
      busType: 'Semi-Sleeper',
      totalSeats: 40,
      seatingType: '2+2 Semi-Sleeper Recliners',
      amenities: ['AC', 'Reclining Seats', 'Ambient Lighting', 'WiFi'],
      rating: 4.7,
      status: 'Active',
    },
  ];
}

/* ── Verified Indian Corridor Presets ── */
const CORRIDOR_PRESET_DB = {
  'chennai|guntur': [
    {
      corridorId: 'CORR_CHN_GNT_A',
      name: 'Corridor A: NH16 Coastal Corridor (via Tada - Nellore - Kavali - Ongole - Chirala - Bapatla)',
      highway: 'NH16 Expressway',
      distance: 415,
      duration: '6h 45m',
      durationMinutes: 405,
      description: 'Primary coastal national highway route via NH16 with 4-lane expressway, modern toll bypasses, and major RTC transit terminals.',
      majorTowns: ['Tada', 'Nayudupeta', 'Gudur', 'Nellore', 'Kavali', 'Singarayakonda', 'Ongole', 'Chirala', 'Bapatla'],
      polyline: [
        [13.0827, 80.2707], [13.5937, 80.0335], [13.9056, 79.9026], [14.1463, 79.8504],
        [14.4426, 79.9865], [14.9132, 79.9930], [15.2500, 80.0300], [15.5057, 80.0499],
        [15.8246, 80.3521], [15.9042, 80.4674], [16.3067, 80.4365]
      ],
      suggestedCities: [
        { name: 'Tada', lat: 13.5937, lng: 80.0335, type: 'city' },
        { name: 'Nayudupeta', lat: 13.9056, lng: 79.9026, type: 'city' },
        { name: 'Nellore', lat: 14.4426, lng: 79.9865, type: 'city' },
        { name: 'Kavali', lat: 14.9132, lng: 79.9930, type: 'city' },
        { name: 'Ongole', lat: 15.5057, lng: 80.0499, type: 'city' },
        { name: 'Chirala', lat: 15.8246, lng: 80.3521, type: 'city' },
        { name: 'Bapatla', lat: 15.9042, lng: 80.4674, type: 'city' },
      ],
      suggestedBoardingPoints: [
        { name: 'CMBT Koyambedu Bus Terminus', lat: 13.0694, lng: 80.2057, type: 'bus_station', boardingPoint: 'Platform 6, CMBT Intercity Terminal', droppingPoint: 'CMBT Koyambedu Roundtana' },
        { name: 'Tada Toll Gate Junction', lat: 13.5937, lng: 80.0335, type: 'bus_station', boardingPoint: 'Tada NH16 Highway Bus Bay', droppingPoint: 'Tada Toll Gate Service Road' },
        { name: 'Nayudupeta RTC Bus Station', lat: 13.9056, lng: 79.9026, type: 'bus_station', boardingPoint: 'APSRTC Bus Station Bay 1', droppingPoint: 'Highway Bypass Flyover' },
        { name: 'Nellore RTC Central Bus Stand', lat: 14.4426, lng: 79.9865, type: 'bus_station', boardingPoint: 'RTC Central Bus Complex Platform 4', droppingPoint: 'Nellore Mini Bypass Junction' },
        { name: 'Kavali RTC Bus Complex', lat: 14.9132, lng: 79.9930, type: 'bus_station', boardingPoint: 'RTC Complex Main Entrance', droppingPoint: 'Kavali Highway Bypass' },
        { name: 'Ongole New RTC Bus Stand', lat: 15.5057, lng: 80.0499, type: 'bus_station', boardingPoint: 'New RTC Stand Kurnool Road', droppingPoint: 'Ongole South Bypass Flyover' },
        { name: 'Chirala Railway Station Road Terminal', lat: 15.8246, lng: 80.3521, type: 'bus_station', boardingPoint: 'Railway Station Road Bus Stand', droppingPoint: 'Chirala Bypass Junction' },
        { name: 'Bapatla Town Clock Tower Stand', lat: 15.9042, lng: 80.4674, type: 'bus_station', boardingPoint: 'Town Clock Tower RTC Stop', droppingPoint: 'Bapatla Bypass Cross' },
        { name: 'Guntur NTR RTC Bus Station', lat: 16.3067, lng: 80.4365, type: 'bus_station', boardingPoint: 'NTR Bus Station Platform 12', droppingPoint: 'Guntur Auto Nagar Drop Point' },
      ],
    },
    {
      corridorId: 'CORR_CHN_GNT_B',
      name: 'Corridor B: Inland Highway (via Tiruvallur - Tiruttani - Nagari - Puttur - Nellore)',
      highway: 'SH57 / NH716',
      distance: 448,
      duration: '8h 15m',
      durationMinutes: 495,
      description: 'Regional inland highway connecting western Tamil Nadu towns and Chittoor borders before rejoining NH16 at Nellore.',
      majorTowns: ['Tiruvallur', 'Tiruttani', 'Nagari', 'Puttur', 'Nellore', 'Kavali', 'Ongole', 'Chilakaluripet'],
      polyline: [
        [13.0827, 80.2707], [13.1432, 79.9083], [13.1764, 79.6102], [13.3308, 79.5843],
        [13.4414, 79.5539], [14.4426, 79.9865], [14.9132, 79.9930], [15.5057, 80.0499],
        [16.0892, 80.1672], [16.3067, 80.4365]
      ],
      suggestedCities: [
        { name: 'Tiruvallur', lat: 13.1432, lng: 79.9083, type: 'city' },
        { name: 'Tiruttani', lat: 13.1764, lng: 79.6102, type: 'city' },
        { name: 'Nagari', lat: 13.3308, lng: 79.5843, type: 'city' },
        { name: 'Puttur', lat: 13.4414, lng: 79.5539, type: 'city' },
        { name: 'Nellore', lat: 14.4426, lng: 79.9865, type: 'city' },
        { name: 'Ongole', lat: 15.5057, lng: 80.0499, type: 'city' },
        { name: 'Chilakaluripet', lat: 16.0892, lng: 80.1672, type: 'city' },
      ],
      suggestedBoardingPoints: [
        { name: 'Tiruvallur Head Bus Depot', lat: 13.1432, lng: 79.9083, type: 'bus_station', boardingPoint: 'Head Bus Depot Bay 2', droppingPoint: 'Tiruvallur Bypass' },
        { name: 'Tiruttani Bypass Circle', lat: 13.1764, lng: 79.6102, type: 'bus_station', boardingPoint: 'RTC Stand Main Bay', droppingPoint: 'Tiruttani Bypass' },
        { name: 'Nagari RTC Stand', lat: 13.3308, lng: 79.5843, type: 'bus_station', boardingPoint: 'Nagari RTC Bus Stand', droppingPoint: 'Nagari Checkpost' },
        { name: 'Puttur Checkpost Bus Bay', lat: 13.4414, lng: 79.5539, type: 'bus_station', boardingPoint: 'Puttur Town RTC Station', droppingPoint: 'Checkpost Drop Bay' },
        { name: 'Nellore Mini Bypass Junction', lat: 14.4480, lng: 79.9800, type: 'bus_station', boardingPoint: 'Nellore Mini Bypass', droppingPoint: 'Mini Bypass Flyover' },
        { name: 'Ongole Bypass Flyover Point', lat: 15.5100, lng: 80.0450, type: 'bus_station', boardingPoint: 'Ongole South Highway Point', droppingPoint: 'Bypass Flyover Point' },
        { name: 'Chilakaluripet Clock Tower Stop', lat: 16.0892, lng: 80.1672, type: 'bus_station', boardingPoint: 'Clock Tower RTC Point', droppingPoint: 'Chilakaluripet Bypass Toll' },
      ],
    },
    {
      corridorId: 'CORR_CHN_GNT_C',
      name: 'Corridor C: Western Rayalaseema Link (via Srikalahasti - Gudur)',
      highway: 'SH61 / NH16',
      distance: 432,
      duration: '7h 50m',
      durationMinutes: 470,
      description: 'Inland pilgrim & industrial route via Srikalahasti temple corridor and Gudur bypass connecting to Guntur.',
      majorTowns: ['Gummidipoondi', 'Srikalahasti', 'Gudur', 'Nellore', 'Ongole', 'Chilakaluripet'],
      polyline: [
        [13.0827, 80.2707], [13.4077, 80.1255], [13.7500, 79.7000], [14.1463, 79.8504],
        [14.4426, 79.9865], [15.5057, 80.0499], [16.0892, 80.1672], [16.3067, 80.4365]
      ],
      suggestedCities: [
        { name: 'Gummidipoondi', lat: 13.4077, lng: 80.1255, type: 'city' },
        { name: 'Srikalahasti', lat: 13.7500, lng: 79.7000, type: 'city' },
        { name: 'Gudur', lat: 14.1463, lng: 79.8504, type: 'city' },
        { name: 'Nellore', lat: 14.4426, lng: 79.9865, type: 'city' },
        { name: 'Ongole', lat: 15.5057, lng: 80.0499, type: 'city' },
        { name: 'Chilakaluripet', lat: 16.0892, lng: 80.1672, type: 'city' },
      ],
      suggestedBoardingPoints: [
        { name: 'Gummidipoondi SIPCOT Bus Stop', lat: 13.4077, lng: 80.1255, type: 'bus_station', boardingPoint: 'SIPCOT Industrial Gate', droppingPoint: 'Railway Station Road' },
        { name: 'Srikalahasti Temple RTC Bus Stop', lat: 13.7500, lng: 79.7000, type: 'bus_station', boardingPoint: 'Temple Car Street Stand', droppingPoint: 'Srikalahasti Bypass' },
        { name: 'Gudur Railway Station Circle', lat: 14.1463, lng: 79.8504, type: 'bus_station', boardingPoint: 'Railway Station Circle Stand', droppingPoint: 'Gudur Old Bus Stand' },
        { name: 'Nellore Atmakur Bus Stand', lat: 14.4410, lng: 79.9820, type: 'bus_station', boardingPoint: 'Atmakur Bus Stand Platform 1', droppingPoint: 'Highway Junction' },
        { name: 'Ongole South Bypass Point', lat: 15.4950, lng: 80.0420, type: 'bus_station', boardingPoint: 'South Bypass Junction', droppingPoint: 'Kurnool Road Flyover' },
      ],
    },
  ],

  'chennai|ongole': [
    {
      corridorId: 'CORR_CHN_ONG_A',
      name: 'Corridor A: NH16 Direct Coastal Express (via Tada - Nellore - Kavali)',
      highway: 'NH16 Expressway',
      distance: 298,
      duration: '5h 15m',
      durationMinutes: 315,
      description: 'High-speed 4-lane expressway along the Bay of Bengal coastline with minimal town diversions.',
      majorTowns: ['Tada', 'Nayudupeta', 'Gudur', 'Nellore', 'Kavali', 'Singarayakonda'],
      polyline: [
        [13.0827, 80.2707], [13.5937, 80.0335], [13.9056, 79.9026], [14.1463, 79.8504],
        [14.4426, 79.9865], [14.9132, 79.9930], [15.2500, 80.0300], [15.5057, 80.0499]
      ],
      suggestedCities: [
        { name: 'Tada', lat: 13.5937, lng: 80.0335, type: 'city' },
        { name: 'Nayudupeta', lat: 13.9056, lng: 79.9026, type: 'city' },
        { name: 'Nellore', lat: 14.4426, lng: 79.9865, type: 'city' },
        { name: 'Kavali', lat: 14.9132, lng: 79.9930, type: 'city' },
      ],
      suggestedBoardingPoints: [
        { name: 'CMBT Koyambedu Terminal', lat: 13.0694, lng: 80.2057, type: 'bus_station', boardingPoint: 'CMBT Platform 8', droppingPoint: 'Koyambedu Roundtana' },
        { name: 'Nayudupeta Bus Stand', lat: 13.9056, lng: 79.9026, type: 'bus_station', boardingPoint: 'APSRTC Bay 1', droppingPoint: 'Highway Flyover' },
        { name: 'Nellore RTC Central Stand', lat: 14.4426, lng: 79.9865, type: 'bus_station', boardingPoint: 'RTC Central Complex', droppingPoint: 'Mini Bypass Flyover' },
        { name: 'Kavali RTC Bus Stand', lat: 14.9132, lng: 79.9930, type: 'bus_station', boardingPoint: 'RTC Main Gate', droppingPoint: 'Kavali Bypass' },
        { name: 'Ongole New RTC Stand', lat: 15.5057, lng: 80.0499, type: 'bus_station', boardingPoint: 'Kurnool Road Stand', droppingPoint: 'South Bypass Drop' },
      ],
    },
    {
      corridorId: 'CORR_CHN_ONG_B',
      name: 'Corridor B: Inland Highway (via Tiruvallur - Renigunta - Gudur)',
      highway: 'SH57 / NH716',
      distance: 326,
      duration: '6h 10m',
      durationMinutes: 370,
      description: 'Inland transit route catering to passengers from western Chennai suburbs, Renigunta, and Nellore.',
      majorTowns: ['Tiruvallur', 'Tiruttani', 'Nagari', 'Renigunta', 'Gudur', 'Nellore', 'Kavali'],
      polyline: [
        [13.0827, 80.2707], [13.1432, 79.9083], [13.1764, 79.6102], [13.6333, 79.5167],
        [14.1463, 79.8504], [14.4426, 79.9865], [14.9132, 79.9930], [15.5057, 80.0499]
      ],
      suggestedCities: [
        { name: 'Tiruvallur', lat: 13.1432, lng: 79.9083, type: 'city' },
        { name: 'Tiruttani', lat: 13.1764, lng: 79.6102, type: 'city' },
        { name: 'Renigunta', lat: 13.6333, lng: 79.5167, type: 'city' },
        { name: 'Nellore', lat: 14.4426, lng: 79.9865, type: 'city' },
        { name: 'Kavali', lat: 14.9132, lng: 79.9930, type: 'city' },
      ],
      suggestedBoardingPoints: [
        { name: 'Tiruvallur Bus Depot', lat: 13.1432, lng: 79.9083, type: 'bus_station', boardingPoint: 'Tiruvallur Bus Stand', droppingPoint: 'Depot Gate' },
        { name: 'Renigunta Railway Stand', lat: 13.6333, lng: 79.5167, type: 'bus_station', boardingPoint: 'Renigunta Circle Stand', droppingPoint: 'Railway Station Road' },
        { name: 'Nellore Mini Bypass Stand', lat: 14.4480, lng: 79.9800, type: 'bus_station', boardingPoint: 'Mini Bypass Junction', droppingPoint: 'Bypass Flyover' },
      ],
    },
  ],

  'bangalore|chennai': [
    {
      corridorId: 'CORR_BLR_CHN_A',
      name: 'Corridor A: Golden Quadrilateral (via Hosur - Krishnagiri - Vellore)',
      highway: 'NH44 / NH48',
      distance: 345,
      duration: '5h 45m',
      durationMinutes: 345,
      description: 'Major 6-lane national highway through industrial hubs of Hosur, Ambur, Vellore, and Kanchipuram.',
      majorTowns: ['Hosur', 'Krishnagiri', 'Ambur', 'Vellore', 'Ranipet', 'Kanchipuram', 'Sriperumbudur'],
      polyline: [
        [12.9716, 77.5946], [12.7409, 77.8253], [12.5186, 78.2138], [12.7904, 78.7166],
        [12.9165, 79.1325], [12.9272, 79.3330], [12.8342, 79.7036], [12.9691, 79.9416], [13.0827, 80.2707]
      ],
      suggestedCities: [
        { name: 'Hosur', lat: 12.7409, lng: 77.8253, type: 'city' },
        { name: 'Krishnagiri', lat: 12.5186, lng: 78.2138, type: 'city' },
        { name: 'Vellore', lat: 12.9165, lng: 79.1325, type: 'city' },
        { name: 'Kanchipuram', lat: 12.8342, lng: 79.7036, type: 'city' },
        { name: 'Sriperumbudur', lat: 12.9691, lng: 79.9416, type: 'city' },
      ],
      suggestedBoardingPoints: [
        { name: 'Kempegowda Majestic Stand', lat: 12.9716, lng: 77.5946, type: 'bus_station', boardingPoint: 'Majestic Intercity Platform 1', droppingPoint: 'Kempegowda Circle' },
        { name: 'Hosur Bus Stand', lat: 12.7409, lng: 77.8253, type: 'bus_station', boardingPoint: 'Hosur Central Stand', droppingPoint: 'Hosur Toll Gate' },
        { name: 'Vellore New Bus Stand', lat: 12.9165, lng: 79.1325, type: 'bus_station', boardingPoint: 'Katpadi Road Bus Stand', droppingPoint: 'Green Circle Vellore' },
        { name: 'Kanchipuram Bypass', lat: 12.8342, lng: 79.7036, type: 'bus_station', boardingPoint: 'Bypass Highway Stop', droppingPoint: 'Kanchi Checkpost' },
        { name: 'CMBT Koyambedu Stand', lat: 13.0694, lng: 80.2057, type: 'bus_station', boardingPoint: 'CMBT Terminal', droppingPoint: 'Koyambedu Roundtana' },
      ],
    },
    {
      corridorId: 'CORR_BLR_CHN_B',
      name: 'Corridor B: Old Madras Road (via Kolar - Chittoor - Ranipet)',
      highway: 'NH75 / NH69',
      distance: 328,
      duration: '6h 00m',
      durationMinutes: 360,
      description: 'Historic route via Kolar and Chittoor connecting to Ranipet and Chennai.',
      majorTowns: ['Kolar', 'Mulbagal', 'Palamaner', 'Chittoor', 'Ranipet', 'Sriperumbudur'],
      polyline: [
        [12.9716, 77.5946], [13.1367, 78.1340], [13.1639, 78.3966], [13.2000, 78.7500],
        [13.2172, 79.1003], [12.9272, 79.3330], [12.9691, 79.9416], [13.0827, 80.2707]
      ],
      suggestedCities: [
        { name: 'Kolar', lat: 13.1367, lng: 78.1340, type: 'city' },
        { name: 'Chittoor', lat: 13.2172, lng: 79.1003, type: 'city' },
        { name: 'Ranipet', lat: 12.9272, lng: 79.3330, type: 'city' },
        { name: 'Sriperumbudur', lat: 12.9691, lng: 79.9416, type: 'city' },
      ],
      suggestedBoardingPoints: [
        { name: 'Tin Factory Bus Stop', lat: 12.9900, lng: 77.6600, type: 'bus_station', boardingPoint: 'Tin Factory Footover Bridge', droppingPoint: 'Tin Factory Circle' },
        { name: 'Chittoor RTC Central Depot', lat: 13.2172, lng: 79.1003, type: 'bus_station', boardingPoint: 'Chittoor RTC Central', droppingPoint: 'Highway Bypass' },
      ],
    },
  ],

  'mumbai|pune': [
    {
      corridorId: 'CORR_BOM_PNQ_A',
      name: 'Corridor A: Mumbai-Pune Expressway (via Panvel - Lonavala)',
      highway: 'Yashwantrao Chavan Expressway',
      distance: 148,
      duration: '3h 15m',
      durationMinutes: 195,
      description: 'Access-controlled 6-lane toll expressway via Khandala Ghat and Lonavala bypass.',
      majorTowns: ['Navi Mumbai', 'Panvel', 'Lonavala', 'Talegaon'],
      polyline: [
        [19.0760, 72.8777], [19.0330, 73.0297], [18.9894, 73.1175], [18.7557, 73.4091], [18.5204, 73.8567]
      ],
      suggestedCities: [
        { name: 'Navi Mumbai', lat: 19.0330, lng: 73.0297, type: 'city' },
        { name: 'Panvel', lat: 18.9894, lng: 73.1175, type: 'city' },
        { name: 'Lonavala', lat: 18.7557, lng: 73.4091, type: 'city' },
      ],
      suggestedBoardingPoints: [
        { name: 'Dadar Asiad Bus Stand', lat: 19.0178, lng: 72.8478, type: 'bus_station', boardingPoint: 'Dadar TT Circle Asiad Stand', droppingPoint: 'Dadar Station' },
        { name: 'Vashi Plaza Bus Stop', lat: 19.0667, lng: 72.9972, type: 'bus_station', boardingPoint: 'Vashi Highway Plaza', droppingPoint: 'Vashi Station' },
        { name: 'Lonavala Center Point', lat: 18.7557, lng: 73.4091, type: 'bus_station', boardingPoint: 'Kumar Resort Lonavala', droppingPoint: 'Expressway Food Mall' },
        { name: 'Pune Swargate Bus Stand', lat: 18.5018, lng: 73.8580, type: 'bus_station', boardingPoint: 'Swargate MSRTC Complex', droppingPoint: 'Swargate Flyover' },
      ],
    },
    {
      corridorId: 'CORR_BOM_PNQ_B',
      name: 'Corridor B: Old Mumbai-Pune Highway (via Khandala & Khopoli)',
      highway: 'NH48 (Old Route)',
      distance: 162,
      duration: '4h 15m',
      durationMinutes: 255,
      description: 'Traditional scenic highway passing through Khopoli, Khandala, and Dehu Road.',
      majorTowns: ['Thane', 'Panvel', 'Khandala', 'Lonavala'],
      polyline: [
        [19.0760, 72.8777], [18.9894, 73.1175], [18.7614, 73.3748], [18.7557, 73.4091], [18.5204, 73.8567]
      ],
      suggestedCities: [
        { name: 'Panvel', lat: 18.9894, lng: 73.1175, type: 'city' },
        { name: 'Khandala', lat: 18.7614, lng: 73.3748, type: 'city' },
        { name: 'Lonavala', lat: 18.7557, lng: 73.4091, type: 'city' },
      ],
      suggestedBoardingPoints: [
        { name: 'Panvel Bus Stand', lat: 18.9894, lng: 73.1175, type: 'bus_station', boardingPoint: 'Panvel ST Stand', droppingPoint: 'Palaspa Phata' },
      ],
    },
  ],

  'hyderabad|vijayawada': [
    {
      corridorId: 'CORR_HYD_BZA_A',
      name: 'Corridor A: NH65 Express Corridor (via Suryapet - Kodad - Nandigama)',
      highway: 'NH65 Expressway',
      distance: 275,
      duration: '4h 45m',
      durationMinutes: 285,
      description: 'Direct 4-lane expressway connecting Hyderabad capital with Amaravati / Vijayawada commercial hub.',
      majorTowns: ['Suryapet', 'Kodad', 'Nandigama'],
      polyline: [
        [17.3850, 78.4867], [17.1439, 79.6239], [16.9961, 79.9678], [16.7667, 80.3000], [16.5062, 80.6480]
      ],
      suggestedCities: [
        { name: 'Suryapet', lat: 17.1439, lng: 79.6239, type: 'city' },
        { name: 'Kodad', lat: 16.9961, lng: 79.9678, type: 'city' },
        { name: 'Nandigama', lat: 16.7667, lng: 80.3000, type: 'city' },
      ],
      suggestedBoardingPoints: [
        { name: 'MGBS Imlibun Bus Station', lat: 17.3789, lng: 78.4816, type: 'bus_station', boardingPoint: 'Platform 34, MGBS Hyderabad', droppingPoint: 'MGBS Out Gate' },
        { name: 'LB Nagar Bus Stop', lat: 17.3500, lng: 78.5500, type: 'bus_station', boardingPoint: 'LB Nagar Ring Road', droppingPoint: 'LB Nagar Metro Pillar' },
        { name: 'Suryapet Hiway Bus Stand', lat: 17.1439, lng: 79.6239, type: 'bus_station', boardingPoint: 'Suryapet Bypass Stop', droppingPoint: 'Suryapet Hotel 7 Junction' },
        { name: 'Vijayawada Pandit Nehru Stand', lat: 16.5062, lng: 80.6480, type: 'bus_station', boardingPoint: 'PNBS Platform 1', droppingPoint: 'PNBS Exit Circle' },
      ],
    },
  ],
};

/* ── Route Corridors Discovery Engine ── */
export async function discoverRouteCorridors(source, destination) {
  const srcName = (source?.name || source || '').trim();
  const dstName = (destination?.name || destination || '').trim();

  if (!srcName || !dstName) {
    throw new Error('Please select both Departure and Destination locations.');
  }
  if (srcName.toLowerCase() === dstName.toLowerCase()) {
    throw new Error('Departure and Destination cannot be the same location.');
  }

  const key1 = `${srcName.toLowerCase()}|${dstName.toLowerCase()}`;
  const key2 = `${dstName.toLowerCase()}|${srcName.toLowerCase()}`;

  // 1. Check verified corridor database for direct or reverse presets
  if (CORRIDOR_PRESET_DB[key1]) {
    return CORRIDOR_PRESET_DB[key1];
  }
  if (CORRIDOR_PRESET_DB[key2]) {
    // Reverse the preset for reverse journeys
    return CORRIDOR_PRESET_DB[key2].map((c) => ({
      ...c,
      corridorId: `${c.corridorId}_REV`,
      name: `${c.name} (Reverse Flow)`,
      majorTowns: [...c.majorTowns].reverse(),
      polyline: [...c.polyline].reverse(),
      suggestedCities: [...c.suggestedCities].reverse(),
      suggestedBoardingPoints: [...c.suggestedBoardingPoints].reverse(),
    }));
  }

  // 2. Dynamic Discovery for any other Indian city pair
  const srcCoords = source?.lat ? source : getCityCoords(srcName) || { name: srcName, lat: 13.0827, lng: 80.2707 };
  const dstCoords = destination?.lat ? destination : getCityCoords(dstName) || { name: dstName, lat: 16.3067, lng: 80.4365 };

  const directDistance = calculateGeoDistance(srcCoords.lat, srcCoords.lng, dstCoords.lat, dstCoords.lng);
  const roadDistA = Math.max(80, Math.round(directDistance * 1.25));
  const roadDistB = Math.max(95, Math.round(directDistance * 1.38));
  const roadDistC = Math.max(110, Math.round(directDistance * 1.45));

  const formatHoursMins = (km) => {
    const mins = Math.round((km / 55) * 60);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  // Intermediate midpoint interpolation
  const midLat = (srcCoords.lat + dstCoords.lat) / 2;
  const midLng = (srcCoords.lng + dstCoords.lng) / 2;

  const dynamicCorridors = [
    {
      corridorId: `CORR_${srcName.slice(0, 3).toUpperCase()}_${dstName.slice(0, 3).toUpperCase()}_A`,
      name: `Corridor A: National Highway Express (${srcName} ➔ ${dstName})`,
      highway: 'National Highway Route',
      distance: roadDistA,
      duration: formatHoursMins(roadDistA),
      durationMinutes: Math.round((roadDistA / 55) * 60),
      description: `Fastest direct commercial highway route between ${srcName} and ${dstName} with multi-lane roads.`,
      majorTowns: ['Midpoint Junction', 'Highway Transit Hub'],
      polyline: [
        [srcCoords.lat, srcCoords.lng],
        [midLat + 0.05, midLng + 0.02],
        [dstCoords.lat, dstCoords.lng],
      ],
      suggestedCities: [
        { name: `${srcName} Transit Hub`, lat: srcCoords.lat + 0.02, lng: srcCoords.lng + 0.02, type: 'city' },
        { name: `Highway Mid-Stop`, lat: midLat, lng: midLng, type: 'city' },
        { name: `${dstName} Outer Junction`, lat: dstCoords.lat - 0.02, lng: dstCoords.lng - 0.02, type: 'city' },
      ],
      suggestedBoardingPoints: [
        { name: `${srcName} Central Bus Stand`, lat: srcCoords.lat, lng: srcCoords.lng, type: 'bus_station', boardingPoint: `${srcName} Main Platform`, droppingPoint: `${srcName} Terminal Exit` },
        { name: `Midpoint RTC Hub`, lat: midLat, lng: midLng, type: 'bus_station', boardingPoint: 'Midpoint Transit Bay', droppingPoint: 'Midpoint Bypass' },
        { name: `${dstName} Central Terminal`, lat: dstCoords.lat, lng: dstCoords.lng, type: 'bus_station', boardingPoint: `${dstName} Main Platform`, droppingPoint: `${dstName} Drop Point` },
      ],
    },
    {
      corridorId: `CORR_${srcName.slice(0, 3).toUpperCase()}_${dstName.slice(0, 3).toUpperCase()}_B`,
      name: `Corridor B: State Regional Bypass (${srcName} ➔ ${dstName})`,
      highway: 'State Highway Link',
      distance: roadDistB,
      duration: formatHoursMins(roadDistB),
      durationMinutes: Math.round((roadDistB / 55) * 60),
      description: `Alternative regional corridor connecting intermediate commuter towns and bypasses.`,
      majorTowns: ['State Bypass Ring', 'Regional Depot'],
      polyline: [
        [srcCoords.lat, srcCoords.lng],
        [midLat - 0.08, midLng + 0.08],
        [dstCoords.lat, dstCoords.lng],
      ],
      suggestedCities: [
        { name: `Regional Hub Point`, lat: midLat - 0.06, lng: midLng + 0.06, type: 'city' },
      ],
      suggestedBoardingPoints: [
        { name: `Regional Bus Stand`, lat: midLat - 0.06, lng: midLng + 0.06, type: 'bus_station', boardingPoint: 'Regional Bay', droppingPoint: 'Regional Bypass' },
      ],
    },
  ];

  if (roadDistC > 350) {
    dynamicCorridors.push({
      corridorId: `CORR_${srcName.slice(0, 3).toUpperCase()}_${dstName.slice(0, 3).toUpperCase()}_C`,
      name: `Corridor C: Western Inland Expressway Link`,
      highway: 'Inland Expressway',
      distance: roadDistC,
      duration: formatHoursMins(roadDistC),
      durationMinutes: Math.round((roadDistC / 55) * 60),
      description: `Inland scenic highway avoiding major urban choke-points.`,
      majorTowns: ['Western Junction', 'Inland Depot'],
      polyline: [
        [srcCoords.lat, srcCoords.lng],
        [midLat + 0.12, midLng - 0.1],
        [dstCoords.lat, dstCoords.lng],
      ],
      suggestedCities: [
        { name: `Inland Junction`, lat: midLat + 0.1, lng: midLng - 0.08, type: 'city' },
      ],
      suggestedBoardingPoints: [
        { name: `Inland RTC Station`, lat: midLat + 0.1, lng: midLng - 0.08, type: 'bus_station', boardingPoint: 'Platform 1', droppingPoint: 'Inland Bypass' },
      ],
    });
  }

  return dynamicCorridors;
}

/* ── Intermediate Stop Suggestions for Selected Corridor ── */
export function suggestStopsForCorridor(corridorId, source, destination) {
  const srcName = (source?.name || source || '').trim().toLowerCase();
  const dstName = (destination?.name || destination || '').trim().toLowerCase();
  const key = `${srcName}|${dstName}`;
  const list = CORRIDOR_PRESET_DB[key] || [];
  const match = list.find((c) => c.corridorId === corridorId) || list[0];

  if (match) {
    return {
      suggestedCities: match.suggestedCities || [],
      suggestedBoardingPoints: match.suggestedBoardingPoints || [],
    };
  }

  return {
    suggestedCities: [],
    suggestedBoardingPoints: [],
  };
}

/* ── Strict Route and Stop Sequence Validation ── */
export function validateRouteProgression(stops = [], sourceName = '', destName = '') {
  if (!Array.isArray(stops) || stops.length === 0) {
    return { valid: true };
  }

  const sLower = (sourceName || '').trim().toLowerCase();
  const dLower = (destName || '').trim().toLowerCase();
  const seen = new Set();

  for (let i = 0; i < stops.length; i++) {
    const raw = stops[i];
    const name = (typeof raw === 'string' ? raw : raw.name || raw.stopName || '').trim();
    if (!name) {
      return { valid: false, error: `Stop at position #${i + 1} has an empty name.` };
    }
    const lower = name.toLowerCase();
    if (sLower && lower === sLower) {
      return { valid: false, error: `Intermediate stop "${name}" cannot be the same as Departure hub.` };
    }
    if (dLower && lower === dLower) {
      return { valid: false, error: `Intermediate stop "${name}" cannot be the same as Destination hub.` };
    }
    if (seen.has(lower)) {
      return { valid: false, error: `Duplicate stop detected: "${name}" is listed multiple times.` };
    }
    seen.add(lower);
  }

  return { valid: true };
}



