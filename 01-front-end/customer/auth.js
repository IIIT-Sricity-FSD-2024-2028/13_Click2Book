/**
 * Click2Book — Customer Auth Guard
 * Add <script src="auth.js"></script> to every customer page.
 *
 * What it does on every page load:
 *  1. Checks if c2b_loggedIn is set in sessionStorage/localStorage
 *  2. If NOT logged in → redirect to login page
 *  3. If logged in → fill profile card with real user name & initials
 *  4. Wire up logout button
 *  5. Update header greeting
 */

(function () {
  'use strict';

  /* ── helpers ──────────────────────────────────────────── */
  function ss(k)  { return sessionStorage.getItem(k); }
  function ls(k)  { return localStorage.getItem(k);   }

  function isLoggedIn() {
    return ss('c2b_loggedIn') === 'true' || ls('c2b_loggedIn') === 'true';
  }

  function getUserName() {
    return ss('c2b_userName') || ls('c2b_userName') || 'Customer';
  }

  function initials(name) {
    return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  /* ── Detect relative path to landing page ─────────────── */
  function loginPath() {
    // All customer pages are one level deep: customer/
    return '../landing page/login.html';
  }

  /* ── Auth gate: redirect guests ───────────────────────── */
  if (!isLoggedIn()) {
    // Save current URL so we can return after login (optional)
    sessionStorage.setItem('c2b_returnUrl', window.location.href);
    window.location.replace(loginPath());
    return; // Stop rest of script
  }

  /* ── Page is accessed by logged-in user ───────────────── */
  window.addEventListener('DOMContentLoaded', function () {
    const name = getUserName();
    const ini  = initials(name);

    /* Profile card */
    const avatarEl = document.querySelector('.profile-avatar');
    const nameEl   = document.querySelector('.profile-name');
    const badgeEl  = document.querySelector('.profile-badge');

    if (avatarEl) avatarEl.textContent = ini;
    if (nameEl)   nameEl.textContent   = name.toUpperCase();
    if (badgeEl)  badgeEl.textContent  = 'Logged In ✓';

    /* Header subtitle greeting */
    const subtitleEl = document.querySelector('.header-subtitle');
    if (subtitleEl && subtitleEl.textContent.includes('Rahul')) {
      subtitleEl.textContent = 'Welcome back, ' + name.split(' ')[0] + '!';
    }

    /* Logout button */
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
          sessionStorage.removeItem('c2b_loggedIn');
          sessionStorage.removeItem('c2b_userName');
          localStorage.removeItem('c2b_loggedIn');
          localStorage.removeItem('c2b_userName');
          window.location.href = loginPath();
        }
      });
    }
  });

})();
