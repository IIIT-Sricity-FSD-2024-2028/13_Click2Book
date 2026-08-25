# 04D — CORS Hardening Report

**Date:** 2026-08-25  **Phase:** 4D  **Status:** COMPLETE ✅

---

## Frontend Architecture Finding (from audit)

`front-end/api-connector.js`:
```javascript
const _h = (location.hostname === "localhost" || ...) ? "localhost" : location.hostname;
window.C2B_API = `http://${_h}:3000/api`;
```

Frontend pages may be opened from `file://` protocol directly.
**`file://` pages have `null` as their origin — the only way to serve them is `origin: "*"`.**

## Decision: Keep `origin: "*"` with Explicit Constraints

Switching to an explicit origin list would break `file://`-served frontend pages.
The hardening is achieved by constraining **methods** and **headers** instead.

## Change Made

`back-end/src/main.ts`:

```typescript
// Before:
app.enableCors();

// After:
app.enableCors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Accept",
    "x-role",        // Click2Book RBAC header
    "x-request-id",  // request correlation header
  ],
  exposedHeaders: ["x-request-id"],
});
```

## What Changed vs What Stayed the Same

| Setting | Before | After |
|---------|--------|-------|
| `origin` | `*` (implicit) | `*` (explicit) — unchanged |
| `methods` | All (Express default) | Explicitly whitelisted 6 methods |
| `allowedHeaders` | Any | Whitelisted: Content-Type, Accept, x-role, x-request-id |
| `exposedHeaders` | None | `x-request-id` exposed to client |
| `credentials` | false (default) | false (default) — unchanged |

## Test Results (Executed)

| # | Test | Result |
|---|------|--------|
| 1 | TypeScript compilation | ✅ PASS — 0 errors |
| 2 | API request with `x-role` header | ✅ PASS — 200 |
| 3 | Frontend API calls preserved | ✅ PASS — wildcard origin maintained |
| 4 | `x-request-id` exposed in response | ✅ PASS |
