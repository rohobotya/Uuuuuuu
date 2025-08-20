# Zowi Auth (Firebase Realtime DB + Storage)

## Files
- `index.html` – User order & login form
- `admin.html` – Admin login + approvals
- `firebase.js` – Firebase config/init (uses your project zowi-9f8e8)
- `auth.js` – User register (uploads proof) + login check
- `admin.js` – Admin panel logic (list users, set approved & payment status)
- `style.css` – Basic styling

## How it works
- Registration creates an Auth user using phone-based fake email (`{phone}@zowi.com`) and password (`{phone}123`).
- Saves user data to Realtime DB under `users/{uid}` and uploads proof to Storage `paymentProofs/`.
- Admin logs in with phone (allowlist in `firebase.js`) and manages users.

## Deploy
Upload all files to the same folder in GitHub Pages or any static host.

## Important
- Make sure Firebase rules allow reads/writes during testing. Then tighten rules later.
- Update `ADMIN_PHONES` in `firebase.js` to include all admin phone numbers.
