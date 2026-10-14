# Click2Book — Super Admin module

A copy of everything related to the **Super Admin** portal of Click2Book. The original project (`FDFED_FINAL`) is unchanged.

```
super_admin/
  front-end/   runnable React app: Staff Access, Super Admin portal
```

## Run it

```bash
cd front-end/super_admin/front-end
npm install                    # first time only
npm run dev                    # → http://localhost:5180
```

The Super Admin console works on demo data stored in the browser, so no backend
is needed. The **Revenue** page reads live money data, so it needs the team backend
running (http://localhost:3000/api); the platform banner also shows the live
platform settings when the backend is up.

It runs on port **5180**, so it can run alongside the main app (5173/5174).

| Page | URL | Login |
|---|---|---|
| Staff Access | http://localhost:5180/staff-access | — |
| Super Admin portal | http://localhost:5180/super-admin/login | `superuser@click2book.com` / `super123` |
| Revenue | http://localhost:5180/super-admin/revenue | (after Super Admin login; needs the backend) |

Links to the admin, customer, provider and support portals (not part of this copy) return to Staff Access.

## What's in `front-end/src`

| Path | Purpose |
|---|---|
| `superadmin/Login.jsx`, `Login.css` | Super Admin login |
| `superadmin/Revenue.jsx`, `Revenue.css` | Revenue page: gross revenue & trend, revenue-split config, checkout fees & refund rules, operator payouts, ledger, payments, refunds, support costs |
| `superadmin/RefundsCard.jsx`, `PricingRulesCard.jsx`, `CanvasChart.jsx`, `revenueUtils.jsx` | Parts of the Revenue page |
| `superadmin/Console.jsx` | Super Admin portal — full-page data console |
| `components/SuperUserPanel/` | The data console (all tables, add / edit / delete, reset DB) |
| `lib/crudSchemas/` | Table & field definitions for the console |
| `landing/StaffAccess.jsx` | Staff Access page with the Super Admin card |
| `lib/`, `hooks/`, `components/`, `styles/` | Shared code these pages need (demo database, session, platform settings, dates, search…) |
| `App.jsx`, `main.jsx` | Routes for this standalone app |

Build tooling (`vite.config.js`, `postcss.config.js`, `build/postcss-scope.js`, ESLint, Prettier) is the same as the main app.

## Notes

- The Super Admin data console edits the demo database stored in the browser
  (localStorage).
- If you change a file here, the main project is not affected (and vice versa).
