/**
 * Click2Book — Shared Dashboard API Connector
 * Works for: Admin, Provider, Support, Customer pages
 * Auto-detects backend host (localhost vs network IP)
 */

(function() {
  const _h = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'localhost' : location.hostname;
  window.C2B_API = `http://${_h}:3000/api`;
})();

function getRole() {
  return sessionStorage.getItem('c2b_role') || localStorage.getItem('c2b_role') || 'CUSTOMER';
}

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${window.C2B_API}${path}`, {
    headers: { 'Content-Type': 'application/json', 'x-role': getRole(), ...(opts.headers||{}) },
    ...opts
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || `API error ${res.status}`);
  return json;
}

/* Show a fixed status badge on every dashboard page */
window.addEventListener('DOMContentLoaded', async () => {
  try {
    const r = await apiFetch('/routes');
    const count = (r.data || []).length;
    showBadge(true, `${count} routes`);
  } catch(e) {
    showBadge(false, 'Backend offline');
  }
});

function showBadge(ok, msg) {
  const d = document.createElement('div');
  d.id = 'c2b-api-badge';
  d.textContent = ok ? `🟢 API Live — ${msg}` : `🔴 ${msg}`;
  d.style.cssText = `position:fixed;bottom:12px;right:12px;z-index:99999;
    padding:5px 14px;border-radius:20px;font-size:11px;font-weight:700;font-family:monospace;
    background:${ok?'#dcfce7':'#fee2e2'};color:${ok?'#166534':'#991b1b'};
    border:1px solid ${ok?'#86efac':'#fca5a5'};box-shadow:0 2px 8px rgba(0,0,0,.12);`;
  document.body.appendChild(d);
  if (ok) setTimeout(() => { d.style.opacity='0.4'; }, 6000);
}
