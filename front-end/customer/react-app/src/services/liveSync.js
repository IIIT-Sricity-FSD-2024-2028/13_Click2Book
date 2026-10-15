/**
 * Click2Book Live Cross-Actor Sync Client (Customer Portal)
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
    // Fetch initial consolidated backend state on startup
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
      if (type === 'SCHEDULE_UPDATED') {
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
      } else if (type === 'BOOKING_CREATED') {
        const bookings = JSON.parse(localStorage.getItem('c2b_bookings') || '[]');
        const exists = bookings.some((b) => b.bookingId === payload.bookingId);
        if (!exists) {
          bookings.unshift(payload);
          localStorage.setItem('c2b_bookings', JSON.stringify(bookings));
        }
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
        const { trips, tripStatuses, customSchedules } = json.data;
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
      }
    } catch (e) {
      // offline fallback
    }
  }
}

export const liveSync = new LiveSyncClient();
