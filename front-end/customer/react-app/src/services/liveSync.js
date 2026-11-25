/**
 * Click2Book Live Cross-Actor Sync Client (Customer Portal)
 * Connects to NestJS Backend SSE stream at /api/sync/stream and syncs directly with Redux memory store.
 */

import {
  readTrips,
  updateTrip,
  setFleet,
  setDeletedBuses,
  setTripStatus,
  setTripStatuses,
} from '../store/slices/tripsSlice';
import { createBooking, readBookings } from '../store/slices/bookingsSlice';

const getApiBase = () => {
  if (typeof window === 'undefined') return 'http://localhost:3000/api';
  const h = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'localhost'
    : window.location.hostname;
  return `http://${h}:3000/api`;
};

let _storeRef = null;
export function injectCustomerLiveSyncStore(store) {
  _storeRef = store;
}

class LiveSyncClient {
  constructor() {
    this.apiBase = getApiBase();
    this.eventSource = null;
    this.listeners = new Set();
    this.isConnected = false;
    this.reconnectTimer = null;
  }

  init() {
    if (typeof window === 'undefined') return;
    if (this.eventSource) return;

    this.connect();
    this.refreshStateFromBackend();
  }

  connect() {
    try {
      if (this.eventSource) {
        this.eventSource.close();
      }

      this.eventSource = new EventSource(`${this.apiBase}/sync/stream`);

      this.eventSource.onopen = () => {
        this.isConnected = true;
      };

      this.eventSource.onmessage = (event) => {
        try {
          if (!event.data) return;
          const data = JSON.parse(event.data);
          this.handleEvent(data);
        } catch (err) {
          console.warn('[LiveSync] Error parsing incoming event:', err);
        }
      };

      this.eventSource.onerror = () => {
        this.isConnected = false;
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }
        if (!this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
          }, 4000);
        }
      };
    } catch (err) {
      console.warn('[LiveSync] Connection failed, retrying in 5s...', err);
      setTimeout(() => this.connect(), 5000);
    }
  }

  handleEvent(data) {
    if (!data || !data.type || data.type === 'HEARTBEAT') return;
    const { type, payload } = data;

    try {
      if (_storeRef) {
        const st = _storeRef.getState();
        const clean = (s) => String(s || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

        if (type === 'SCHEDULE_UPDATED') {
          _storeRef.dispatch(updateTrip(payload));
        } else if (type === 'TRIP_STATUS_UPDATED') {
          if (payload.tripId && payload.status) {
            _storeRef.dispatch(setTripStatus({ tripId: payload.tripId, status: payload.status }));
          }
        } else if (type === 'BOOKING_CREATED') {
          _storeRef.dispatch(createBooking(payload));
        } else if (type === 'BUS_REGISTERED' || type === 'FLEET_ASSIGNED' || type === 'VEHICLE_CREATED') {
          const bus = payload.bus || payload;
          if (bus && (bus.vehicleNumber || bus.vehicleId)) {
            const bNum = clean(bus.vehicleNumber || bus.regNo);
            const bId = clean(bus.vehicleId || bus.id);
            const filteredDel = (st.trips.deletedBuses || []).filter(
              (d) => clean(d.id || d.vehicleId) !== bId && clean(d.plate || d.vehicleNumber) !== bNum
            );
            _storeRef.dispatch(setDeletedBuses(filteredDel));

            const fleet = [...(st.trips.fleet || [])];
            const idx = fleet.findIndex(
              (b) => (bId && clean(b.vehicleId || b.id) === bId) || (bNum && clean(b.vehicleNumber) === bNum)
            );
            if (idx >= 0) fleet[idx] = { ...fleet[idx], ...bus };
            else fleet.unshift(bus);
            _storeRef.dispatch(setFleet(fleet));
          }
        } else if (type === 'BUS_DELETED') {
          const busId = payload.busId || payload.id;
          const vNum = payload.vehicleNumber;
          const idNorm = clean(busId);
          const plateNorm = clean(vNum);

          const deleted = [...(st.trips.deletedBuses || [])];
          if (!deleted.some((d) => (idNorm && clean(d.id || d.vehicleId) === idNorm) || (plateNorm && clean(d.plate || d.vehicleNumber) === plateNorm))) {
            deleted.push({ id: busId, vehicleId: busId, plate: vNum, vehicleNumber: vNum, deletedAt: new Date().toISOString() });
            _storeRef.dispatch(setDeletedBuses(deleted));
          }

          const updatedFleet = (st.trips.fleet || []).filter(
            (b) => !(idNorm && clean(b.vehicleId || b.id) === idNorm) && !(plateNorm && clean(b.vehicleNumber) === plateNorm)
          );
          _storeRef.dispatch(setFleet(updatedFleet));

          const updatedScheds = (st.trips.items || []).filter(
            (s) => !(idNorm && clean(s.vehicleId) === idNorm) && !(plateNorm && clean(s.vehicleNumber) === plateNorm)
          );
          _storeRef.dispatch(readTrips(updatedScheds));
        } else if (type === 'BUSES_CLEARED') {
          _storeRef.dispatch(setFleet([]));
          _storeRef.dispatch(readTrips([]));
        }
      }
    } catch (e) {
      console.warn('[LiveSync] Error updating Redux state:', e);
    }

    try {
      window.dispatchEvent(new CustomEvent('c2b_sync', { detail: data }));
    } catch {}

    this.listeners.forEach((fn) => {
      try {
        fn(data);
      } catch (err) {
        console.error('[LiveSync] Listener error:', err);
      }
    });
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async broadcast(type, payload) {
    try {
      await fetch(`${this.apiBase}/sync/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, payload }),
      });
    } catch (err) {
      console.warn('[LiveSync] Broadcast failed, handled in Redux memory:', err);
    }
  }

  async syncBooking(booking) {
    try {
      await fetch(`${this.apiBase}/sync/booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booking),
      });
    } catch {}
    const isCancelled =
      booking?.status === 'CANCELLED' ||
      booking?.booking_status === 'CANCELLED' ||
      booking?.bookingStatus === 'CANCELLED';
    this.broadcast(isCancelled ? 'BOOKING_CANCELLED' : 'BOOKING_CREATED', booking);
  }

  async syncVehicle(bus) {
    try {
      await fetch(`${this.apiBase}/sync/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'BUS_REGISTERED', payload: { bus } }),
      });
    } catch {}
    this.broadcast('BUS_REGISTERED', { bus });
  }

  async syncSchedule(schedule) {
    try {
      await fetch(`${this.apiBase}/sync/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schedule),
      });
    } catch {}
    this.broadcast('SCHEDULE_UPDATED', schedule);
  }

  async syncTripStatus(tripId, status) {
    try {
      await fetch(`${this.apiBase}/sync/trip-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId, status }),
      });
    } catch {}
    this.broadcast('TRIP_STATUS_UPDATED', { tripId, status });
  }

  async refreshStateFromBackend() {
    try {
      const res = await fetch(`${this.apiBase}/sync/state`);
      const json = await res.json();
      if (json.success && json.data && _storeRef) {
        const st = _storeRef.getState();
        const { tripStatuses, customSchedules, vehicles, bookings } = json.data;
        const clean = (s) => String(s || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

        if (Array.isArray(vehicles) && vehicles.length > 0) {
          const currentFleet = [...(st.trips.fleet || [])];
          const deletedBuses = st.trips.deletedBuses || [];
          let fleetChanged = false;
          vehicles.forEach((v) => {
            const vNum = v.vehicleNumber || v.regNo;
            const vId = v.vehicleId || v.id;
            const isDel = deletedBuses.some(
              (d) => (vId && clean(vId) === clean(d.id || d.vehicleId)) || (vNum && clean(vNum) === clean(d.plate || d.vehicleNumber))
            );
            if (isDel) return;
            const idx = currentFleet.findIndex(
              (f) => (vId && f.vehicleId === vId) || (vNum && clean(f.vehicleNumber || f.regNo) === clean(vNum))
            );
            if (idx >= 0) {
              currentFleet[idx] = {
                ...currentFleet[idx],
                ...v,
                vehicleNumber: v.vehicleNumber || currentFleet[idx].vehicleNumber,
                seatLayout: v.seatLayout || currentFleet[idx].seatLayout,
              };
            } else {
              currentFleet.unshift(v);
            }
            fleetChanged = true;
          });
          if (fleetChanged) {
            _storeRef.dispatch(setFleet(currentFleet));
          }
        }

        if (Array.isArray(customSchedules) && customSchedules.length > 0) {
          const current = [...(st.trips.items || [])];
          const currentIds = new Set(current.map((s) => s.id || s.tripId));
          let updated = false;
          customSchedules.forEach((cs) => {
            const csId = cs.id || cs.tripId;
            if (!currentIds.has(csId)) {
              current.unshift(cs);
              updated = true;
            } else {
              const idx = current.findIndex((s) => (s.id || s.tripId) === csId);
              if (idx >= 0) {
                current[idx] = { ...current[idx], ...cs };
                updated = true;
              }
            }
          });
          if (updated) _storeRef.dispatch(readTrips(current));
        }

        if (tripStatuses && Object.keys(tripStatuses).length > 0) {
          _storeRef.dispatch(setTripStatuses(tripStatuses));
        }

        if (Array.isArray(bookings) && bookings.length > 0) {
          const currentBookings = [...(st.bookings.items || [])];
          const existingIds = new Set(currentBookings.map((b) => b.bookingId));
          let updatedBookings = false;
          bookings.forEach((b) => {
            if (!existingIds.has(b.bookingId)) {
              currentBookings.push(b);
              updatedBookings = true;
            }
          });
          if (updatedBookings) _storeRef.dispatch(readBookings(currentBookings));
        }
      }
    } catch (e) {
      // offline fallback
    }
  }
}

export const liveSync = new LiveSyncClient();
