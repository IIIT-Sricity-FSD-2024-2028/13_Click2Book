# Click2Book — Super Admin module

A copy of everything related to the **Super Admin** and **Admin** portals of
Click2Book. The original project (`FDFED_FINAL`) is unchanged.

```
super_admin/
  front-end/   runnable React app: Staff Access, Admin console, Super Admin portal
  back-end/    the backend modules behind these portals (reference copy)
```

## Run it

The front-end talks to the Click2Book backend, so start that first (from the main project):

```bash
cd C:\Users\USER\Desktop\FDFED_FINAL\FDFED_FINAL\back-end
npm run build
node dist/src/main.js          # → http://localhost:3000/api
```

Then the Super Admin front-end:

```bash
cd C:\Users\USER\Desktop\super_admin\front-end
npm install                    # first time only (already done)
npm run dev                    # → http://localhost:5180
```

It runs on port **5180**, so it can run alongside the main app (5173/5174).

| Page | URL | Login |
|---|---|---|
| Staff Access | http://localhost:5180/staff-access | — |
| Super Admin portal | http://localhost:5180/super-admin/login | `superuser@click2book.com` / `super123` |
| Admin console | http://localhost:5180/admin/login | `admin@click2book.com` / `Admin@123` |
| Revenue Split | http://localhost:5180/admin/revenue-dashboard | (after admin login) |

Links to the customer, provider and support portals (not part of this copy) return to Staff Access.

## What's in `front-end/src`

| Path | Purpose |
|---|---|
| `superadmin/Login.jsx`, `Login.css` | Super Admin login |
| `superadmin/Console.jsx` | Super Admin portal — full-page data console |
| `components/SuperUserPanel/` | The data console (all tables, add / edit / delete, reset DB) |
| `lib/crudSchemas/` | Table & field definitions for the console |
| `landing/StaffAccess.jsx` | Staff Access page with the Super Admin card |
| `admin/AdminDashboard.jsx` | Admin console shell (role-based sections, notifications) |
| `admin/sections/` | Admins, Providers, Buses, Bookings, Customers, Reports, Finance, Support, Settings, Overview |
| `admin/lib/adminData.jsx` | Loads admin data from the backend; every admin action |
| `admin/Login.jsx`, `admin/RevenueDashboard.jsx` | Admin login, revenue split dashboard |
| `admin/components/`, `admin/styles/` | Charts, shared UI, styles |
| `lib/`, `hooks/`, `components/`, `styles/` | Shared code these pages need (API client, session, pricing, settings, dates, toasts…) |
| `App.jsx`, `main.jsx` | Routes for this standalone app |

Build tooling (`vite.config.js`, `postcss.config.js`, `build/postcss-scope.js`, ESLint, Prettier) is the same as the main app.

## What's in `back-end/src`

These modules only run inside the full NestJS backend (they depend on bookings,
payments, trips, etc.), so they are here for reference / review — the running
backend is the one in the main project.

| Path | Purpose |
|---|---|
| `modules/platform/` | Platform settings, admin activity log, login lockout |
| `modules/admin/` | Admin accounts: roles, permissions, activate / deactivate / delete |
| `modules/auth/auth.service.ts`, `auth.module.ts` | Login (admins, support, providers, customers), deactivated-admin block |
| `modules/provider/` | Provider document verification, approve / reject / suspend |
| `modules/revenue-split/` | Commission & fee configuration |
| `modules/ledger/` | Transaction ledger (fare split per booking) |
| `modules/payouts/` | Operator payout summary |
| `modules/report/` | Daily reports |
| `common/utils/defined.util.ts` | Safe partial updates |

## Notes

- The Super Admin data console edits the demo database stored in the browser
  (localStorage); the Admin console reads and writes the real backend.
- If you change a file here, the main project is not affected (and vice versa).
