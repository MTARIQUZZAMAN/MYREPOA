# Spec: Demo Login Page (HTML/CSS/JS)

**Status:** Draft — no code written yet
**Date:** 2026-09-13
**Type:** New feature (greenfield; project is currently empty apart from `.gitignore`)

---

## 1. Overview

A minimal, front-end-only login demo built with plain HTML, CSS, and vanilla JavaScript. The user logs in with a **username** and **phone number**, which are checked against a small in-memory dummy data array. On success the app navigates to a separate **welcome page** protected by a `sessionStorage` flag. No backend, no frameworks, no build step.

### Demo credentials

| Field    | Value    |
| -------- | -------- |
| Username | `tarik`  |
| Phone    | `123456` |

### Goals

- Simple, working login flow that can be demoed by opening the pages in a browser.
- Clean separation: structure (HTML), presentation (CSS), behavior (JS).
- Realistic-feeling touches: session flag, protected welcome page, logout, a11y basics.

### Non-goals

- No real authentication, no backend, no hashing, no network calls.
- No password field (phone number stands in for it in this demo).
- No password-reset, signup, rate limiting, or lockout features.
- No i18n framework — UI text is English, hardcoded.
- No persistence of login across browser restarts.

---

## 2. File structure

```
/ (project root)
├── index.html      # Login page
├── welcome.html    # Post-login welcome page
├── style.css       # Single shared stylesheet for both pages
├── script.js       # All JS: login validation, session guard, logout
└── .gitignore      # (already exists)
```

- **3-file separation** for the login page (`index.html`, `style.css`, `script.js`), plus `welcome.html` for the post-login page.
- The post-login page uses an **app layout**: a fixed **left sidebar menu** plus a main content area with switchable sections (Home / Profile / Settings / About / Clock). On screens ≤640px the sidebar becomes a slide-in drawer behind a hamburger button.
- One **shared** `style.css` serves both pages (user decision).
- One `script.js` serves both pages; page-specific behavior is gated by DOM detection (e.g., if `#login-form` exists → run login logic; if `#logout-btn` exists → run welcome-page logic). This avoids a second JS file while keeping the welcome page functional.
- No external dependencies, no CDN links, no fonts fetched from the network.

---

## 3. Login page (`index.html`)

### 3.1 Layout

- Centered form on the page; **minimal / plain visual style** (user decision) — simple borders, normal fonts, no decorative gradient, no dark mode.
- Fields, in order:
  1. **Username** — `<input type="text">`, `autocomplete="username"`
  2. **Phone number** — `<input type="tel">`, `autocomplete="tel"` (free text allowed while typing; no character filtering, no max length — validated on submit only)
  3. **Login** — `<button type="submit">Login</button>`
- **Demo-credentials hint box** (the only "extra" chosen): a small, visually distinct box on the login page, e.g.
  > Demo login — username: `tarik`, phone: `123456`
- Wrapped in a real `<form>` so **Enter key submits** natively; JS listens to the form's `submit` event and calls `preventDefault()` before validating.

### 3.2 Validation rules (checked on submit only)

| # | Rule | Result on failure |
| - | ---- | ----------------- |
| 1 | Username non-empty (after trim) | Inline error "Username is required", field highlighted |
| 2 | Phone non-empty (after trim) | Inline error "Phone number is required", field highlighted |
| 3 | Credentials match the dummy account | Generic error "Invalid username or phone number", both fields highlighted |

- **Validation timing:** on submit only (user decision). No live re-validation as the user types; errors simply remain until the next submit attempt.
- **Matching rule:** username AND phone must both match **the same dummy account** (user decision). With a single account this is equivalent to both matching, but the array structure keeps it correct if more users are added later.
- **Username normalization:** trim whitespace + **case-insensitive** (user decision). `Tarik `, `TARIK`, ` tarik` all pass.
- **Phone normalization:** trim whitespace only; otherwise an **exact match** against `123456` (user decision). `123 456`, `+123456`, `123-456`, `1234567` all **fail**.
- **Empty-field handling:** inline required errors are shown and the form does **not** attempt a credential check (user decision). If both fields are empty, both required errors appear.
- Required errors take precedence over the invalid-credentials check: a submit with any empty field never produces the generic message.

### 3.3 Error display

- **Generic combined message** for bad credentials (user decision): one fixed string — `Invalid username or phone number` — regardless of which field is actually wrong. Never reveal which field failed.
- **Highlight + message** (user decision): failing inputs get a visual error state (e.g. red border via a CSS class such as `.input-error`), plus the error text.
- Placement: a single error region for the generic credentials error, and per-field error text for required errors (directly under each field).
- Error messages clear at the start of each new submit attempt before re-evaluating.

### 3.4 Dummy data model

```js
// Top of script.js — easy to extend with more demo users later
const USERS = [
  { username: "tarik", phone: "123456" },
];
```

- Chosen as a **JS array** (user decision) rather than bare constants, so adding accounts later (e.g. `admin / 111111`) is a one-line change.
- Matching algorithm: normalize input username (trim + lowercase) and phone (trim), then find a user in `USERS` where `user.username.toLowerCase() === inputUsername && user.phone === inputPhone`. Login succeeds iff exactly such a user is found.

### 3.5 Session handling (login side)

- On successful login, set a `sessionStorage` flag before navigating, e.g.
  `sessionStorage.setItem("demoSessionUser", "tarik")`.
- **`sessionStorage`** chosen over `localStorage` (user decision): the session ends when the tab/window closes.
- Then redirect: `window.location.href = "welcome.html"`.
- Note: `sessionStorage` values are per-tab — logging in in one tab does not create a session in another tab. This is acceptable (and arguably correct) for the demo.

---

## 4. Welcome page (`welcome.html`)

### 4.1 Content & left sidebar menu

- App layout with a **left sidebar menu** (user request): app name header, then menu items **Home / Profile / Settings / About / Clock**.
- Menu items switch between content sections shown in the main area (in-page via `hidden`, `preventDefault()` on the anchor clicks — no routing, no page reloads). The active item is highlighted and marked with `aria-current="page"`.
- Main area sections: **Home** (greeting `Welcome, tarik!` with username injected from the session flag, plus a **live clock** — `HH:MM:SS — Weekday, Month Day, Year`, ticking at whole seconds), **Profile** (shows the session username), **Settings** (placeholder), **About** (demo description). The **Logout** button moved to the sidebar footer.
- No session metadata, no timestamps.

### 4.2 Access guard

- On page load, `script.js` checks `sessionStorage` for the session flag.
- **If absent → redirect to `index.html`** (user decision). The user never sees an empty/generic welcome page.
- If present → render greeting with the stored username.

### 4.3 Logout

- A **Logout button** exists (user decision), placed at the bottom of the sidebar.
- Behavior: remove the session flag (`sessionStorage.removeItem(...)`) and redirect to `index.html`.
- After logout, pressing the browser Back button lands on `welcome.html`, which re-runs the guard on load and redirects back to the login page. (Edge case worth manual testing; if bfcache restores a stale page, add a `pageshow` listener that re-checks the session — optional hardening, noted here so it isn't forgotten.)

---

## 5. Styling & responsiveness

- **Minimal/plain style** (user decision): clean, readable, no decorative theming. Light background, simple bordered card or bare centered form, standard system fonts.
- **Fully responsive** (user decision):
  - `<meta name="viewport" content="width=device-width, initial-scale=1">` on both pages.
  - Form spans available width on small screens with sensible padding; inputs and buttons have comfortable touch-target size (≥ ~44px height recommended).
  - Fluid sizing; no horizontal scrolling on ~320px-wide viewports.
- Single `style.css` contains: base/reset-ish styles, form styles, error-state styles (`.input-error`, error text), hint-box styles, welcome-page styles, and responsive tweaks.
- **Sidebar responsiveness:** on viewports ≤640px the sidebar is a fixed, slide-in drawer (hamburger button in a mobile top bar; semi-transparent backdrop; Escape closes it).

---

## 6. Accessibility

- **Standard a11y** (user decision):
  - Every input has a programmatically associated `<label for="...">`.
  - Form submits via **Enter** natively (real `<form>` + submit button).
  - Error message container uses `role="alert"` (or `aria-live="assertive"`) so failures are announced by screen readers; per-field errors linked to inputs via `aria-describedby`.
  - Failing inputs get `aria-invalid="true"` (removed on next successful submit attempt).
- Buttons are real `<button>` elements with visible text labels.
- **Sidebar a11y:** menu links use `aria-current="page"` for the active item; the mobile hamburger button has `aria-expanded`/`aria-controls` and a dynamic `aria-label`.

---

## 7. UI text (English, hardcoded)

| Context | Text |
| ------- | ---- |
| Login page title/heading | Login |
| Username label | Username |
| Phone label | Phone number |
| Submit button | Login |
| Generic credentials error | Invalid username or phone number |
| Required error (username) | Username is required |
| Required error (phone) | Phone number is required |
| Hint box | Demo login — username: tarik, phone: 123456 |
| Sidebar app name | DemoApp |
| Menu items | Home / Profile / Settings / About / Clock |
| Welcome heading | Welcome, {username}! |
| Home clock | {HH:MM:SS} — {Weekday, Month Day, Year} |
| Clock menu item | Clock |
| Analog clock face | Wooden case, brass bezel, roman numerals I–XII (aria-label describes it) |
| Digital time under analog clock | {HH:MM:SS} (locale 2-digit format) |
| Logout button | Logout |

---

## 8. Flows & edge cases (checklist)

1. **Happy path:** enter `tarik` + `123456` → welcome page shows "Welcome, tarik!" with the sidebar menu.
2. **Case/space variants:** `TARIK` / `123456`, ` tarik ` / `123456` → success.
3. **Wrong username, right phone** (or vice versa) → generic error, both fields highlighted, no navigation.
4. **Phone formatting variants fail:** `123 456`, `+123456`, `123-456`, `1234567` → generic error.
5. **Both fields empty** → both required errors, no credential check.
6. **One field empty** → only that field's required error.
7. **Errors persist until next submit** (no live clearing) — intentional.
8. **Direct visit to `welcome.html` without login** → immediate redirect to `index.html`.
9. **Logout** → session flag removed, back on login page; Back button then re-redirects to login.
10. **Close tab, reopen `welcome.html`** → redirect to login (sessionStorage expired with tab).
11. **Refresh login page** → form resets; no stale error states (fresh DOM).
12. **Mobile viewport (~320–400px)** → form fully usable, no overflow.
13. **Sidebar navigation** → menu items switch the main-area sections in-page; active item highlighted.
14. **Mobile sidebar** → hamburger opens the drawer; backdrop click or Escape closes it; picking a menu item closes it too.
15. **Live clock** → Home section shows `HH:MM:SS — Weekday, Month Day, Year`, ticking every second (aligned to whole seconds; no drift over long sessions).
16. **Antique analog clock** → Clock menu item shows an SVG bedside clock: wooden case + brass bezel + roman numerals, with hour/minute/second hands ticking at whole seconds.
17. **Independent clocks** → the Home digital clock and the analog clock tick independently; leaving one section open while viewing the other keeps both running.

---

## 9. Acceptance criteria

- [ ] `index.html`, `welcome.html`, `style.css`, `script.js` exist; no other files added; no external dependencies.
- [ ] Login works for the demo credentials per §8.1–8.2 and fails per §8.3–8.4.
- [ ] Error messages and field highlighting behave exactly as §3.3 and §3.2.
- [ ] Successful login sets the `sessionStorage` flag and navigates to `welcome.html`.
- [ ] `welcome.html` redirects to `index.html` when the flag is missing (§4.2).
- [ ] Logout clears the flag and returns to the login page (§4.3).
- [ ] Welcome page shows a **left sidebar menu** whose items switch the main content sections (§4.1).
- [ ] All §7 strings are used verbatim.
- [ ] Labels, `aria-invalid`, `aria-describedby`/`role="alert"` are present and correct; sidebar `aria-current`/`aria-expanded` correct.
- [ ] Pages render correctly at mobile widths (no overflow at 320px); sidebar behaves as a drawer ≤640px.
- [ ] Works when served statically (e.g. VS Code Live Server, `python -m http.server`, `npx serve`); opening via `file://` should also work since there are no fetches/modules.

---

## 10. Future extensions (out of scope now)

- Add more dummy users to the `USERS` array (structure already supports it).
- Swap the array lookup for a `fetch()` to a real API — the submit handler is the single integration point.
- Add a password field, "remember me" (`localStorage`), or a fake loading state.
- Internationalize the §7 strings.
- Give the Settings/Profile sections real functionality; add more menu items.

---

## 11. Decision log (from interview)

| Decision | Choice |
| -------- | ------ |
| Code organization | 3 separate files (+ welcome.html) |
| After login | Navigate to separate welcome page |
| Match rule | Username AND phone must match same account |
| Phone validation | Exact match only |
| Error detail | Generic combined message |
| Field error UX | Highlight offending inputs + message |
| Empty fields | Inline required errors, block submit |
| Error timing | On submit only |
| Dummy data | JS array (`USERS`), only `tarik / 123456` |
| Session | `sessionStorage` flag; welcome page protected |
| Username normalization | Trim + case-insensitive |
| Extras | Demo-credentials hint box only |
| Logout | Yes — button on welcome page |
| Visual style | Minimal / plain |
| Welcome content | Greeting + logout only |
| Phone input behavior | Free text while typing, validated on submit |
| Responsive | Fully responsive |
| Accessibility | Standard (labels, Enter submit, `role="alert"`/`aria-describedby`) |
| CSS | Single shared stylesheet |
| Direct visit to welcome | Redirect to login |
| UI language | English |
| Post-login layout | Left sidebar menu + switchable content sections (added later per user request) |
