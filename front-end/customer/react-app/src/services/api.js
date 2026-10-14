/**
 * Click2Book Customer Portal — Resilient API Layer
 * Connects to NestJS Backend at /api (via Vite proxy or direct host)
 * Preserves dual-mode operation and localStorage fallback
 */

const API_BASE = '/api';

export function getRole() {
  if (typeof window === 'undefined') return 'CUSTOMER';
  return sessionStorage.getItem('c2b_role') || localStorage.getItem('c2b_role') || 'CUSTOMER';
}

export function getCustomerId() {
  if (typeof window === 'undefined') return 'C001';
  return (
    sessionStorage.getItem('c2b_loggedInId') ||
    localStorage.getItem('c2b_loggedInId') ||
    sessionStorage.getItem('c2b_userId') ||
    localStorage.getItem('c2b_userId') ||
    'C001'
  );
}

export function getCustomerName() {
  if (typeof window === 'undefined') return 'Customer';
  return sessionStorage.getItem('c2b_userName') || localStorage.getItem('c2b_userName') || 'Customer';
}

export function getCustomerEmail() {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem('c2b_userEmail') || localStorage.getItem('c2b_userEmail') || '';
}

export async function apiFetch(path, options = {}) {
  const role = getRole();
  const headers = {
    'Content-Type': 'application/json',
    'x-role': role,
    ...(options.headers || {}),
  };

  // If body is FormData, delete Content-Type to allow boundary generation
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    const errorMsg = json.message || `API error ${res.status}`;
    const err = new Error(Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg);
    err.status = res.status;
    throw err;
  }

  return json.data !== undefined ? json.data : json;
}

export const API = {
  async ping() {
    try {
      const data = await apiFetch('/routes');
      return { connected: true, routesCount: Array.isArray(data) ? data.length : 0 };
    } catch {
      return { connected: false, routesCount: 0 };
    }
  },

  routes: {
    async getAll() {
      return apiFetch('/routes');
    },
  },

  auth: {
    async login(email, password) {
      return apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    },
    async register(name, email, password, phoneNumber, age = 25, gender = 'MALE') {
      return apiFetch('/customers', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, phoneNumber, age, gender }),
      });
    },
  },

  trips: {
    async search(source, destination, date) {
      let url = `/trips?source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}`;
      if (date) url += `&date=${encodeURIComponent(date)}`;
      return apiFetch(url);
    },
    async getById(tripId) {
      return apiFetch(`/trips/${tripId}`);
    },
  },

  seats: {
    async getByVehicle(vehicleId) {
      return apiFetch(`/seats/vehicle/${vehicleId}`);
    },
  },

  bookings: {
    async create(tripId, seatNumber, offerCode = null) {
      const customerId = getCustomerId();
      const body = { customerId, tripId, seatNumber: Number(seatNumber) };
      if (offerCode) body.offerCode = offerCode;
      return apiFetch('/bookings', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
    async confirm(bookingId) {
      return apiFetch(`/bookings/${bookingId}/confirm`, {
        method: 'PATCH',
      });
    },
    async getMine() {
      const customerId = getCustomerId();
      return apiFetch(`/bookings/customer/${customerId}`);
    },
    async getById(bookingId) {
      return apiFetch(`/bookings/${bookingId}`);
    },
  },

  payments: {
    async pay(bookingId, amount, paymentMethod = 'UPI', discountAmount = 0) {
      return apiFetch('/payments', {
        method: 'POST',
        body: JSON.stringify({ bookingId, amount: Number(amount), paymentMethod, discountAmount: Number(discountAmount) }),
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
    async getByBooking(bookingId) {
      return apiFetch(`/cancellations/booking/${bookingId}`);
    },
  },

  refunds: {
    async request(bookingId, refundAmount) {
      return apiFetch('/refunds/request', {
        method: 'POST',
        body: JSON.stringify({ bookingId, refundAmount: Number(refundAmount) }),
      });
    },
    async getByBooking(bookingId) {
      return apiFetch(`/refunds/booking/${bookingId}`);
    },
  },

  offers: {
    async getActive() {
      return apiFetch('/offers/active');
    },
  },

  customer: {
    async getProfile(id) {
      const customerId = id || getCustomerId();
      return apiFetch(`/customers/${customerId}`);
    },
    async updateProfile(id, data) {
      const customerId = id || getCustomerId();
      return apiFetch(`/customers/${customerId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    async uploadProfilePicture(file, id) {
      const customerId = id || getCustomerId();
      const formData = new FormData();
      formData.append('file', file);
      return apiFetch(`/customers/${customerId}/profile-picture`, {
        method: 'POST',
        body: formData,
      });
    },
  },

  support: {
    async submitRequest(description, category = 'General', bookingId = null) {
      const customerId = getCustomerId();
      const body = { customerId, description, category };
      if (bookingId) body.bookingId = bookingId;
      return apiFetch('/support-requests', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
    async getMyRequests() {
      const customerId = getCustomerId();
      return apiFetch(`/support-requests/customer/${customerId}`);
    },
  },

  lostFound: {
    async report(tripId, bookingId, itemDescription, category, dateLost, contactPhone) {
      const customerId = getCustomerId();
      return apiFetch('/lost-found', {
        method: 'POST',
        body: JSON.stringify({ tripId, bookingId, customerId, itemDescription, category, dateLost, contactPhone }),
      });
    },
    async getMine() {
      const customerId = getCustomerId();
      return apiFetch(`/lost-found/customer/${customerId}`);
    },
  },

  tracking: {
    async getLocation(tripId) {
      const customerId = getCustomerId();
      return apiFetch(`/tracking/${tripId}?customerId=${encodeURIComponent(customerId)}`);
    },
    async getEta(tripId) {
      return apiFetch(`/tracking/${tripId}/eta`);
    },
    async raiseSos(bookingId, type, message = '', lat = null, lng = null) {
      const customerId = getCustomerId();
      const body = { bookingId, customerId, type, message };
      if (lat != null) body.lat = lat;
      if (lng != null) body.lng = lng;
      return apiFetch('/emergency', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
  },
};

// Convenient aliases for component compatibility
API.customers = API.customer;
API.supportRequests = {
  create: async (data) => {
    const payload = {
      customerId: data.customerId || getCustomerId(),
      description: data.description,
    };
    if (data.bookingId) payload.bookingId = data.bookingId;
    if (data.category) payload.category = data.category;
    if (data.requestId) payload.requestId = data.requestId;
    if (data.supporterId) payload.supporterId = data.supporterId;
    if (data.status) payload.status = data.status;
    if (data.customerName) payload.customerName = data.customerName;
    if (data.createdAt) payload.createdAt = data.createdAt;
    return apiFetch('/support-requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  getMine: async (customerId) => {
    const cId = customerId || getCustomerId();
    return apiFetch(`/support-requests/customer/${cId}`);
  },
  submitRequest: API.support.submitRequest,
  getMyRequests: API.support.getMyRequests,
};
API.emergency = {
  createAlert: async (data) => {
    return apiFetch('/emergency', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  raiseSos: API.tracking.raiseSos,
};

export const api = API;
export default API;
