/**
 * Click2Book Live Cross-Actor Sync Client (Service Provider Portal)
 * Connects to NestJS Backend SSE stream at /api/sync/stream
 * Enables instant multi-actor data flow across Service Provider, Customer, Admin & Super Admin.
 */

const getApiBase = () => {
  if (typeof window === 'undefined') return 'http://localhost:3000/api';
  const h = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'localhost'
    : window.location.hostname;
  return `http://${h}:3000/api`;
};

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

    // 1. Synchronize local storage based on event type
    try {
      if (type === 'BOOKING_CREATED') {
        const bookings = JSON.parse(localStorage.getItem('c2b_bookings') || '[]');
        const exists = bookings.some((b) => b.bookingId === payload.bookingId);
        if (!exists) {
          bookings.unshift(payload);
          localStorage.setItem('c2b_bookings', JSON.stringify(bookings));

          // Also update booked seats count and revenue on schedule
          const schedules = JSON.parse(localStorage.getItem('c2b_bus_schedules') || '[]');
          const tid = payload.tripId || payload.scheduleId;
          const s = schedules.find((item) => (item.id || item.tripId) === tid);
          if (s) {
            const seatCount = payload.passengerCount || (Array.isArray(payload.seat_list) ? payload.seat_list.length : 1);
            s.bookedSeats = (s.bookedSeats || 0) + seatCount;
            s.availableSeats = Math.max(0, (s.totalSeats || 40) - s.bookedSeats);
            s.revenue = (s.revenue || 0) + (Number(payload.total) || Number(payload.amount) || (s.fare * seatCount));
            localStorage.setItem('c2b_bus_schedules', JSON.stringify(schedules));
          }
        }
      } else if (type === 'SCHEDULE_UPDATED') {
        const localScheds = JSON.parse(localStorage.getItem('c2b_bus_schedules') || '[]');
        const tid = payload.id || payload.tripId;
        const idx = localScheds.findIndex((s) => (s.id || s.tripId) === tid);
        if (idx >= 0) {
          localScheds[idx] = { ...localScheds[idx], ...payload };
        } else {
          localScheds.unshift(payload);
        }
        localStorage.setItem('c2b_bus_schedules', JSON.stringify(localScheds));
      } else if (type === 'TRIP_STATUS_UPDATED') {
        const statuses = JSON.parse(localStorage.getItem('c2b_trip_statuses') || '{}');
        if (payload.tripId && payload.status) {
          statuses[payload.tripId] = payload.status;
          localStorage.setItem('c2b_trip_statuses', JSON.stringify(statuses));
        }
      } else if (type === 'BUS_REGISTERED' || type === 'FLEET_ASSIGNED' || type === 'VEHICLE_CREATED') {
        const bus = payload.bus || payload;
        if (bus && (bus.vehicleNumber || bus.vehicleId)) {
          const fleet = JSON.parse(localStorage.getItem('c2b_registered_fleet') || '[]');
          const clean = (s) => String(s || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
          const bNum = clean(bus.vehicleNumber || bus.regNo);
          const bId = clean(bus.vehicleId || bus.id);

          // If it was previously marked deleted, unmark it
          const deleted = JSON.parse(localStorage.getItem('c2b_deleted_buses') || '[]');
          const filteredDel = deleted.filter(d => clean(d.id || d.vehicleId) !== bId && clean(d.plate || d.vehicleNumber) !== bNum);
          localStorage.setItem('c2b_deleted_buses', JSON.stringify(filteredDel));

          const idx = fleet.findIndex(
            (b) =>
              (bId && clean(b.vehicleId || b.id) === bId) ||
              (bNum && clean(b.vehicleNumber) === bNum)
          );
          if (idx >= 0) {
            fleet[idx] = { ...fleet[idx], ...bus };
          } else {
            fleet.unshift(bus);
          }
          localStorage.setItem('c2b_registered_fleet', JSON.stringify(fleet));
        }
      } else if (type === 'BUS_DELETED') {
        const busId = payload.busId || payload.id;
        const vNum = payload.vehicleNumber;
        const clean = (s) => String(s || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        const idNorm = clean(busId);
        const plateNorm = clean(vNum);

        const deleted = JSON.parse(localStorage.getItem('c2b_deleted_buses') || '[]');
        if (!deleted.some(d => (idNorm && clean(d.id || d.vehicleId) === idNorm) || (plateNorm && clean(d.plate || d.vehicleNumber) === plateNorm))) {
          deleted.push({ id: busId, vehicleId: busId, plate: vNum, vehicleNumber: vNum, deletedAt: new Date().toISOString() });
          localStorage.setItem('c2b_deleted_buses', JSON.stringify(deleted));
        }

        const fleet = JSON.parse(localStorage.getItem('c2b_registered_fleet') || '[]');
        const updated = fleet.filter(b => {
          const bId = clean(b.vehicleId || b.id);
          const bPlate = clean(b.vehicleNumber);
          return !(idNorm && bId === idNorm) && !(plateNorm && bPlate === plateNorm);
        });
        localStorage.setItem('c2b_registered_fleet', JSON.stringify(updated));

        const scheds = JSON.parse(localStorage.getItem('c2b_bus_schedules') || '[]');
        const updatedScheds = scheds.filter(s => {
          const sPlate = clean(s.vehicleNumber);
          const sId = clean(s.vehicleId);
          return !(idNorm && sId === idNorm) && !(plateNorm && sPlate === plateNorm);
        });
        localStorage.setItem('c2b_bus_schedules', JSON.stringify(updatedScheds));
      } else if (type === 'BUSES_CLEARED') {
        localStorage.setItem('c2b_registered_fleet', JSON.stringify([]));
        localStorage.setItem('c2b_bus_schedules', JSON.stringify([]));
      }
    } catch (e) {
      console.warn('[LiveSync] Error updating local cache:', e);
    }

    // 2. Dispatch storage and custom events to update all components in current window
    try {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('c2b_sync', { detail: data }));
    } catch {}

    // 3. Notify registered listeners
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
      console.warn('[LiveSync] Broadcast failed, handled locally:', err);
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
    this.broadcast('BOOKING_CREATED', booking);
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
      if (json.success && json.data) {
        const { customSchedules, tripStatuses, bookings } = json.data;
        if (customSchedules && Array.isArray(customSchedules) && customSchedules.length > 0) {
          const current = JSON.parse(localStorage.getItem('c2b_bus_schedules') || '[]');
          const currentIds = new Set(current.map((s) => s.id || s.tripId));
          let updated = false;
          customSchedules.forEach((cs) => {
            const csId = cs.id || cs.tripId;
            if (!currentIds.has(csId)) {
              current.unshift(cs);
              updated = true;
            }
          });
          if (updated) {
            localStorage.setItem('c2b_bus_schedules', JSON.stringify(current));
            window.dispatchEvent(new Event('storage'));
          }
        }
        if (tripStatuses && Object.keys(tripStatuses).length > 0) {
          const localStatuses = JSON.parse(localStorage.getItem('c2b_trip_statuses') || '{}');
          Object.assign(localStatuses, tripStatuses);
          localStorage.setItem('c2b_trip_statuses', JSON.stringify(localStatuses));
          window.dispatchEvent(new Event('storage'));
        }
        if (bookings && Array.isArray(bookings) && bookings.length > 0) {
          const currentBookings = JSON.parse(localStorage.getItem('c2b_bookings') || '[]');
          const existingIds = new Set(currentBookings.map((b) => b.bookingId));
          let updatedBookings = false;
          bookings.forEach((b) => {
            if (!existingIds.has(b.bookingId)) {
              currentBookings.push(b);
              updatedBookings = true;
            }
          });
          if (updatedBookings) {
            localStorage.setItem('c2b_bookings', JSON.stringify(currentBookings));
            window.dispatchEvent(new Event('storage'));
          }
        }
        const { vehicles } = json.data;
        if (vehicles && Array.isArray(vehicles) && vehicles.length > 0) {
          const currentFleet = JSON.parse(localStorage.getItem('c2b_registered_fleet') || '[]');
          const deletedBuses = JSON.parse(localStorage.getItem('c2b_deleted_buses') || '[]');
          const clean = (s) => String(s || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

          let updatedFleet = false;
          vehicles.forEach((v) => {
            const vNum = v.vehicleNumber || v.regNo;
            const vId = v.vehicleId || v.id;
            const isDel = deletedBuses.some((d) => {
              const dId = clean(d.id || d.vehicleId);
              const dPlate = clean(d.plate || d.vehicleNumber);
              return (vId && dId && clean(vId) === dId) || (vNum && dPlate && clean(vNum) === dPlate);
            });
            if (isDel) {
              const delIdx = currentFleet.findIndex(
                (f) => (vId && clean(f.vehicleId || f.id) === clean(vId)) || (vNum && clean(f.vehicleNumber) === clean(vNum))
              );
              if (delIdx >= 0) {
                currentFleet.splice(delIdx, 1);
                updatedFleet = true;
              }
              return;
            }

            const idx = currentFleet.findIndex(
              (f) => (v.vehicleId && f.vehicleId === v.vehicleId) || (vNum && f.vehicleNumber && clean(f.vehicleNumber) === clean(vNum))
            );
            if (idx >= 0) {
              currentFleet[idx] = { ...v, ...currentFleet[idx] };
            } else {
              currentFleet.push(v);
              updatedFleet = true;
            }
          });
          if (updatedFleet) {
            localStorage.setItem('c2b_registered_fleet', JSON.stringify(currentFleet));
            window.dispatchEvent(new Event('storage'));
          }
        }
      }
    } catch (e) {}
  }
}

export const liveSync = new LiveSyncClient();
