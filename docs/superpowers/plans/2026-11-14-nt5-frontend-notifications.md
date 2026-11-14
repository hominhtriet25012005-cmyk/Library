# NT-5 — Frontend notifications implementation plan

> **Execution:** Inline implementation is authorized by the user's request to deploy NT-5. Follow `docs/email.md` as the accepted stage specification.

**Goal:** Replace the USER and ADMIN notification mock data with Backend-owned notification APIs and persist email preferences through Backend.

**Architecture:** Add one API module and a shared hook for paginated notifications, server unread count, mark-one/read-all actions, refresh polling, and error/loading state. Keep the existing popovers, but render generic notification DTOs. In settings, map the six Backend email preference fields while leaving appearance/privacy in localStorage.

**Tech Stack:** React 19, Vite, Material UI, existing fetch API client and Spring notification endpoints.

**Spec:** `docs/email.md`, NT-5; Backend contracts in `Library/src/main/java/com/library/controller/NotificationController.java`.

## Global Constraints

- In-app notifications remain available regardless of email preferences.
- The Backend is the source of truth for unread state and all six email preferences.
- Do not expose a newsletter preference; newsletter is outside V1.
- Preserve local-only appearance, privacy, and search-history behavior.
- Use Vietnamese UI copy and existing API authentication; no schema or Backend changes.
- No tests will be added or run in this implementation turn; verify with the production frontend build.

## Review Focus

- A role with no notifications, a full unread count larger than the visible page, and a failed refresh still gets a usable bell and accurate count.
- Mark-one/read-all errors must not falsely clear the server unread badge.
- Notifications without an action URL must not navigate to an external or invalid location.
- Preference load/save failures must not fall back to pretending localStorage is authoritative.
- Switching accounts must not briefly show the prior account's notifications or preferences.

## Files

- Create `frontend/library-frontend/src/api/notifications.js` for endpoint contracts and DTO checks.
- Create `frontend/library-frontend/src/notifications/useNotifications.js` for shared bell state and polling.
- Modify `frontend/library-frontend/src/api/client.js` to support HTTP PATCH.
- Modify `Navbar.jsx` and `AdminTopbar.jsx` to render server notifications.
- Modify `useUserSettings.js` and `UserSettingsPage.jsx` to load/save Backend email preferences and remove the newsletter toggle.
- Modify `docs/email.md` to record NT-5 implementation and verification status.

## Tasks

### Task 1: Notification API and shared hook

- Add authenticated list/count/read/read-all/preferences methods for `/api/notifications`.
- Validate page sizes and response shapes; use `readAt === null` for unread state.
- Poll every 30 seconds, refresh on focus/visibility, abort stale requests, and preserve server count independently of the visible 20-item page.
- Mark actions update local state only after the API succeeds.

### Task 2: USER and ADMIN bells

- Replace localStorage and fine/return-request-derived mock entries with shared API data.
- Keep role-specific labels/styles; show loading, retryable errors, empty state, unread styling, and mark-read/read-all.
- Navigate only to safe same-origin application paths supplied by Backend; if absent/invalid, open the relevant role's default page.

### Task 3: Email preferences

- Map the six Backend booleans to settings UI; hide the ADMIN-only return-request option from USER accounts.
- Save all six fields with `PUT /api/notifications/preferences`; handle failed loads/saves visibly.
- Remove newsletter, explain mandatory transactional mail, and make reset-to-defaults update Backend plus local-only settings.

### Task 4: Documentation and verification

- Update `docs/email.md` NT-5 progress and endpoint wiring notes.
- Run `npm run build` in `frontend/library-frontend`; do not run the test script.
