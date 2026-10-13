/**
 * Backend location. When the app is opened over the network (e.g. from a
 * phone on the same Wi-Fi) the API is assumed to live on the same host.
 */
const host = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'localhost' : window.location.hostname;

export const API_BASE = `http://${host}:3000/api`;
