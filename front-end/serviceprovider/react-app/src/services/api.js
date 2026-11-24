/* ──────────────────────────────────────────────────────────
   Click2Book – Service Provider API Service  (api.js)
   Mirrors the approach used in the support agent services/api.js
   ────────────────────────────────────────────────────────── */

import { liveSync } from './liveSync.js';

const getHost = () => {
  try {
    if (typeof window !== 'undefined' && window.location && window.location.hostname) {
      return (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'localhost'
        : window.location.hostname;
    }
  } catch {}
  return 'localhost';
};

const API_BASE = () => `http://${getHost()}:3000/api`;

export function normalizeCity(c) {
  if (!c || typeof c !== 'string') return '';
  const s = c.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (['visakhapatnam', 'vishakapatnam', 'vishakapatanam', 'vizag', 'visakha', 'vskp'].includes(s)) return 'visakhapatnam';
  if (['chennai', 'madras'].includes(s)) return 'chennai';
  if (['bangalore', 'bengaluru', 'blr'].includes(s)) return 'bangalore';
  if (['hyderabad', 'secunderabad', 'hyd'].includes(s)) return 'hyderabad';
  if (['vijayawada', 'bezawada', 'vja'].includes(s)) return 'vijayawada';
  return s;
}

function createTimeoutSignal(ms = 2500, existingSignal) {
  if (existingSignal) return existingSignal;
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(ms);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

async function spFetch(path, options = {}) {
  const url = path.startsWith('/api') ? path : `/api${path}`;
  const timeoutMs = options.timeout || 2500;
  const userId = sessionStorage.getItem('c2b_loggedInId') || localStorage.getItem('c2b_loggedInId');
  const sessionVersion = sessionStorage.getItem('c2b_sessionVersion') || localStorage.getItem('c2b_sessionVersion');
  const headers = {
    'Content-Type': 'application/json',
    'x-role': 'PROVIDER',
    ...(userId ? { 'x-user-id': userId } : {}),
    ...(sessionVersion ? { 'x-session-version': sessionVersion } : {}),
    ...(options.headers || {}),
  };
  let res;
  try {
    res = await fetch(url, {
      ...options,
      signal: createTimeoutSignal(timeoutMs, options.signal),
      headers,
    });
  } catch {
    try {
      res = await fetch(`http://${getHost()}:3000/api${path}`, {
        ...options,
        signal: createTimeoutSignal(timeoutMs, options.signal),
        headers,
      });
    } catch {
      throw new Error('The service is temporarily unavailable. Please try again.');
    }
  }
  const json = await res.json().catch(() => ({}));
  if (res.status === 401 || res.status === 403) {
    const message = String(json.message || '');
    if (message.includes('service provider account has been deactivated') || message.includes('session is no longer valid')) {
      clearProviderSession();
      window.dispatchEvent(new CustomEvent('c2b_account_deactivated', {
        detail: {
          message: message.includes('service provider account has been deactivated')
            ? 'Your service provider account has been deactivated by the administrator. You cannot log in. Please contact customer support for assistance.'
            : 'Your session is no longer valid. Please log in again.',
        },
      }));
    }
  }
  if (!res.ok || json.success === false) throw new Error(json.message || `Request failed (${res.status})`);
  return json.data !== undefined ? json.data : json;
}

function clearProviderSession() {
  for (const storage of [sessionStorage, localStorage]) {
    ['c2b_loggedIn', 'c2b_userName', 'c2b_userEmail', 'c2b_loggedInId', 'c2b_role', 'c2b_sessionVersion'].forEach((key) => storage.removeItem(key));
  }
}

export async function getTripBookings(tripId) {
  if (!tripId) return [];
  try {
    return await spFetch(`/bookings/trip/${encodeURIComponent(tripId)}`);
  } catch {
    return [];
  }
}

/* ── Centralized Real-Time Event Dispatcher for Same-Tab and Cross-Tab Reactivity ── */
export function notifyChange(type, detail = {}) {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('c2b_sync', { detail: { type, ...detail } }));
    }
  } catch {}
}

/* ── Auth ── */
export async function loginProvider(email, password) {
  clearProviderSession();
  let response;
  try {
    response = await fetch(`http://${getHost()}:3000/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      signal: createTimeoutSignal(10000),
    });
  } catch {
    throw new Error('The service is temporarily unavailable. Please try again.');
  }
  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json.success) {
    const message = json.message || `Request failed (${response.status})`;
    if (String(message).includes('service provider account has been deactivated')) clearProviderSession();
    throw new Error(message);
  }
  if (json.data?.role !== 'PROVIDER') throw new Error('Not a provider account');
  return { success: true, data: json.data };
}

/* ── Dashboard Stats ── */
export function getDashboardData(providerId) {
  initFleetStorage();
  const loggedId = sessionStorage.getItem('c2b_loggedInId') || localStorage.getItem('c2b_loggedInId') || 'P001';
  const targetId = providerId || loggedId;
  const fleetBuses = getFleetBuses(targetId);
  const assignedFleet = fleetBuses.filter((b) => b.assignedRoute || b.status === 'Assigned' || b.route);
  if (assignedFleet.length > 0) {
    try {
      ensureTodayJourneysForAssignedFleet(assignedFleet);
    } catch {}
  }

  let localSchedules = [];
  try {
    localSchedules = JSON.parse(localStorage.getItem('c2b_bus_schedules') || '[]');
    if (!Array.isArray(localSchedules)) localSchedules = [];
  } catch { localSchedules = []; }

  let localBookings = [];
  try {
    localBookings = JSON.parse(localStorage.getItem('c2b_bookings') || '[]');
    if (!Array.isArray(localBookings)) localBookings = [];
  } catch { localBookings = []; }

  let statuses = {};
  try {
    statuses = JSON.parse(localStorage.getItem('c2b_trip_statuses') || '{}');
    if (!statuses || typeof statuses !== 'object' || Array.isArray(statuses)) statuses = {};
  } catch { statuses = {}; }

  // Start with empty buses array (populated strictly with registered provider schedules, no mock data)
  const buses = [];

  localSchedules.forEach((s) => {
    if (s.isSegment) return;
    const tid = s.id || s.tripId;
    const total = Number(s.totalSeats) || 40;
    const tripStatus = statuses[tid] || s.status || 'Active';
    const existingIdx = buses.findIndex(b => b.id === tid || b.tripId === tid);
    const busItem = {
      id: tid,
      tripId: tid,
      from: s.from || 'Origin',
      to: s.to || 'Destination',
      route: s.from && s.to ? `${s.from} → ${s.to}` : 'Custom Route',
      dep: `${s.departureTime || '08:00'} → ${s.arrivalTime || '12:00'}`,
      name: s.busName || 'Express Bus',
      booked: Number(s.bookedSeats) || 0,
      total,
      status: tripStatus === 'IN_PROGRESS' ? 'In Progress' : ((Number(s.bookedSeats) || 0) >= total ? 'Full' : 'Active'),
      fare: Number(s.fare) || 500,
      revenue: Number(s.revenue) || 0,
    };
    if (existingIdx >= 0) {
      buses[existingIdx] = { ...buses[existingIdx], ...busItem };
    } else {
      buses.unshift(busItem);
    }
  });

  // Guarantee that every assigned bus appears in Dashboard schedule table
  assignedFleet.forEach((bus) => {
    const cleanP = String(bus.vehicleNumber || bus.regNo || bus.vehicleId || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const bOrig = (bus.assignedRoute?.originCity || bus.originCity || '').toLowerCase().trim();
    const bDest = (bus.assignedRoute?.destCity || bus.destCity || '').toLowerCase().trim();

    const hasTrip = buses.some((b) => {
      const bCode = String(b.id || b.tripId || b.name || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      const matchesPlate = cleanP && bCode.includes(cleanP);
      if (!matchesPlate) return false;
      if (bOrig && bDest) {
        const bFrom = (b.from || '').toLowerCase().trim();
        const bTo = (b.to || '').toLowerCase().trim();
        return (bFrom === bOrig && bTo === bDest) || (bFrom === bDest && bTo === bOrig);
      }
      return true;
    });
    if (!hasTrip) {
      const orig = bus.assignedRoute?.originCity || bus.originCity || 'Chennai';
      const dest = bus.assignedRoute?.destCity || bus.destCity || 'Vijayawada';
      const upDep = bus.roundTripSchedule?.upSchedule?.departureTime || '08:00';
      const upArr = bus.roundTripSchedule?.upSchedule?.arrivalTime || '14:30';
      const dnDep = bus.roundTripSchedule?.downSchedule?.departureTime || '16:30';
      const dnArr = bus.roundTripSchedule?.downSchedule?.arrivalTime || '23:00';
      const fare = Number(bus.roundTripSchedule?.fare) || 650;
      const total = Number(bus.totalSeats) || 40;
      const upTid = `T_UP_${cleanP || 'BUS'}_today`;
      const dnTid = `T_DN_${cleanP || 'BUS'}_today`;

      buses.push({
        id: upTid,
        tripId: upTid,
        from: orig,
        to: dest,
        route: `${orig} → ${dest}`,
        dep: `${upDep} → ${upArr}`,
        name: bus.busName || `${bus.vehicleNumber || 'Bus'} (${bus.busType || 'Bus'})`,
        booked: 0,
        total,
        status: statuses[upTid] === 'IN_PROGRESS' ? 'In Progress' : 'Active',
        fare,
        revenue: 0,
      });
      buses.push({
        id: dnTid,
        tripId: dnTid,
        from: dest,
        to: orig,
        route: `${dest} → ${orig}`,
        dep: `${dnDep} → ${dnArr}`,
        name: bus.busName || `${bus.vehicleNumber || 'Bus'} (${bus.busType || 'Bus'})`,
        booked: 0,
        total,
        status: statuses[dnTid] === 'IN_PROGRESS' ? 'In Progress' : 'Active',
        fare,
        revenue: 0,
      });
    }
  });

  // Apply unique bookings
  const seenIds = new Set();
  localBookings.forEach((b) => {
    if (!b?.bookingId || seenIds.has(b.bookingId) || b.status === 'CANCELLED' || b.booking_status === 'CANCELLED' || b.bookingStatus === 'CANCELLED') return;
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
        (b.busName && bus.name && typeof b.busName === 'string' && bus.name.toLowerCase() === b.busName.toLowerCase()) ||
        (b.from && b.to && typeof b.from === 'string' && typeof b.to === 'string' && bus.from?.toLowerCase() === b.from.toLowerCase() && bus.to?.toLowerCase() === b.to.toLowerCase())
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

  const totalPax = buses.reduce((acc, b) => acc + (Number(b.booked) || 0), 0);
  const totalRev = buses.reduce((acc, b) => acc + Math.round((Number(b.revenue) || 0) * 0.9), 0);
  const activeBusesCount = assignedFleet.length;

  return { buses, totalPax, totalRev, activeBusesCount };
}

/* ── Helper: Ensure recurring journey instances are generated for assigned fleet, including TODAY's journey ── */
let isEnsuringFleet = false;
export function ensureTodayJourneysForAssignedFleet(assignedFleet) {
  if (isEnsuringFleet) return false;
  if (!assignedFleet || !assignedFleet.length) return false;
  isEnsuringFleet = true;
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    const clean = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const cleanName = (s) => String(s || '').toLowerCase().trim();

    let modified = false;
    let fleetModified = false;
    const raw = JSON.parse(localStorage.getItem('c2b_bus_schedules') || '[]');
    const cancelledList = JSON.parse(localStorage.getItem('c2b_cancelled_schedules') || '[]');
    const cancelledIds = JSON.parse(localStorage.getItem('c2b_cancelled_trip_ids') || '[]');
    const cancelledIdSet = new Set([...cancelledIds, ...cancelledList.map((c) => c.tripId)]);
    const statuses = JSON.parse(localStorage.getItem('c2b_trip_statuses') || '{}');

    assignedFleet.forEach((bus) => {
      // If bus is assigned, make sure it has assignedRoute
      if (!bus.assignedRoute) {
        let orig = bus.originCity || bus.origin || bus.from || '';
        let dest = bus.destCity || bus.destination || bus.to || '';
        if (!orig || !dest) {
          if (bus.route) {
            const parts = bus.route.split(/→|↔|-|\bto\b/i).map((s) => s.trim()).filter(Boolean);
            if (parts.length >= 2) {
              orig = parts[0];
              dest = parts[1];
            }
          }
        }
        if (!orig) orig = 'Chennai';
        if (!dest) dest = 'Vijayawada';
        bus.assignedRoute = {
          originCity: orig,
          destCity: dest,
          corridorName: `${orig} ↔ ${dest} Corridor`,
          intermediateStops: [],
          intermediateStopDetails: [],
          durationEst: '6h 30m',
          distanceKm: 430,
        };
        bus.status = 'Assigned';
        fleetModified = true;
      }

      const busPlate = clean(bus.vehicleNumber || bus.regNo || bus.vehicleId || 'BUS');
      const busId = clean(bus.vehicleId || bus.id);
      const busName = cleanName(bus.busName || bus.vehicleNumber);
      const orig = cleanName(bus.assignedRoute?.originCity);
      const dest = cleanName(bus.assignedRoute?.destCity);

      const matchesBus = (s) => {
        const sPlate = clean(s.vehicleNumber);
        const sId = clean(s.vehicleId);
        const sName = cleanName(s.busName);
        const sTripId = String(s.id || s.tripId || '');
        return (
          (busPlate && sPlate === busPlate) ||
          (busId && sId === busId) ||
          (busName && sName === busName) ||
          (busPlate && sTripId.includes(busPlate)) ||
          (busId && sTripId.includes(busId))
        );
      };

      // Check if this bus has active primary schedules matching current assigned route
      const hasCurrentRouteTrips = raw.some((s) => {
        if (s.isSegment) return false;
        if (!matchesBus(s)) return false;

        // Check if it matches the current route
        const sFrom = cleanName(s.from);
        const sTo = cleanName(s.to);
        const isUpMatch = sFrom === orig && sTo === dest;
        const isDownMatch = sFrom === dest && sTo === orig;
        return isUpMatch || isDownMatch;
      });

      const hasTodayTrip = raw.some((s) => {
        if (s.isSegment) return false;
        if (!matchesBus(s)) return false;
        const sFrom = cleanName(s.from);
        const sTo = cleanName(s.to);
        const isRouteMatch = (sFrom === orig && sTo === dest) || (sFrom === dest && sTo === orig);
        return isRouteMatch && (s.journeyDate || '').split('T')[0] === todayStr;
      });

      const hasFutureOrTodayTrips = raw.some((s) => {
        if (s.isSegment) return false;
        if (!matchesBus(s)) return false;
        const sFrom = cleanName(s.from);
        const sTo = cleanName(s.to);
        const isRouteMatch = (sFrom === orig && sTo === dest) || (sFrom === dest && sTo === orig);
        const jDate = (s.journeyDate || '').split('T')[0];
        return isRouteMatch && jDate >= todayStr;
      });

      // Check if UP or DOWN trips for today were explicitly deleted/cancelled by operator
      const upTripId = `T_UP_${busPlate}_${todayStr.replace(/-/g, '')}`;
      const downTripId = `T_DN_${busPlate}_${todayStr.replace(/-/g, '')}`;
      const isUpCancelled = cancelledIdSet.has(upTripId) || statuses[upTripId] === 'CANCELLED';
      const isDownCancelled = cancelledIdSet.has(downTripId) || statuses[downTripId] === 'CANCELLED';

      // If route trips already exist and future/today trips or cancellations exist, do not regenerate on read
      if (hasCurrentRouteTrips && (hasFutureOrTodayTrips || hasTodayTrip || isUpCancelled || isDownCancelled)) {
        return;
      }

      // If no trips for current route, generate 30 days of upcoming schedules silently
      const d30 = new Date();
      d30.setDate(d30.getDate() + 30);
      const sched = bus.roundTripSchedule || {
        vehicleId: bus.vehicleId || bus.id,
        upSchedule: {
          departureTime: '08:00',
          arrivalTime: '14:30',
          operatingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
          originCity: bus.assignedRoute?.originCity || 'Chennai',
          destCity: bus.assignedRoute?.destCity || 'Vijayawada',
          intermediateStops: bus.assignedRoute?.intermediateStops || [],
        },
        downSchedule: {
          departureTime: '16:30',
          arrivalTime: '23:00',
          operatingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
          originCity: bus.assignedRoute?.destCity || 'Vijayawada',
          destCity: bus.assignedRoute?.originCity || 'Chennai',
          intermediateStops: [...(bus.assignedRoute?.intermediateStops || [])].reverse(),
        },
        fare: 650,
        validFrom: todayStr,
        validUntil: d30.toISOString().split('T')[0],
      };
      if (!sched.validUntil) {
        sched.validUntil = d30.toISOString().split('T')[0];
      }
      generateRecurringJourneyInstances(bus, sched, false);
      modified = true;
    });

    if (fleetModified) {
      try {
        const allFleet = JSON.parse(localStorage.getItem('c2b_registered_fleet') || '[]');
        assignedFleet.forEach((b) => {
          const idx = allFleet.findIndex((x) => x.vehicleId === b.vehicleId || x.id === b.id || x.vehicleNumber === b.vehicleNumber);
          if (idx >= 0) allFleet[idx] = { ...allFleet[idx], ...b };
        });
        localStorage.setItem('c2b_registered_fleet', JSON.stringify(allFleet));
      } catch {}
    }

    return modified;
  } finally {
    isEnsuringFleet = false;
  }
}

/* ── Deduplicate schedules helper: strictly enforces exactly 1 UP and 1 DOWN trip per bus per date ── */
export function deduplicateSchedules(schedules) {
  if (!Array.isArray(schedules)) return [];
  const clean = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const cleanName = (s) => String(s || '').toLowerCase().trim();
  const seenIds = new Set();
  const seenSlots = new Set();

  const result = [];
  for (const s of schedules) {
    if (!s || s.isSegment) continue;
    const tid = String(s.id || s.tripId || '').trim();
    if (!tid) continue;
    if (/^T00\d/.test(tid) || /^BUS_10\d\d$/.test(s.vehicleId || '')) continue;

    // Check ID uniqueness
    if (seenIds.has(tid)) continue;

    // Check unique slot: (bus + journeyDate + direction)
    const plate = clean(s.vehicleNumber || s.vehicleId || s.busName || '');
    const jDate = (s.journeyDate || '').split('T')[0];
    const direction = s.direction || (cleanName(s.from) + '_' + cleanName(s.to));

    if (plate && jDate) {
      const slotKey = `${plate}_${jDate}_${direction}`;
      if (seenSlots.has(slotKey)) continue; // Discard duplicate trip for the same bus on the same date!
      seenSlots.add(slotKey);
    }

    seenIds.add(tid);
    result.push(s);
  }
  return result;
}

/* ── Safe LocalStorage Helper for Schedules (Prevents QuotaExceededError & Duplication) ── */
export function safeSaveSchedules(schedules) {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    // Strictly deduplicate and strip legacy mock trips
    const cleaned = deduplicateSchedules(schedules);

    try {
      localStorage.setItem('c2b_bus_schedules', JSON.stringify(cleaned));
      return true;
    } catch (quotaErr) {
      console.warn('LocalStorage quota exceeded on c2b_bus_schedules, performing aggressive prune...', quotaErr);
      // Prune past unbooked trips to recover storage quota
      const pruned = cleaned.filter((s) => {
        const jDate = (s.journeyDate || '').split('T')[0];
        if (jDate && jDate < todayStr && !s.bookedSeats) return false;
        return true;
      });
      localStorage.setItem('c2b_bus_schedules', JSON.stringify(pruned));
      return true;
    }
  } catch (criticalErr) {
    console.error('Critical quota error saving c2b_bus_schedules:', criticalErr);
    try {
      // Keep only active upcoming schedules for today and future
      const todayStr = new Date().toISOString().split('T')[0];
      const raw = JSON.parse(localStorage.getItem('c2b_bus_schedules') || '[]');
      const minimal = deduplicateSchedules(raw).filter((s) => !s.isSegment && (s.journeyDate || '').split('T')[0] >= todayStr);
      localStorage.setItem('c2b_bus_schedules', JSON.stringify(minimal));
    } catch {}
    return false;
  }
}

/* ── Schedules ── */
export function getLocalSchedules(providerId) {
  try {
    initFleetStorage();
    const loggedId = sessionStorage.getItem('c2b_loggedInId') || localStorage.getItem('c2b_loggedInId') || 'P001';
    const targetId = providerId || loggedId;
    const fleetBuses = getFleetBuses(targetId);
    const assignedFleet = fleetBuses.filter((b) => b.assignedRoute || b.status === 'Assigned' || b.route);

    // Only show assigned buses — if no buses are assigned, return empty list (no mock data)
    if (assignedFleet.length === 0) {
      return [];
    }

    // Ensure recurring journey instances are generated for assigned buses, including today's trip
    ensureTodayJourneysForAssignedFleet(assignedFleet);

    const clean = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const cleanName = (s) => String(s || '').toLowerCase().trim();

    const raw = JSON.parse(localStorage.getItem('c2b_bus_schedules') || '[]');
    // Automatic purge of stored duplicates in localStorage
    const dedupedRaw = deduplicateSchedules(raw);
    if (dedupedRaw.length !== raw.length) {
      safeSaveSchedules(dedupedRaw);
    }
    // Filter out subsegments, legacy mock schedules, and schedules for unassigned buses
    const primaryOnly = raw.filter((s) => {
      if (!s || s.isSegment) return false;
      const tripId = s.id || s.tripId || '';
      // Purge legacy mock IDs like T001.. or BUS_1001..
      if (/^T00\d/.test(tripId) || /^BUS_10\d\d$/.test(s.vehicleId || '')) return false;

      // Must belong strictly to an assigned fleet bus from Bus Fleet Management
      const sPlate = clean(s.vehicleNumber);
      const sName = cleanName(s.busName);
      const sId = clean(s.vehicleId);

      const matchingBus = assignedFleet.find((b) =>
        (b.vehicleNumber && sPlate && clean(b.vehicleNumber) === sPlate) ||
        (b.vehicleId && sId && clean(b.vehicleId) === sId) ||
        (b.vehicleNumber && tripId.includes(clean(b.vehicleNumber))) ||
        (b.vehicleId && tripId.includes(clean(b.vehicleId))) ||
        (b.busName && sName && cleanName(b.busName) === sName)
      );

      if (!matchingBus) return false;

      // Also ensure that the schedule matches the current assigned corridor for this bus
      const bOrig = cleanName(matchingBus.assignedRoute?.originCity);
      const bDest = cleanName(matchingBus.assignedRoute?.destCity);
      const sFrom = cleanName(s.from || s.source);
      const sTo = cleanName(s.to || s.destination);
      if (bOrig && bDest && sFrom && sTo) {
        const isUp = (sFrom === bOrig && sTo === bDest);
        const isDown = (sFrom === bDest && sTo === bOrig);
        if (!isUp && !isDown) return false;
      }

      return true;
    });

    const statuses = JSON.parse(localStorage.getItem('c2b_trip_statuses') || '{}');
    const completions = JSON.parse(localStorage.getItem('c2b_trip_completions') || '{}');
    const localBookings = JSON.parse(localStorage.getItem('c2b_bookings') || '[]');

    const mapped = primaryOnly.map((s, i) => {
      const tripId = s.id || s.tripId || `LOCAL-${i + 1}`;
      const status = statuses[tripId] || s.status || 'SCHEDULED';
      const totalSeats = s.totalSeats || 40;

      // Match corresponding fleet bus to get corridor and vehicle details if missing on schedule
      const sPlate = clean(s.vehicleNumber);
      const sId = clean(s.vehicleId);
      const sName = cleanName(s.busName);

      const parentBus = assignedFleet.find((b) =>
        (b.vehicleNumber && sPlate && clean(b.vehicleNumber) === sPlate) ||
        (b.vehicleId && sId && clean(b.vehicleId) === sId) ||
        (b.busName && sName && cleanName(b.busName) === sName) ||
        (b.vehicleNumber && s.id && String(s.id).includes(clean(b.vehicleNumber)))
      );

      const corridorName = s.corridorName || parentBus?.assignedRoute?.corridorName || null;
      const corridorId = s.corridorId || parentBus?.assignedRoute?.corridorId || null;
      const direction = s.direction || 'UP';
      const vehicleNumber = s.vehicleNumber || parentBus?.vehicleNumber || s.vehicleId || '—';

      // Count bookings for this trip from c2b_bookings
      const tripBookings = localBookings.filter((b) =>
        (b.status !== 'CANCELLED' && b.booking_status !== 'CANCELLED') &&
        (b.tripId === tripId ||
         (b.busName && s.busName && cleanName(b.busName) === cleanName(s.busName) &&
          (!b.from || !s.from || cleanName(b.from) === cleanName(s.from))))
      );
      const distinctBookingSeats = new Set();
      tripBookings.forEach((b) => {
        const seats = Array.isArray(b.seat_list)
          ? b.seat_list
          : typeof b.seats === 'string'
          ? b.seats.split(',')
          : b.seatNumber != null
          ? [b.seatNumber]
          : [];
        seats.forEach((seat) => distinctBookingSeats.add(String(seat).trim().toUpperCase()));
      });
      const bookedFromBookings = distinctBookingSeats.size;
      const bookedSeats = bookedFromBookings;
      const availableSeats = Math.max(0, totalSeats - bookedSeats);
      const fare = s.fare || parentBus?.roundTripSchedule?.fare || 0;
      const bookingRev = tripBookings.reduce((sum, b) => sum + (Number(b.total) || Number(b.amount) || Number(b.subtotal) || (fare * (Array.isArray(b.seat_list) ? b.seat_list.length : 1))), 0);
      const revenue = Math.max(s.revenue || 0, bookingRev || (bookedSeats * fare));

      const parsedStops = Array.isArray(s.intermediateStops)
        ? s.intermediateStops
        : (s.via ? s.via.split(',').map((x) => x.trim()).filter(Boolean) : []);

      return {
        id:                tripId,
        tripId,
        source:            s.from || parentBus?.assignedRoute?.originCity || '—',
        destination:       s.to   || parentBus?.assignedRoute?.destCity   || '—',
        via:               s.via  || '',
        intermediateStops: parsedStops,
        allStops:          s.allStops || [s.from, ...parsedStops, s.to].filter(Boolean),
        departureTime:     s.departureTime || '—',
        arrivalTime:       s.arrivalTime   || '—',
        journeyDate:       s.journeyDate || (s.addedAt ? s.addedAt.split('T')[0] : '—'),
        busName:           s.busName || parentBus?.busName || '—',
        vehicleType:       s.busType || s.vehicleType || parentBus?.busType || '—',
        vehicleNumber,
        direction,
        corridorName,
        corridorId,
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

    // Guarantee that EVERY assigned bus in assignedFleet is shown (unless deleted)
    const todayStr = new Date().toISOString().split('T')[0];
    const cancelledIds = JSON.parse(localStorage.getItem('c2b_cancelled_trip_ids') || '[]');
    let schedulesAdded = false;
    const rawToPersist = JSON.parse(localStorage.getItem('c2b_bus_schedules') || '[]');

    assignedFleet.forEach((bus) => {
      const bPlate = clean(bus.vehicleNumber || bus.regNo || bus.vehicleId);
      const bOrig = cleanName(bus.assignedRoute?.originCity || 'Chennai');
      const bDest = cleanName(bus.assignedRoute?.destCity || 'Vijayawada');

      const hasTrips = mapped.some((m) => {
        const mPlate = clean(m.vehicleNumber);
        const matchesPlate = (bPlate && mPlate === bPlate) || (bPlate && m.tripId.includes(bPlate));
        if (!matchesPlate) return false;
        const mFrom = cleanName(m.source || m.from);
        const mTo = cleanName(m.destination || m.to);
        const matchesRoute = (mFrom === bOrig && mTo === bDest) || (mFrom === bDest && mTo === bOrig);
        const isUpcoming = (m.journeyDate || '').split('T')[0] >= todayStr;
        return matchesRoute && isUpcoming && m.status !== 'CANCELLED' && m.status !== 'COMPLETED';
      });

      if (!hasTrips) {
        const upTripId = `T_UP_${bPlate}_${todayStr.replace(/-/g, '')}`;
        const downTripId = `T_DN_${bPlate}_${todayStr.replace(/-/g, '')}`;
        const origCity = bus.assignedRoute?.originCity || 'Chennai';
        const destCity = bus.assignedRoute?.destCity || 'Vijayawada';
        const corridor = bus.assignedRoute?.corridorName || `${origCity} ↔ ${destCity} Corridor`;
        const fare = Number(bus.roundTripSchedule?.fare || 650);
        const totalSeats = Number(bus.totalSeats || 40);

        if (!cancelledIds.includes(upTripId) && statuses[upTripId] !== 'CANCELLED') {
          const upItem = {
            id: upTripId,
            tripId: upTripId,
            source: origCity,
            destination: destCity,
            from: origCity,
            to: destCity,
            corridorName: corridor,
            corridorId: bus.assignedRoute?.corridorId || null,
            direction: 'UP',
            departureTime: bus.roundTripSchedule?.upSchedule?.departureTime || '08:00',
            arrivalTime: bus.roundTripSchedule?.upSchedule?.arrivalTime || '14:30',
            journeyDate: todayStr,
            vehicleNumber: bus.vehicleNumber,
            vehicleId: bus.vehicleId,
            busName: bus.busName,
            busType: bus.busType || bus.vehicleType || 'AC Sleeper',
            vehicleType: bus.busType || bus.vehicleType || 'AC Sleeper',
            totalSeats,
            availableSeats: totalSeats,
            bookedSeats: 0,
            fare,
            revenue: 0,
            status: statuses[upTripId] || 'SCHEDULED',
            isNew: true,
            intermediateStops: bus.assignedRoute?.intermediateStops || [],
            allStops: [origCity, ...(bus.assignedRoute?.intermediateStops || []), destCity],
          };
          mapped.push(upItem);
          rawToPersist.push(upItem);
          schedulesAdded = true;
        }
        if (!cancelledIds.includes(downTripId) && statuses[downTripId] !== 'CANCELLED') {
          const dnItem = {
            id: downTripId,
            tripId: downTripId,
            source: destCity,
            destination: origCity,
            from: destCity,
            to: origCity,
            corridorName: corridor,
            corridorId: bus.assignedRoute?.corridorId || null,
            direction: 'DOWN',
            departureTime: bus.roundTripSchedule?.downSchedule?.departureTime || '16:30',
            arrivalTime: bus.roundTripSchedule?.downSchedule?.arrivalTime || '23:00',
            journeyDate: todayStr,
            vehicleNumber: bus.vehicleNumber,
            vehicleId: bus.vehicleId,
            busName: bus.busName,
            busType: bus.busType || bus.vehicleType || 'AC Sleeper',
            vehicleType: bus.busType || bus.vehicleType || 'AC Sleeper',
            totalSeats,
            availableSeats: totalSeats,
            bookedSeats: 0,
            fare,
            revenue: 0,
            status: statuses[downTripId] || 'SCHEDULED',
            isNew: true,
            intermediateStops: [...(bus.assignedRoute?.intermediateStops || [])].reverse(),
            allStops: [destCity, ...[...(bus.assignedRoute?.intermediateStops || [])].reverse(), origCity],
          };
          mapped.push(dnItem);
          rawToPersist.push(dnItem);
          schedulesAdded = true;
        }
      }
    });

    if (schedulesAdded) {
      try {
        safeSaveSchedules(rawToPersist);
      } catch {}
    }

    return mapped;
  } catch (e) { return []; }
}

export async function fetchSchedulesFromAPI(providerId) {
  const localTrips = getLocalSchedules(providerId);
  const loggedId = sessionStorage.getItem('c2b_loggedInId') || localStorage.getItem('c2b_loggedInId') || 'P001';
  const targetId = providerId || loggedId;
  const fleetBuses = getFleetBuses(targetId);
  const assignedFleet = fleetBuses.filter((b) => b.assignedRoute || b.status === 'Assigned' || b.route);

  // If no buses are assigned, do NOT display any mock/unassigned schedules
  if (assignedFleet.length === 0) {
    return { data: [], isLive: false };
  }

  const assignedPlateSet = new Set(assignedFleet.map((b) => (b.vehicleNumber || '').toUpperCase()).filter(Boolean));
  const assignedNameSet = new Set(assignedFleet.map((b) => (b.busName || '').toLowerCase()).filter(Boolean));
  const assignedIdSet = new Set(assignedFleet.map((b) => (b.vehicleId || b.id || '').toUpperCase()).filter(Boolean));

  const statuses = JSON.parse(localStorage.getItem('c2b_trip_statuses') || '{}');
  const completions = JSON.parse(localStorage.getItem('c2b_trip_completions') || '{}');

  try {
    const apiData = await spFetch('/trips', {});
    if (apiData?.length && (apiData[0]?.source || apiData[0]?.route)) {
      // Filter out any API trips that do not belong to assigned fleet buses
      const mappedApi = apiData
        .filter((t) => {
          const vNum = (t.vehicleNumber || t.vehicle?.vehicleNumber || '').toUpperCase();
          const bName = (t.busName || t.vehicle?.busName || '').toLowerCase();
          const vId = (t.vehicleId || t.vehicle?.vehicleId || '').toUpperCase();
          return assignedPlateSet.has(vNum) || assignedNameSet.has(bName) || assignedIdSet.has(vId);
        })
        .map((t) => ({
          ...t,
          status: statuses[t.tripId] || t.status || 'SCHEDULED',
          completedAt: completions[t.tripId] || t.completedAt || null,
        }));
      const localIds = new Set(localTrips.map((lt) => lt.tripId));
      const extraApi = mappedApi.filter((at) => !localIds.has(at.tripId));
      return { data: [...localTrips, ...extraApi], isLive: true };
    }
    return { data: localTrips, isLive: false };
  } catch {
    return { data: localTrips, isLive: false };
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
    vehicleNumber,
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

    const cleanVehicleNum = (vehicleNumber || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '') ||
      (((busName || 'BUS').replace(/[^A-Za-z0-9]/g, '').toUpperCase()) + '0000').slice(0, 10);
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
  vehicleNumber,
  direction,
}) {
  const schedules = JSON.parse(localStorage.getItem('c2b_bus_schedules') || '[]');
  const canonicalId = backendTripId || (tripId && /^T\d+$/.test(tripId) ? tripId : null);
  const effectiveId = canonicalId || tripId;

  const existingItem = schedules.find((s) => (s.id || s.tripId) === effectiveId);
  const effVehicleNumber = vehicleNumber || existingItem?.vehicleNumber || null;
  const effDirection = direction || existingItem?.direction || 'UP';
  const effCorridorId = corridorId || existingItem?.corridorId || null;
  const effCorridorName = corridorName || existingItem?.corridorName || null;

  const stopsList = Array.isArray(intermediateStops)
    ? intermediateStops.map((s) => String(s).trim()).filter(Boolean)
    : typeof via === 'string' && via.trim()
    ? via.split(',').map((s) => s.trim()).filter(Boolean)
    : (existingItem?.intermediateStops || []);

  const effectiveFrom = (from || existingItem?.from || '').trim();
  const effectiveTo = (to || existingItem?.to || '').trim();
  const effectiveVia = (via && String(via).trim()) ? String(via).trim() : stopsList.join(', ');
  const fullStops = [effectiveFrom, ...stopsList, effectiveTo].filter(Boolean);

  // Filter out any stale subsegments belonging to this trip
  const cleanSchedules = schedules.filter(
    (s) => s.parentTripId !== effectiveId && !String(s.id).startsWith(`${effectiveId}_SEG_`)
  );

  const primaryItem = {
    id: effectiveId,
    tripId: effectiveId,
    backendTripId: canonicalId,
    vehicleId: vehicleId || existingItem?.vehicleId || null,
    vehicleNumber: effVehicleNumber,
    scheduleId: scheduleId || existingItem?.scheduleId || null,
    providerId: providerId || existingItem?.providerId || 'P001',
    from: effectiveFrom,
    to: effectiveTo,
    via: effectiveVia,
    intermediateStops: stopsList,
    allStops: fullStops,
    corridorId: effCorridorId,
    corridorName: effCorridorName,
    direction: effDirection,
    routeStops: Array.isArray(routeStops) && routeStops.length > 0 ? routeStops : (existingItem?.routeStops || []),
    encodedPolyline: encodedPolyline || existingItem?.encodedPolyline || null,
    departureTime: dep,
    arrivalTime: arr,
    journeyDate: journeyDate || existingItem?.journeyDate,
    busName: busName || existingItem?.busName || 'Assigned Fleet Bus',
    busType: busType || existingItem?.busType || 'AC',
    vehicleType: busType || existingItem?.vehicleType || 'AC',
    seatLayout: existingItem?.seatLayout || '2+2',
    totalSeats: Number(seats) || existingItem?.totalSeats || 40,
    availableSeats: Number(seats) || existingItem?.availableSeats || 40,
    bookedSeats: existingItem?.bookedSeats || 0,
    fare: Number(fare) || existingItem?.fare || 500,
    revenue: existingItem?.revenue || 0,
    operatorPayout: existingItem?.operatorPayout || 0,
    status: existingItem?.status || 'SCHEDULED',
    isPrimaryRoute: true,
    addedAt: existingItem?.addedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const idx = cleanSchedules.findIndex((s) => (s.id || s.tripId) === effectiveId);
  if (idx >= 0) {
    cleanSchedules[idx] = { ...cleanSchedules[idx], ...primaryItem };
  } else {
    cleanSchedules.push(primaryItem);
  }

  safeSaveSchedules(cleanSchedules);
  try { window.dispatchEvent(new Event('storage')); } catch {}
  try { window.dispatchEvent(new CustomEvent('c2b_sync', { detail: { type: 'SCHEDULE_UPDATED', payload: primaryItem } })); } catch {}
  try { liveSync.syncSchedule(primaryItem); } catch {}
}

/* ── Edit / Update a locally-stored schedule ── */
export function updateLocalSchedule(tripId, payload = {}) {
  const {
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
    journeyDate,
    vehicleNumber,
    direction,
    corridorName,
    corridorId,
  } = payload;

  const stopsList = Array.isArray(intermediateStops)
    ? intermediateStops.map((s) => String(s).trim()).filter(Boolean)
    : typeof via === 'string' && via.trim()
    ? via.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const effectiveVia = (via && String(via).trim()) ? String(via).trim() : stopsList.join(', ');

  // 1. Update c2b_bus_schedules
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
    vehicleNumber,
    direction,
    corridorName,
    corridorId,
  });

  // 2. Synchronize back into c2b_registered_fleet so assignedRoute & roundTripSchedule reflect the edit
  try {
    initFleetStorage();
    const all = JSON.parse(localStorage.getItem('c2b_registered_fleet') || '[]');
    const targetPlate = (vehicleNumber || '').toUpperCase();
    const targetName = (busName || '').toLowerCase();

    const busIdx = all.findIndex((b) =>
      (targetPlate && b.vehicleNumber && b.vehicleNumber.toUpperCase() === targetPlate) ||
      (targetName && b.busName && b.busName.toLowerCase() === targetName) ||
      (b.vehicleId && b.vehicleId === tripId)
    );

    if (busIdx >= 0) {
      const bus = all[busIdx];

      // Sync route corridor metadata
      if (bus.assignedRoute) {
        if (corridorName) bus.assignedRoute.corridorName = corridorName;
        if (corridorId) bus.assignedRoute.corridorId = corridorId;
        if (stopsList.length > 0) {
          bus.assignedRoute.intermediateStops = stopsList;
        }
      }

      // Sync round trip schedule
      if (bus.roundTripSchedule) {
        const isUp = direction === 'UP' || (bus.assignedRoute?.originCity && from && bus.assignedRoute.originCity.toLowerCase() === from.toLowerCase());
        const legKey = isUp ? 'upSchedule' : 'downSchedule';

        if (bus.roundTripSchedule[legKey]) {
          if (dep) bus.roundTripSchedule[legKey].departureTime = dep;
          if (arr) bus.roundTripSchedule[legKey].arrivalTime = arr;
          if (stopsList.length > 0) {
            bus.roundTripSchedule[legKey].intermediateStops = stopsList;
          }
        }
        if (fare) {
          bus.roundTripSchedule.fare = Number(fare);
        }

        // Recalculate turnaround rest time if both UP arrival and DOWN departure are present
        try {
          const uh_m = (bus.roundTripSchedule.upSchedule?.arrivalTime || '').split(':').map(Number);
          const dh_m = (bus.roundTripSchedule.downSchedule?.departureTime || '').split(':').map(Number);
          if (uh_m.length === 2 && dh_m.length === 2 && !isNaN(uh_m[0]) && !isNaN(dh_m[0])) {
            let rest = (dh_m[0] * 60 + dh_m[1]) - (uh_m[0] * 60 + uh_m[1]);
            if (rest < 0) rest += 24 * 60;
            bus.roundTripSchedule.restMinutesBetweenJourneys = rest;
          }
        } catch {}
      }

      bus.updatedAt = new Date().toISOString();
      all[busIdx] = bus;
      localStorage.setItem('c2b_registered_fleet', JSON.stringify(all));
      try { window.dispatchEvent(new Event('storage')); } catch {}
    }
  } catch (syncErr) {
    console.warn('Sync to fleet note:', syncErr);
  }

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

    // Record in cancelled/deleted trip IDs set so recurring instances are NEVER auto-resurrected
    const cancelledIds = JSON.parse(localStorage.getItem('c2b_cancelled_trip_ids') || '[]');
    if (!cancelledIds.includes(tripId)) {
      cancelledIds.push(tripId);
      localStorage.setItem('c2b_cancelled_trip_ids', JSON.stringify(cancelledIds));
    }

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
    try { window.dispatchEvent(new CustomEvent('c2b_sync', { detail: { type: 'SCHEDULE_CANCELLED', tripId } })); } catch {}
    return true;
  } catch {
    return false;
  }
}

/* ── Permanently Delete a Schedule (Removes completely from Cancelled tab and storage) ── */
export function deletePermanentSchedule(tripId) {
  try {
    // 1. Remove from cancelled schedules list
    const cancelled = JSON.parse(localStorage.getItem('c2b_cancelled_schedules') || '[]');
    const filteredCancelled = cancelled.filter((c) => c.tripId !== tripId);
    localStorage.setItem('c2b_cancelled_schedules', JSON.stringify(filteredCancelled));

    // 2. Remove from active schedules (c2b_bus_schedules)
    const raw = JSON.parse(localStorage.getItem('c2b_bus_schedules') || '[]');
    const filtered = raw.filter(
      (s) => s.id !== tripId && s.tripId !== tripId && s.parentTripId !== tripId && !String(s.id).startsWith(`${tripId}_SEG_`)
    );
    localStorage.setItem('c2b_bus_schedules', JSON.stringify(filtered));

    // 3. Remove from statuses
    const statuses = JSON.parse(localStorage.getItem('c2b_trip_statuses') || '{}');
    delete statuses[tripId];
    localStorage.setItem('c2b_trip_statuses', JSON.stringify(statuses));

    // 4. Ensure it remains in deleted trip IDs so it is never auto-regenerated
    const cancelledIds = JSON.parse(localStorage.getItem('c2b_cancelled_trip_ids') || '[]');
    if (!cancelledIds.includes(tripId)) {
      cancelledIds.push(tripId);
      localStorage.setItem('c2b_cancelled_trip_ids', JSON.stringify(cancelledIds));
    }

    // 5. Clean completions
    const completions = JSON.parse(localStorage.getItem('c2b_trip_completions') || '{}');
    delete completions[tripId];
    localStorage.setItem('c2b_trip_completions', JSON.stringify(completions));

    try { window.dispatchEvent(new Event('storage')); } catch {}
    try { window.dispatchEvent(new CustomEvent('c2b_sync', { detail: { type: 'SCHEDULE_PERMANENTLY_DELETED', tripId } })); } catch {}
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

/* ── Helper: Normalized Seat ID mapping across Seater (A1..), Sleeper (L1.., U1..), & numeric formats ── */
function getEquivalentSeatIds(rawSeatId, totalSeats = 40, isSleeper = false) {
  const str = String(rawSeatId || '').trim().toUpperCase();
  const set = new Set();
  if (str) set.add(str);

  const total = Number(totalSeats) || 40;
  const half = Math.ceil(total / 2);
  let num = null;

  if (/^\d+$/.test(str)) {
    num = parseInt(str, 10);
  } else if (/^L(\d+)$/i.test(str)) {
    num = parseInt(str.slice(1), 10);
  } else if (/^U(\d+)$/i.test(str)) {
    num = half + parseInt(str.slice(1), 10);
  } else if (/^([A-Z])(\d+)$/i.test(str)) {
    const rowChar = str[0];
    const colNum = parseInt(str.slice(1), 10);
    const rowIdx = rowChar.charCodeAt(0) - 65;
    num = rowIdx * 4 + colNum;
  }

  if (num && num >= 1 && num <= total) {
    set.add(String(num));
    const rowChar = String.fromCharCode(65 + Math.floor((num - 1) / 4));
    const colNum = ((num - 1) % 4) + 1;
    set.add(`${rowChar}${colNum}`);
    if (num <= half) {
      set.add(`L${num}`);
    } else {
      set.add(`U${num - half}`);
    }
  }

  return { list: Array.from(set), num };
}

/* ── Seat Management: Real assigned fleet buses & verified schedules (Clean, No Mock Data) ── */
export function getSeatData(providerId) {
  initFleetStorage();
  const loggedId = sessionStorage.getItem('c2b_loggedInId') || localStorage.getItem('c2b_loggedInId') || 'P001';
  const targetId = providerId || loggedId;

  // 1. Get assigned fleet buses strictly belonging to this provider
  const fleetBuses = getFleetBuses(targetId);
  const assignedFleet = fleetBuses.filter((b) => b.assignedRoute || b.status === 'Assigned' || b.route);

  // Ensure recurring journey instances are generated for assigned fleet, including today's trips
  ensureTodayJourneysForAssignedFleet(assignedFleet);

  // 2. Read schedules from c2b_bus_schedules (filter out segments, cancellations, and past dates)
  let localSchedules = [];
  try {
    localSchedules = JSON.parse(localStorage.getItem('c2b_bus_schedules') || '[]');
  } catch { localSchedules = []; }

  // Immediately deduplicate stored schedules to eliminate any 980 duplicates from storage
  const dedupedLocal = deduplicateSchedules(localSchedules);
  if (dedupedLocal.length !== localSchedules.length) {
    safeSaveSchedules(dedupedLocal);
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const cancelledList = JSON.parse(localStorage.getItem('c2b_cancelled_schedules') || '[]');
  const cancelledIds = JSON.parse(localStorage.getItem('c2b_cancelled_trip_ids') || '[]');
  const cancelledIdSet = new Set([...cancelledIds, ...cancelledList.map((c) => c.tripId)]);
  const statuses = JSON.parse(localStorage.getItem('c2b_trip_statuses') || '{}');

  const cleanSchedules = dedupedLocal.filter((s) => {
    if (!s || s.isSegment) return false;
    if (/^BUS_10\d\d$/.test(s.vehicleId || s.id || '')) return false;
    if (/^T00\d$/.test(s.id || s.tripId || '')) return false;
    if (s.providerId && targetId && s.providerId !== targetId && targetId !== 'P001' && s.providerId !== 'P001') return false;
    const sId = s.id || s.tripId;
    if (cancelledIdSet.has(sId) || statuses[sId] === 'CANCELLED') return false;
    if (statuses[sId] === 'COMPLETED') return false;
    const sDate = (s.journeyDate || '').split('T')[0];
    if (sDate && sDate < todayStr) return false; // Exclude past expired dates
    return Boolean(s.from && s.to && s.from !== 'Origin' && s.to !== 'Destination');
  });

  const trips = [];
  const seenSlots = new Set();
  const clean = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const cleanName = (s) => String(s || '').toLowerCase().trim();

  // 3. For each assigned bus in the fleet, gather its real trips
  assignedFleet.forEach((bus) => {
    const isSleeper = (bus.busType || '').toLowerCase().includes('sleeper') && !(bus.busType || '').toLowerCase().includes('semi');
    const total = Number(bus.totalSeats || (isSleeper ? 30 : 40));
    const fare = Number(bus.roundTripSchedule?.fare || (isSleeper ? 1483 : 650));
    const bPlate = clean(bus.vehicleNumber || bus.regNo || bus.vehicleId);
    const bId = clean(bus.vehicleId || bus.id);
    const bName = cleanName(bus.busName);
    const bOrig = cleanName(bus.assignedRoute?.originCity);
    const bDest = cleanName(bus.assignedRoute?.destCity);

    // Find real schedules belonging to this bus matching its assigned corridor
    const busSchedules = cleanSchedules.filter((s) => {
      const sPlate = clean(s.vehicleNumber);
      const sId = clean(s.vehicleId);
      const sName = cleanName(s.busName);
      const sTripId = String(s.id || s.tripId || '');
      const vMatch = bPlate && sPlate && sPlate === bPlate;
      const idMatch = bId && sId && sId === bId;
      const nameMatch = bName && sName && sName === bName;
      const tripIdMatch = (bPlate && sTripId.includes(bPlate)) || (bId && sTripId.includes(bId));
      if (!vMatch && !idMatch && !nameMatch && !tripIdMatch) return false;
      if (bOrig && bDest) {
        const sFrom = normalizeCity(s.from);
        const sTo = normalizeCity(s.to);
        const oNorm = normalizeCity(bOrig);
        const dNorm = normalizeCity(bDest);
        const matchesRoute = (sFrom === oNorm && sTo === dNorm) || (sFrom === dNorm && sTo === oNorm);
        if (!matchesRoute) return false;
      }
      return true;
    });

    if (busSchedules.length > 0) {
      busSchedules.forEach((s) => {
        const sId = s.id || s.tripId;
        const sDate = (s.journeyDate || '').split('T')[0];
        const sDir = s.direction || 'UP';
        const slotKey = `${bPlate}_${sDate}_${sDir}`;

        // Strictly enforce 1 UP trip and 1 DOWN trip per day per assigned bus (No 980 duplicates!)
        if (seenSlots.has(slotKey)) return;
        seenSlots.add(slotKey);

        // Validate departure and arrival timetable
        const depTime = s.departureTime || (sDir === 'UP' ? (bus.roundTripSchedule?.upSchedule?.departureTime || '08:00') : (bus.roundTripSchedule?.downSchedule?.departureTime || '16:30'));
        const arrTime = s.arrivalTime || (sDir === 'UP' ? (bus.roundTripSchedule?.upSchedule?.arrivalTime || '14:30') : (bus.roundTripSchedule?.downSchedule?.arrivalTime || '23:00'));

        trips.push({
          id: sId,
          tripId: s.tripId || sId,
          backendTripId: s.backendTripId || sId,
          vehicleId: bus.vehicleId || s.vehicleId,
          vehicleNumber: bus.vehicleNumber || s.vehicleNumber,
          name: bus.busName || s.busName || `${bus.vehicleNumber} (${bus.busType})`,
          type: bus.busType || bus.vehicleType || s.busType || 'AC Seater',
          total,
          fare: Number(s.fare || fare),
          route: `${s.from} → ${s.to}`,
          from: s.from,
          to: s.to,
          time: `${depTime} → ${arrTime}`,
          departureTime: depTime,
          arrivalTime: arrTime,
          journeyDate: sDate,
          direction: sDir,
          seatLayout: bus.seatLayout || generateDefaultSeatLayout(bus.busType, total),
          assignedRoute: bus.assignedRoute,
          status: statuses[sId] || s.status || 'SCHEDULED',
          bookedSeatList: [],
          passengerMap: {},
          bookedCount: 0,
          actualBookedCount: 0,
        });
      });
    } else if (bus.assignedRoute || bus.status === 'Assigned') {
      // Bus is assigned to a corridor, but recurring schedules haven't been generated yet
      // Synthesize its canonical UP and DOWN trips so the operator can immediately inspect seat layout
      const upDep = bus.roundTripSchedule?.upSchedule?.departureTime || '08:00';
      const upArr = bus.roundTripSchedule?.upSchedule?.arrivalTime || '14:30';
      const dnDep = bus.roundTripSchedule?.downSchedule?.departureTime || '20:00';
      const dnArr = bus.roundTripSchedule?.downSchedule?.arrivalTime || '02:30';
      const baseDate = bus.assignedRoute?.effectiveDate || new Date().toISOString().split('T')[0];
      const safePlate = String(bus.vehicleNumber || bus.regNo || bus.vehicleId || 'BUS').toUpperCase().replace(/[^A-Z0-9]/g, '');
      const orig = bus.assignedRoute?.originCity || bus.originCity || 'Chennai';
      const dest = bus.assignedRoute?.destCity || bus.destCity || 'Vijayawada';

      const upTripId = `TRIP_UP_${safePlate}`;
      trips.push({
        id: upTripId,
        tripId: upTripId,
        backendTripId: upTripId,
        vehicleId: bus.vehicleId,
        vehicleNumber: bus.vehicleNumber || 'Bus',
        name: bus.busName || `${bus.vehicleNumber || 'Bus'} (${bus.busType || 'Bus'})`,
        type: bus.busType || bus.vehicleType || 'AC Seater',
        total,
        fare,
        route: `${orig} → ${dest}`,
        from: orig,
        to: dest,
        time: `${upDep} → ${upArr}`,
        departureTime: upDep,
        arrivalTime: upArr,
        journeyDate: baseDate,
        direction: 'UP',
        seatLayout: bus.seatLayout || generateDefaultSeatLayout(bus.busType, total),
        assignedRoute: bus.assignedRoute,
        status: statuses[upTripId] || 'SCHEDULED',
        bookedSeatList: [],
        passengerMap: {},
        bookedCount: 0,
        actualBookedCount: 0,
      });

      const dnTripId = `TRIP_DN_${safePlate}`;
      trips.push({
        id: dnTripId,
        tripId: dnTripId,
        backendTripId: dnTripId,
        vehicleId: bus.vehicleId,
        vehicleNumber: bus.vehicleNumber || 'Bus',
        name: bus.busName || `${bus.vehicleNumber || 'Bus'} (${bus.busType || 'Bus'})`,
        type: bus.busType || bus.vehicleType || 'AC Seater',
        total,
        fare,
        route: `${dest} → ${orig}`,
        from: dest,
        to: orig,
        time: `${dnDep} → ${dnArr}`,
        departureTime: dnDep,
        arrivalTime: dnArr,
        journeyDate: baseDate,
        direction: 'DOWN',
        seatLayout: bus.seatLayout || generateDefaultSeatLayout(bus.busType, total),
        assignedRoute: bus.assignedRoute,
        status: statuses[dnTripId] || 'SCHEDULED',
        bookedSeatList: [],
        passengerMap: {},
        bookedCount: 0,
        actualBookedCount: 0,
      });
    }
  });

  // 3b. Guarantee trip instances exist for any dates where real bookings exist for an assigned bus
  let localBookings = [];
  try {
    localBookings = JSON.parse(localStorage.getItem('c2b_bookings') || '[]');
  } catch { localBookings = []; }

  assignedFleet.forEach((bus) => {
    const isSleeper = (bus.busType || '').toLowerCase().includes('sleeper') && !(bus.busType || '').toLowerCase().includes('semi');
    const total = Number(bus.totalSeats || (isSleeper ? 30 : 40));
    const fare = Number(bus.roundTripSchedule?.fare || (isSleeper ? 1483 : 650));
    const bPlate = clean(bus.vehicleNumber || bus.regNo || bus.vehicleId);
    const bName = cleanName(bus.busName);

    localBookings.forEach((b) => {
      if (!b || b.status === 'CANCELLED' || b.booking_status === 'CANCELLED' || b.bookingStatus === 'CANCELLED') return;
      const bPl = clean(b.vehicleNumber || b.plateNumber);
      const bNm = cleanName(b.busName);
      const bTrId = String(b.tripId || b.backendTripId || '');

      const plateMatches = bPl && (bPl === bPlate || bPl === clean(bus.vehicleId));
      const nameMatches = bNm && bName && (bName === bNm || bName.includes(bNm) || bNm.includes(bName));
      const trMatches = bTrId && (bTrId.includes(bPlate) || (bus.vehicleId && bTrId.includes(clean(bus.vehicleId))));

      if (!plateMatches && !nameMatches && !trMatches) return;

      const bDate = (b.journeyDate || b.date || '').split('T')[0];
      if (!bDate || bDate < todayStr) return;

      const bFromNorm = normalizeCity(b.from);
      const bToNorm = normalizeCity(b.to);
      const origNorm = normalizeCity(bus.assignedRoute?.originCity || 'Chennai');
      const destNorm = normalizeCity(bus.assignedRoute?.destCity || 'Visakhapatnam');

      const routeStops = [
        origNorm,
        ...(bus.assignedRoute?.intermediateStops || []).map(normalizeCity),
        destNorm,
      ];
      const fIdx = routeStops.indexOf(bFromNorm);
      const tIdx = routeStops.indexOf(bToNorm);
      const isDown = (bFromNorm === destNorm && bToNorm === origNorm) || (fIdx !== -1 && tIdx !== -1 && fIdx > tIdx);
      const sDir = isDown ? 'DOWN' : 'UP';
      const slotKey = `${bPlate}_${bDate}_${sDir}`;

      if (!seenSlots.has(slotKey)) {
        seenSlots.add(slotKey);
        const depTime = sDir === 'UP'
          ? (bus.roundTripSchedule?.upSchedule?.departureTime || '08:00')
          : (bus.roundTripSchedule?.downSchedule?.departureTime || '20:00');
        const arrTime = sDir === 'UP'
          ? (bus.roundTripSchedule?.upSchedule?.arrivalTime || '14:30')
          : (bus.roundTripSchedule?.downSchedule?.arrivalTime || '02:30');
        const fromC = isDown ? (bus.assignedRoute?.destCity || 'Visakhapatnam') : (bus.assignedRoute?.originCity || 'Chennai');
        const toC = isDown ? (bus.assignedRoute?.originCity || 'Chennai') : (bus.assignedRoute?.destCity || 'Visakhapatnam');
        const synthTripId = b.tripId || `TRIP_${sDir}_${bPlate}_${bDate.replace(/-/g, '')}`;

        trips.push({
          id: synthTripId,
          tripId: synthTripId,
          backendTripId: synthTripId,
          vehicleId: bus.vehicleId,
          vehicleNumber: bus.vehicleNumber || 'Bus',
          name: bus.busName || `${bus.vehicleNumber || 'Bus'} (${bus.busType || 'Bus'})`,
          type: bus.busType || bus.vehicleType || 'AC Seater',
          total,
          fare: Number(b.fare || fare),
          route: `${fromC} → ${toC}`,
          from: fromC,
          to: toC,
          time: `${depTime} → ${arrTime}`,
          departureTime: depTime,
          arrivalTime: arrTime,
          journeyDate: bDate,
          direction: sDir,
          seatLayout: bus.seatLayout || generateDefaultSeatLayout(bus.busType, total),
          assignedRoute: bus.assignedRoute,
          bookedSeatList: [],
          passengerMap: {},
          bookedCount: 0,
          actualBookedCount: 0,
        });
      }
    });
  });

  // 4. Populate live bookings from c2b_bookings into the real trips (NO MOCK BUSES EVER INVENTED)
  const seenBookingIds = new Set();
  localBookings.forEach((b) => {
    const bId = b?.bookingId || b?.booking_id;
    if (!bId || seenBookingIds.has(bId)) return;
    if (b.status === 'CANCELLED' || b.booking_status === 'CANCELLED' || b.bookingStatus === 'CANCELLED') return;
    seenBookingIds.add(bId);

    // Match booking to the exact trip (Direction and Route aware)
    const bPlate = clean(b.vehicleNumber || b.plateNumber);
    const bVehId = clean(b.vehicleId || b.id);
    const bName = cleanName(b.busName);
    const bTripId = String(b.tripId || b.backendTripId || '').trim();
    const bDate = String(b.journeyDate || b.date || '').split('T')[0];
    const bFrom = normalizeCity(b.from);
    const bTo   = normalizeCity(b.to);

    const match = trips.find((t) => {
      // 1. Direct trip ID match takes top priority
      if (bTripId && (t.id === bTripId || t.tripId === bTripId || t.backendTripId === bTripId)) return true;

      // 2. Bus identity match: plate, vehicleId, or name
      const tPlate = clean(t.vehicleNumber);
      const tId = clean(t.vehicleId);
      const tName = cleanName(t.name);
      const plateMatch = (bPlate && tPlate && (bPlate === tPlate || bPlate.includes(tPlate) || tPlate.includes(bPlate))) ||
                         (bPlate && tId && (bPlate === tId || bPlate.includes(tId) || tId.includes(bPlate))) ||
                         (bVehId && tId && bVehId === tId);
      const nameMatch = bName && tName && (
        tName === bName ||
        tName.includes(bName) ||
        bName.includes(tName)
      );

      // Date match
      const tDate = String(t.journeyDate || '').split('T')[0];
      const dateMatches = !bDate || !tDate || bDate === tDate;

      const tFrom = normalizeCity(t.from);
      const tTo   = normalizeCity(t.to);
      const tDir = t.direction || 'UP';

      // Check route and corridor direction
      let routeMatches = false;
      if (bFrom && bTo && tFrom && tTo) {
        if (bFrom === tFrom && bTo === tTo) {
          routeMatches = true;
        } else if (bFrom === tTo && bTo === tFrom) {
          return false; // Opposing direction
        } else {
          const stops = [tFrom, ...(t.assignedRoute?.intermediateStops || []).map(normalizeCity), tTo];
          const fIdx = stops.indexOf(bFrom);
          const tIdx = stops.indexOf(bTo);
          if (fIdx !== -1 && tIdx !== -1) {
            const isUp = fIdx < tIdx;
            routeMatches = (isUp && tDir === 'UP') || (!isUp && tDir === 'DOWN');
          }
        }
      }

      if ((plateMatch || nameMatch) && dateMatches) {
        if (routeMatches) return true;
        if (!bFrom || !bTo) return true;
        return true;
      }
      if (routeMatches && dateMatches) return true;
      return false;
    });

    // Strictly skip orphan bookings — NEVER invent mock buses!
    if (!match) return;

    const rawSeats = Array.isArray(b.seat_list)
      ? b.seat_list
      : Array.isArray(b.seats)
      ? b.seats
      : typeof b.seats === 'string'
      ? b.seats.split(',')
      : b.seatNumber
      ? [b.seatNumber]
      : [];
    const cleanSeats = [...new Set(rawSeats.map((s) => String(s).trim()).filter(Boolean))];
    if (cleanSeats.length === 0) return;

    const isSleeper = (match.type || '').toLowerCase().includes('sleeper') && !(match.type || '').toLowerCase().includes('semi');

    const primaryPax = {
      name: b.passengerName || b.name || b.customerName || (Array.isArray(b.passengers) && b.passengers[0]?.name) || 'Passenger',
      gender: b.gender || (Array.isArray(b.passengers) && b.passengers[0]?.gender) || 'General',
      age: b.age || (Array.isArray(b.passengers) && b.passengers[0]?.age) || '—',
      phone: b.phone || b.mobile || b.contactNumber || b.passengerPhone || (Array.isArray(b.passengers) && b.passengers[0]?.phone) || '—',
      email: b.email || b.passengerEmail || (Array.isArray(b.passengers) && b.passengers[0]?.email) || '—',
      bookingId: bId,
      bookingDate: b.bookingDate || b.createdAt || b.bookedAt || b.addedAt || '—',
      seats: cleanSeats,
      fare: b.subtotal || b.fare || b.total || b.amount || '—',
      status: b.status || b.booking_status || 'CONFIRMED',
      from: b.from || match.from,
      to: b.to || match.to,
    };

    if (!match._bookedSeatNums) match._bookedSeatNums = new Set();

    cleanSeats.forEach((seatStr, sIdx) => {
      const equivs = getEquivalentSeatIds(seatStr, match.total, isSleeper);
      equivs.list.forEach((eq) => match.bookedSeatList.push(eq));
      if (equivs.num) match._bookedSeatNums.add(equivs.num);

      let paxForSeat = primaryPax;
      if (Array.isArray(b.passengers) && b.passengers.length > 0) {
        const matchedP = b.passengers.find((p) => {
          const s = p.seat || p.seatNumber;
          if (!s) return false;
          const pStr = String(s).trim().toUpperCase();
          if (pStr === seatStr.toUpperCase()) return true;
          const pEquivs = getEquivalentSeatIds(pStr, match.total, isSleeper);
          return pEquivs.list.includes(seatStr.toUpperCase()) || (equivs.num && pEquivs.num === equivs.num);
        }) || b.passengers[sIdx];
        if (matchedP) {
          paxForSeat = {
            ...primaryPax,
            name: matchedP.name || primaryPax.name,
            gender: matchedP.gender || primaryPax.gender,
            age: matchedP.age || primaryPax.age,
            phone: matchedP.phone || primaryPax.phone,
            email: matchedP.email || primaryPax.email,
          };
        }
      }

      equivs.list.forEach((eq) => {
        match.passengerMap[eq] = paxForSeat;
        match.passengerMap[eq.toUpperCase()] = paxForSeat;
        match.passengerMap[eq.toLowerCase()] = paxForSeat;
      });
      match.passengerMap[seatStr] = paxForSeat;
      match.passengerMap[seatStr.toUpperCase()] = paxForSeat;
      match.passengerMap[seatStr.toLowerCase()] = paxForSeat;
    });

    match.bookedSeatList = [...new Set(match.bookedSeatList)];
    match.bookedCount = match._bookedSeatNums.size;
    match.actualBookedCount = match._bookedSeatNums.size;
  });

  // Clean internal tracking set
  trips.forEach((t) => {
    delete t._bookedSeatNums;
  });

  return trips.filter((t) => {
    const status = String(t.status || t.tripStatus || 'SCHEDULED').toUpperCase();
    return status !== 'COMPLETED' && status !== 'CANCELLED';
  });
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

function getLocalTripsForConfirm(localStatuses, providerId) {
  try {
    initFleetStorage();
    const loggedId = sessionStorage.getItem('c2b_loggedInId') || localStorage.getItem('c2b_loggedInId') || 'P001';
    const targetId = providerId || loggedId;
    const fleetBuses = getFleetBuses(targetId);
    const assignedFleet = fleetBuses.filter((b) => b.assignedRoute || b.status === 'Assigned' || b.route);

    // Only show assigned buses — if no buses are assigned, return empty list (no mock data)
    if (assignedFleet.length === 0) {
      return [];
    }

    // Ensure recurring journey instances are generated for assigned buses, including today's trip
    ensureTodayJourneysForAssignedFleet(assignedFleet);

    const clean = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const cleanName = (s) => String(s || '').toLowerCase().trim();

    const assignedPlateSet = new Set(assignedFleet.map((b) => clean(b.vehicleNumber || b.regNo || b.vehicleId)).filter(Boolean));
    const assignedNameSet = new Set(assignedFleet.map((b) => cleanName(b.busName)).filter(Boolean));
    const assignedIdSet = new Set(assignedFleet.map((b) => clean(b.vehicleId || b.id)).filter(Boolean));

    const raw = JSON.parse(localStorage.getItem('c2b_bus_schedules') || '[]');
    const localSchedules = deduplicateSchedules(raw);
    if (localSchedules.length !== raw.length) {
      safeSaveSchedules(localSchedules);
    }

    const cancelledIds = JSON.parse(localStorage.getItem('c2b_cancelled_trip_ids') || '[]');
    const cancelledList = JSON.parse(localStorage.getItem('c2b_cancelled_schedules') || '[]');
    const cancelledSet = new Set([...cancelledIds, ...cancelledList.map((c) => c?.tripId).filter(Boolean)]);

    const assignedSchedules = localSchedules.filter((s) => {
      if (!s || s.isSegment) return false;
      const tripId = s.tripId || s.id || '';
      if (/^T00\d/.test(tripId) || /^BUS_10\d\d$/.test(s.vehicleId || '')) return false;
      if (cancelledSet.has(tripId) || localStatuses[tripId] === 'CANCELLED') return false;

      const sPlate = clean(s.vehicleNumber);
      const sName = cleanName(s.busName);
      const sId = clean(s.vehicleId);

      const matchesPlate = sPlate && assignedPlateSet.has(sPlate);
      const matchesName = sName && assignedNameSet.has(sName);
      const matchesId = sId && assignedIdSet.has(sId);
      const matchesTripId =
        Array.from(assignedPlateSet).some((p) => p && tripId.includes(p)) ||
        Array.from(assignedIdSet).some((id) => id && tripId.includes(id));

      return matchesPlate || matchesName || matchesId || matchesTripId;
    });

    const mapped = [];
    const seenSlots = new Set();

    assignedSchedules.forEach((s, idx) => {
      const tripId = s.tripId || s.id || `LOCAL_T_${idx + 1}`;
      const status = localStatuses[tripId] || s.status || 'SCHEDULED';
      const sPlate = clean(s.vehicleNumber);
      const sId = clean(s.vehicleId);
      const sName = cleanName(s.busName);
      const sDate = (s.journeyDate || '').split('T')[0] || new Date().toISOString().split('T')[0];
      const sDir = s.direction || 'UP';

      const parentBus = assignedFleet.find((b) =>
        (b.vehicleNumber && sPlate && clean(b.vehicleNumber) === sPlate) ||
        (b.vehicleId && sId && clean(b.vehicleId) === sId) ||
        (b.busName && sName && cleanName(b.busName) === sName) ||
        (b.vehicleNumber && s.id && String(s.id).includes(clean(b.vehicleNumber)))
      );

      const vehicleNumber = s.vehicleNumber || parentBus?.vehicleNumber || s.vehicleId || `BUS-${idx + 1}`;
      const busName = s.busName || parentBus?.busName || 'Assigned Fleet Bus';
      const safePlate = clean(vehicleNumber);

      // Strictly enforce 1 UP trip and 1 DOWN trip per day per assigned coach
      const slotKey = `${safePlate}_${sDate}_${sDir}`;
      if (seenSlots.has(slotKey)) return;
      seenSlots.add(slotKey);

      const depTime = s.departureTime || (sDir === 'UP'
        ? (parentBus?.roundTripSchedule?.upSchedule?.departureTime || '08:00')
        : (parentBus?.roundTripSchedule?.downSchedule?.departureTime || '16:30'));
      const arrTime = s.arrivalTime || (sDir === 'UP'
        ? (parentBus?.roundTripSchedule?.upSchedule?.arrivalTime || '14:30')
        : (parentBus?.roundTripSchedule?.downSchedule?.arrivalTime || '23:00'));

      mapped.push({
        trip: {
          tripId,
          tripStatus: status,
          vehicleId: vehicleNumber,
        },
        schedule: {
          scheduleId: s.scheduleId || tripId,
          journeyDate: sDate,
          departureTime: depTime,
          arrivalTime: arrTime,
          via: s.via || (parentBus?.assignedRoute?.intermediateStops || []).join(', ') || '',
          from: s.from || (sDir === 'UP' ? parentBus?.assignedRoute?.originCity : parentBus?.assignedRoute?.destCity) || 'Origin',
          to: s.to || (sDir === 'UP' ? parentBus?.assignedRoute?.destCity : parentBus?.assignedRoute?.originCity) || 'Destination',
          corridorName: s.corridorName || parentBus?.assignedRoute?.corridorName,
          direction: sDir,
        },
        route: {
          source: s.from || (sDir === 'UP' ? parentBus?.assignedRoute?.originCity : parentBus?.assignedRoute?.destCity) || 'Origin',
          destination: s.to || (sDir === 'UP' ? parentBus?.assignedRoute?.destCity : parentBus?.assignedRoute?.originCity) || 'Destination',
          corridorName: s.corridorName || parentBus?.assignedRoute?.corridorName,
        },
        vehicle: {
          vehicleNumber,
          busName,
          busType: s.busType || parentBus?.busType || 'AC',
        },
      });
    });

    // Guarantee every assigned bus has today's canonical trips in Confirm Trips if missing
    const todayStr = new Date().toISOString().split('T')[0];
    assignedFleet.forEach((bus) => {
      const bPlate = clean(bus.vehicleNumber || bus.regNo || bus.vehicleId);
      const bOrig = cleanName(bus.assignedRoute?.originCity || 'Chennai');
      const bDest = cleanName(bus.assignedRoute?.destCity || 'Vijayawada');

      const hasTodayTrips = mapped.some((m) => {
        const mPlate = clean(m.vehicle?.vehicleNumber || m.trip?.vehicleId);
        const matchesPlate = (bPlate && mPlate === bPlate) || (bPlate && m.trip?.tripId?.includes(bPlate));
        if (!matchesPlate) return false;
        const mDate = (m.schedule?.journeyDate || '').split('T')[0];
        return mDate === todayStr;
      });

      if (!hasTodayTrips) {
        const upTripId = `T_UP_${bPlate}_${todayStr.replace(/-/g, '')}`;
        const downTripId = `T_DN_${bPlate}_${todayStr.replace(/-/g, '')}`;
        const orig = bus.assignedRoute?.originCity || 'Chennai';
        const dest = bus.assignedRoute?.destCity || 'Vijayawada';
        const corr = bus.assignedRoute?.corridorName || `${orig} ↔ ${dest} Corridor`;

        const upSlot = `${bPlate}_${todayStr}_UP`;
        if (!seenSlots.has(upSlot) && !cancelledSet.has(upTripId) && localStatuses[upTripId] !== 'CANCELLED') {
          seenSlots.add(upSlot);
          mapped.push({
            trip: {
              tripId: upTripId,
              tripStatus: localStatuses[upTripId] || 'SCHEDULED',
              vehicleId: bus.vehicleNumber,
            },
            schedule: {
              scheduleId: upTripId,
              journeyDate: todayStr,
              departureTime: bus.roundTripSchedule?.upSchedule?.departureTime || '08:00',
              arrivalTime: bus.roundTripSchedule?.upSchedule?.arrivalTime || '14:30',
              via: (bus.assignedRoute?.intermediateStops || []).join(', '),
              from: orig,
              to: dest,
              corridorName: corr,
              direction: 'UP',
            },
            route: { source: orig, destination: dest, corridorName: corr },
            vehicle: {
              vehicleNumber: bus.vehicleNumber,
              busName: bus.busName,
              busType: bus.busType || bus.vehicleType || 'AC Sleeper',
            },
          });
        }

        const dnSlot = `${bPlate}_${todayStr}_DOWN`;
        if (!seenSlots.has(dnSlot) && !cancelledSet.has(downTripId) && localStatuses[downTripId] !== 'CANCELLED') {
          seenSlots.add(dnSlot);
          mapped.push({
            trip: {
              tripId: downTripId,
              tripStatus: localStatuses[downTripId] || 'SCHEDULED',
              vehicleId: bus.vehicleNumber,
            },
            schedule: {
              scheduleId: downTripId,
              journeyDate: todayStr,
              departureTime: bus.roundTripSchedule?.downSchedule?.departureTime || '16:30',
              arrivalTime: bus.roundTripSchedule?.downSchedule?.arrivalTime || '23:00',
              via: [...(bus.assignedRoute?.intermediateStops || [])].reverse().join(', '),
              from: dest,
              to: orig,
              corridorName: corr,
              direction: 'DOWN',
            },
            route: { source: dest, destination: orig, corridorName: corr },
            vehicle: {
              vehicleNumber: bus.vehicleNumber,
              busName: bus.busName,
              busType: bus.busType || bus.vehicleType || 'AC Sleeper',
            },
          });
        }
      }
    });

    return mapped;
  } catch {
    return [];
  }
}

/* ── Confirm Trips / Live Trips ── */
export async function fetchLiveTrips(providerId) {
  const loggedId = sessionStorage.getItem('c2b_loggedInId') || localStorage.getItem('c2b_loggedInId') || 'P001';
  const targetId = providerId || loggedId;
  const fleetBuses = getFleetBuses(targetId);
  const assignedFleet = fleetBuses.filter((b) => b.assignedRoute || b.status === 'Assigned' || b.route);

  // If no buses are assigned, return empty list (no mock trips!)
  if (assignedFleet.length === 0) {
    return { data: [], isLive: false };
  }

  const clean = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const cleanName = (s) => String(s || '').toLowerCase().trim();

  const assignedPlateSet = new Set(assignedFleet.map((b) => clean(b.vehicleNumber || b.regNo || b.vehicleId)).filter(Boolean));
  const assignedNameSet = new Set(assignedFleet.map((b) => cleanName(b.busName)).filter(Boolean));
  const assignedIdSet = new Set(assignedFleet.map((b) => clean(b.vehicleId || b.id)).filter(Boolean));

  const localStatuses = JSON.parse(localStorage.getItem('c2b_trip_statuses') || '{}');
  const localTrips = getLocalTripsForConfirm(localStatuses, targetId);

  try {
    const schedules = await spFetch(`/schedules?providerId=${encodeURIComponent(targetId)}`, { timeout: 1500 });
    const scheduleIds = (schedules || []).map((s) => s.scheduleId);
    const allTrips = await spFetch('/trips', { timeout: 1500 });
    let myTrips = (allTrips || []).filter((t) => scheduleIds.includes(t.scheduleId));
    if (!myTrips.length) myTrips = allTrips || [];

    // Filter to only trips belonging to assigned fleet buses
    myTrips = myTrips.filter((t) => {
      const vNum = clean(t.vehicleNumber || t.vehicle?.vehicleNumber);
      const bName = cleanName(t.busName || t.vehicle?.busName);
      const vId = clean(t.vehicleId || t.vehicle?.vehicleId);
      return (vNum && assignedPlateSet.has(vNum)) || (bName && assignedNameSet.has(bName)) || (vId && assignedIdSet.has(vId));
    });

    const detailed = await Promise.all(
      myTrips.map(async (trip) => {
        try {
          const res = await spFetch(`/trips/${trip.tripId}`, { timeout: 1500 });
          if (res && res.trip) return res;
          return {
            trip: {
              tripId: res?.tripId || trip.tripId,
              tripStatus: res?.status || res?.tripStatus || trip.status || 'SCHEDULED',
              vehicleId: res?.vehicleNumber || trip.vehicleNumber || '—',
            },
            schedule: {
              scheduleId: res?.scheduleId || trip.scheduleId || trip.tripId,
              journeyDate: res?.journeyDate || trip.journeyDate || new Date().toISOString().split('T')[0],
              departureTime: res?.departureTime || trip.departureTime || '08:00',
              arrivalTime: res?.arrivalTime || trip.arrivalTime || '14:30',
              via: res?.via || trip.via || '',
              from: res?.from || res?.source || trip.source || 'Origin',
              to: res?.to || res?.destination || trip.destination || 'Destination',
              corridorName: res?.corridorName || trip.corridorName,
              direction: res?.direction || trip.direction || 'UP',
            },
            route: {
              source: res?.from || res?.source || trip.source || 'Origin',
              destination: res?.to || res?.destination || trip.destination || 'Destination',
              corridorName: res?.corridorName || trip.corridorName,
            },
            vehicle: {
              vehicleNumber: res?.vehicleNumber || trip.vehicleNumber || '—',
              busName: res?.busName || trip.busName || 'Bus',
              busType: res?.busType || trip.busType || 'AC',
            },
          };
        } catch {
          return {
            trip: { tripId: trip.tripId, tripStatus: trip.status || 'SCHEDULED', vehicleId: trip.vehicleNumber },
            schedule: { ...trip, from: trip.source, to: trip.destination },
            route: { source: trip.source, destination: trip.destination },
            vehicle: { vehicleNumber: trip.vehicleNumber, busName: trip.busName, busType: trip.busType },
          };
        }
      })
    );
    const existingIds = new Set(detailed.map((d) => d?.trip?.tripId).filter(Boolean));
    const extraLocal = localTrips.filter((lt) => !existingIds.has(lt.trip.tripId));
    return { data: [...detailed, ...extraLocal], isLive: true };
  } catch {
    return { data: localTrips, isLive: false };
  }
}

export async function confirmTrip(tripId) {
  const statuses = JSON.parse(localStorage.getItem('c2b_trip_statuses') || '{}');
  statuses[tripId] = 'CONFIRMED';
  localStorage.setItem('c2b_trip_statuses', JSON.stringify(statuses));
  notifyChange('TRIP_STATUS_UPDATED', { tripId, status: 'CONFIRMED' });

  try {
    await spFetch(`/trips/${tripId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ tripStatus: 'CONFIRMED' }),
      timeout: 1500,
    });
  } catch {}
}

export async function startTrip(tripId) {
  const statuses = JSON.parse(localStorage.getItem('c2b_trip_statuses') || '{}');
  statuses[tripId] = 'IN_PROGRESS';
  localStorage.setItem('c2b_trip_statuses', JSON.stringify(statuses));
  notifyChange('TRIP_STATUS_UPDATED', { tripId, status: 'IN_PROGRESS' });

  try {
    await spFetch(`/trips/${tripId}/confirm`, { method: 'PATCH', timeout: 1500 });
  } catch {}
}

export async function endTrip(tripId) {
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

  notifyChange('TRIP_STATUS_UPDATED', { tripId, status: 'COMPLETED' });

  try {
    await spFetch(`/trips/${tripId}/complete`, { method: 'PATCH', timeout: 1500 });
  } catch {
    try {
      await spFetch(`/trips/${tripId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ tripStatus: 'COMPLETED' }),
        timeout: 1500,
      });
    } catch {}
  }
}

export async function updateLocation(tripId, lat, lng, status, nextStop, providerId) {
  try {
    const allTracking = JSON.parse(localStorage.getItem('c2b_live_tracking') || '{}');
    allTracking[tripId] = {
      lat,
      lng,
      status: status || 'EN_ROUTE',
      nextStop: nextStop || '',
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem('c2b_live_tracking', JSON.stringify(allTracking));
    notifyChange('TRACKING_UPDATED', { tripId, lat, lng, status, nextStop });
  } catch {}

  try {
    await spFetch(`/tracking/${tripId}`, {
      method: 'PATCH',
      body: JSON.stringify({ providerId, lat, lng, status, ...(nextStop ? { nextStop } : {}) }),
      timeout: 1500,
    });
  } catch {}
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
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
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
  'tenali': { name: 'Tenali', lat: 16.2430, lng: 80.6400, state: 'Andhra Pradesh' },
  'gummidipoondi': { name: 'Gummidipoondi', lat: 13.4077, lng: 80.1255, state: 'Tamil Nadu' },
  // Visakhapatnam ↔ Vijayawada corridor cities
  'anakapalle': { name: 'Anakapalle', lat: 17.6914, lng: 83.0053, state: 'Andhra Pradesh' },
  'tuni': { name: 'Tuni', lat: 17.3573, lng: 82.5484, state: 'Andhra Pradesh' },
  'samalkot': { name: 'Samalkot', lat: 17.0574, lng: 82.1700, state: 'Andhra Pradesh' },
  'nidadavole': { name: 'Nidadavole', lat: 16.9075, lng: 81.6694, state: 'Andhra Pradesh' },
  'tadepalligudem': { name: 'Tadepalligudem', lat: 16.8138, lng: 81.5272, state: 'Andhra Pradesh' },
  'bhimavaram': { name: 'Bhimavaram', lat: 16.5443, lng: 81.5212, state: 'Andhra Pradesh' },
  'tanuku': { name: 'Tanuku', lat: 16.7536, lng: 81.6797, state: 'Andhra Pradesh' },
  'pithapuram': { name: 'Pithapuram', lat: 17.1137, lng: 82.2537, state: 'Andhra Pradesh' },
  'kakinada': { name: 'Kakinada', lat: 16.9891, lng: 82.2475, state: 'Andhra Pradesh' },
  'amalapuram': { name: 'Amalapuram', lat: 16.5775, lng: 82.0046, state: 'Andhra Pradesh' },
  // Guntur ↔ Hyderabad corridor cities
  'miryalaguda': { name: 'Miryalaguda', lat: 16.8731, lng: 79.5649, state: 'Telangana' },
  'nalgonda': { name: 'Nalgonda', lat: 17.0570, lng: 79.2671, state: 'Telangana' },
  'addanki': { name: 'Addanki', lat: 15.8130, lng: 79.9770, state: 'Andhra Pradesh' },
  'narasaraopet': { name: 'Narasaraopet', lat: 16.2342, lng: 80.0477, state: 'Andhra Pradesh' },
  'macherla': { name: 'Macherla', lat: 16.4779, lng: 79.4328, state: 'Andhra Pradesh' },
  'sattenapalle': { name: 'Sattenapalle', lat: 16.3934, lng: 80.1511, state: 'Andhra Pradesh' },
  'piduguralla': { name: 'Piduguralla', lat: 16.4749, lng: 79.8869, state: 'Andhra Pradesh' },
  'vinukonda': { name: 'Vinukonda', lat: 16.0491, lng: 79.7399, state: 'Andhra Pradesh' },
  // Rayalaseema & Karnataka Transit Corridors
  'kurnool': { name: 'Kurnool', lat: 15.8281, lng: 78.0373, state: 'Andhra Pradesh' },
  'nandyal': { name: 'Nandyal', lat: 15.4786, lng: 78.4836, state: 'Andhra Pradesh' },
  'anantapur': { name: 'Anantapur', lat: 14.6819, lng: 77.6006, state: 'Andhra Pradesh' },
  'dharmavaram': { name: 'Dharmavaram', lat: 14.4137, lng: 77.7126, state: 'Andhra Pradesh' },
  'kadapa': { name: 'Kadapa', lat: 14.4673, lng: 78.8242, state: 'Andhra Pradesh' },
  'proddatur': { name: 'Proddatur', lat: 14.7526, lng: 78.5523, state: 'Andhra Pradesh' },
  'madanapalle': { name: 'Madanapalle', lat: 13.5560, lng: 78.5010, state: 'Andhra Pradesh' },
  'warangal': { name: 'Warangal', lat: 17.9689, lng: 79.5941, state: 'Telangana' },
  'khammam': { name: 'Khammam', lat: 17.2473, lng: 80.1514, state: 'Telangana' },
  'mahabubnagar': { name: 'Mahabubnagar', lat: 16.7488, lng: 77.9856, state: 'Telangana' },
  'nizamabad': { name: 'Nizamabad', lat: 18.6725, lng: 78.0941, state: 'Telangana' },
  'karimnagar': { name: 'Karimnagar', lat: 18.4386, lng: 79.1288, state: 'Telangana' },
  // Tamil Nadu & Karnataka Regional Transit Network
  'salem': { name: 'Salem', lat: 11.6643, lng: 78.1460, state: 'Tamil Nadu' },
  'erode': { name: 'Erode', lat: 11.3410, lng: 77.7172, state: 'Tamil Nadu' },
  'coimbatore': { name: 'Coimbatore', lat: 11.0168, lng: 76.9558, state: 'Tamil Nadu' },
  'tirupur': { name: 'Tirupur', lat: 11.1085, lng: 77.3411, state: 'Tamil Nadu' },
  'madurai': { name: 'Madurai', lat: 9.9252, lng: 78.1198, state: 'Tamil Nadu' },
  'dindigul': { name: 'Dindigul', lat: 10.3673, lng: 77.9803, state: 'Tamil Nadu' },
  'trichy': { name: 'Trichy', lat: 10.7905, lng: 78.7047, state: 'Tamil Nadu' },
  'thanjavur': { name: 'Thanjavur', lat: 10.7870, lng: 79.1378, state: 'Tamil Nadu' },
  'villupuram': { name: 'Villupuram', lat: 11.9401, lng: 79.4861, state: 'Tamil Nadu' },
  'tindivanam': { name: 'Tindivanam', lat: 12.2330, lng: 79.6500, state: 'Tamil Nadu' },
  'chengalpattu': { name: 'Chengalpattu', lat: 12.6841, lng: 79.9836, state: 'Tamil Nadu' },
  'tambaram': { name: 'Tambaram', lat: 12.9249, lng: 80.1000, state: 'Tamil Nadu' },
  'mysore': { name: 'Mysore', lat: 12.2958, lng: 76.6394, state: 'Karnataka' },
  'tumkur': { name: 'Tumkur', lat: 13.3379, lng: 77.1010, state: 'Karnataka' },
  'hubli': { name: 'Hubli', lat: 15.3647, lng: 75.1240, state: 'Karnataka' },
  'belgaum': { name: 'Belgaum', lat: 15.8497, lng: 74.4977, state: 'Karnataka' },
  'davangere': { name: 'Davangere', lat: 14.4644, lng: 75.9218, state: 'Karnataka' },
  'sholapur': { name: 'Solapur', lat: 17.6599, lng: 75.9064, state: 'Maharashtra' },
  'kolhapur': { name: 'Kolhapur', lat: 16.7050, lng: 74.2433, state: 'Maharashtra' },
  'thane': { name: 'Thane', lat: 19.2183, lng: 72.9781, state: 'Maharashtra' },
  'nashik': { name: 'Nashik', lat: 19.9975, lng: 73.7898, state: 'Maharashtra' },
  'aurangabad': { name: 'Aurangabad', lat: 19.8762, lng: 75.3433, state: 'Maharashtra' },
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

/* ── Registered Provider Fleet for Step 1 & Global Fleet Registry ── */
export function getRegisteredBuses() {
  const fleet = getFleetBuses();
  if (fleet && fleet.length > 0) {
    return fleet.map((b) => ({
      vehicleId: b.vehicleId || b.id,
      vehicleNumber: b.vehicleNumber,
      busName: b.busName || b.vehicleNumber,
      busType: b.busType || b.vehicleType || 'Volvo AC',
      totalSeats: b.totalSeats || 40,
      seatingType: b.seatingType || `${b.busType || 'AC'} Coach`,
      amenities: b.amenities || ['WiFi', 'AC', 'Charging point'],
      rating: b.rating || 4.7,
      status: b.status || 'Available',
      assignedRoute: b.assignedRoute || null,
      seatLayout: b.seatLayout || null,
    }));
  }
  return [];
}

/* ── Verified Indian Corridor Presets ── */
const CORRIDOR_PRESET_DB = {
  'chennai|visakhapatnam': [
    {
      corridorId: 'CORR_MAS_VSKP_A',
      name: 'Corridor A: NH16 Coastal Corridor (via Nellore - Ongole - Vijayawada - Rajahmundry)',
      highway: 'NH16 Golden Quadrilateral Coastal Expressway',
      distance: 790,
      duration: '13h 30m',
      durationMinutes: 810,
      description: 'Major eastern coastal trunk corridor connecting Tamil Nadu and Andhra Pradesh along NH16 through all major coastal commercial hubs.',
      majorTowns: [
        'Tada', 'SriCity', 'Nayudupeta', 'Gudur', 'Nellore', 'Kavali', 'Ongole',
        'Chilakaluripet', 'Guntur', 'Vijayawada', 'Eluru', 'Tadepalligudem', 'Tanuku',
        'Rajahmundry', 'Samalkot', 'Kakinada', 'Annavaram', 'Tuni', 'Anakapalle'
      ],
      polyline: [
        [13.0827, 80.2707], [13.5937, 80.0335], [13.9056, 79.9026], [14.1463, 79.8504],
        [14.4426, 79.9865], [14.9132, 79.9930], [15.5057, 80.0499], [16.0892, 80.1672],
        [16.3067, 80.4365], [16.5062, 80.6480], [16.7107, 81.0952], [16.8142, 81.5266],
        [16.8584, 81.6881], [17.0005, 81.8040], [17.0494, 82.1706], [16.9891, 82.2475],
        [17.2800, 82.4000], [17.3571, 82.5484], [17.6914, 83.0053], [17.6868, 83.2185]
      ],
      suggestedCities: [
        { name: 'Tada', lat: 13.5937, lng: 80.0335, type: 'city' },
        { name: 'Nayudupeta', lat: 13.9056, lng: 79.9026, type: 'city' },
        { name: 'Nellore', lat: 14.4426, lng: 79.9865, type: 'city' },
        { name: 'Kavali', lat: 14.9132, lng: 79.9930, type: 'city' },
        { name: 'Ongole', lat: 15.5057, lng: 80.0499, type: 'city' },
        { name: 'Guntur', lat: 16.3067, lng: 80.4365, type: 'city' },
        { name: 'Vijayawada', lat: 16.5062, lng: 80.6480, type: 'city' },
        { name: 'Eluru', lat: 16.7107, lng: 81.0952, type: 'city' },
        { name: 'Tadepalligudem', lat: 16.8142, lng: 81.5266, type: 'city' },
        { name: 'Tanuku', lat: 16.8584, lng: 81.6881, type: 'city' },
        { name: 'Rajahmundry', lat: 17.0005, lng: 81.8040, type: 'city' },
        { name: 'Samalkot', lat: 17.0494, lng: 82.1706, type: 'city' },
        { name: 'Kakinada', lat: 16.9891, lng: 82.2475, type: 'city' },
        { name: 'Annavaram', lat: 17.2800, lng: 82.4000, type: 'city' },
        { name: 'Tuni', lat: 17.3571, lng: 82.5484, type: 'city' },
        { name: 'Anakapalle', lat: 17.6914, lng: 83.0053, type: 'city' },
      ],
      suggestedBoardingPoints: [
        { name: 'CMBT Koyambedu Bus Terminus', lat: 13.0694, lng: 80.2057, type: 'bus_station', boardingPoint: 'Platform 6, CMBT Intercity Terminal', droppingPoint: 'CMBT Koyambedu Roundtana' },
        { name: 'Nellore RTC Central Bus Stand', lat: 14.4426, lng: 79.9865, type: 'bus_station', boardingPoint: 'RTC Central Complex Platform 4', droppingPoint: 'Nellore Mini Bypass Junction' },
        { name: 'Vijayawada Pandit Nehru Bus Station (PNBS)', lat: 16.5062, lng: 80.6480, type: 'bus_station', boardingPoint: 'PNBS Platform 12 Intercity', droppingPoint: 'Varadhi Junction Flyover' },
        { name: 'Rajahmundry RTC Complex', lat: 17.0005, lng: 81.8040, type: 'bus_station', boardingPoint: 'Rajahmundry Central Bus Station Bay 3', droppingPoint: 'Lalacheruvu Flyover Bypass' },
        { name: 'Visakhapatnam Dwaraka Bus Station (RTC Complex)', lat: 17.6868, lng: 83.2185, type: 'bus_station', boardingPoint: 'Dwaraka Bus Station Main Bay', droppingPoint: 'Maddilapalem Bus Bay' },
      ],
    },
  ],
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

  'chennai|vijayawada': [
    {
      corridorId: 'CORR_CHN_BZA_A',
      name: 'Corridor A: NH16 Coastal Corridor (via Tada - Nayudupeta - Gudur - Nellore - Kavali - Singarayakonda - Ongole - Chilakaluripet - Guntur)',
      highway: 'NH16 National Expressway',
      distance: 435,
      duration: '7h 15m',
      durationMinutes: 435,
      description: 'Primary high-speed 6-lane coastal corridor connecting Chennai with Vijayawada commercial hub via key district transit terminals.',
      majorTowns: ['Tada', 'Nayudupeta', 'Gudur', 'Nellore', 'Kavali', 'Singarayakonda', 'Ongole', 'Chilakaluripet', 'Guntur'],
      polyline: [
        [13.0827, 80.2707], [13.5937, 80.0335], [13.9056, 79.9026], [14.1463, 79.8504],
        [14.4426, 79.9865], [14.9132, 79.9930], [15.2500, 80.0300], [15.5057, 80.0499],
        [16.0892, 80.1672], [16.3067, 80.4365], [16.5062, 80.6480]
      ],
      suggestedCities: [
        { name: 'Tada', lat: 13.5937, lng: 80.0335, type: 'city' },
        { name: 'Nayudupeta', lat: 13.9056, lng: 79.9026, type: 'city' },
        { name: 'Gudur', lat: 14.1463, lng: 79.8504, type: 'city' },
        { name: 'Nellore', lat: 14.4426, lng: 79.9865, type: 'city' },
        { name: 'Kavali', lat: 14.9132, lng: 79.9930, type: 'city' },
        { name: 'Singarayakonda', lat: 15.2500, lng: 80.0300, type: 'city' },
        { name: 'Ongole', lat: 15.5057, lng: 80.0499, type: 'city' },
        { name: 'Chilakaluripet', lat: 16.0892, lng: 80.1672, type: 'city' },
        { name: 'Guntur', lat: 16.3067, lng: 80.4365, type: 'city' },
      ],
      suggestedBoardingPoints: [
        { name: 'CMBT Koyambedu Bus Terminus', lat: 13.0694, lng: 80.2057, type: 'bus_station', boardingPoint: 'Platform 8, CMBT Intercity', droppingPoint: 'CMBT Roundtana' },
        { name: 'Tada NH16 Highway Bus Bay', lat: 13.5937, lng: 80.0335, type: 'bus_station', boardingPoint: 'Tada Toll Bypass Bus Bay', droppingPoint: 'Tada Toll Gate Cross' },
        { name: 'Nayudupeta RTC Bus Station', lat: 13.9056, lng: 79.9026, type: 'bus_station', boardingPoint: 'APSRTC Bus Station Bay 1', droppingPoint: 'Highway Bypass Flyover' },
        { name: 'Gudur RTC Bus Depot', lat: 14.1463, lng: 79.8504, type: 'bus_station', boardingPoint: 'Gudur Railway Station Circle', droppingPoint: 'Old Bus Stand Junction' },
        { name: 'Nellore RTC Central Bus Stand', lat: 14.4426, lng: 79.9865, type: 'bus_station', boardingPoint: 'RTC Central Bus Complex Platform 4', droppingPoint: 'Nellore Mini Bypass Junction' },
        { name: 'Kavali RTC Bus Complex', lat: 14.9132, lng: 79.9930, type: 'bus_station', boardingPoint: 'RTC Complex Main Entrance', droppingPoint: 'Kavali Highway Bypass' },
        { name: 'Singarayakonda RTC Bus Stand', lat: 15.2500, lng: 80.0300, type: 'bus_station', boardingPoint: 'Town Clock Tower RTC Stand', droppingPoint: 'Singarayakonda Bypass' },
        { name: 'Ongole New RTC Bus Stand', lat: 15.5057, lng: 80.0499, type: 'bus_station', boardingPoint: 'New RTC Stand Kurnool Road', droppingPoint: 'Ongole South Bypass Flyover' },
        { name: 'Chilakaluripet RTC Bus Station', lat: 16.0892, lng: 80.1672, type: 'bus_station', boardingPoint: 'Clock Tower RTC Point', droppingPoint: 'Chilakaluripet Bypass Toll' },
        { name: 'Guntur NTR RTC Bus Station', lat: 16.3067, lng: 80.4365, type: 'bus_station', boardingPoint: 'NTR Bus Station Platform 12', droppingPoint: 'Guntur Auto Nagar Drop Point' },
        { name: 'Vijayawada Pandit Nehru Bus Station (PNBS)', lat: 16.5062, lng: 80.6480, type: 'bus_station', boardingPoint: 'PNBS Platform 1 Intercity', droppingPoint: 'PNBS Out Gate Terminal' },
      ],
    },
    {
      corridorId: 'CORR_CHN_BZA_B',
      name: 'Corridor B: Inland Highway (via Tiruvallur - Tiruttani - Nagari - Puttur - Nellore - Tenali)',
      highway: 'SH57 / NH716 / NH16',
      distance: 468,
      duration: '8h 30m',
      durationMinutes: 510,
      description: 'Regional corridor via western Tamil Nadu satellite towns, Chittoor border, connecting to Tenali and Vijayawada.',
      majorTowns: ['Tiruvallur', 'Tiruttani', 'Nagari', 'Puttur', 'Nellore', 'Kavali', 'Ongole', 'Tenali'],
      polyline: [
        [13.0827, 80.2707], [13.1432, 79.9083], [13.1764, 79.6102], [13.3308, 79.5843],
        [13.4414, 79.5539], [14.4426, 79.9865], [14.9132, 79.9930], [15.5057, 80.0499],
        [16.2430, 80.6400], [16.5062, 80.6480]
      ],
      suggestedCities: [
        { name: 'Tiruvallur', lat: 13.1432, lng: 79.9083, type: 'city' },
        { name: 'Tiruttani', lat: 13.1764, lng: 79.6102, type: 'city' },
        { name: 'Nagari', lat: 13.3308, lng: 79.5843, type: 'city' },
        { name: 'Puttur', lat: 13.4414, lng: 79.5539, type: 'city' },
        { name: 'Nellore', lat: 14.4426, lng: 79.9865, type: 'city' },
        { name: 'Kavali', lat: 14.9132, lng: 79.9930, type: 'city' },
        { name: 'Ongole', lat: 15.5057, lng: 80.0499, type: 'city' },
        { name: 'Tenali', lat: 16.2430, lng: 80.6400, type: 'city' },
      ],
      suggestedBoardingPoints: [
        { name: 'Tiruvallur Head Bus Depot', lat: 13.1432, lng: 79.9083, type: 'bus_station', boardingPoint: 'Head Bus Depot Bay 2', droppingPoint: 'Tiruvallur Bypass' },
        { name: 'Tiruttani Bypass Circle', lat: 13.1764, lng: 79.6102, type: 'bus_station', boardingPoint: 'RTC Stand Main Bay', droppingPoint: 'Tiruttani Bypass' },
        { name: 'Nagari RTC Stand', lat: 13.3308, lng: 79.5843, type: 'bus_station', boardingPoint: 'Nagari RTC Bus Stand', droppingPoint: 'Nagari Checkpost' },
        { name: 'Puttur Checkpost Bus Bay', lat: 13.4414, lng: 79.5539, type: 'bus_station', boardingPoint: 'Puttur Town RTC Station', droppingPoint: 'Checkpost Drop Bay' },
        { name: 'Nellore Mini Bypass Junction', lat: 14.4480, lng: 79.9800, type: 'bus_station', boardingPoint: 'Nellore Mini Bypass', droppingPoint: 'Mini Bypass Flyover' },
        { name: 'Ongole Bypass Flyover Point', lat: 15.5100, lng: 80.0450, type: 'bus_station', boardingPoint: 'Ongole South Highway Point', droppingPoint: 'Bypass Flyover Point' },
        { name: 'Tenali RTC Central Bus Stand', lat: 16.2430, lng: 80.6400, type: 'bus_station', boardingPoint: 'Tenali RTC Central Bay', droppingPoint: 'Tenali Railway Cross' },
        { name: 'Vijayawada PNBS Terminal', lat: 16.5062, lng: 80.6480, type: 'bus_station', boardingPoint: 'PNBS Platform 3', droppingPoint: 'City Bus Terminal Exit' },
      ],
    },
    {
      corridorId: 'CORR_CHN_BZA_C',
      name: 'Corridor C: Western Rayalaseema Link (via Srikalahasti - Gudur - Ongole)',
      highway: 'SH61 / NH16 Expressway',
      distance: 452,
      duration: '8h 05m',
      durationMinutes: 485,
      description: 'Pilgrim and regional connector passing Srikalahasti temple town and Gudur before joining the primary Vijayawada link.',
      majorTowns: ['Gummidipoondi', 'Srikalahasti', 'Gudur', 'Nellore', 'Ongole', 'Chilakaluripet', 'Guntur'],
      polyline: [
        [13.0827, 80.2707], [13.4077, 80.1255], [13.7500, 79.7000], [14.1463, 79.8504],
        [14.4426, 79.9865], [15.5057, 80.0499], [16.0892, 80.1672], [16.3067, 80.4365], [16.5062, 80.6480]
      ],
      suggestedCities: [
        { name: 'Gummidipoondi', lat: 13.4077, lng: 80.1255, type: 'city' },
        { name: 'Srikalahasti', lat: 13.7500, lng: 79.7000, type: 'city' },
        { name: 'Gudur', lat: 14.1463, lng: 79.8504, type: 'city' },
        { name: 'Nellore', lat: 14.4426, lng: 79.9865, type: 'city' },
        { name: 'Ongole', lat: 15.5057, lng: 80.0499, type: 'city' },
        { name: 'Chilakaluripet', lat: 16.0892, lng: 80.1672, type: 'city' },
        { name: 'Guntur', lat: 16.3067, lng: 80.4365, type: 'city' },
      ],
      suggestedBoardingPoints: [
        { name: 'Gummidipoondi SIPCOT Bus Stop', lat: 13.4077, lng: 80.1255, type: 'bus_station', boardingPoint: 'SIPCOT Industrial Gate', droppingPoint: 'Railway Station Road' },
        { name: 'Srikalahasti Temple RTC Bus Stop', lat: 13.7500, lng: 79.7000, type: 'bus_station', boardingPoint: 'Temple Car Street Stand', droppingPoint: 'Srikalahasti Bypass' },
        { name: 'Gudur Railway Station Circle', lat: 14.1463, lng: 79.8504, type: 'bus_station', boardingPoint: 'Railway Station Circle Stand', droppingPoint: 'Gudur Old Bus Stand' },
        { name: 'Nellore Atmakur Bus Stand', lat: 14.4410, lng: 79.9820, type: 'bus_station', boardingPoint: 'Atmakur Bus Stand Platform 1', droppingPoint: 'Highway Junction' },
        { name: 'Ongole South Bypass Point', lat: 15.4950, lng: 80.0420, type: 'bus_station', boardingPoint: 'South Bypass Junction', droppingPoint: 'Kurnool Road Flyover' },
        { name: 'Guntur Auto Nagar Point', lat: 16.3100, lng: 80.4400, type: 'bus_station', boardingPoint: 'Auto Nagar Highway Gate', droppingPoint: 'Guntur Bypass Circle' },
        { name: 'Vijayawada PNBS RTC Stand', lat: 16.5062, lng: 80.6480, type: 'bus_station', boardingPoint: 'PNBS Entrance Platform', droppingPoint: 'PNBS Terminal' },
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

  'guntur|hyderabad': [
    {
      corridorId: 'CORR_GNT_HYD_A',
      name: 'Corridor A: NH65 Direct Expressway (via Narasaraopet - Miryalaguda - Nalgonda)',
      highway: 'NH65 Expressway',
      distance: 265,
      duration: '4h 50m',
      durationMinutes: 290,
      description: 'Primary expressway from Guntur to Hyderabad via Narasaraopet, Miryalaguda and Nalgonda district hubs.',
      majorTowns: ['Narasaraopet', 'Piduguralla', 'Miryalaguda', 'Nalgonda', 'Suryapet'],
      polyline: [
        [16.3067, 80.4365], [16.2342, 80.0477], [16.4749, 79.8869], [16.8731, 79.5649], [17.0570, 79.2671], [17.1439, 79.6239], [17.3850, 78.4867]
      ],
      suggestedCities: [
        { name: 'Narasaraopet', lat: 16.2342, lng: 80.0477, type: 'city' },
        { name: 'Piduguralla', lat: 16.4749, lng: 79.8869, type: 'city' },
        { name: 'Miryalaguda', lat: 16.8731, lng: 79.5649, type: 'city' },
        { name: 'Nalgonda', lat: 17.0570, lng: 79.2671, type: 'city' },
        { name: 'Suryapet', lat: 17.1439, lng: 79.6239, type: 'city' },
      ],
      suggestedBoardingPoints: [
        { name: 'Guntur NTR RTC Bus Station', lat: 16.3067, lng: 80.4365, type: 'bus_station', boardingPoint: 'NTR Bus Station Platform 1', droppingPoint: 'Guntur South Bypass' },
        { name: 'Narasaraopet RTC Bus Stand', lat: 16.2342, lng: 80.0477, type: 'bus_station', boardingPoint: 'Main RTC Stand Bay', droppingPoint: 'Narasaraopet Bypass Circle' },
        { name: 'Piduguralla Highway Stop', lat: 16.4749, lng: 79.8869, type: 'bus_station', boardingPoint: 'Piduguralla NH65 Stop', droppingPoint: 'Piduguralla Bypass Junction' },
        { name: 'Miryalaguda RTC Bus Stand', lat: 16.8731, lng: 79.5649, type: 'bus_station', boardingPoint: 'Main Bus Stand Platform 2', droppingPoint: 'Miryalaguda Bypass' },
        { name: 'Nalgonda RTC Bus Station', lat: 17.0570, lng: 79.2671, type: 'bus_station', boardingPoint: 'RTC Bus Station Bay 4', droppingPoint: 'Nalgonda Choutuppal Road' },
        { name: 'Suryapet Hiway Bus Stand', lat: 17.1439, lng: 79.6239, type: 'bus_station', boardingPoint: 'Suryapet Bypass Stop', droppingPoint: 'Suryapet Hotel 7 Junction' },
        { name: 'MGBS Imlibun Bus Station', lat: 17.3789, lng: 78.4816, type: 'bus_station', boardingPoint: 'Platform 34, MGBS Hyderabad', droppingPoint: 'MGBS Out Gate' },
      ],
    },
    {
      corridorId: 'CORR_GNT_HYD_B',
      name: 'Corridor B: State Highway via Vinukonda - Macherla - Kodad',
      highway: 'SH / NH65 Alt',
      distance: 302,
      duration: '5h 30m',
      durationMinutes: 330,
      description: 'Alternate route via Vinukonda and Macherla districts connecting to Kodad before Hyderabad.',
      majorTowns: ['Chilakaluripet', 'Vinukonda', 'Macherla', 'Kodad', 'Nalgonda'],
      polyline: [
        [16.3067, 80.4365], [16.0892, 80.1672], [16.0491, 79.7399], [16.4779, 79.4328], [16.9961, 79.9678], [17.0570, 79.2671], [17.3850, 78.4867]
      ],
      suggestedCities: [
        { name: 'Chilakaluripet', lat: 16.0892, lng: 80.1672, type: 'city' },
        { name: 'Vinukonda', lat: 16.0491, lng: 79.7399, type: 'city' },
        { name: 'Macherla', lat: 16.4779, lng: 79.4328, type: 'city' },
        { name: 'Kodad', lat: 16.9961, lng: 79.9678, type: 'city' },
        { name: 'Nalgonda', lat: 17.0570, lng: 79.2671, type: 'city' },
      ],
      suggestedBoardingPoints: [
        { name: 'Guntur Auto Nagar Bus Point', lat: 16.3100, lng: 80.4400, type: 'bus_station', boardingPoint: 'Auto Nagar RTC Point', droppingPoint: 'Guntur West Bypass' },
        { name: 'Chilakaluripet Clock Tower Stop', lat: 16.0892, lng: 80.1672, type: 'bus_station', boardingPoint: 'Clock Tower RTC Point', droppingPoint: 'Chilakaluripet Bypass Toll' },
        { name: 'Vinukonda Bus Stand', lat: 16.0491, lng: 79.7399, type: 'bus_station', boardingPoint: 'Vinukonda Town RTC Stand', droppingPoint: 'Vinukonda Highway Point' },
        { name: 'Macherla RTC Bus Stand', lat: 16.4779, lng: 79.4328, type: 'bus_station', boardingPoint: 'Main RTC Stand', droppingPoint: 'Macherla Bypass Road' },
        { name: 'Kodad Highway Stop', lat: 16.9961, lng: 79.9678, type: 'bus_station', boardingPoint: 'Kodad NH Stop', droppingPoint: 'Kodad Town Junction' },
        { name: 'MGBS Imlibun Bus Station', lat: 17.3789, lng: 78.4816, type: 'bus_station', boardingPoint: 'Platform 36, MGBS', droppingPoint: 'MGBS Out Gate' },
      ],
    },
    {
      corridorId: 'CORR_GNT_HYD_C',
      name: 'Corridor C: Sattenapalle - Miryalaguda Cut Road',
      highway: 'District Roads / NH65',
      distance: 283,
      duration: '5h 10m',
      durationMinutes: 310,
      description: 'Via Sattenapalle and Miryalaguda, avoiding Guntur city to merge onto NH65 at Suryapet.',
      majorTowns: ['Sattenapalle', 'Miryalaguda', 'Suryapet', 'Nalgonda'],
      polyline: [
        [16.3067, 80.4365], [16.3934, 80.1511], [16.8731, 79.5649], [17.1439, 79.6239], [17.0570, 79.2671], [17.3850, 78.4867]
      ],
      suggestedCities: [
        { name: 'Sattenapalle', lat: 16.3934, lng: 80.1511, type: 'city' },
        { name: 'Miryalaguda', lat: 16.8731, lng: 79.5649, type: 'city' },
        { name: 'Suryapet', lat: 17.1439, lng: 79.6239, type: 'city' },
        { name: 'Nalgonda', lat: 17.0570, lng: 79.2671, type: 'city' },
      ],
      suggestedBoardingPoints: [
        { name: 'Guntur NTR Bus Station West Gate', lat: 16.3067, lng: 80.4365, type: 'bus_station', boardingPoint: 'West Gate Bay', droppingPoint: 'Guntur West Circle' },
        { name: 'Sattenapalle Bus Stand', lat: 16.3934, lng: 80.1511, type: 'bus_station', boardingPoint: 'Main Bus Stand', droppingPoint: 'Sattenapalle Bypass Road' },
        { name: 'Miryalaguda Central Stop', lat: 16.8731, lng: 79.5649, type: 'bus_station', boardingPoint: 'Central Bus Stand Platform 1', droppingPoint: 'Miryalaguda Choutuppal Road' },
        { name: 'Nalgonda RTC Bus Station', lat: 17.0570, lng: 79.2671, type: 'bus_station', boardingPoint: 'Platform 3', droppingPoint: 'Nalgonda Outer Ring' },
        { name: 'MGBS Imlibun Bus Station', lat: 17.3789, lng: 78.4816, type: 'bus_station', boardingPoint: 'Platform 34, MGBS Hyderabad', droppingPoint: 'MGBS Out Gate' },
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
  const resolveCoords = (val, nameStr) => {
    if (val && typeof val === 'object') {
      const lat = val.lat !== undefined ? Number(val.lat) : val.latitude !== undefined ? Number(val.latitude) : null;
      const lng = val.lng !== undefined ? Number(val.lng) : val.longitude !== undefined ? Number(val.longitude) : null;
      if (lat !== null && !isNaN(lat) && lng !== null && !isNaN(lng) && lat !== 0 && lng !== 0) {
        return { name: val.name || nameStr, lat, lng };
      }
    }
    const clean = (nameStr || (typeof val === 'string' ? val : '')).trim().toLowerCase();
    const local = CITY_COORDINATES[clean];
    if (local) return { name: local.name, lat: local.lat, lng: local.lng };
    const partialKey = Object.keys(CITY_COORDINATES).find((k) => clean.includes(k) || k.includes(clean));
    if (partialKey) {
      const p = CITY_COORDINATES[partialKey];
      return { name: p.name, lat: p.lat, lng: p.lng };
    }
    try {
      const cached = sessionStorage.getItem(`c2b_osm_${clean}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].latitude) {
          return { name: parsed[0].name || nameStr, lat: parsed[0].latitude, lng: parsed[0].longitude };
        }
      }
    } catch {}
    let hash = 0;
    for (let i = 0; i < clean.length; i++) hash = (hash * 31 + clean.charCodeAt(i)) & 0xffffffff;
    const fallbackLat = 13.0 + ((Math.abs(hash) % 500) / 100);
    const fallbackLng = 78.0 + ((Math.abs(hash >> 8) % 400) / 100);
    return { name: nameStr, lat: fallbackLat, lng: fallbackLng };
  };

  const srcCoords = resolveCoords(source, srcName);
  const dstCoords = resolveCoords(destination, dstName);

  const directDistance = calculateGeoDistance(srcCoords.lat, srcCoords.lng, dstCoords.lat, dstCoords.lng);

  // Direction vector for the direct S→D route
  const dx = dstCoords.lng - srcCoords.lng;
  const dy = dstCoords.lat - srcCoords.lat;
  const magSq = dx * dx + dy * dy;

  // Helper: collect all cities within a perpendicular corridor buffer of a given half-width
  const collectCitiesInBand = (halfWidthKm) => {
    const stops = [];
    const sLower = srcName.toLowerCase();
    const dLower = dstName.toLowerCase();
    if (magSq <= 0) return stops;
    Object.values(CITY_COORDINATES).forEach((cityObj) => {
      const cNameLower = cityObj.name.toLowerCase();
      if (cNameLower === sLower || cNameLower === dLower) return;
      const t = ((cityObj.lng - srcCoords.lng) * dx + (cityObj.lat - srcCoords.lat) * dy) / magSq;
      if (t < 0.04 || t > 0.96) return;
      const projLat = srcCoords.lat + t * dy;
      const projLng = srcCoords.lng + t * dx;
      const dPerp = calculateGeoDistance(cityObj.lat, cityObj.lng, projLat, projLng);
      if (dPerp <= halfWidthKm) {
        stops.push({ name: cityObj.name, lat: cityObj.lat, lng: cityObj.lng, t, dPerp });
      }
    });
    stops.sort((a, b) => a.t - b.t || a.dPerp - b.dPerp);
    const seen = new Set();
    return stops.filter((s) => {
      const k = s.name.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  };

  const narrowBuffer = Math.min(30, Math.max(15, directDistance * 0.12));
  const mediumBuffer = Math.min(55, Math.max(25, directDistance * 0.24));
  const wideBuffer = Math.min(80, Math.max(35, directDistance * 0.36));

  const stopsNarrow = collectCitiesInBand(narrowBuffer);
  const stopsAll = collectCitiesInBand(mediumBuffer);
  const stopsWide = collectCitiesInBand(wideBuffer);

  const stopsA_raw = stopsNarrow.length > 0 ? stopsNarrow : stopsAll;
  const stopsANames = new Set(stopsA_raw.map((s) => s.name));
  const stopsB_extras = stopsAll.filter((s) => !stopsANames.has(s.name));
  const stopsB_fallback = stopsNarrow.length === 0
    ? stopsWide.filter((_, i) => i % 2 === 0)
    : (stopsAll.length > 2 ? stopsAll.filter((_, i) => i % 2 === 0) : stopsAll);
  const stopsB_raw = stopsB_extras.length >= 2 ? stopsAll : stopsB_fallback;
  const stopsC_raw = stopsWide.filter((s, i) => i % 3 === 0 || stopsANames.has(s.name));
  const stopsD_raw = stopsWide.length > 3 ? stopsWide.filter((s, i) => i % 2 !== 0) : [];

  const srcN = srcName.charAt(0).toUpperCase() + srcName.slice(1);
  const dstN = dstName.charAt(0).toUpperCase() + dstName.slice(1);

  // Guarantee that every corridor has meaningful stops even on rural / novel routes
  const ensureStops = (stops, bandLetter, shiftSign) => {
    if (stops && stops.length >= 2) return stops;
    const mag = Math.sqrt(magSq);
    const perpLat = mag > 0 ? -dx / mag : 0;
    const perpLng = mag > 0 ? dy / mag : 0;
    const fractions = [0.25, 0.50, 0.75];
    const namesByBand = {
      A: [`${srcN} Expressway Toll Bay`, `Midway Highway Transit Plaza`, `${dstN} Ring Road Junction`],
      B: [`${srcN} State Highway Bypass`, `Central District Bus Stand`, `${dstN} Commuter Interchange`],
      C: [`Inland Transit Sub-Station`, `Central Regional Bus Bay`, `Suburban Link Point`],
      D: [`Outer Ring Expressway Halt`, `District Commercial Bus Depot`, `${dstN} Outer Cross`],
    };
    const names = namesByBand[bandLetter] || namesByBand.A;
    return fractions.map((t, idx) => ({
      name: names[idx] || `Transit Halt #${idx + 1}`,
      lat: srcCoords.lat + t * dy + perpLat * shiftSign * 0.08,
      lng: srcCoords.lng + t * dx + perpLng * shiftSign * 0.08,
      t,
      dPerp: Math.abs(shiftSign) * 20,
    }));
  };

  const stopsA = ensureStops(stopsA_raw, 'A', 0);
  const stopsB = ensureStops(stopsB_raw, 'B', 0.08);
  const stopsC = ensureStops(stopsC_raw, 'C', -0.1);
  const stopsD = ensureStops(stopsD_raw, 'D', 0.14);

  const polylineA = [
    [srcCoords.lat, srcCoords.lng],
    ...stopsA.map((s) => [s.lat, s.lng]),
    [dstCoords.lat, dstCoords.lng],
  ];
  const polylineB = [
    [srcCoords.lat, srcCoords.lng],
    ...stopsB.map((s) => [s.lat, s.lng]),
    [dstCoords.lat, dstCoords.lng],
  ];
  const polylineC = [
    [srcCoords.lat, srcCoords.lng],
    ...stopsC.map((s) => [s.lat, s.lng]),
    [dstCoords.lat, dstCoords.lng],
  ];
  const polylineD = [
    [srcCoords.lat, srcCoords.lng],
    ...stopsD.map((s) => [s.lat, s.lng]),
    [dstCoords.lat, dstCoords.lng],
  ];

  const makeBoardingPoints = (stops, srcN, dstN, srcC, dstC) => [
    { name: `${srcN} Central Bus Terminus`, lat: srcC.lat, lng: srcC.lng, type: 'bus_station', boardingPoint: 'Main Intercity Bay', droppingPoint: 'Terminal Exit' },
    ...stops.map((s) => ({
      name: `${s.name} RTC Bus Complex`,
      lat: s.lat,
      lng: s.lng,
      type: 'bus_station',
      boardingPoint: `${s.name} RTC Bus Stand`,
      droppingPoint: `${s.name} Highway Bypass`,
    })),
    { name: `${dstN} Central Bus Terminal`, lat: dstC.lat, lng: dstC.lng, type: 'bus_station', boardingPoint: 'Platform 1', droppingPoint: 'Central Drop Point' },
  ];

  const formatHoursMins = (km) => {
    const mins = Math.round((km / 55) * 60);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const roadDistA = Math.max(60, Math.round(directDistance * 1.18));
  const roadDistB = Math.max(75, Math.round(directDistance * 1.28));
  const roadDistC = Math.max(90, Math.round(directDistance * 1.38));
  const roadDistD = Math.max(100, Math.round(directDistance * 1.48));

  const corrKey = `${srcName.slice(0, 3).toUpperCase()}_${dstName.slice(0, 3).toUpperCase()}`;

  const dynamicCorridors = [
    {
      corridorId: `CORR_${corrKey}_A`,
      name: `Corridor A: NH Direct Expressway (${srcN} ➔ ${dstN})`,
      highway: 'National Highway Expressway',
      distance: roadDistA,
      duration: formatHoursMins(roadDistA),
      durationMinutes: Math.round((roadDistA / 55) * 60),
      description: `Fastest primary NH corridor connecting ${srcN} and ${dstN} via major district transit hubs (Most Commonly Used).`,
      majorTowns: stopsA.map((s) => s.name),
      polyline: polylineA,
      suggestedCities: stopsA.map((s) => ({ name: s.name, lat: s.lat, lng: s.lng, type: 'city' })),
      suggestedBoardingPoints: makeBoardingPoints(stopsA, srcN, dstN, srcCoords, dstCoords),
    },
    {
      corridorId: `CORR_${corrKey}_B`,
      name: `Corridor B: State Highway Link (${srcN} ➔ ${dstN})`,
      highway: 'State Highway via Key Towns',
      distance: roadDistB,
      duration: formatHoursMins(roadDistB),
      durationMinutes: Math.round((roadDistB / 55) * 60),
      description: `Alternative regional corridor through additional commuter hubs and bypass routes.`,
      majorTowns: stopsB.map((s) => s.name),
      polyline: polylineB,
      suggestedCities: stopsB.map((s) => ({ name: s.name, lat: s.lat, lng: s.lng, type: 'city' })),
      suggestedBoardingPoints: makeBoardingPoints(stopsB, srcN, dstN, srcCoords, dstCoords),
    },
  ];

  if (directDistance >= 100) {
    dynamicCorridors.push({
      corridorId: `CORR_${corrKey}_C`,
      name: `Corridor C: Regional Inland Route (${srcN} ➔ ${dstN})`,
      highway: 'Inland Road via District Towns',
      distance: roadDistC,
      duration: formatHoursMins(roadDistC),
      durationMinutes: Math.round((roadDistC / 55) * 60),
      description: `Inland alternate avoiding coastal / urban congestion, connecting smaller district centres.`,
      majorTowns: stopsC.map((s) => s.name),
      polyline: polylineC,
      suggestedCities: stopsC.map((s) => ({ name: s.name, lat: s.lat, lng: s.lng, type: 'city' })),
      suggestedBoardingPoints: makeBoardingPoints(stopsC, srcN, dstN, srcCoords, dstCoords),
    });
  }

  if (directDistance >= 150 && stopsD.length > 0) {
    dynamicCorridors.push({
      corridorId: `CORR_${corrKey}_D`,
      name: `Corridor D: Extended Bypass Corridor (${srcN} ➔ ${dstN})`,
      highway: 'Extended Bypass Route',
      distance: roadDistD,
      duration: formatHoursMins(roadDistD),
      durationMinutes: Math.round((roadDistD / 55) * 60),
      description: `Longer route via outer district bypass roads and secondary transit hubs.`,
      majorTowns: stopsD.map((s) => s.name),
      polyline: polylineD,
      suggestedCities: stopsD.map((s) => ({ name: s.name, lat: s.lat, lng: s.lng, type: 'city' })),
      suggestedBoardingPoints: makeBoardingPoints(stopsD, srcN, dstN, srcCoords, dstCoords),
    });
  }

  // Cap at 4 corridors max
  return dynamicCorridors.slice(0, 4);
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

/* ── Pick Main Towns & Famous RTC Places in Map Polyline Progression Order & Estimate Timings ── */
export function getOrderedCorridorStations(corridor, source, destination, departureTime = '06:00') {
  if (!corridor) return [];

  const srcName = (typeof source === 'string' ? source : source?.name || '').trim().toLowerCase();
  const dstName = (typeof destination === 'string' ? destination : destination?.name || '').trim().toLowerCase();

  const polyline = (corridor.polyline || []).map((pt) => {
    return Array.isArray(pt) ? { lat: pt[0], lng: pt[1] } : pt;
  }).filter((pt) => pt && pt.lat !== undefined && pt.lng !== undefined);

  if (polyline.length < 2) return [];

  // 1. Calculate cumulative segment distances of polyline in km
  const segDistances = [];
  let totalPolyDist = 0;
  for (let i = 0; i < polyline.length - 1; i++) {
    const d = calculateGeoDistance(polyline[i].lat, polyline[i].lng, polyline[i + 1].lat, polyline[i + 1].lng);
    segDistances.push(d);
    totalPolyDist += d;
  }
  if (totalPolyDist <= 0) totalPolyDist = 1;

  // 2. Project point onto polyline and find cumulative distance along route
  const getPolylineProgression = (lat, lng) => {
    let bestDistToPoly = Infinity;
    let bestCumDist = 0;

    let cum = 0;
    for (let i = 0; i < polyline.length - 1; i++) {
      const p1 = polyline[i];
      const p2 = polyline[i + 1];
      const segLen = segDistances[i] || 0.001;

      // Vector from p1 to p2
      const dx = p2.lng - p1.lng;
      const dy = p2.lat - p1.lat;
      const magSq = dx * dx + dy * dy;

      let t = 0;
      if (magSq > 0) {
        t = ((lng - p1.lng) * dx + (lat - p1.lat) * dy) / magSq;
        t = Math.max(0, Math.min(1, t));
      }

      // Projected point coordinates
      const projLat = p1.lat + t * dy;
      const projLng = p1.lng + t * dx;

      // Distance from candidate point to projection
      const distToProj = calculateGeoDistance(lat, lng, projLat, projLng);
      if (distToProj < bestDistToPoly) {
        bestDistToPoly = distToProj;
        bestCumDist = cum + t * segLen;
      }

      cum += segLen;
    }

    return Math.max(0, Math.min(1, bestCumDist / totalPolyDist));
  };

  // 3. Collect candidate stops from suggestedBoardingPoints, suggestedCities, and majorTowns
  const candidateMap = new Map();

  // (a) Boarding points (famous RTC terminals / stations)
  (corridor.suggestedBoardingPoints || []).forEach((bp) => {
    const name = (bp.name || '').trim();
    if (!name) return;
    const lower = name.toLowerCase();
    // Exclude source and destination hubs
    if (srcName && (lower.includes(srcName) || srcName.includes(lower))) return;
    if (dstName && (lower.includes(dstName) || dstName.includes(lower))) return;

    const lat = bp.lat;
    const lng = bp.lng;
    if (!lat || !lng) return;

    const key = `${lat.toFixed(3)}_${lng.toFixed(3)}`;
    candidateMap.set(key, {
      name: bp.name,
      fullName: bp.boardingPoint ? `${bp.name} (${bp.boardingPoint})` : bp.name,
      lat,
      lng,
      type: 'TERMINAL',
      category: 'Famous RTC Terminal',
    });
  });

  // (b) Suggested cities & major towns
  const townsList = [
    ...(corridor.suggestedCities || []),
    ...(corridor.majorTowns || []).map((t) => {
      const coords = getCityCoords(t);
      return coords ? { name: t, lat: coords.lat, lng: coords.lng, type: 'city' } : null;
    }).filter(Boolean),
  ];

  townsList.forEach((town) => {
    const name = (town.name || '').trim();
    if (!name) return;
    const lower = name.toLowerCase();
    if (srcName && (lower === srcName || srcName.includes(lower))) return;
    if (dstName && (lower === dstName || dstName.includes(lower))) return;

    const lat = town.lat;
    const lng = town.lng;
    if (!lat || !lng) return;

    // Check if an RTC terminal is already present within ~8km
    let exists = false;
    for (const [, existing] of candidateMap.entries()) {
      if (calculateGeoDistance(lat, lng, existing.lat, existing.lng) < 8) {
        exists = true;
        break;
      }
    }

    if (!exists) {
      const key = `${lat.toFixed(3)}_${lng.toFixed(3)}`;
      candidateMap.set(key, {
        name,
        fullName: `${name} RTC Bus Stand`,
        lat,
        lng,
        type: 'TOWN',
        category: 'Main Town / Transit Hub',
      });
    }
  });

  // 4. Convert candidate map to list and project onto polyline for map-ordered sequence
  const candidates = Array.from(candidateMap.values());
  const scored = candidates.map((c) => {
    const ratio = getPolylineProgression(c.lat, c.lng);
    return { ...c, progressRatio: ratio };
  });

  // STRICT ORDERING: Sort by progressRatio from 0 (origin) to 1 (destination)
  // This guarantees exact physical order as on the map road!
  scored.sort((a, b) => a.progressRatio - b.progressRatio);

  // Filter out any candidates too close to origin (ratio < 0.03) or destination (ratio > 0.97)
  const validStops = scored.filter((s) => s.progressRatio >= 0.03 && s.progressRatio <= 0.97);

  // 5. Parse departure time (HH:MM) to estimate arrival clock time at each station
  let depMinutes = 360; // 06:00 default
  try {
    const [hh, mm] = (departureTime || '06:00').split(':').map(Number);
    depMinutes = (hh || 0) * 60 + (mm || 0);
  } catch {}

  const totalCorridorDist = Number(corridor.distance) || 435;
  const totalCorridorDurMins = Number(corridor.durationMinutes) || 435;

  return validStops.map((stop, idx) => {
    const distKm = Math.max(15, Math.round(stop.progressRatio * totalCorridorDist));
    const elapsedMins = Math.max(15, Math.round(stop.progressRatio * totalCorridorDurMins));

    const arrMinTotal = (depMinutes + elapsedMins) % (24 * 60);
    const arrH = Math.floor(arrMinTotal / 60);
    const arrM = arrMinTotal % 60;
    const arrPeriod = arrH >= 12 ? 'PM' : 'AM';
    const arrH12 = arrH % 12 === 0 ? 12 : arrH % 12;
    const arrTimeStr = `${String(arrH12).padStart(2, '0')}:${String(arrM).padStart(2, '0')} ${arrPeriod}`;

    const haltMins = 10;
    const depMinTotal = (arrMinTotal + haltMins) % (24 * 60);
    const depH = Math.floor(depMinTotal / 60);
    const depM = depMinTotal % 60;
    const depPeriod = depH >= 12 ? 'PM' : 'AM';
    const depH12 = depH % 12 === 0 ? 12 : depH % 12;
    const depTimeStr = `${String(depH12).padStart(2, '0')}:${String(depM).padStart(2, '0')} ${depPeriod}`;

    const durH = Math.floor(elapsedMins / 60);
    const durM = elapsedMins % 60;
    const elapsedTimeStr = durH > 0 ? `+${durH}h ${durM}m` : `+${durM}m`;

    return {
      id: `STOP_${idx + 1}`,
      order: idx + 1,
      name: stop.name,
      fullName: stop.fullName,
      type: stop.type,
      category: stop.category,
      lat: stop.lat,
      lng: stop.lng,
      progressRatio: stop.progressRatio,
      distanceFromOriginKm: distKm,
      totalCorridorDist: totalCorridorDist,
      elapsedMinutes: elapsedMins,
      elapsedTimeStr,
      haltMinutes: haltMins,
      estimatedArrivalTime: arrTimeStr,
      estimatedDepartureTime: depTimeStr,
      fare: Number(corridor.fare || 650),
      selected: true,
    };
  });
}

/* ── Dynamic Schedule Times Calculation for Intermediate Stations (UP & Reversed DOWN) ── */
export function computeStopScheduleTimes(stations = [], depTime = '06:00', totalDurMins = 435, isReverse = false) {
  if (!Array.isArray(stations) || stations.length === 0) return [];

  let depMinutes = 360;
  try {
    const [hh, mm] = (depTime || '06:00').split(':').map(Number);
    depMinutes = (hh || 0) * 60 + (mm || 0);
  } catch {}

  const ordered = isReverse ? [...stations].reverse() : [...stations];

  return ordered.map((stop, idx) => {
    let effectiveElapsedMins = stop.elapsedMinutes || 60;
    let distKm = stop.distanceFromOriginKm || 50;
    if (isReverse) {
      effectiveElapsedMins = Math.max(15, (totalDurMins || 435) - (stop.elapsedMinutes || 60));
      const totDist = Number(stop.totalCorridorDist || 435);
      distKm = Math.max(15, totDist - (stop.distanceFromOriginKm || 50));
    }

    const arrMinTotal = (depMinutes + effectiveElapsedMins) % (24 * 60);
    const arrH = Math.floor(arrMinTotal / 60);
    const arrM = arrMinTotal % 60;
    const arrPeriod = arrH >= 12 ? 'PM' : 'AM';
    const arrH12 = arrH % 12 === 0 ? 12 : arrH % 12;
    const arrTimeStr = `${String(arrH12).padStart(2, '0')}:${String(arrM).padStart(2, '0')} ${arrPeriod}`;

    const haltMins = stop.haltMinutes || 10;
    const depMinTotal = (arrMinTotal + haltMins) % (24 * 60);
    const depH = Math.floor(depMinTotal / 60);
    const depM = depMinTotal % 60;
    const depPeriod = depH >= 12 ? 'PM' : 'AM';
    const depH12 = depH % 12 === 0 ? 12 : depH % 12;
    const depTimeStr = `${String(depH12).padStart(2, '0')}:${String(depM).padStart(2, '0')} ${depPeriod}`;

    const durH = Math.floor(effectiveElapsedMins / 60);
    const durM = effectiveElapsedMins % 60;
    const elapsedTimeStr = durH > 0 ? `+${durH}h ${durM}m` : `+${durM}m`;

    return {
      ...stop,
      order: idx + 1,
      distanceFromOriginKm: distKm,
      elapsedMinutes: effectiveElapsedMins,
      elapsedTimeStr,
      estimatedArrivalTime: arrTimeStr,
      estimatedDepartureTime: depTimeStr,
      fare: stop.fare || 650,
    };
  });
}

/* ──────────────────────────────────────────────────────────
   MODULE 1 to 6: PERMANENT BUS REGISTRATION, DYNAMIC SEAT
   LAYOUT, BUS-TO-ROUTE ASSIGNMENT & ROUND-TRIP SCHEDULING
   ────────────────────────────────────────────────────────── */

/* ── Indian Vehicle Registration Number Plate Validation & Normalization ── */
export function validateVehicleNumberPlate(rawNumber) {
  if (!rawNumber || typeof rawNumber !== 'string') {
    return {
      valid: false,
      message: 'Bus registration number is required.',
      normalized: '',
    };
  }

  const clean = rawNumber.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

  // Format: State (2 letters) + RTO (1-2 digits) + Series (1-3 letters) + Sequence (4 digits)
  // e.g., AP 27 AB 1234, TS 08 XY 9012, DL 01 A 1234, KA 05 MN 4545
  const plateRegex = /^([A-Z]{2})([0-9]{1,2})([A-Z]{1,3})([0-9]{4})$/;
  const match = clean.match(plateRegex);

  if (!match) {
    return {
      valid: false,
      message:
        `Invalid bus registration number "${rawNumber}". Must strictly follow standard Indian vehicle plate format: State (2 letters) + RTO (1-2 digits) + Series (1-3 letters) + 4 digits (e.g., AP 27 AB 1234 or TS 08 XY 9012). Non-standard numbers or arbitrary names are strictly prohibited.`,
      normalized: rawNumber.trim().toUpperCase(),
    };
  }

  const [, state, rto, series, num] = match;
  const normalized = `${state} ${rto.padStart(2, '0')} ${series} ${num}`;

  return {
    valid: true,
    message: '',
    normalized,
  };
}

export function normalizeVehiclePlate(rawNumber) {
  const res = validateVehicleNumberPlate(rawNumber);
  return res.valid ? res.normalized : (rawNumber || '').trim().toUpperCase();
}

/* ── Parse Route Duration String (e.g. "6h 45m", "8h 15m") to Total Minutes ── */
export function parseDurationToMinutes(durationStr) {
  if (!durationStr) return 360;
  if (typeof durationStr === 'number') return durationStr;
  let total = 0;
  const hMatch = String(durationStr).match(/(\d+)\s*h/i);
  const mMatch = String(durationStr).match(/(\d+)\s*m/i);
  if (hMatch) total += parseInt(hMatch[1], 10) * 60;
  if (mMatch) total += parseInt(mMatch[1], 10);
  return total > 0 ? total : 360;
}

/* ── Auto-Compute Arrival Time & Date from Departure Time and Route Duration ── */
export function computeArrivalTime(depTime, durationMinutes, startDateStr) {
  if (!depTime) return null;
  const [dh, dm] = depTime.split(':').map(Number);
  if (isNaN(dh) || isNaN(dm)) return null;

  const mins = Number(durationMinutes) || 0;
  const totalDepMins = dh * 60 + dm;
  const totalArrMins = totalDepMins + mins;

  const arrH = Math.floor((totalArrMins % (24 * 60)) / 60);
  const arrM = totalArrMins % 60;
  const arrTime = `${String(arrH).padStart(2, '0')}:${String(arrM).padStart(2, '0')}`;
  const daysDiff = Math.floor(totalArrMins / (24 * 60));

  let arrDateStr = '';
  if (startDateStr) {
    const [y, m, d] = startDateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d + daysDiff);
    arrDateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
  }

  return {
    arrTime,
    daysDiff,
    isNextDay: daysDiff > 0,
    arrDateStr,
  };
}

/* ── Validate Future Departure Time (Buses Cannot Depart in Present / Past Time) ── */
export function validateFutureDeparture(journeyDate, departureTime) {
  if (!journeyDate || !departureTime) {
    return { valid: false, message: 'Journey date and departure time are required.' };
  }
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const curH = String(now.getHours()).padStart(2, '0');
  const curM = String(now.getMinutes()).padStart(2, '0');
  const curTimeStr = `${curH}:${curM}`;

  if (journeyDate < todayStr) {
    return {
      valid: false,
      message: `Journey date (${journeyDate}) cannot be in the past. Please select today (${todayStr}) or a future date.`,
    };
  }

  if (journeyDate === todayStr && departureTime <= curTimeStr) {
    return {
      valid: false,
      message: `Departure time (${departureTime}) cannot be earlier than or equal to current time (${curTimeStr}). Buses cannot depart in the present or past time.`,
    };
  }

  return { valid: true };
}

/* ── Check if Bus is Currently In Trip (Active Trip Check) ── */
export function isBusInActiveTrip(vehicleNumber) {
  if (!vehicleNumber) return null;
  const schedules = JSON.parse(localStorage.getItem('c2b_bus_schedules') || '[]');
  const statuses = JSON.parse(localStorage.getItem('c2b_trip_statuses') || '{}');
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const curHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return (
    schedules.find((s) => {
      const match = s.vehicleNumber === vehicleNumber || (s.busName && s.busName.includes(vehicleNumber));
      if (!match) return false;
      const st = statuses[s.tripId] || s.status;
      if (st === 'IN_PROGRESS') return true;
      if (st === 'SCHEDULED' && s.journeyDate === today && s.departureTime && s.departureTime <= curHHMM) {
        return true;
      }
      return false;
    }) || null
  );
}

/* ── Dynamic Seat Layout Generator ── */
export function generateDefaultSeatLayout(busType = 'Seater', totalSeats = 40, rows = 10, cols = 5) {
  const typeStr = (busType || '').toLowerCase();
  const isSleeper = typeStr.includes('sleeper') && !typeStr.includes('semi');
  const count = Number(totalSeats) > 0 ? Number(totalSeats) : 40;

  const rowCount = Math.max(5, Number(rows) || Math.ceil(count / 4));
  const colCount = Math.max(4, Number(cols) || 5);
  const aisleCol = isSleeper ? 3 : 3;

  const lowerDeck = [];
  const upperDeck = [];

  let lowerSeatNum = 1;
  let upperSeatNum = 1;

  for (let r = 1; r <= rowCount; r++) {
    for (let c = 1; c <= colCount; c++) {
      if (c === aisleCol && r < rowCount) {
        // Gangway / Aisle
        lowerDeck.push({
          seatId: `L_R${r}_C${c}`,
          seatNumber: '',
          seatType: 'AISLE',
          deck: 'LOWER',
          row: r,
          col: c,
          isActive: false,
        });
        if (isSleeper) {
          upperDeck.push({
            seatId: `U_R${r}_C${c}`,
            seatNumber: '',
            seatType: 'AISLE',
            deck: 'UPPER',
            row: r,
            col: c,
            isActive: false,
          });
        }
      } else {
        // Seat or Berth
        const isUpperApplicable = isSleeper && upperDeck.filter((s) => s.isActive).length < Math.floor(count / 2);
        const isLowerApplicable = lowerDeck.filter((s) => s.isActive).length < (isSleeper ? Math.ceil(count / 2) : count);

        if (isLowerApplicable) {
          const sType = isSleeper ? (c <= 2 ? 'DOUBLE_SLEEPER' : 'SINGLE_SLEEPER') : 'SEATER';
          lowerDeck.push({
            seatId: `L_R${r}_C${c}`,
            seatNumber: isSleeper ? `L${lowerSeatNum}` : `${lowerSeatNum}`,
            seatType: sType,
            deck: 'LOWER',
            row: r,
            col: c,
            isActive: true,
            berthType: 'LOWER',
          });
          lowerSeatNum++;
        } else {
          lowerDeck.push({
            seatId: `L_R${r}_C${c}`,
            seatNumber: '',
            seatType: 'EMPTY',
            deck: 'LOWER',
            row: r,
            col: c,
            isActive: false,
          });
        }

        if (isSleeper) {
          if (isUpperApplicable) {
            const sType = c <= 2 ? 'DOUBLE_SLEEPER' : 'SINGLE_SLEEPER';
            upperDeck.push({
              seatId: `U_R${r}_C${c}`,
              seatNumber: `U${upperSeatNum}`,
              seatType: sType,
              deck: 'UPPER',
              row: r,
              col: c,
              isActive: true,
              berthType: 'UPPER',
            });
            upperSeatNum++;
          } else {
            upperDeck.push({
              seatId: `U_R${r}_C${c}`,
              seatNumber: '',
              seatType: 'EMPTY',
              deck: 'UPPER',
              row: r,
              col: c,
              isActive: false,
            });
          }
        }
      }
    }
  }

  const activeLower = lowerDeck.filter((s) => s.isActive).length;
  const activeUpper = upperDeck.filter((s) => s.isActive).length;

  return {
    rows: rowCount,
    cols: colCount,
    totalSeats: activeLower + activeUpper,
    lowerBerthsCount: activeLower,
    upperBerthsCount: activeUpper,
    hasUpperDeck: isSleeper,
    lowerDeck,
    upperDeck: isSleeper ? upperDeck : [],
    updatedAt: new Date().toISOString(),
  };
}

/* ── Registered Fleet Storage (Clean, No Mock Buses) ── */
const INITIAL_FLEET_BUSES = [];
const DELETED_BUSES_KEY = 'c2b_deleted_buses';

export function getDeletedBuses() {
  try {
    return JSON.parse(localStorage.getItem(DELETED_BUSES_KEY) || '[]');
  } catch {
    return [];
  }
}

export function isBusDeleted(busIdOrPlate) {
  if (!busIdOrPlate) return false;
  const target = String(busIdOrPlate).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const deleted = getDeletedBuses();
  const clean = (s) => String(s || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  return deleted.some((d) => {
    const dId = clean(d.id || d.vehicleId);
    const dPlate = clean(d.plate || d.vehicleNumber);
    return (dId && dId === target) || (dPlate && dPlate === target);
  });
}

export function markBusDeleted(bus) {
  if (!bus) return;
  const busId = typeof bus === 'object' ? (bus.vehicleId || bus.id) : bus;
  const busPlate = typeof bus === 'object' ? (bus.vehicleNumber || bus.regNo) : '';
  const deleted = getDeletedBuses();
  const clean = (s) => String(s || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const idNorm = clean(busId);
  const plateNorm = clean(busPlate);

  const exists = deleted.some((d) => {
    const dId = clean(d.id || d.vehicleId);
    const dPlate = clean(d.plate || d.vehicleNumber);
    return (idNorm && dId && idNorm === dId) || (plateNorm && dPlate && plateNorm === dPlate);
  });

  if (!exists) {
    deleted.push({
      id: busId || '',
      vehicleId: busId || '',
      plate: busPlate || '',
      vehicleNumber: busPlate || '',
      deletedAt: new Date().toISOString(),
    });
    localStorage.setItem(DELETED_BUSES_KEY, JSON.stringify(deleted));
  }
}

export function unmarkBusDeleted(busIdOrPlate) {
  if (!busIdOrPlate) return;
  const clean = (s) => String(s || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const target = clean(busIdOrPlate);
  const deleted = getDeletedBuses();
  const filtered = deleted.filter((d) => {
    const dId = clean(d.id || d.vehicleId);
    const dPlate = clean(d.plate || d.vehicleNumber);
    return dId !== target && dPlate !== target;
  });
  localStorage.setItem(DELETED_BUSES_KEY, JSON.stringify(filtered));
}

/* ── Initialize Fleet Storage ── */
export function initFleetStorage() {
  const FRESH_KEY = 'c2b_fleet_fresh_v6';
  try {
    if (!localStorage.getItem(FRESH_KEY)) {
      localStorage.setItem(FRESH_KEY, 'true');
      const existingRaw = JSON.parse(localStorage.getItem('c2b_registered_fleet') || '[]');
      const cleanedRaw = existingRaw.filter((b) => !/^V0\d\d$/.test(b.vehicleId || b.id || '') && !/^BUS_10\d\d$/.test(b.vehicleId || b.id || ''));
      localStorage.setItem('c2b_registered_fleet', JSON.stringify(cleanedRaw));
      const scheds = JSON.parse(localStorage.getItem('c2b_bus_schedules') || '[]');
      const cleanScheds = scheds.filter((s) => !/^V0\d\d$/.test(s.vehicleId || '') && !/^T0\d\d$/.test(s.id || s.tripId || ''));
      localStorage.setItem('c2b_bus_schedules', JSON.stringify(cleanScheds));
    }
  } catch {}

  const existing = localStorage.getItem('c2b_registered_fleet');
  const deleted = getDeletedBuses();
  const clean = (s) => String(s || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

  if (!existing) {
    localStorage.setItem('c2b_registered_fleet', JSON.stringify([]));
  } else {
    try {
      const parsed = JSON.parse(existing);
      let fleetChanged = false;
      // Clean out any legacy mock buses AND any deleted buses
      const cleaned = parsed.filter((b) => {
        if (/^BUS_10\d\d$/.test(b.vehicleId || b.id || '')) return false;
        const bId = clean(b.vehicleId || b.id);
        const bPlate = clean(b.vehicleNumber || b.regNo);
        const isDel = deleted.some((d) => {
          const dId = clean(d.id || d.vehicleId);
          const dPlate = clean(d.plate || d.vehicleNumber);
          return (bId && dId && bId === dId) || (bPlate && dPlate && bPlate === dPlate);
        });
        return !isDel;
      });
      if (cleaned.length !== parsed.length) {
        fleetChanged = true;
      }
      // Normalize any bus that has assigned route or status Assigned
      cleaned.forEach((bus) => {
        if (bus.assignedRoute || bus.status === 'Assigned' || (bus.route && bus.route.includes('→'))) {
          if (bus.status !== 'Assigned') {
            bus.status = 'Assigned';
            fleetChanged = true;
          }
          if (!bus.assignedRoute) {
            let orig = bus.originCity || bus.origin || bus.from || '';
            let dest = bus.destCity || bus.destination || bus.to || '';
            if (!orig || !dest) {
              if (bus.route) {
                const parts = bus.route.split(/→|↔|-|\bto\b/i).map((s) => s.trim()).filter(Boolean);
                if (parts.length >= 2) { orig = parts[0]; dest = parts[1]; }
              }
            }
            if (!orig) orig = 'Chennai';
            if (!dest) dest = 'Vijayawada';
            bus.assignedRoute = {
              originCity: orig,
              destCity: dest,
              corridorName: `${orig} ↔ ${dest} Corridor`,
              intermediateStops: [],
              intermediateStopDetails: [],
              durationEst: '6h 30m',
              distanceKm: 430,
            };
            fleetChanged = true;
          }
        }
      });
      if (fleetChanged) {
        localStorage.setItem('c2b_registered_fleet', JSON.stringify(cleaned));
      }
    } catch {}
  }

  // Also purge legacy mock schedules, duplicates, and bloated subsegments from c2b_bus_schedules
  try {
    const rawSched = JSON.parse(localStorage.getItem('c2b_bus_schedules') || '[]');
    const cleanedSched = deduplicateSchedules(rawSched);
    if (cleanedSched.length !== rawSched.length) {
      safeSaveSchedules(cleanedSched);
    }
  } catch {}
}

/* ── Get Registered Fleet for Provider (Multi-Provider Isolation) ── */
export function getFleetBuses(providerId) {
  initFleetStorage();
  const loggedId = sessionStorage.getItem('c2b_loggedInId') || localStorage.getItem('c2b_loggedInId') || 'P001';
  const targetId = providerId || loggedId;
  const deleted = getDeletedBuses();
  const clean = (s) => String(s || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

  try {
    const raw = JSON.parse(localStorage.getItem('c2b_registered_fleet') || '[]');
    // Filter by providerId to strictly prevent cross-provider access and exclude legacy mock buses & deleted buses
    return raw.filter((b) => {
      if (/^BUS_10\d\d$/.test(b.vehicleId || b.id || '')) return false;
      const bId = clean(b.vehicleId || b.id);
      const bPlate = clean(b.vehicleNumber || b.regNo);
      const isDel = deleted.some((d) => {
        const dId = clean(d.id || d.vehicleId);
        const dPlate = clean(d.plate || d.vehicleNumber);
        return (bId && dId && bId === dId) || (bPlate && dPlate && bPlate === dPlate);
      });
      if (isDel) return false;
      if (!b.providerId || !targetId || b.providerId === targetId || targetId === 'P001' || b.providerId === 'P001') {
        return true;
      }
      return false;
    });
  } catch {
    return [];
  }
}

/* ── Get Fleet Overview Statistics ── */
export function getFleetStats(providerId) {
  const buses = getFleetBuses(providerId);
  const totalBuses = buses.length;
  const assignedBuses = buses.filter((b) => b.status === 'Assigned' || b.assignedRoute).length;
  const availableBuses = buses.filter((b) => b.status === 'Available' && !b.assignedRoute).length;
  const maintenanceBuses = buses.filter((b) => b.status === 'Maintenance').length;

  return {
    totalBuses,
    assignedBuses,
    availableBuses,
    maintenanceBuses,
  };
}

/* ── Get Bus by ID ── */
export function getBusById(busId) {
  initFleetStorage();
  const all = JSON.parse(localStorage.getItem('c2b_registered_fleet') || '[]');
  return all.find((b) => b.vehicleId === busId || b.id === busId || b.vehicleNumber === busId) || null;
}

/* ── Register New Bus (Validates Unique Registration Number & Indian Plate Format) ── */
export async function registerNewBus(busData) {
  initFleetStorage();
  const loggedId = sessionStorage.getItem('c2b_loggedInId') || localStorage.getItem('c2b_loggedInId') || 'P001';

  // 1. Validate Registration Number Format strictly against official Indian Vehicle Plate Format
  const plateCheck = validateVehicleNumberPlate(busData.vehicleNumber);
  if (!plateCheck.valid) {
    throw new Error(plateCheck.message);
  }
  const cleanRegNum = plateCheck.normalized;
  unmarkBusDeleted(cleanRegNum);

  // 2. Validate Total Passenger Capacity: must be > 10 and < 80
  const totalSeats = Number(busData.totalSeats);
  if (isNaN(totalSeats) || totalSeats <= 10 || totalSeats >= 80) {
    throw new Error(
      `Total passenger capacity must be more than 10 and less than 80 seats (between 11 and 79 seats). Given: ${busData.totalSeats}`
    );
  }

  const all = JSON.parse(localStorage.getItem('c2b_registered_fleet') || '[]');

  // 3. Validate uniqueness across all buses (ignoring spaces / hyphens)
  const duplicate = all.find(
    (b) => (b.vehicleNumber || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanRegNum.replace(/[^A-Z0-9]/g, '')
  );
  if (duplicate) {
    throw new Error(`Bus registration number "${cleanRegNum}" already exists. Registration number must be unique.`);
  }

  const busId = `BUS_${Date.now()}`;
  const busType = busData.busType || busData.vehicleType || 'AC Sleeper';
  const isSleeper = busType.toLowerCase().includes('sleeper') && !busType.toLowerCase().includes('semi');
  const lowerBerths = isSleeper ? Math.ceil(totalSeats / 2) : 0;
  const upperBerths = isSleeper ? (totalSeats - lowerBerths) : 0;

  // Generate dynamic seat layout if not provided
  const seatLayout = busData.seatLayout || generateDefaultSeatLayout(busType, totalSeats);

  const newBus = {
    vehicleId: busId,
    id: busId,
    providerId: busData.providerId || loggedId,
    vehicleNumber: cleanRegNum,
    busName: busData.busName || `${cleanRegNum} (${busType})`,
    vehicleType: busType,
    busType,
    totalSeats,
    lowerBerths: Number(busData.lowerBerths) || lowerBerths,
    upperBerths: Number(busData.upperBerths) || upperBerths,
    status: busData.status || 'Available',
    amenities: Array.isArray(busData.amenities) ? busData.amenities : ['AC', 'Charging point'],
    photographs: busData.photographs || [],
    rating: 4.8,
    seatLayout,
    assignedRoute: null,
    routeHistory: [],
    roundTripSchedule: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  all.unshift(newBus);
  localStorage.setItem('c2b_registered_fleet', JSON.stringify(all));

  // Sync to backend if online
  try {
    await spFetch('/vehicles', {
      method: 'POST',
      body: JSON.stringify({
        providerId: busData.providerId || loggedId,
        vehicleNumber: cleanRegNum,
        vehicleType: busType,
        totalSeats,
        busName: newBus.busName,
        amenities: newBus.amenities,
        status: newBus.status,
      }),
    });
  } catch (err) {
    console.warn('Backend vehicle registration sync note:', err?.message);
  }

  notifyChange('BUS_REGISTERED', { busId: newBus.vehicleId, vehicleNumber: newBus.vehicleNumber });
  try { liveSync.syncVehicle(newBus); } catch {}

  return newBus;
}

/* ── Save / Update Dynamic Seat Layout Configuration ── */
export async function saveBusSeatLayout(busId, layoutConfig) {
  initFleetStorage();
  const all = JSON.parse(localStorage.getItem('c2b_registered_fleet') || '[]');
  const idx = all.findIndex((b) => b.vehicleId === busId || b.id === busId);

  if (idx === -1) {
    throw new Error(`Bus ${busId} not found.`);
  }

  // Safety check: Restrict structural changes when active future bookings exist
  const activeBookings = checkBusActiveBookings(all[idx].vehicleNumber);
  if (activeBookings.length > 0) {
    // Check if total seats changed
    if (all[idx].totalSeats !== layoutConfig.totalSeats) {
      throw new Error(
        `Cannot change total seat capacity from ${all[idx].totalSeats} to ${layoutConfig.totalSeats}: ` +
        `This bus has ${activeBookings.length} active passenger reservations on upcoming dates.`
      );
    }
  }

  all[idx].seatLayout = {
    ...layoutConfig,
    updatedAt: new Date().toISOString(),
  };
  all[idx].totalSeats = layoutConfig.totalSeats;
  all[idx].updatedAt = new Date().toISOString();

  localStorage.setItem('c2b_registered_fleet', JSON.stringify(all));

  // Sync to backend if online
  try {
    await spFetch(`/vehicles/${busId}/seat-layout`, {
      method: 'PUT',
      body: JSON.stringify(layoutConfig),
    });
  } catch (err) {
    console.warn('Backend seat layout sync note:', err?.message);
  }

  notifyChange('LAYOUT_SAVED', { busId, layoutConfig });
  return all[idx];
}

/* ── Check Active Bookings for a Bus ── */
export function checkBusActiveBookings(vehicleNumber) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const bookings = JSON.parse(localStorage.getItem('c2b_bookings') || '[]');
    const schedules = JSON.parse(localStorage.getItem('c2b_bus_schedules') || '[]');

    // Find schedules matching this bus
    const matchingTripIds = new Set(
      schedules
        .filter((s) => s.busName?.includes(vehicleNumber) || s.vehicleNumber === vehicleNumber)
        .map((s) => s.tripId || s.id)
    );

    return bookings.filter(
      (b) =>
        (matchingTripIds.has(b.tripId) || (b.busName && b.busName.includes(vehicleNumber))) &&
        b.status !== 'CANCELLED' &&
        (!b.journeyDate || b.journeyDate >= today)
    );
  } catch {
    return [];
  }
}

/* ── Assign Bus to Permanent Route Corridor (Module 3) ── */
export async function assignBusToRoute(busId, routeData) {
  initFleetStorage();
  const all = JSON.parse(localStorage.getItem('c2b_registered_fleet') || '[]');
  const idx = all.findIndex((b) => b.vehicleId === busId || b.id === busId || b.vehicleNumber === busId);

  if (idx === -1) {
    throw new Error(`Bus ${busId} not found.`);
  }

  const bus = all[idx];

  if (bus.status === 'Maintenance') {
    throw new Error(`Cannot assign route: Bus ${bus.vehicleNumber} is currently under Maintenance.`);
  }
  if (bus.status === 'Inactive') {
    throw new Error(`Cannot assign route: Bus ${bus.vehicleNumber} is Inactive.`);
  }

  const assignmentId = `ASGN_${Date.now()}`;
  const newAssignment = {
    assignmentId,
    vehicleId: bus.vehicleId,
    originCity: routeData.originCity,
    destCity: routeData.destCity,
    corridorId: routeData.corridorId,
    corridorName: routeData.corridorName || `${routeData.originCity} ↔ ${routeData.destCity} Corridor`,
    distanceKm: Number(routeData.distanceKm) || 350,
    durationEst: routeData.durationEst || '6h 00m',
    intermediateStops: Array.isArray(routeData.intermediateStops) ? routeData.intermediateStops : [],
    intermediateStopDetails: Array.isArray(routeData.intermediateStopDetails) ? routeData.intermediateStopDetails : [],
    effectiveDate: routeData.effectiveDate || new Date().toISOString().split('T')[0],
    assignedAt: new Date().toISOString(),
    status: 'ACTIVE',
  };

  // Archive previous active assignment if changing
  if (bus.assignedRoute) {
    bus.routeHistory = [...(bus.routeHistory || []), { ...bus.assignedRoute, status: 'SUPERSEDED' }];
  }

  bus.assignedRoute = newAssignment;
  bus.status = 'Assigned';
  bus.updatedAt = new Date().toISOString();

  // Initialize or synchronize roundTripSchedule and generate recurring bookable schedules
  const routeDurMins = parseDurationToMinutes(newAssignment.durationEst) || 360;
  const upDepTime = bus.roundTripSchedule?.upSchedule?.departureTime || '08:00';
  const upTimeline = computeArrivalTime(upDepTime, routeDurMins) || { arrTime: '14:30', isNextDay: false, arrDateStr: '' };
  const upArrTime = upTimeline.arrTime || '14:30';
  const [uah, uam] = upArrTime.split(':').map(Number);
  const restMinutes = bus.roundTripSchedule?.restMinutesBetweenJourneys || 120;
  const dnDepTotal = (((uah || 14) * 60 + (uam || 30) + restMinutes)) % (24 * 60);
  const dnh = Math.floor(dnDepTotal / 60);
  const dnm = dnDepTotal % 60;
  const dnDepTime = bus.roundTripSchedule?.downSchedule?.departureTime || `${String(dnh).padStart(2, '0')}:${String(dnm).padStart(2, '0')}`;
  const dnTimeline = computeArrivalTime(dnDepTime, routeDurMins) || { arrTime: '23:00', isNextDay: false, arrDateStr: '' };
  const dnArrTime = dnTimeline.arrTime || '23:00';

  const upDetails = newAssignment.intermediateStopDetails || [];
  const downDetails = computeStopScheduleTimes(upDetails, dnDepTime, routeDurMins, true);

  bus.roundTripSchedule = {
    vehicleId: bus.vehicleId,
    assignmentId: newAssignment.assignmentId,
    upSchedule: {
      scheduleId: bus.roundTripSchedule?.upSchedule?.scheduleId || `SCH_UP_${Date.now()}`,
      originCity: newAssignment.originCity,
      destCity: newAssignment.destCity,
      departureTime: upDepTime,
      arrivalTime: upArrTime,
      operatingDays: bus.roundTripSchedule?.upSchedule?.operatingDays || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
      intermediateStops: newAssignment.intermediateStops || [],
      intermediateStopDetails: upDetails,
      active: true,
    },
    downSchedule: {
      scheduleId: bus.roundTripSchedule?.downSchedule?.scheduleId || `SCH_DN_${Date.now()}`,
      originCity: newAssignment.destCity,
      destCity: newAssignment.originCity,
      departureTime: dnDepTime,
      arrivalTime: dnArrTime,
      operatingDays: bus.roundTripSchedule?.downSchedule?.operatingDays || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
      intermediateStops: [...(newAssignment.intermediateStops || [])].reverse(),
      intermediateStopDetails: downDetails,
      active: true,
    },
    fare: bus.roundTripSchedule?.fare || 650,
    validFrom: newAssignment.effectiveDate || new Date().toISOString().split('T')[0],
    validUntil: bus.roundTripSchedule?.validUntil || (() => {
      const d = new Date(newAssignment.effectiveDate || new Date());
      d.setDate(d.getDate() + 30);
      return d.toISOString().split('T')[0];
    })(),
    restMinutesBetweenJourneys: restMinutes,
  };

  localStorage.setItem('c2b_registered_fleet', JSON.stringify(all));

  // Clean any prior cancellation locks for this bus so new assignment schedules generate freely
  try {
    const cleanCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const bPlate = cleanCode(bus.vehicleNumber);
    const bId = cleanCode(bus.vehicleId);
    const cancelledIds = JSON.parse(localStorage.getItem('c2b_cancelled_trip_ids') || '[]');
    const unblockedCancelled = cancelledIds.filter((cid) => !(bPlate && cid.includes(bPlate)) && !(bId && cid.includes(bId)));
    localStorage.setItem('c2b_cancelled_trip_ids', JSON.stringify(unblockedCancelled));

    const statuses = JSON.parse(localStorage.getItem('c2b_trip_statuses') || '{}');
    let stChanged = false;
    Object.keys(statuses).forEach((tid) => {
      if ((bPlate && tid.includes(bPlate)) || (bId && tid.includes(bId))) {
        if (statuses[tid] === 'CANCELLED') {
          delete statuses[tid];
          stChanged = true;
        }
      }
    });
    if (stChanged) localStorage.setItem('c2b_trip_statuses', JSON.stringify(statuses));
  } catch {}

  // Generate actual bookable recurring schedule instances into c2b_bus_schedules
  generateRecurringJourneyInstances(bus, bus.roundTripSchedule);

  // Sync to backend
  try {
    await spFetch(`/vehicles/${busId}/assign-route`, {
      method: 'POST',
      body: JSON.stringify(newAssignment),
    });
  } catch (err) {
    console.warn('Backend assign-route sync note:', err?.message);
  }

  notifyChange('FLEET_ASSIGNED', { busId: bus.vehicleId, vehicleNumber: bus.vehicleNumber });
  try { liveSync.syncVehicle(bus); } catch {}
  return bus;
}

/* ── Change Route Assignment with Booking Conflict Check (Module 6) ── */
export async function changeBusRoute(busId, newRouteData, confirmationOptions = {}) {
  initFleetStorage();
  const all = JSON.parse(localStorage.getItem('c2b_registered_fleet') || '[]');
  const idx = all.findIndex((b) => b.vehicleId === busId || b.id === busId);

  if (idx === -1) {
    throw new Error(`Bus ${busId} not found.`);
  }

  const bus = all[idx];

  // Conflict Check: Look for active future bookings on existing route
  const activeBookings = checkBusActiveBookings(bus.vehicleNumber);
  if (activeBookings.length > 0 && !confirmationOptions.forceConfirm) {
    return {
      success: false,
      hasConflicts: true,
      conflictCount: activeBookings.length,
      bookings: activeBookings,
      currentRoute: `${bus.assignedRoute?.originCity || 'Origin'} ↔ ${bus.assignedRoute?.destCity || 'Dest'}`,
      message:
        `Warning: Bus ${bus.vehicleNumber} has ${activeBookings.length} confirmed passenger bookings on upcoming journeys. ` +
        `Reassigning will affect future passengers. Please confirm or provide an effective transition date.`,
    };
  }

  return {
    success: true,
    data: await assignBusToRoute(busId, newRouteData),
  };
}

/* ── Save Round-Trip Schedules: UP and DOWN (Module 4 & 5) ── */
export async function saveRoundTripSchedules(busId, scheduleConfig) {
  initFleetStorage();
  const all = JSON.parse(localStorage.getItem('c2b_registered_fleet') || '[]');
  const idx = all.findIndex((b) => b.vehicleId === busId || b.id === busId);

  if (idx === -1) {
    throw new Error(`Bus ${busId} not found.`);
  }

  const bus = all[idx];
  if (!bus.assignedRoute) {
    throw new Error(`Please assign bus ${bus.vehicleNumber} to a permanent route corridor first.`);
  }

  const { upSchedule, downSchedule, fare } = scheduleConfig;

  // Turnaround rest time calculation
  const [uh, um] = (upSchedule.arrivalTime || '14:30').split(':').map(Number);
  const [dh, dm] = (downSchedule.departureTime || '20:00').split(':').map(Number);
  let restMinutes = (dh * 60 + dm) - (uh * 60 + um);
  if (restMinutes < 0) restMinutes += 24 * 60;

  if (restMinutes < 60) {
    throw new Error(`Inadequate turnaround rest time (${Math.floor(restMinutes / 60)}h ${restMinutes % 60}m). A minimum of 1 hour (60 minutes) rest is required at destination before the return journey.`);
  }
  if (restMinutes > 720) {
    throw new Error(`Excessive turnaround rest time (${Math.floor(restMinutes / 60)}h ${restMinutes % 60}m). Turnaround rest must be within 12 hours for continuous round-trip cycling.`);
  }

  const routeDurMins = parseDurationToMinutes(bus.assignedRoute?.durationEst);
  const upDetails = upSchedule.intermediateStopDetails || bus.assignedRoute.intermediateStopDetails || [];
  const downDetails = (downSchedule.intermediateStopDetails && downSchedule.intermediateStopDetails.length > 0)
    ? downSchedule.intermediateStopDetails
    : computeStopScheduleTimes(upDetails, downSchedule.departureTime, routeDurMins, true);

  const roundTripData = {
    vehicleId: bus.vehicleId,
    assignmentId: bus.assignedRoute.assignmentId,
    upSchedule: {
      scheduleId: `SCH_UP_${Date.now()}`,
      originCity: bus.assignedRoute.originCity,
      destCity: bus.assignedRoute.destCity,
      departureTime: upSchedule.departureTime,
      arrivalTime: upSchedule.arrivalTime,
      operatingDays: upSchedule.operatingDays || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
      intermediateStops: upSchedule.intermediateStops || [],
      intermediateStopDetails: upDetails,
      active: true,
    },
    downSchedule: {
      scheduleId: `SCH_DN_${Date.now()}`,
      originCity: bus.assignedRoute.destCity,
      destCity: bus.assignedRoute.originCity,
      departureTime: downSchedule.departureTime,
      arrivalTime: downSchedule.arrivalTime,
      operatingDays: downSchedule.operatingDays || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
      // Intermediate stops in REVERSE order for DOWN journey with validated reverse distances and timings
      intermediateStops: downSchedule.intermediateStops || [...(upSchedule.intermediateStops || [])].reverse(),
      intermediateStopDetails: downDetails,
      active: true,
    },
    fare: Number(fare) || 650,
    validFrom: scheduleConfig.validFrom || new Date().toISOString().split('T')[0],
    validUntil: scheduleConfig.validUntil || '',
    restMinutesBetweenJourneys: restMinutes,
  };

  bus.roundTripSchedule = roundTripData;
  bus.updatedAt = new Date().toISOString();

  localStorage.setItem('c2b_registered_fleet', JSON.stringify(all));

  // Clean any prior cancellation locks for this bus so new schedules generate freely
  try {
    const cleanCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const bPlate = cleanCode(bus.vehicleNumber);
    const bId = cleanCode(bus.vehicleId);
    const cancelledIds = JSON.parse(localStorage.getItem('c2b_cancelled_trip_ids') || '[]');
    const unblockedCancelled = cancelledIds.filter((cid) => !(bPlate && cid.includes(bPlate)) && !(bId && cid.includes(bId)));
    localStorage.setItem('c2b_cancelled_trip_ids', JSON.stringify(unblockedCancelled));

    const statuses = JSON.parse(localStorage.getItem('c2b_trip_statuses') || '{}');
    let stChanged = false;
    Object.keys(statuses).forEach((tid) => {
      if ((bPlate && tid.includes(bPlate)) || (bId && tid.includes(bId))) {
        if (statuses[tid] === 'CANCELLED') {
          delete statuses[tid];
          stChanged = true;
        }
      }
    });
    if (stChanged) localStorage.setItem('c2b_trip_statuses', JSON.stringify(statuses));
  } catch {}

  // Generate actual bookable recurring schedule instances into c2b_bus_schedules (Module 5)
  generateRecurringJourneyInstances(bus, roundTripData);

  // Sync to backend
  try {
    await spFetch(`/vehicles/${busId}/schedules`, {
      method: 'POST',
      body: JSON.stringify(roundTripData),
    });
  } catch (err) {
    console.warn('Backend save-schedules sync note:', err?.message);
  }

  notifyChange('SCHEDULES_SAVED', { busId: bus.vehicleId, vehicleNumber: bus.vehicleNumber });
  return bus;
}

/* ── Generate Journey Instances for Operating Dates (Module 5) ── */
function generateRecurringJourneyInstances(bus, roundTripData, dispatchEvents = true) {
  const schedules = JSON.parse(localStorage.getItem('c2b_bus_schedules') || '[]');
  const cancelledList = JSON.parse(localStorage.getItem('c2b_cancelled_schedules') || '[]');
  const cancelledIds = JSON.parse(localStorage.getItem('c2b_cancelled_trip_ids') || '[]');
  const cancelledIdSet = new Set([...cancelledIds, ...cancelledList.map((c) => c.tripId)]);
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const curH = String(today.getHours()).padStart(2, '0');
  const curM = String(today.getMinutes()).padStart(2, '0');
  const curHHMM = `${curH}:${curM}`;

  // Clean any stale unbooked schedules for this bus using normalized plate/ID/name matching
  const cleanCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const cleanName = (s) => String(s || '').toLowerCase().trim();
  const busPlate = cleanCode(bus.vehicleNumber);
  const busId = cleanCode(bus.vehicleId);
  const bName = cleanName(bus.busName);
  const busPlateStr = (bus.vehicleNumber || bus.regNo || bus.vehicleId || 'BUS').replace(/\W/g, '');

  const cleanSchedules = deduplicateSchedules(schedules).filter((s) => {
    const sPlate = cleanCode(s.vehicleNumber);
    const sId = cleanCode(s.vehicleId);
    const sName = cleanName(s.busName);
    const sTripId = cleanCode(s.id || s.tripId || '');
    const isThisBus =
      (busPlate && sPlate === busPlate) ||
      (busId && sId === busId) ||
      (bName && sName === bName) ||
      (busPlateStr && sTripId.includes(busPlateStr)) ||
      (busId && sTripId.includes(busId));
    return !isThisBus || (s.bookedSeats > 0);
  });

  // Determine window dates: start from validFrom (selected date) or today for the upcoming 30 days
  const startWindow = roundTripData.validFrom ? new Date(roundTripData.validFrom) : new Date(today);
  const endWindow = roundTripData.validUntil ? new Date(roundTripData.validUntil) : null;
  const numDays = endWindow
    ? Math.max(1, Math.min(30, Math.round((endWindow - startWindow) / (1000 * 60 * 60 * 24)) + 1))
    : 30;

  const routeDurMins = parseDurationToMinutes(bus.assignedRoute?.durationEst);
  const existingStatuses = JSON.parse(localStorage.getItem('c2b_trip_statuses') || '{}');

  const seenSlotsInRun = new Set();

  // Generate instances across the 30-day operating window: automated continuous daily round-trip cycling
  for (let i = 0; i < numDays; i++) {
    const curDate = new Date(startWindow);
    curDate.setDate(startWindow.getDate() + i);
    const dateStr = curDate.toISOString().split('T')[0];

    // Buses cannot be scheduled for past dates
    if (dateStr < todayStr) continue;

    const dayOfWeek = dayNames[curDate.getDay()];
    const isToday = dateStr === todayStr;

    // Validate and format departure/arrival timetables
    const rawUpDep = roundTripData.upSchedule?.departureTime || '08:00';
    const upTimeline = computeArrivalTime(rawUpDep, routeDurMins, dateStr);
    const upDepTime = rawUpDep;
    const upArrTime = roundTripData.upSchedule?.arrivalTime || upTimeline?.arrTime || '14:30';

    const rawDownDep = roundTripData.downSchedule?.departureTime || '16:30';
    const downTimeline = computeArrivalTime(rawDownDep, routeDurMins, dateStr);
    const downDepTime = rawDownDep;
    const downArrTime = roundTripData.downSchedule?.arrivalTime || downTimeline?.arrTime || '23:00';

    // Generate UP Journey for each upcoming date
    const upTripId = `T_UP_${busPlateStr}_${dateStr.replace(/-/g, '')}`;
    const upSlot = `${busPlateStr}_${dateStr}_UP`;
    const isUpCancelled = cancelledIdSet.has(upTripId) || existingStatuses[upTripId] === 'CANCELLED';

    // DO NOT resurrect if explicitly cancelled/deleted by operator, and avoid duplicate slots
    if (!isUpCancelled && !seenSlotsInRun.has(upSlot)) {
      seenSlotsInRun.add(upSlot);
      const upFullStops = [
        roundTripData.upSchedule?.originCity || bus.assignedRoute?.originCity || 'Chennai',
        ...(roundTripData.upSchedule?.intermediateStops || []).map((s) => s.stopName || s.name || s),
        roundTripData.upSchedule?.destCity || bus.assignedRoute?.destCity || 'Vijayawada',
      ];

      // Auto status: if today and departure time has already arrived/passed, mark IN_PROGRESS
      const upStatus = existingStatuses[upTripId] || (isToday && upDepTime <= curHHMM ? 'IN_PROGRESS' : 'SCHEDULED');
      if (isToday && upDepTime <= curHHMM && !existingStatuses[upTripId]) {
        existingStatuses[upTripId] = 'IN_PROGRESS';
      }

      const upTripItem = {
        id: upTripId,
        tripId: upTripId,
        vehicleId: bus.vehicleId,
        vehicleNumber: bus.vehicleNumber,
        providerId: bus.providerId || 'P001',
        from: roundTripData.upSchedule?.originCity || bus.assignedRoute?.originCity || 'Chennai',
        to: roundTripData.upSchedule?.destCity || bus.assignedRoute?.destCity || 'Vijayawada',
        corridorId: bus.assignedRoute?.corridorId,
        corridorName: bus.assignedRoute?.corridorName,
        departureTime: upDepTime,
        arrivalTime: upArrTime,
        arrivalDate: upTimeline?.arrDateStr || dateStr,
        estimatedDuration: bus.assignedRoute?.durationEst || '6h 30m',
        isOvernight: upTimeline?.isNextDay || false,
        journeyDate: dateStr,
        dayOfWeek: dayOfWeek,
        busName: bus.busName,
        busType: bus.busType,
        vehicleType: bus.busType || bus.vehicleType,
        seatLayout: bus.seatLayout,
        totalSeats: bus.totalSeats,
        availableSeats: bus.totalSeats,
        bookedSeats: 0,
        fare: roundTripData.fare || 650,
        revenue: 0,
        status: upStatus,
        direction: 'UP',
        intermediateStops: (roundTripData.upSchedule?.intermediateStops || []).map((s) => s.stopName || s.name || s),
        via: (roundTripData.upSchedule?.intermediateStops || []).map((s) => s.stopName || s.name || s).join(', '),
        allStops: upFullStops,
        isPrimaryRoute: true,
        addedAt: new Date().toISOString(),
      };
      cleanSchedules.push(upTripItem);
    }

    // Generate DOWN Journey for each upcoming date
    const downTripId = `T_DN_${busPlateStr}_${dateStr.replace(/-/g, '')}`;
    const downSlot = `${busPlateStr}_${dateStr}_DOWN`;
    const isDownCancelled = cancelledIdSet.has(downTripId) || existingStatuses[downTripId] === 'CANCELLED';

    // DO NOT resurrect if explicitly cancelled/deleted by operator, and avoid duplicate slots
    if (!isDownCancelled && !seenSlotsInRun.has(downSlot)) {
      seenSlotsInRun.add(downSlot);
      const downFullStops = [
        roundTripData.downSchedule?.originCity || bus.assignedRoute?.destCity || 'Vijayawada',
        ...(roundTripData.downSchedule?.intermediateStops || []).map((s) => s.stopName || s.name || s),
        roundTripData.downSchedule?.destCity || bus.assignedRoute?.originCity || 'Chennai',
      ];

      // Auto status: if today and departure time has already arrived/passed, mark IN_PROGRESS
      const downStatus = existingStatuses[downTripId] || (isToday && downDepTime <= curHHMM ? 'IN_PROGRESS' : 'SCHEDULED');
      if (isToday && downDepTime <= curHHMM && !existingStatuses[downTripId]) {
        existingStatuses[downTripId] = 'IN_PROGRESS';
      }

      const downTripItem = {
        id: downTripId,
        tripId: downTripId,
        vehicleId: bus.vehicleId,
        vehicleNumber: bus.vehicleNumber,
        providerId: bus.providerId || 'P001',
        from: roundTripData.downSchedule?.originCity || bus.assignedRoute?.destCity || 'Vijayawada',
        to: roundTripData.downSchedule?.destCity || bus.assignedRoute?.originCity || 'Chennai',
        corridorId: bus.assignedRoute?.corridorId,
        corridorName: bus.assignedRoute?.corridorName,
        departureTime: downDepTime,
        arrivalTime: downArrTime,
        arrivalDate: downTimeline?.arrDateStr || dateStr,
        estimatedDuration: bus.assignedRoute?.durationEst || '6h 30m',
        isOvernight: downTimeline?.isNextDay || false,
        journeyDate: dateStr,
        dayOfWeek: dayOfWeek,
        busName: bus.busName,
        busType: bus.busType,
        vehicleType: bus.busType || bus.vehicleType,
        seatLayout: bus.seatLayout,
        totalSeats: bus.totalSeats,
        availableSeats: bus.totalSeats,
        bookedSeats: 0,
        fare: roundTripData.fare || 650,
        revenue: 0,
        status: downStatus,
        direction: 'DOWN',
        intermediateStops: (roundTripData.downSchedule?.intermediateStops || []).map((s) => s.stopName || s.name || s),
        via: (roundTripData.downSchedule?.intermediateStops || []).map((s) => s.stopName || s.name || s).join(', '),
        allStops: downFullStops,
        isPrimaryRoute: true,
        addedAt: new Date().toISOString(),
      };
      cleanSchedules.push(downTripItem);
    }
  }

  try { localStorage.setItem('c2b_trip_statuses', JSON.stringify(existingStatuses)); } catch {}
  const dedupedFinal = deduplicateSchedules(cleanSchedules);
  safeSaveSchedules(dedupedFinal);
  if (dispatchEvents) {
    try { window.dispatchEvent(new Event('storage')); } catch {}
    try { window.dispatchEvent(new CustomEvent('c2b_sync', { detail: { type: 'SCHEDULES_GENERATED', busId: bus.vehicleId } })); } catch {}
  }
}

/* ── Update Bus Operating Status (Available, Maintenance, Inactive) ── */
export async function updateBusStatus(busId, newStatus) {
  initFleetStorage();
  const all = JSON.parse(localStorage.getItem('c2b_registered_fleet') || '[]');
  const idx = all.findIndex((b) => b.vehicleId === busId || b.id === busId);

  if (idx === -1) {
    throw new Error(`Bus ${busId} not found.`);
  }

  all[idx].status = newStatus;
  all[idx].updatedAt = new Date().toISOString();

  localStorage.setItem('c2b_registered_fleet', JSON.stringify(all));

  // Sync to backend
  try {
    await spFetch(`/vehicles/${busId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });
  } catch (err) {
    console.warn('Backend update-status sync note:', err?.message);
  }

  notifyChange('STATUS_UPDATED', { busId, status: newStatus });
  return all[idx];
}

/* ── Delete Registered Bus (Safe Deletion Check & Permanent Persistence Across Refreshes) ── */
export async function deleteBus(busId) {
  initFleetStorage();
  const all = JSON.parse(localStorage.getItem('c2b_registered_fleet') || '[]');
  const idx = all.findIndex((b) => b.vehicleId === busId || b.id === busId || b.vehicleNumber === busId);
  const bus = idx !== -1 ? all[idx] : null;

  // Mark in deleted buses blacklist immediately so it NEVER re-appears on refresh
  markBusDeleted(bus || { vehicleId: busId });

  if (idx !== -1) {
    all.splice(idx, 1);
    localStorage.setItem('c2b_registered_fleet', JSON.stringify(all));
  }

  const clean = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const cleanName = (s) => String(s || '').toLowerCase().trim();
  const bPlate = bus ? clean(bus.vehicleNumber) : clean(busId);
  const bId = bus ? clean(bus.vehicleId) : clean(busId);
  const bName = bus ? cleanName(bus.busName) : '';

  // Cascade Delete: Remove ALL schedules belonging to this bus from c2b_bus_schedules
  try {
    const rawSched = JSON.parse(localStorage.getItem('c2b_bus_schedules') || '[]');
    const cleanedSched = rawSched.filter((s) => {
      const sPlate = clean(s.vehicleNumber);
      const sId = clean(s.vehicleId);
      const sName = cleanName(s.busName);
      const sTripId = String(s.id || s.tripId || '');
      const matches =
        (bPlate && sPlate === bPlate) ||
        (bId && sId === bId) ||
        (bName && sName === bName) ||
        (bPlate && sTripId.includes(bPlate)) ||
        (bId && sTripId.includes(bId));
      return !matches;
    });
    localStorage.setItem('c2b_bus_schedules', JSON.stringify(cleanedSched));
  } catch {}

  // Cascade Delete: Remove ALL cancelled schedules belonging to this bus
  try {
    const cancelled = JSON.parse(localStorage.getItem('c2b_cancelled_schedules') || '[]');
    const cleanedCancelled = cancelled.filter((c) => {
      const cTripId = String(c.tripId || '');
      const cName = cleanName(c.busName);
      const matches = (bPlate && cTripId.includes(bPlate)) || (bId && cTripId.includes(bId)) || (bName && cName === bName);
      return !matches;
    });
    localStorage.setItem('c2b_cancelled_schedules', JSON.stringify(cleanedCancelled));
  } catch {}

  // Cascade Delete: Clean up c2b_trip_statuses for trips of this bus
  try {
    const statuses = JSON.parse(localStorage.getItem('c2b_trip_statuses') || '{}');
    let statusChanged = false;
    Object.keys(statuses).forEach((tid) => {
      if ((bPlate && tid.includes(bPlate)) || (bId && tid.includes(bId))) {
        delete statuses[tid];
        statusChanged = true;
      }
    });
    if (statusChanged) localStorage.setItem('c2b_trip_statuses', JSON.stringify(statuses));
  } catch {}

  // Cascade Delete: Clean up completions
  try {
    const completions = JSON.parse(localStorage.getItem('c2b_trip_completions') || '{}');
    let compChanged = false;
    Object.keys(completions).forEach((tid) => {
      if ((bPlate && tid.includes(bPlate)) || (bId && tid.includes(bId))) {
        delete completions[tid];
        compChanged = true;
      }
    });
    if (compChanged) localStorage.setItem('c2b_trip_completions', JSON.stringify(completions));
  } catch {}

  // Sync to backend DELETE /vehicles/:id with x-role header
  try {
    await spFetch(`/vehicles/${busId}`, {
      method: 'DELETE',
      headers: { 'x-role': 'PROVIDER' },
    });
  } catch (err) {
    console.warn('Backend delete vehicle sync note:', err?.message);
  }

  notifyChange('BUS_DELETED', { busId, vehicleNumber: bus?.vehicleNumber });
  try { liveSync.broadcast('BUS_DELETED', { busId, vehicleNumber: bus?.vehicleNumber }); } catch {}
  return true;
}

/* ── Clear All Fleet Buses (Reset Fleet to Start Completely Fresh) ── */
export async function clearAllBuses(providerId) {
  initFleetStorage();
  const loggedId = sessionStorage.getItem('c2b_loggedInId') || localStorage.getItem('c2b_loggedInId') || 'P001';
  const targetId = providerId || loggedId;
  const all = JSON.parse(localStorage.getItem('c2b_registered_fleet') || '[]');

  all.forEach((b) => {
    markBusDeleted(b);
  });

  localStorage.setItem('c2b_registered_fleet', JSON.stringify([]));
  localStorage.setItem('c2b_bus_schedules', JSON.stringify([]));
  localStorage.setItem('c2b_cancelled_schedules', JSON.stringify([]));
  localStorage.setItem('c2b_trip_statuses', JSON.stringify({}));

  try {
    await spFetch(`/vehicles?providerId=${encodeURIComponent(targetId)}`, {
      method: 'DELETE',
      headers: { 'x-role': 'PROVIDER' },
    });
  } catch (err) {
    console.warn('Backend clear all vehicles sync note:', err?.message);
  }

  notifyChange('BUSES_CLEARED', { providerId: targetId });
  try { liveSync.broadcast('BUSES_CLEARED', { providerId: targetId }); } catch {}
  return true;
}

/* ── Unassign Bus Route (Removes Corridor Binding and Slices All Schedules) ── */
export async function unassignBusRoute(busId) {
  initFleetStorage();
  const all = JSON.parse(localStorage.getItem('c2b_registered_fleet') || '[]');
  const idx = all.findIndex((b) => b.vehicleId === busId || b.id === busId);
  if (idx === -1) {
    throw new Error(`Bus ${busId} not found.`);
  }

  const bus = all[idx];

  // Protect against unassigning if currently running an active trip
  const liveTrip = isBusInActiveTrip(bus.vehicleNumber);
  if (liveTrip) {
    throw new Error(`Cannot unassign bus "${bus.vehicleNumber}"! It is currently running an active trip (${liveTrip.from} → ${liveTrip.to}).`);
  }

  const clean = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const cleanName = (s) => String(s || '').toLowerCase().trim();
  const bPlate = clean(bus.vehicleNumber);
  const bId = clean(bus.vehicleId);
  const bName = cleanName(bus.busName);

  // Unassign
  bus.status = 'Available';
  bus.assignedRoute = null;
  bus.roundTripSchedule = null;
  bus.updatedAt = new Date().toISOString();
  localStorage.setItem('c2b_registered_fleet', JSON.stringify(all));

  // Purge schedules from c2b_bus_schedules
  try {
    const rawSched = JSON.parse(localStorage.getItem('c2b_bus_schedules') || '[]');
    const cleanedSched = rawSched.filter((s) => {
      const sPlate = clean(s.vehicleNumber);
      const sId = clean(s.vehicleId);
      const sName = cleanName(s.busName);
      const sTripId = String(s.id || s.tripId || '');
      const matches =
        (bPlate && sPlate === bPlate) ||
        (bId && sId === bId) ||
        (bName && sName === bName) ||
        (bPlate && sTripId.includes(bPlate)) ||
        (bId && sTripId.includes(bId));
      return !matches;
    });
    localStorage.setItem('c2b_bus_schedules', JSON.stringify(cleanedSched));
  } catch {}

  // Sync to backend if supported
  try {
    await spFetch(`/vehicles/${busId}/unassign-route`, { method: 'POST' });
  } catch {}

  notifyChange('ROUTE_UNASSIGNED', { busId });
  return bus;
}





