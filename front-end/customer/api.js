/**
 * Click2Book — Frontend API Client
 * ─────────────────────────────────
 * Connects all frontend pages to the NestJS backend running at localhost:3000
 *
 * Usage in any HTML page:
 *   <script src="api.js"></script>
 *   <script>
 *     const trips = await API.trips.search('Hyderabad', 'Chennai', '2026-06-01');
 *   </script>
 */

// Auto-detect backend host: if running via network IP use same IP, else localhost
const _host = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? 'localhost'
  : location.hostname;
const API_BASE = `http://${_host}:3000/api`;

/** Read current role from session (set at login) */
function getRole() {
  return sessionStorage.getItem('c2b_role') || localStorage.getItem('c2b_role') || 'CUSTOMER';
}

/** Read current customer ID from session */
function getCustomerId() {
  return sessionStorage.getItem('c2b_userId') || localStorage.getItem('c2b_userId') || '';
}

/**
 * Core fetch wrapper — handles headers, errors, and response parsing
 */
async function apiFetch(path, options = {}) {
  const role = getRole();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'x-role': role,
      ...options.headers,
    },
    ...options,
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.message || `API error ${res.status}`);
  }

  return json.data;
}

/* ─────────────────────────────────────────────────────────────
   API MODULES
   ───────────────────────────────────────────────────────────── */
window.API = {

  /** Check if backend is reachable */
  async ping() {
    try {
      const data = await apiFetch('/routes');
      return { connected: true, message: '✅ Backend connected', routesCount: data.length };
    } catch (e) {
      return { connected: false, message: '❌ Backend not reachable: ' + e.message };
    }
  },

  trips: {
    /** Search trips by source, destination, and date */
    async search(source, destination, date) {
      let url = `/trips?source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}`;
      if (date) url += `&date=${date}`;
      return apiFetch(url);
    },
    /** Get trip details by ID */
    async getById(tripId) {
      return apiFetch(`/trips/${tripId}`);
    },
  },

  routes: {
    async getAll() { return apiFetch('/routes'); },
  },

  bookings: {
    /** Create a new booking */
    async create(tripId, seatNumber, offerId = null) {
      const customerId = getCustomerId();
      return apiFetch('/bookings', {
        method: 'POST',
        body: JSON.stringify({ customerId, tripId, seatNumber, ...(offerId ? { offerId } : {}) }),
      });
    },
    /** Get bookings for the current customer */
    async getMine() {
      const customerId = getCustomerId();
      return apiFetch(`/bookings/customer/${customerId}`);
    },
    async getById(bookingId) {
      return apiFetch(`/bookings/${bookingId}`);
    },
  },

  payments: {
    /** Process payment for a booking */
    async pay(bookingId, amount, paymentMethod = 'UPI', discountAmount = 0) {
      return apiFetch('/payments', {
        method: 'POST',
        body: JSON.stringify({ bookingId, amount, paymentMethod, discountAmount }),
      });
    },
    async getByBooking(bookingId) {
      return apiFetch(`/payments/booking/${bookingId}`);
    },
  },

  cancellations: {
    async cancel(bookingId) {
      return apiFetch('/cancellations', {
        method: 'POST',
        body: JSON.stringify({ bookingId }),
      });
    },
  },

  refunds: {
    async request(bookingId, refundAmount) {
      return apiFetch('/refunds/request', {
        method: 'POST',
        body: JSON.stringify({ bookingId, refundAmount }),
      });
    },
  },

  offers: {
    async getActive() { return apiFetch('/offers/active'); },
    async getAll()    { return apiFetch('/offers'); },
  },

  reviews: {
    async submit(tripId, rating, comment = '') {
      const customerId = getCustomerId();
      return apiFetch('/reviews', {
        method: 'POST',
        body: JSON.stringify({ customerId, tripId, rating, comment }),
      });
    },
    async getMyReviews() {
      const customerId = getCustomerId();
      return apiFetch(`/reviews/customer/${customerId}`);
    },
  },

  support: {
    async submitRequest(description) {
      const customerId = getCustomerId();
      return apiFetch('/support-requests', {
        method: 'POST',
        body: JSON.stringify({ customerId, description }),
      });
    },
    async getMyRequests() {
      const customerId = getCustomerId();
      return apiFetch(`/support-requests/customer/${customerId}`);
    },
  },

  customer: {
    async getProfile() {
      const customerId = getCustomerId();
      return apiFetch(`/customers/${customerId}`);
    },
    async register(name, email, password, age, gender, phoneNumber) {
      return apiFetch('/customers', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, age, gender, phoneNumber }),
      });
    },
  },
};

/* ─────────────────────────────────────────────────────────────
   CONNECTION STATUS BANNER
   Shows a small status badge on page load (top-right corner)
   ───────────────────────────────────────────────────────────── */
window.addEventListener('DOMContentLoaded', async () => {
  const status = await API.ping();

  // Create floating status badge
  const badge = document.createElement('div');
  badge.id = 'api-status-badge';
  badge.style.cssText = `
    position: fixed; bottom: 16px; right: 16px; z-index: 9999;
    padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;
    font-family: monospace; cursor: default; box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    background: ${status.connected ? '#22c55e' : '#ef4444'};
    color: white;
  `;
  badge.title = status.connected
    ? `Backend connected — ${status.routesCount} routes loaded`
    : status.message;
  badge.textContent = status.connected ? '● API Connected' : '● API Offline';
  document.body.appendChild(badge);

  // Auto-hide after 5 seconds if connected
  if (status.connected) {
    setTimeout(() => badge.style.opacity = '0.3', 5000);
  }
});
