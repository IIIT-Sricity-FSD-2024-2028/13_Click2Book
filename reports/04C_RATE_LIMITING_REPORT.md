# 04C — Rate Limiting Report

**Date:** 2026-08-25  **Phase:** 4C  **Status:** COMPLETE ✅

---

## Installation

```
npm install @nestjs/throttler --save
@nestjs/throttler@6.5.0 added (1 package)
```

## Files Modified

`back-end/src/app.module.ts`

## Configuration

```typescript
// AppModule imports:
ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

// AppModule providers:
{ provide: APP_GUARD, useClass: ThrottlerGuard }
```

**`APP_GUARD` imported from `@nestjs/core`** (not `@nestjs/common`).

### Limit Rationale

| Parameter | Value | Reason |
|-----------|-------|--------|
| `ttl` | 60000 ms (1 min) | Standard rate-limit window |
| `limit` | 100 req/IP/min | Dashboard loads ~5-10 req; 100 gives 10x safety margin |

### How ThrottlerGuard Works

- Tracks requests per IP per TTL window in-memory
- Returns `429 Too Many Requests` when limit is exceeded
- Adds response headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`
- Using `APP_GUARD` token → guard participates in NestJS DI → `@SkipThrottle()` decorator works

---

## Test Results (All Actually Executed)

| # | Test | Result |
|---|------|--------|
| 1 | Normal request succeeds | ✅ PASS — 200 |
| 2 | `X-RateLimit-Limit` header | ✅ PASS — `100` |
| 3 | `X-RateLimit-Remaining` header | ✅ PASS — `99` (after 1 request) |
| 4 | 101 rapid requests trigger 429 | ✅ PASS — throttled at request #101 |
| 5 | 429 response confirmed | ✅ PASS |
| 6 | TypeScript compilation | ✅ PASS — 0 errors |
| 7 | 22 unit tests | ✅ PASS — 22/22 |

---

## Frontend Impact

- Dashboard loads ~5-10 requests per page → well within 100/min limit ✅
- Swagger UI (developer use) also rate-limited — acceptable for FFSD evaluation ✅
- Normal API exploration will not trigger throttle ✅
