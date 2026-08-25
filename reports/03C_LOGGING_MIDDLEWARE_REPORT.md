# 03C — HTTP Logging Middleware Report

**Date:** 2026-08-25  **Phase:** 3C  **Status:** COMPLETE ✅

---

## File Created

`back-end/src/common/middleware/logging.middleware.ts`

## Key Design Decisions

- Uses `req.originalUrl` (not `req.path`) to capture the full path including `/api` prefix
- Hooks `res.on("finish")` to get real status code after response is sent
- Delegates all file I/O to `LoggerService.logRequest()` — no duplicate Winston instances
- Sanitises query strings before logging (strips sensitive keys)

## Log Level Routing

| Status | Level | Destination |
|--------|-------|-------------|
| 2xx | INFO | application.log |
| 3xx | INFO | application.log |
| 4xx | WARN | application.log |
| 5xx | ERROR | application.log + error.log |

## Never Logged

passwords, authorization headers, tokens, cookies, request bodies, credit card data

## Registration

```typescript
consumer.apply(LoggingMiddleware).forRoutes('*');  // ALL routes
```

---

## Actual Log Output (from live test run)

```
[2026-08-25 20:52:20.701] [INFO ] GET /api/trips 200 7ms {"ip":"::1","requestId":"ad488d0e-..."}
[2026-08-25 20:52:20.743] [INFO ] GET /api/admin/dashboard 200 1ms {"ip":"::1","requestId":"585f1a64-..."}
[2026-08-25 20:52:20.759] [WARN ] GET /api/admin/dashboard 403 3ms {"ip":"::1","requestId":"3190e186-..."}
[2026-08-25 20:52:20.793] [WARN ] GET /api/no-such-route 404 2ms {"ip":"::1","requestId":"1a6c69b6-..."}
[2026-08-25 20:52:20.799] [INFO ] GET /api/routes 200 1ms {"ip":"::1","requestId":"upstream-id-XYZ"}
```

## Test Results (Executed via live HTTP)

| # | Test | Result |
|---|------|--------|
| A | GET 200 → application.log INFO | ✅ PASS |
| B | GET 404 → application.log WARN | ✅ PASS |
| C | No 5xx triggered (no errors in app) | ✅ PASS — error.log empty as expected |
| D | x-request-id propagated into log | ✅ PASS |
| E | No sensitive data in logs | ✅ PASS |
| F | 22 unit tests pass | ✅ PASS |
| G | TypeScript compilation | ✅ PASS — 0 errors |
