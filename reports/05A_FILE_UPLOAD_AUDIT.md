# 05A — File Upload Read-Only Audit

**Date:** 2026-08-25  **Type:** Read-Only — NO files modified  **Status:** COMPLETE ✅

---

## 1. What Already Exists

### CustomerModule
| Component | File | Key Finding |
|-----------|------|-------------|
| Controller | `customer.controller.ts` | CRUD endpoints (POST/GET/PUT/DELETE). No upload endpoint yet. |
| Service | `customer.service.ts` | 5 methods — create/findAll/findById/update/remove. No upload method. |
| Repository | `customer.repository.ts` | In-memory array. `Customer` interface has NO `profilePicture` field yet. |
| Interface | `interfaces/customer.interface.ts` | 7 fields — no `profilePicture`. Must add. |
| DTOs | `dto/customer.dto.ts` | `CreateCustomerDto` / `UpdateCustomerDto` — no upload field (correct — upload is separate endpoint). |

### Existing Frontend — `front-end/customer/my-profile.html`
- **Avatar area:** `.profile-big-avatar` div — currently shows text initials (e.g. "RS")
- **Avatar edit dot:** `.avatar-edit-dot` click → opens the **Edit Profile modal** (text fields only)
- No `<input type="file">` anywhere in the file
- Profile data loaded from `sessionStorage` + `DB.customers.getById()` (local mock)
- **No existing upload UI.** Must ADD a file input + upload button inside the existing avatar area.

### Multer
- **`multer` is already installed** — bundled inside `@nestjs/platform-express` (confirmed in node_modules)
- `@nestjs/platform-express` ships `FileInterceptor`, `FilesInterceptor`, `MulterModule`
- **Zero new dependencies required** for basic file upload

### Uploads Directory
- `back-end/uploads/` does **NOT exist** yet
- Must be created programmatically on server startup (`mkdirSync` with `recursive: true`)

### Static File Serving
- No `ServeStaticModule` configured in `AppModule`
- Must add `ServeStaticModule` (from `@nestjs/serve-static`) OR use `express.static()`
- `@nestjs/serve-static` is NOT installed — need to install it OR use `app.use('/uploads', express.static(...))`
- **Recommendation:** Use `app.use('/uploads', express.static(...))` in `main.ts` — zero extra install

---

## 2. Files to Create

| File | Purpose |
|------|---------|
| `back-end/src/common/middleware/upload.middleware.ts` | Multer config: diskStorage, fileFilter, 5 MB limit |

## 3. Files to Modify

| File | Change |
|------|--------|
| `back-end/src/modules/customer/interfaces/customer.interface.ts` | Add optional `profilePicture?: string` field |
| `back-end/src/modules/customer/customer.controller.ts` | Add `POST :id/profile-picture` endpoint with `FileInterceptor` |
| `back-end/src/modules/customer/customer.service.ts` | Add `uploadProfilePicture(id, filename)` method |
| `back-end/src/main.ts` | Add `mkdirSync` for uploads dir + `app.use('/uploads', express.static(...))` |
| `front-end/customer/my-profile.html` | Add file input + upload button to avatar area |

## 4. Database Change

**YES — minimal.** Add `profilePicture?: string` to:
- `customer.interface.ts` (TypeScript interface)
- `customer.repository.ts` seed data (optional — existing customers have no photo, that is fine)

No schema migration needed — in-memory store.

## 5. New Dependencies Required

| Package | Needed? | Reason |
|---------|---------|--------|
| `multer` | ❌ Already present | Inside `@nestjs/platform-express` |
| `@types/multer` | ✅ YES | TypeScript types for `Express.Multer.File` |
| `@nestjs/serve-static` | ❌ Not needed | Use `express.static()` directly in main.ts |

**Only `@types/multer` needs to be installed** (devDependency).

## 6. Storage Location

```
back-end/uploads/profile/<customerId>-<timestamp>-<random>.<ext>
```

Example: `C001-1724599200000-a83f92.jpg`

## 7. How Uploaded Image is Accessed

After upload:
- File stored at: `back-end/uploads/profile/C001-xxx.jpg`
- Accessible via: `http://localhost:3000/uploads/profile/C001-xxx.jpg`
- `profilePicture` field on customer stores the relative path: `/uploads/profile/C001-xxx.jpg`
- Frontend `<img src="...">` displays it directly

## 8. Security Risks

| Risk | Mitigation |
|------|-----------|
| Malicious file type disguised as image | fileFilter checks `mimetype` (not extension) |
| Oversized file (DoS) | Multer `limits.fileSize: 5 * 1024 * 1024` |
| Path traversal via filename | Server generates filename — original filename never used as path |
| Directory listing of uploads | `express.static()` does not list directories by default |
| File execution | Uploaded to `uploads/` not `src/` — Node.js never executes it |
| Logging file contents | Logger never logs `req.file.buffer` or `file.path` contents |

## 9. FFSD Evaluation Demonstration

1. Navigate to `http://localhost:3000/docs` → show `POST /customers/:id/profile-picture`
2. Open `front-end/customer/my-profile.html` → choose a JPG → click Upload
3. Show `back-end/uploads/profile/` contains the file with safe generated filename
4. Show `GET /api/customers/C001` now returns `profilePicture: "/uploads/profile/C001-xxx.jpg"`
5. Show avatar in profile page updates to show the actual image

---

## Summary — What Needs to Happen in 5B

```
1. npm install @types/multer --save-dev
2. Add profilePicture?: string to customer.interface.ts
3. Create upload middleware (diskStorage, fileFilter, 5MB limit)
4. Add uploadProfilePicture() to CustomerService
5. Add POST :id/profile-picture to CustomerController
6. Add mkdirSync + express.static('/uploads') to main.ts
7. Test all cases
8. Connect frontend (Phase 5C)
```
