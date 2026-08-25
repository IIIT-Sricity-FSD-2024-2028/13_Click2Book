# 00 — Click2Book: Initial FFSD Audit Report

**Audit Date:** 2026-08-25
**Auditor:** Antigravity (Read-Only Pass — No files were modified)
**Git Baseline Commit:** "Baseline before FFSD middleware implementation" (committed to `main`)

---

## A. Current Architecture

### Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js | LTS |
| Framework | NestJS | ^11.0.1 |
| Language | TypeScript | ^5.7.3 |
| HTTP Adapter | Express (via @nestjs/platform-express) | ^11.0.1 |
| API Docs | Swagger (@nestjs/swagger + swagger-ui-express) | ^11.4.2 / ^5.0.1 |
| Validation | class-validator + class-transformer | ^0.15.1 / ^0.5.1 |
| Testing | Jest + ts-jest + Supertest | ^30.0.0 / ^29.2.5 / ^7.0.0 |
| Frontend | Vanilla HTML5 + CSS3 + JavaScript | — |
| Database | MySQL (schema in Database/DBschema.sql) | — |
| ORM/DB Driver | **None** — in-memory arrays (repositories) | — |

### Project Root Layout

```
FFSD_Final/
├── back-end/               # NestJS API
│   ├── src/
│   │   ├── main.ts         # Bootstrap, Swagger, CORS, global pipes/filters
│   │   ├── app.module.ts   # Root module — imports all 22 feature modules
│   │   ├── app.controller.ts
│   │   ├── app.service.ts
│   │   ├── common/
│   │   │   ├── decorators/roles.decorator.ts
│   │   │   ├── enums/role.enum.ts
│   │   │   ├── exceptions/global-exception.filter.ts
│   │   │   ├── guards/roles.guard.ts
│   │   │   └── utils/{id.util.ts, response.util.ts}
│   │   └── modules/        # 22 feature modules
│   ├── test/               # e2e tests (Supertest)
│   ├── package.json
│   └── tsconfig.json
├── front-end/
│   ├── api-connector.js    # Shared API base URL + apiFetch() helper
│   ├── landing page/       # 7 pages
│   ├── customer/           # 14 files — bus booking portal
│   ├── TrainInterface/     # 24 files — train booking portal
│   ├── admin/              # 4 files — admin dashboard
│   ├── serviceprovider/    # 11 files — provider portal
│   ├── supportagent/       # 4 files — support agent portal
│   └── crud functions/js/  # 8 shared JS files
├── Database/
│   ├── DBschema.sql
│   └── ER_DIAGRAM.jpg
└── reports/                # This audit file (only new item created in audit pass)
```

### API Architecture

- **Global prefix:** /api
- **Swagger UI:** http://localhost:3000/docs
- **CORS:** Enabled globally (open — no origin restriction)
- **Auth strategy:** Header-based RBAC (x-role: CUSTOMER | ADMIN | PROVIDER | SUPPORT)
- **Request lifecycle:**
  Request → RolesGuard → Controller → Service → Repository → Response
  Any throw → GlobalExceptionFilter → Standardised JSON error

### Backend Module Inventory (22 modules)

| Group | Modules |
|-------|---------|
| Auth & Identity | auth, customer, admin, provider, support |
| Transport Core | route, vehicle, seat, schedule, trip |
| Booking Workflow | offer, booking, payment, cancellation, refund |
| Supplementary | irctc, review, support-request, report |
| Safety & Recovery | tracking, emergency, lost-found |

Every module follows: controller.ts → service.ts → repository.ts (in-memory array)
with dto/, interfaces/, and enums/ subdirectories.

---

## B. Existing Functionality

### Authentication & Authorization

| Item | Implementation | File |
|------|---------------|------|
| Login endpoint | POST /api/auth/login — static users + CustomerRepository | auth.service.ts |
| Password storage | **Plaintext** in memory — no hashing | auth.service.ts, customer.repository.ts |
| Role check | RolesGuard reads x-role request header | roles.guard.ts |
| Role decorator | @Roles(Role.ADMIN) — uses NestJS SetMetadata | roles.decorator.ts |
| Role enum | CUSTOMER, ADMIN, PROVIDER, SUPPORT | role.enum.ts |
| Session management | **None** — frontend uses sessionStorage/localStorage | auth.js (frontend) |

### Validation

- Global ValidationPipe with whitelist: true, forbidNonWhitelisted: true, transform: true
- All DTOs use class-validator decorators
- Validation errors produce 400 Bad Request with field-level messages

### Error Handling

- GlobalExceptionFilter catches all exceptions
- Returns standardised { success: false, message: "...", data: null }
- Handles HttpException (extracts status code + message)
- Handles unknown errors as 500
- **No logging** — errors are only returned to client, never written to any file

### Response Format

All successful responses:  { "success": true, "message": "...", "data": {...} }

### Controllers Inventory (22 controllers, all CRUD-complete)

| Controller | Roles Protected |
|-----------|----------------|
| AuthController | None (public) |
| CustomerController | RolesGuard (ADMIN, CUSTOMER) |
| AdminController | RolesGuard (ADMIN only) |
| ProviderController | RolesGuard (PROVIDER, ADMIN) |
| SupportController | RolesGuard (ADMIN, SUPPORT) |
| VehicleController | RolesGuard (PROVIDER, ADMIN) |
| SeatController | RolesGuard (PROVIDER, ADMIN) |
| RouteController | RolesGuard (PROVIDER, ADMIN) |
| ScheduleController | RolesGuard (PROVIDER, ADMIN) |
| TripController | RolesGuard (PROVIDER, ADMIN) |
| OfferController | RolesGuard (PROVIDER, ADMIN) |
| IrctcController | RolesGuard (CUSTOMER, ADMIN) |
| BookingController | RolesGuard (CUSTOMER, ADMIN) |
| PaymentController | RolesGuard (CUSTOMER, ADMIN) |
| CancellationController | RolesGuard (CUSTOMER, ADMIN) |
| RefundController | RolesGuard (CUSTOMER, ADMIN) |
| ReviewController | RolesGuard (CUSTOMER, ADMIN) |
| SupportRequestController | RolesGuard (CUSTOMER, SUPPORT, ADMIN) |
| ReportController | RolesGuard (ADMIN only) |
| TrackingController | RolesGuard (PROVIDER, CUSTOMER, ADMIN) |
| EmergencyController | RolesGuard (CUSTOMER, ADMIN) |
| LostFoundController | RolesGuard (CUSTOMER, PROVIDER, ADMIN) |

### Existing Tests

| File | Type | Cases |
|------|------|-------|
| app.controller.spec.ts | Unit | 1 (Hello World) |
| tracking.service.spec.ts | Unit | 7 |
| emergency.service.spec.ts | Unit | 5 |
| lost-found.service.spec.ts | Unit | 7 |
| test/app.e2e-spec.ts | E2E | 1 (GET /) |

### Frontend Integration

- api-connector.js — shared; sets C2B_API = http://localhost:3000/api, provides apiFetch()
  with auto-injected Content-Type and x-role headers from sessionStorage
- auth.js (customer portal) — client-side auth guard, redirects unauthenticated users to login
- crud functions/js/ — 8 shared JS files for UI rendering per role

---

## C. FFSD Requirements Satisfaction Matrix

| FFSD Requirement | Status | Evidence |
|-----------------|--------|---------|
| 1. Complete Web Application | SATISFIED | 22 backend modules, 55+ frontend pages, 4 portals |
| 2. Logging Middleware | MISSING | Zero logging code in back-end/src/ |
| 3. Error Handling Middleware | PARTIAL | GlobalExceptionFilter exists but no file logging |
| 4. File Upload Middleware | MISSING | No multer, no FileInterceptor, no upload endpoint |
| 5. Security Middleware | PARTIAL | CORS + RolesGuard + ValidationPipe. No helmet/rate-limit |
| 6. Router-level Middleware | MISSING | No NestMiddleware class, no configure(consumer) anywhere |
| 7. Logs stored in files | MISSING | No logs directory, no application.log/error.log/admin.log |

---

## D. What is Missing

### D1. Logging Middleware (Req #2 + #7)
- No Logger service usage anywhere in the codebase
- No winston or NestJS built-in logger configured
- No log files: application.log, error.log, admin.log
- No request/response logging (method, URL, status, latency)
- No periodic log flushing or log rotation

### D2. Enhanced Error Handling (Req #3)
- GlobalExceptionFilter does NOT write errors to error.log
- No stack trace capture for 500 errors
- No differentiation between 4xx and 5xx for log routing
- No admin.log for admin-specific error/action tracking

### D3. File Upload Middleware (Req #4)
- No multer package installed
- No FileInterceptor wired to any controller
- No upload endpoint (candidate: provider vehicle photo, customer profile picture, lost-found item photo)
- No uploads/ directory
- No file type/size validation

### D4. Security Middleware (Req #5)
- No helmet package (HTTP security headers: CSP, HSTS, X-Frame-Options, etc.)
- No rate limiter (@nestjs/throttler or express-rate-limit)
- CORS is wide open (app.enableCors() with no origin restriction)
- Passwords stored as plaintext in memory
- No request body size limit configured

### D5. Router-level Middleware (Req #6)
- No class implementing NestMiddleware with use(req, res, next) signature
- No configure(consumer: MiddlewareConsumer) method in AppModule or any module
- Route-specific middleware entirely absent

### D6. Log File Management (Req #7)
- No logs/ directory
- No application.log (all HTTP requests)
- No error.log (4xx/5xx with stack trace)
- No admin.log (admin actions: login, report generation, user management)
- No scheduled log flush/rotation mechanism

---

## E. Exact Files to Modify

| File | Modification Required |
|------|-----------------------|
| back-end/src/main.ts | Add helmet(), rate limiter, tighter CORS, wire LoggingMiddleware globally |
| back-end/src/app.module.ts | Add configure(consumer) with MiddlewareConsumer.apply().forRoutes() |
| back-end/src/common/exceptions/global-exception.filter.ts | Inject LoggerService, write to error.log and admin.log |
| back-end/src/modules/customer/customer.controller.ts | Add FileInterceptor for profile picture upload |
| back-end/src/modules/lost-found/lost-found.controller.ts | Add FileInterceptor for item photo upload |
| back-end/src/modules/admin/admin.controller.ts | Log admin actions to admin.log |
| back-end/src/modules/report/report.controller.ts | Log report generation to admin.log |
| back-end/package.json | Add new dependencies |

---

## F. Exact Files to Create

```
back-end/src/common/middleware/
├── logging.middleware.ts          # NestMiddleware — logs every req/res to application.log
├── admin-logger.middleware.ts     # NestMiddleware — logs /api/admin/* to admin.log
└── request-id.middleware.ts       # NestMiddleware — attaches x-request-id UUID

back-end/src/common/logger/
├── logger.module.ts               # Global winston logger module
└── logger.service.ts              # Wraps winston — writes to all three log files

back-end/logs/                     # Auto-created by winston at runtime
├── application.log
├── error.log
└── admin.log

back-end/uploads/                  # Upload destination directory
└── .gitkeep

back-end/src/common/upload/
└── upload.config.ts               # Multer disk storage config
```

---

## G. Dependencies Required

| Package | Purpose | Install |
|---------|---------|---------|
| winston | File-based logging | npm install winston |
| winston-daily-rotate-file | Log rotation by date/size | npm install winston-daily-rotate-file |
| helmet | HTTP security headers | npm install helmet |
| @nestjs/throttler | Rate limiting | npm install @nestjs/throttler |
| @types/multer | TypeScript types for file upload | npm install @types/multer -D |
| uuid | x-request-id generation | npm install uuid |
| @types/uuid | TypeScript types for uuid | npm install @types/uuid -D |

Note: multer itself ships with @nestjs/platform-express. Only @types/multer is needed.

---

## H. Risks of Modifying Existing Functionality

| Risk | Severity | Mitigation |
|------|---------|-----------|
| GlobalExceptionFilter modification could break response shape | HIGH | Keep existing JSON shape; only ADD logging as a side-effect |
| helmet may block Swagger UI (CSP headers) | MEDIUM | Use helmet({ contentSecurityPolicy: false }) for development |
| Rate limiting may throttle rapid Swagger testing | LOW | Set generous limits (100 req/60s), or exclude /docs |
| CORS tightening may break frontend opened from file:// | HIGH | Keep CORS open for localhost origins in dev config |
| Adding winston adds async I/O overhead | LOW | Use async transports; logging is non-blocking |
| Plaintext passwords — if bcrypt is added, existing test users break | HIGH | Only hash new registrations; keep seeded data as-is |

---

## I. Recommended Implementation Order

```
Step 1  Install dependencies (npm install)
Step 2  Create LoggerService + LoggerModule (back-end/src/common/logger/)
Step 3  Create LoggingMiddleware (back-end/src/common/middleware/logging.middleware.ts)
Step 4  Create RequestIdMiddleware (back-end/src/common/middleware/request-id.middleware.ts)
Step 5  Add configure(consumer) to AppModule → wire LoggingMiddleware for all routes
Step 6  Create AdminLoggerMiddleware → wire to /admin/* and /reports/* routes
Step 7  Modify GlobalExceptionFilter → inject LoggerService → write to error.log
Step 8  Modify main.ts → add helmet(), ThrottlerModule, tighten CORS
Step 9  Create upload.config.ts + uploads/ directory
Step 10 Modify customer.controller.ts → add profile picture upload endpoint
Step 11 Modify lost-found.controller.ts → add item photo upload endpoint
Step 12 Verify: npm test (all existing tests still pass)
Step 13 Manual smoke test → verify all three log files created and populated
```

---

## J. Testing Strategy

### Existing Tests — Must Still Pass

```bash
cd back-end
npm test
# Must pass: tracking.service.spec, emergency.service.spec, lost-found.service.spec, app.controller.spec
```

### New Unit Tests to Write

| Test File | Coverage |
|-----------|---------|
| common/middleware/logging.middleware.spec.ts | Middleware calls next(), writes to log |
| common/logger/logger.service.spec.ts | info(), error(), warn() write correct format |

### Manual Verification Checklist

| Check | How |
|-------|-----|
| application.log created | Start server, GET /api/trips, check logs/application.log |
| error.log populated | Hit invalid route, check logs/error.log contains stack trace |
| admin.log populated | GET /api/admin/dashboard with x-role: ADMIN, check logs/admin.log |
| Helmet headers present | curl -I http://localhost:3000/api/trips → X-Frame-Options header |
| Rate limiting works | 101+ rapid requests → 429 Too Many Requests |
| File upload works | POST multipart form → 200 + file in uploads/ |
| Swagger still works | http://localhost:3000/docs opens without CSP errors |
| Frontend badge works | landing page/index.html → green API Live badge |

---

## K. Final Expected Project Structure

```
FFSD_Final/
├── back-end/
│   ├── logs/                        🔴 NEW (auto-created by winston)
│   │   ├── application.log          🔴 NEW
│   │   ├── error.log                🔴 NEW
│   │   └── admin.log                🔴 NEW
│   ├── uploads/                     🔴 NEW
│   │   └── .gitkeep                 🔴 NEW
│   ├── src/
│   │   ├── main.ts                  🟡 MODIFIED
│   │   ├── app.module.ts            🟡 MODIFIED
│   │   ├── common/
│   │   │   ├── decorators/          ✅ Unchanged
│   │   │   ├── enums/               ✅ Unchanged
│   │   │   ├── exceptions/
│   │   │   │   └── global-exception.filter.ts  🟡 MODIFIED
│   │   │   ├── guards/              ✅ Unchanged
│   │   │   ├── logger/              🔴 NEW
│   │   │   │   ├── logger.module.ts 🔴 NEW
│   │   │   │   └── logger.service.ts 🔴 NEW
│   │   │   ├── middleware/          🔴 NEW
│   │   │   │   ├── logging.middleware.ts       🔴 NEW
│   │   │   │   ├── admin-logger.middleware.ts  🔴 NEW
│   │   │   │   └── request-id.middleware.ts    🔴 NEW
│   │   │   ├── upload/              🔴 NEW
│   │   │   │   └── upload.config.ts 🔴 NEW
│   │   │   └── utils/               ✅ Unchanged
│   │   └── modules/
│   │       ├── customer/customer.controller.ts  🟡 MODIFIED
│   │       ├── lost-found/lost-found.controller.ts 🟡 MODIFIED
│   │       ├── admin/admin.controller.ts        🟡 MODIFIED
│   │       ├── report/report.controller.ts      🟡 MODIFIED
│   │       └── [18 other modules]               ✅ Unchanged
│   ├── test/                        ✅ Unchanged
│   └── package.json                 🟡 MODIFIED
├── front-end/                       ✅ Unchanged
├── Database/                        ✅ Unchanged
├── reports/
│   └── 00_INITIAL_FFSD_AUDIT.md    ✅ This file
└── .gitignore                       🟡 MODIFIED (add logs/, uploads/)
```

### Change Summary

| Status | Count |
|--------|-------|
| Files to CREATE | 8 |
| Files to MODIFY | 8 |
| Files unchanged | ~200+ |
| New directories | 5 |
| New npm packages | 7 |

---

## Appendix: Key File Paths Quick Reference

| Item | Path |
|------|------|
| Main bootstrap | back-end/src/main.ts |
| Root module | back-end/src/app.module.ts |
| Role guard | back-end/src/common/guards/roles.guard.ts |
| Roles decorator | back-end/src/common/decorators/roles.decorator.ts |
| Exception filter | back-end/src/common/exceptions/global-exception.filter.ts |
| Role enum | back-end/src/common/enums/role.enum.ts |
| Auth service | back-end/src/modules/auth/auth.service.ts |
| Customer repository | back-end/src/modules/customer/customer.repository.ts |
| Admin service | back-end/src/modules/admin/admin.service.ts |
| Booking service | back-end/src/modules/booking/booking.service.ts |
| Tracking service | back-end/src/modules/tracking/tracking.service.ts |
| Frontend API connector | front-end/api-connector.js |
| Frontend auth guard | front-end/customer/auth.js |
| Database schema | Database/DBschema.sql |
