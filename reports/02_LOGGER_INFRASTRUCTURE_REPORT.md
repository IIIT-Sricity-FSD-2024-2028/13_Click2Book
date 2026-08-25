# 02 — Click2Book: Logger Infrastructure Report (Phase 2)

**Implementation Date:** 2026-08-25
**Phase:** 2 — Logging Infrastructure
**Status:** COMPLETE ✅
**Git Branch:** main

---

## 1. Files Created / Modified

### Files Created

| File | Size | Description |
|------|------|-------------|
| `back-end/src/common/logger/logger.service.ts` | ~180 lines | Injectable Winston-backed LoggerService |
| `back-end/src/common/logger/logger.module.ts` | ~22 lines | Global NestJS module exporting LoggerService |

### Files Modified

| File | Change |
|------|--------|
| `.gitignore` | Added `back-end/logs/`, `back-end/uploads/`, `back-end/smoke-test-*.ts`, `.gitignore` audit files |

### Temporary Files (gitignored)

| File | Purpose |
|------|---------|
| `back-end/smoke-test-logger.ts` | Phase 2 verification — deleted after testing |

### Runtime Artifacts (gitignored, created by winston)

| File | Size | Created |
|------|------|---------|
| `back-end/logs/application-2026-08-25.log` | 1824 bytes | 2026-08-25 19:50:41 |
| `back-end/logs/error-2026-08-25.log` | 1035 bytes | 2026-08-25 19:50:41 |
| `back-end/logs/admin-2026-08-25.log` | 160 bytes | 2026-08-25 19:50:41 |

---

## 2. Dependencies Installed

| Package | Version | Type | Purpose |
|---------|---------|------|---------|
| `winston` | 3.19.0 | production | Core logging framework |
| `winston-daily-rotate-file` | 5.0.0 | production | Daily log rotation + size-based rotation |

> **Note:** `@types/winston-daily-rotate-file` does **not** exist on npm — 
> the package ships its own bundled TypeScript declarations (`.d.ts` files).
> No additional type package is needed.

---

## 3. Logger Architecture

### Design Overview

```
LoggerService (Injectable)
        │
        ├── applicationLogger  → back-end/logs/application-YYYY-MM-DD.log
        │     Level: INFO and above (info, warn, error)
        │     Also receives: debug (development only via Console transport)
        │
        ├── errorLogger        → back-end/logs/error-YYYY-MM-DD.log
        │     Level: ERROR only
        │     Receives from: logger.error() + logger.logRequest() for 5xx
        │
        └── adminLogger        → back-end/logs/admin-YYYY-MM-DD.log
              Level: INFO and above
              Receives from: logger.adminLog() only
```

### Public API

```typescript
// Standard NestJS LoggerService interface (drop-in compatible)
logger.log(message, context?, meta?)         → application.log  [INFO]
logger.warn(message, context?, meta?)        → application.log  [WARN]
logger.error(message, trace?, context?, meta?) → error.log + application.log  [ERROR]
logger.debug(message, context?, meta?)       → application.log  [DEBUG] (dev only)
logger.verbose(message, context?)            → application.log  [VERBOSE]

// Click2Book-specific helpers
logger.adminLog(action, adminId, details?)   → admin.log + application.log  [INFO]
logger.logRequest(method, url, status, ms, meta?) → application.log (level varies by status)
```

### Log Level Routing

| Method | application.log | error.log | admin.log |
|--------|----------------|-----------|-----------|
| `log()` | ✅ INFO | ❌ | ❌ |
| `warn()` | ✅ WARN | ❌ | ❌ |
| `error()` | ✅ ERROR | ✅ ERROR | ❌ |
| `debug()` | ✅ DEBUG (dev) | ❌ | ❌ |
| `adminLog()` | ✅ INFO (mirror) | ❌ | ✅ INFO |
| `logRequest()` 2xx | ✅ INFO | ❌ | ❌ |
| `logRequest()` 4xx | ✅ WARN | ❌ | ❌ |
| `logRequest()` 5xx | ✅ ERROR | ✅ ERROR | ❌ |

### Log Format

```
[YYYY-MM-DD HH:mm:ss.SSS] [LEVEL] message {optional JSON meta}
  STACK: <stack trace if error>
```

**Example lines from actual log files:**

```
[2026-08-25 19:50:41.605] [INFO ] Smoke test: info message from LoggerService {"context":"SmokeTest","testId":"T01"}
[2026-08-25 19:50:41.607] [WARN ] Smoke test: warning - disk usage above 80% {"context":"SmokeTest","usage":"82%"}
[2026-08-25 19:50:41.620] [ERROR] Smoke test: simulated error {"context":"SmokeTest","code":500}
  STACK: Error: test error
    at Object.<anonymous> (back-end/smoke-test-logger.ts:33:45)
    ...
[2026-08-25 19:50:41.621] [INFO ] ADMIN_ACTION: GENERATE_REPORT [adminId=ADMIN001] {"action":"GENERATE_REPORT","adminId":"ADMIN001","reportDate":"2026-08-25","totalBookings":47}
[2026-08-25 19:50:41.622] [INFO ] GET /api/trips 200 42ms {"source":"Hyderabad","destination":"Chennai"}
[2026-08-25 19:50:41.622] [INFO ] Smoke test: sensitive field scrub check {"context":"SmokeTest","user":"ADMIN001","password":"[REDACTED]","authorization":"[REDACTED]","safeField":"this is fine"}
[2026-08-25 19:50:41.622] [WARN ] GET /api/customers/NOTFOUND 404 5ms
[2026-08-25 19:50:41.622] [ERROR] POST /api/bookings 500 123ms
```

---

## 4. Log Files Summary

| File | Level Filter | Contents | Rotation | Retention |
|------|-------------|---------|---------|----------|
| `application-YYYY-MM-DD.log` | INFO+ | All API requests, warnings, errors, admin mirroring | Daily + 10MB | 14 days |
| `error-YYYY-MM-DD.log` | ERROR only | 5xx errors, exceptions, unhandled rejections with stack traces | Daily + 10MB | 14 days |
| `admin-YYYY-MM-DD.log` | INFO+ | Admin actions: login, report generation, user management | Daily + 10MB | 14 days |

---

## 5. Rotation Configuration

```typescript
new winston.transports.DailyRotateFile({
  dirname:       'back-end/logs/',
  filename:      '<name>-%DATE%',
  extension:     '.log',
  datePattern:   'YYYY-MM-DD',      // rotates at midnight
  zippedArchive: true,              // gzip rotated files
  maxSize:       '10m',             // also rotate when file hits 10 MB
  maxFiles:      '14d',             // delete files older than 14 days
  auditFile:     '.logs/.<name>-audit.json',   // tracks rotated files
})
```

**Rotation triggers:**
1. **Daily** — new file created at midnight (`YYYY-MM-DD` suffix changes)
2. **Size-based** — new file created if current file exceeds 10 MB within a day

**Archival:** Rotated (old) files are gzip-compressed automatically.  
**Cleanup:** Files older than 14 days are automatically deleted by the transport.

---

## 6. Security Considerations

### Sensitive Field Scrubbing

The `scrub()` function runs recursively on ALL metadata objects before they are serialised into log lines. The following keys are permanently blocked:

```
password  |  passwd  |  secret  |  token  |  authorization
x-auth-token  |  x-role  |  cookie  |  set-cookie
credit_card  |  cvv  |  ssn
```

Keys are matched **case-insensitively**. Matching values are replaced with `[REDACTED]`.

**Verified in smoke test:**
```
INPUT:  { password: "ShouldBeRedacted", authorization: "Bearer ShouldBeRedacted", safeField: "this is fine" }
OUTPUT: { password: "[REDACTED]", authorization: "[REDACTED]", safeField: "this is fine" }
```

### Other Security Notes

- Log files are **gitignored** — never committed to version control
- `exceptionHandlers` and `rejectionHandlers` are wired to `error.log` so unhandled crashes are captured
- No PII beyond what is explicitly passed (implementor responsibility when calling `logger.log()`)
- In Phase 3 (LoggingMiddleware), request URL query strings must also be sanitised before logging

---

## 7. Actual Test Results

All tests executed via: `npx ts-node smoke-test-logger.ts`

| # | Test | Result |
|---|------|--------|
| 1 | `logger.log()` writes to application.log at INFO | ✅ PASS |
| 2 | `logger.warn()` writes to application.log at WARN | ✅ PASS |
| 3 | `logger.error()` writes to error.log AND application.log with stack trace | ✅ PASS |
| 4 | `logger.debug()` writes to application.log (console visible) | ✅ PASS |
| 5 | `logger.adminLog()` writes to admin.log AND mirrors to application.log | ✅ PASS |
| 6 | `logger.logRequest()` 200 writes INFO to application.log | ✅ PASS |
| 7 | Sensitive fields (password, authorization) appear as [REDACTED] | ✅ PASS |
| 8 | `logger.logRequest()` 404 writes WARN to application.log | ✅ PASS |
| 9 | `logger.logRequest()` 500 writes ERROR to application.log + error.log | ✅ PASS |
| 10 | logs/ directory created automatically by winston | ✅ PASS |
| 11 | application.log exists and has content (1824 bytes) | ✅ PASS |
| 12 | error.log exists and has content (1035 bytes) | ✅ PASS |
| 13 | admin.log exists and has content (160 bytes) | ✅ PASS |
| 14 | Plaintext passwords NOT present in any log file | ✅ PASS |
| 15 | [REDACTED] marker confirmed in application.log | ✅ PASS |

### Existing Unit Tests — Regression Check

```
PASS src/modules/emergency/emergency.service.spec.ts
PASS src/modules/lost-found/lost-found.service.spec.ts
PASS src/modules/tracking/tracking.service.spec.ts
PASS src/app.controller.spec.ts

Test Suites: 4 passed, 4 total
Tests:       22 passed, 22 total
```

**All 22 pre-existing unit tests continue to pass. Zero regressions.**

### TypeScript Compilation

```bash
npx tsc --noEmit
# Exit code: 0  (no errors, no warnings)
```

---

## 8. What Was NOT Changed

The following were explicitly left untouched per Phase 2 scope:

| Area | Status |
|------|--------|
| `main.ts` | ✅ Unchanged |
| `app.module.ts` | ✅ Unchanged (LoggerModule NOT wired yet) |
| `GlobalExceptionFilter` | ✅ Unchanged |
| All 22 business modules | ✅ Unchanged |
| Frontend (all portals) | ✅ Unchanged |
| Auth / login logic | ✅ Unchanged |
| Database schema | ✅ Unchanged |
| `RolesGuard` | ✅ Unchanged |

> **Important:** LoggerModule is created but NOT yet imported into AppModule.
> It will be wired in Phase 3 (Logging Middleware) when the MiddlewareConsumer
> is also configured. This ensures the module is only imported once.

---

## 9. Remaining Work (Next Phases)

| Phase | Task | Depends On |
|-------|------|-----------|
| **Phase 3** | LoggingMiddleware (NestMiddleware) — logs every HTTP request to application.log | Phase 2 ✅ |
| **Phase 3** | RequestIdMiddleware — attaches UUID x-request-id | Phase 2 ✅ |
| **Phase 3** | AdminLoggerMiddleware — extra detail for /api/admin/* routes | Phase 2 ✅ |
| **Phase 3** | Wire LoggerModule into AppModule + configure(consumer) | Phase 2 ✅ |
| **Phase 3** | Enhance GlobalExceptionFilter to write to error.log | Phase 2 ✅ |
| **Phase 4** | Security middleware: helmet + @nestjs/throttler + CORS tightening | Phase 3 |
| **Phase 5** | File upload middleware: multer + upload endpoints on customer + lost-found | Phase 4 |

---

## 10. Logger Quick-Start for Future Phases

```typescript
// In any service or controller:
import { LoggerService } from '../../common/logger/logger.service';

@Injectable()
export class SomeService {
  constructor(private readonly logger: LoggerService) {}

  doSomething() {
    this.logger.log('Did something', 'SomeService', { id: 'X001' });
  }

  handleAdminAction(adminId: string) {
    this.logger.adminLog('SOME_ACTION', adminId, { detail: 'value' });
  }

  handleError(err: Error) {
    this.logger.error('Operation failed', err.stack, 'SomeService');
  }
}
```
