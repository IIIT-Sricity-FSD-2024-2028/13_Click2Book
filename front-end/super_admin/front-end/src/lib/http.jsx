import { API_BASE } from './config';
import { getRole } from './session';

/**
 * Fetch wrapper for the NestJS backend.
 *
 * The backend wraps every payload as `{ success, data, message }`. By default
 * this resolves to `data` and throws when the request failed; pass
 * `raw: true` to get the whole envelope instead.
 *
 * `role` sets the `x-role` RBAC header. It defaults to the signed-in role;
 * pass `null` to send no role at all (e.g. for login).
 */
export async function apiRequest(path, { role, method = 'GET', body, headers, raw = false } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(role === null ? {} : { 'x-role': role || getRole() }),
      ...headers,
    },
    ...(body !== undefined ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}),
  });

  const json = await res.json();
  if (!res.ok || (!raw && !json.success)) {
    throw new Error(json.message || `API error ${res.status}`);
  }
  return raw ? json : json.data;
}
