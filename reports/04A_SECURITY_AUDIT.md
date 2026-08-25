# 04A — Click2Book: Phase 4A Security Read-Only Audit

**Date:** 2026-08-25  **Type:** Read-Only — NO files modified  **Status:** COMPLETE ✅

---

## 1. CORS Configuration

**File:** `back-end/src/main.ts` line 15  
**Current implementation:**
```typescript
app.enableCors();  // no options — uses Express defaults
```

**Express defaults when no options given:**
- `Access-Control-Allow-Origin: *`  (any origin)
- `Access-Control-Allow-Methods: GET, HEAD, PUT, PATCH, POST, DELETE`
- Credentials NOT allowed (fine since we use header-based RBAC, not cookies)

**Status:** 🟡 PARTIAL  
**Risk of current config:** Allows any origin to call the API.
For an academic project this is acceptable, but does not pass a production security review.

**Frontend origins that must be allowed:**
- `http://localhost` (file:// served pages also use localhost:3000 via `api-connector.js`)
- `http://127.0.0.1`
- `file://` origins (frontend HTML files opened directly) — NOTE: `file://` cannot be
  expressed as an allowed origin; the wildcard `*` is the only way to serve file:// pages

**FFSD evaluation necessity:** LOW — wildcard CORS is acceptable for localhost dev.
**Recommended change:** Tighten to explicit origins `http://localhost:3000`,
`http://127.0.0.1:3000` but keep `*` if frontend uses `file://` protocol.
**Frontend break risk:** Changing from `*` to explicit origins WILL break the frontend
if pages are opened as `file://` URLs. Keep wildcard or add `null` origin for file://.

---

## 2. ValidationPipe

**File:** `back-end/src/main.ts` lines 18–23  
**Current implementation:**
```typescript
new ValidationPipe({
  whitelist: true,           // strips unknown properties from body
  forbidNonWhitelisted: true, // throws 400 if unknown properties present
  transform: true,           // auto-transforms types
})
```

**Status:** ✅ PASS  
**Assessment:** Excellent. `whitelist + forbidNonWhitelisted` prevents mass-assignment attacks.
`transform` ensures type safety at the boundary.  
**Recommended change:** None — this is the correct production configuration.

---

## 3. RolesGuard

**File:** `back-end/src/common/guards/roles.guard.ts`  
**Current implementation:** Header-based RBAC using `x-role` header.
Applied via `@UseGuards(RolesGuard)` on ALL 22 business controllers.

**Status:** ✅ PASS (for academic RBAC demonstration)  
**Assessment:** The guard correctly:
- Reads `x-role` from request headers
- Compares against `@Roles()` decorator values
- Throws `ForbiddenException` on mismatch (→ logged to application.log via Phase 3E)
- Tested and verified: CUSTOMER cannot access /api/admin (403 confirmed)

**Important:** This is a simplified academic RBAC (no JWT). Do NOT replace with JWT
for FFSD evaluation — that is a different architectural decision.  
**Recommended change:** None.

---

## 4. Authentication

**File:** `back-end/src/modules/auth/`  
**Current implementation:** Login endpoint creates a session/role, returned to client.
Frontend stores role in `sessionStorage` / `localStorage`.
Every request passes `x-role` header (see `api-connector.js`).

**Status:** ✅ PASS (for academic scope)  
**Risk:** In production, `x-role` can be trivially spoofed by any client.
For FFSD evaluation this is the intended design — do NOT add JWT.  
**Recommended change:** None for FFSD.

---

## 5. HTTP Security Headers (Helmet)

**Current headers on `GET /api/routes`:**
```
X-Content-Type-Options         : [NOT PRESENT]
X-Frame-Options                : [NOT PRESENT]
X-XSS-Protection               : [NOT PRESENT]
Strict-Transport-Security      : [NOT PRESENT]
Content-Security-Policy        : [NOT PRESENT]
X-Permitted-Cross-Domain-Policies : [NOT PRESENT]
Cross-Origin-Embedder-Policy   : [NOT PRESENT]
Cross-Origin-Opener-Policy     : [NOT PRESENT]
Cross-Origin-Resource-Policy   : [NOT PRESENT]
Permissions-Policy             : [NOT PRESENT]
Referrer-Policy                : [NOT PRESENT]
```

**Status:** ❌ MISSING — no security headers whatsoever  
**FFSD necessity:** HIGH — "Security middleware" requirement explicitly maps to Helmet.
**Recommended change:** `npm install helmet` + `app.use(helmet())` in `main.ts`.
**Swagger impact:** Helmet's default CSP will break Swagger UI inline scripts.
Must use `helmet({ contentSecurityPolicy: false })` or configure CSP to allow Swagger.
**Frontend break risk:** LOW — Helmet headers are response headers; they don't affect CORS.

---

## 6. Rate Limiting

**Current implementation:** None.  
**Status:** ❌ MISSING  
**FFSD necessity:** HIGH — "Security middleware" requirement maps to throttling.
**Recommended change:** `npm install @nestjs/throttler` + `ThrottlerModule.forRoot()` in AppModule.
**Recommended limits for academic project:**
- `ttl: 60000` (1-minute window)
- `limit: 100` (100 req/min globally — won't break normal frontend usage)
- Apply `ThrottlerGuard` globally; Swagger / static assets excluded automatically.
**Frontend break risk:** LOW if limits are ≥100 req/min. Higher risk if limits < 30.

---

## 7. Request Body Limits

**Current implementation:** Express default (no explicit limit set in main.ts).  
Express default JSON body limit: **100kb**.  
**Status:** 🟡 PARTIAL — default exists but is not explicitly configured.  
**Recommended change:** For Phase 5 (file upload), set explicit limit on JSON routes
and separate limit on multipart/form-data via multer. No change needed in Phase 4.

---

## 8. Swagger Configuration

**File:** `back-end/src/main.ts` lines 33–80  
**Current implementation:**
- Served at `/docs` and also at `/api` (overrides the API prefix)
- Uses `addApiKey` for `x-role` header
- No authentication required to VIEW Swagger

**Status:** 🟡 PARTIAL  
**Issue 1:** Swagger served at `/api` will conflict with API routes — `SwaggerModule.setup('api', ...)` overrides the global prefix for that path.
**Issue 2:** Swagger is publicly accessible without restriction (acceptable for FFSD).
**Helmet impact:** Default CSP blocks Swagger's inline scripts — must configure helmet to allow.
**Recommended change:** Remove `SwaggerModule.setup('api', ...)` (line 80) — redundant and
potentially confusing. Only keep `/docs`. (Optional, low risk.)

---

## 9. File Upload Security Preparation

**Current implementation:** None — no multer, no upload endpoints.  
**Status:** ❌ MISSING — Phase 5 scope  
**Relevant for Phase 5:**
- `back-end/uploads/` already gitignored (from Phase 2 .gitignore update)
- Must add: file type whitelisting, size limits, filename sanitisation

---

## 10. Logging Security (Sensitive Data Protection)

**File:** `back-end/src/common/logger/logger.service.ts`  
**Current implementation:** `scrub()` function redacts:
`password, passwd, secret, token, authorization, x-auth-token, x-role, cookie, set-cookie, credit_card, cvv, ssn`

**Status:** ✅ PASS  
**Verified in Phase 2/3 smoke tests:** `password` and `authorization` → `[REDACTED]`

---

## 11. Existing Security Dependencies

From `package.json` dependencies:
```
helmet             ❌ NOT installed
@nestjs/throttler  ❌ NOT installed
bcrypt / argon2    ❌ NOT installed (passwords stored/compared in plain — academic scope)
express-rate-limit ❌ NOT installed
class-validator    ✅ v0.15.1
class-transformer  ✅ v0.5.1
```

---

## Summary Table

| Security Area | Status | FFSD Required | Phase |
|--------------|--------|--------------|-------|
| CORS | 🟡 Wildcard | LOW | 4D |
| ValidationPipe | ✅ PASS | — | Already done |
| RolesGuard (all controllers) | ✅ PASS | — | Already done |
| Authentication (header-RBAC) | ✅ PASS (academic) | — | Already done |
| HTTP Security Headers (Helmet) | ❌ MISSING | HIGH | 4B |
| Rate Limiting (Throttler) | ❌ MISSING | HIGH | 4C |
| Request Body Limits | 🟡 Express default | LOW | Phase 5 |
| Swagger (CSP/Helmet conflict) | ⚠️ Will break | Caution | 4B |
| File Upload Security | ❌ MISSING | — | Phase 5 |
| Logging Sensitive Data | ✅ PASS | — | Phase 2/3 done |
| Security Dependencies | ❌ None installed | HIGH | 4B/4C |

---

## Frontend Impact Analysis

The frontend `api-connector.js` uses:
```javascript
const _h = (location.hostname === 'localhost' || ...) ? 'localhost' : location.hostname;
window.C2B_API = `http://${_h}:3000/api`;
```

Frontend pages may be served from `file://` or `http://localhost`.
**CORS change risk:** Switching from `*` to explicit origins WILL break `file://` served pages.
**Helmet risk:** Zero — Helmet sets response headers, does not affect CORS.
**Throttler risk:** Low if limit ≥ 100 req/min. Dashboard pages make ~5-10 requests on load.

---

## Recommended Phase 4 Implementation Order

```
4B: helmet (app.use(helmet({ contentSecurityPolicy: false })))
       ↓
4C: @nestjs/throttler (ThrottlerModule, 100 req/60s globally)
       ↓
4D: CORS (keep wildcard * to preserve file:// frontend access)
       ↓
4E: Full integration test
```
