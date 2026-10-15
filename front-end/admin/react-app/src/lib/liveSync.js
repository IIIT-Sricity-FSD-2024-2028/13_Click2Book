/**
 * Click2Book Live Cross-Actor Sync Client (Admin Portal)
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
          console.warn('[LiveSync Admin] Error parsing event:', err);
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
      setTimeout(() => this.connect(), 5000);
    }
  }

  handleEvent(data) {
    if (!data || !data.type || data.type === 'HEARTBEAT') return;

    try {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('c2b_sync', { detail: data }));
    } catch {}

    this.listeners.forEach((fn) => {
      try {
        fn(data);
      } catch (err) {
        console.error('[LiveSync Admin] Listener error:', err);
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
    } catch (err) {}
  }
}

export const liveSync = new LiveSyncClient();
