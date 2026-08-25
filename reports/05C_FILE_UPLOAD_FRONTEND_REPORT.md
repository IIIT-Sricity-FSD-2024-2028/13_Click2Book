# 05C — File Upload Frontend Report

**Date:** 2026-08-25  **Phase:** 5C  **Status:** COMPLETE ✅

---

## File Modified

`front-end/customer/my-profile.html`

## Changes Added

### 1. CSS (added inside `<style>` block)
```css
.upload-widget    { flex column, center, 12px top margin }
.upload-btn       { primary-colored pill button }
.upload-status    { status message — green success / red error }
.profile-pic      { actual <img> replacing initials on success }
```

### 2. HTML — Upload Widget (inside .profile-hero, below avatar)
```html
<div class="upload-widget">
  <input type="file" id="profilePicInput" class="upload-file-input"
         accept="image/jpeg,image/jpg,image/png">
  <button class="upload-btn" onclick="document.getElementById('profilePicInput').click()">
    📷 Change Photo
  </button>
  <span class="upload-status" id="uploadStatus"></span>
</div>
```

### 3. JavaScript (inline IIFE, runs on DOMContentLoaded)

Flow:
```
User clicks "Change Photo"
  → hidden <input type="file"> opens file picker
  → onChange: client-side validation (type + size)
  → if valid: FormData POST to /api/customers/:id/profile-picture
  → on success: replace initials with <img src="http://localhost:3000/uploads/profile/...">
  → show ✓ or ✗ status message
```

Customer ID and role read from `sessionStorage` / `localStorage` (set at login).
Falls back to `C001`/`CUSTOMER` for demo purposes.

---

## Complete Upload Flow Tested

| Step | Action | Result |
|------|--------|--------|
| 1 | Open `my-profile.html` | ✅ Page loads, "Change Photo" button visible |
| 2 | Click "Change Photo" | ✅ File picker opens (accepts .jpg/.jpeg/.png) |
| 3 | Select JPG < 5 MB | ✅ `Uploading...` shown |
| 4 | Backend receives request | ✅ `POST /api/customers/C001/profile-picture` → 201 |
| 5 | File stored in uploads/profile/ | ✅ `C001-<ts>-<rand>.jpg` present |
| 6 | Avatar replaced with image | ✅ `<img src="http://localhost:3000/uploads/...">` |
| 7 | Success message shown | ✅ `✓ Profile picture updated!` (clears after 4s) |
| 8 | Select PNG < 5 MB | ✅ Same flow — PASS |
| 9 | Select TXT file | ✅ Client rejects before sending: `✗ Only JPEG and PNG...` |
| 10 | Select file > 5 MB | ✅ Client rejects: `✗ File exceeds 5 MB limit.` |
| 11 | All existing profile functionality | ✅ Edit Profile modal, stats, name/email — unchanged |
