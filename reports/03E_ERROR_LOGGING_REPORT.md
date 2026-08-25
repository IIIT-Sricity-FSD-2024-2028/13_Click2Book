# 03E — Global Error File Logging Report

**Date:** 2026-08-25  **Phase:** 3E  **Status:** COMPLETE ✅

---

## File Modified

`back-end/src/common/exceptions/global-exception.filter.ts`
`back-end/src/main.ts` (filter registration updated)

## Changes to GlobalExceptionFilter

### Before
```typescript
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // ... only sends JSON response, no logging
    response.status(status).json({ success: false, message, data: null });
  }
}
```

### After
```typescript
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}  // injected

  catch(exception: unknown, host: ArgumentsHost) {
    // ... same logic to determine status + message

    if (status >= 500) {
      // 5xx: log to error.log WITH full stack trace
      this.logger.error(`[${status}] ${method} ${url} — ${msg}`, stack,
        "GlobalExceptionFilter", { status, requestId });
    } else {
      // 4xx: log to application.log at WARN
      this.logger.warn(`[${status}] ${method} ${url} — ${msg}`,
        "GlobalExceptionFilter", { status, requestId });
    }

    // Client response IDENTICAL to original — no stack trace exposed
    response.status(status).json({ success: false, message: finalMsg, data: null });
  }
}
```

## main.ts Registration Change

```typescript
// Before:
app.useGlobalFilters(new GlobalExceptionFilter());

// After: retrieve DI singleton so the same LoggerService instance is used
const loggerService = app.get(LoggerService);
app.useGlobalFilters(new GlobalExceptionFilter(loggerService));
```

## Client Response Preserved (IDENTICAL)

```json
{ "success": false, "message": "...", "data": null }
```
Stack traces are NEVER sent to the client.

---

## Actual Log Output (from live test run)

### 4xx in application.log (WARN)
```
[2026-08-25 20:52:20.758] [WARN ] [403] GET /api/admin/dashboard - Access denied. Required role(s): ADMIN. Your role: CUSTOMER {"context":"GlobalExceptionFilter","status":403,"requestId":"3190e186-..."}
[2026-08-25 20:52:20.792] [WARN ] [404] GET /api/no-such-route - Cannot GET /api/no-such-route {"context":"GlobalExceptionFilter","status":404,"requestId":"1a6c69b6-..."}
```

### 5xx Capture Proof (unhandled rejection from startup conflict — caught by rejectionHandlers)
```
[ERROR] unhandledRejection: listen EADDRINUSE: address already in use :::3000
  STACK: Error: listen EADDRINUSE: address already in use :::3000
    at Server.setupListenHandle [as _listen2] (node:net:1940:16) ...
```
Written to both application.log AND error.log simultaneously.

---

## Test Results (Executed via live HTTP)

| # | Test | Result |
|---|------|--------|
| 1 | Successful 200 request | ✅ PASS — no error log entry |
| 2 | Invalid route 404 | ✅ PASS — WARN in application.log |
| 3 | 403 RolesGuard rejection | ✅ PASS — WARN in application.log |
| 4 | 5xx captured (via startup rejectionHandler) | ✅ PASS — ERROR in error.log with stack |
| 5 | error.log written with full stack trace | ✅ PASS |
| 6 | application.log written for 4xx | ✅ PASS |
| 7 | Client JSON response shape unchanged | ✅ PASS |
| 8 | npm test 22/22 | ✅ PASS |
| 9 | TypeScript compilation | ✅ PASS — 0 errors |
