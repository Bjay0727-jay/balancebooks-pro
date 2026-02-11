# Balance Books Pro - Code Review

**Version Reviewed:** 2.0.3
**Date:** 2026-02-11
**Scope:** Full codebase review covering architecture, security, performance, code quality, CI/CD, and Electron integration.

---

## Executive Summary

Balance Books Pro is a feature-rich personal finance application built with React, Vite, Tailwind CSS, and Electron. The privacy-first, local-storage architecture is a solid design choice. However, the codebase has several structural and security issues that should be addressed to improve maintainability, reliability, and user safety. The most critical issues are the monolithic 3,300+ line component, unused modular code that was written but never integrated, missing PWA assets, and security gaps in the Dropbox OAuth flow.

---

## Critical Issues

### 1. Monolithic Component (`src/App.jsx` - 3,369 lines)

**Severity: High | Category: Architecture**

The entire application lives in a single `App()` component with:
- 30+ `useState` hooks (lines 65-100)
- 15+ `useEffect` hooks (lines 106-179)
- 10+ `useMemo` computations (lines 381-532)
- All business logic, UI rendering, Dropbox integration, and data management in one function

**Impact:** Extremely difficult to maintain, test, or onboard new developers. Every state change triggers reconciliation of the entire component tree. Bug isolation is nearly impossible.

**Recommendation:** Extract into feature-based modules:
- `components/Dashboard/` - Dashboard views and widgets
- `components/Transactions/` - Transaction list, forms, filters
- `components/Budget/` - Budget goals and analysis
- `components/Debts/` - Debt tracker and payoff calculators
- `components/Settings/` - Settings, backup, Dropbox integration
- `components/common/` - Modal, forms, shared UI

### 2. Modular Code Written But Never Integrated

**Severity: High | Category: Architecture**

The codebase contains a well-designed modular layer that is completely unused:

| Module | Location | Status |
|--------|----------|--------|
| `useTransactions` hook | `src/hooks/useTransactions.js` | **Unused** - App.jsx manages transactions via raw useState |
| `useRecurringExpenses` hook | `src/hooks/useRecurringExpenses.js` | **Unused** |
| `useDebts` hook | `src/hooks/useDebts.js` | **Unused** |
| `useAppInit` hook | `src/hooks/useAppInit.js` | **Unused** |
| IndexedDB database layer | `src/db/database.js` | **Unused** - App.jsx uses localStorage directly |
| Migration utility | `src/db/migration.js` | **Unused** |
| Constants module | `src/utils/constants.js` | **Unused** - App.jsx redeclares CATEGORIES, FREQUENCY_OPTIONS, MONTHS |
| Formatters module | `src/utils/formatters.js` | **Unused** - App.jsx redeclares uid, currency, shortDate, getDateParts |

**Impact:** The app stores all data in localStorage (5-10MB limit) despite having an IndexedDB layer ready. Users with significant transaction history will hit storage limits. All the modular improvements were built but never wired in.

**Recommendation:** Complete the migration to use the hooks and IndexedDB layer. Remove the duplicate declarations from App.jsx and import from the modules instead.

### 3. Dropbox OAuth Security Issues

**Severity: High | Category: Security**

Several security concerns with the Dropbox integration:

- **Implicit OAuth flow (line 198):** Uses `response_type=token` which is deprecated per RFC 6749. The access token is exposed in the URL fragment and browser history. Should use Authorization Code flow with PKCE instead.
- **Token stored in localStorage (lines 97-99, 117-119):** localStorage is accessible to any JavaScript running on the page. An XSS vulnerability would expose the Dropbox token. Should use `httpOnly` cookies or in-memory storage.
- **Placeholder API key (line 103):** `DROPBOX_APP_KEY = 'YOUR_APP_KEY_HERE'` is hardcoded in the source. If a real key is committed, it would be exposed in the client bundle.
- **No token refresh mechanism:** The implicit flow token expires and there's no refresh logic - users must re-authenticate.

### 4. Missing PWA Assets

**Severity: High | Category: Functionality**

The `index.html` references PWA files that don't exist in the repository:
- `sw.js` (service worker) - referenced at line 83 but missing
- `manifest.json` - referenced at line 11 but missing
- `icon-192.png` - referenced at line 12 but missing

**Impact:** The PWA install banner shows, but the app cannot actually be installed as a PWA. Service worker registration silently fails, and offline support doesn't work.

**Recommendation:** Either create proper PWA assets (service worker, manifest, icons) or remove the PWA install banner and service worker registration code to avoid misleading users.

---

## Security Issues

### 5. CDN Dependency Without Integrity Hash

**Severity: Medium | Category: Security**

`index.html:17`:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
```

No `integrity` attribute or `crossorigin` attribute. If the CDN is compromised, arbitrary JavaScript could run in the app context with access to all financial data.

**Recommendation:** Add Subresource Integrity (SRI):
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"
  integrity="sha256-[hash]"
  crossorigin="anonymous"></script>
```
Or better: install `xlsx` as an npm dependency and bundle it with Vite.

### 6. No Input Validation on Data Restore

**Severity: Medium | Category: Security**

The restore flow (`App.jsx:3209-3218`) directly sets application state from parsed JSON without any validation:
```javascript
setTransactions(data.transactions || parsed.transactions || []);
setRecurringExpenses(data.recurringExpenses || parsed.recurringExpenses || []);
```

**Impact:** Malformed or maliciously crafted backup files could inject unexpected data, cause rendering errors, or corrupt the local database.

**Recommendation:** Validate restored data against expected schemas before setting state. Check types, required fields, and reasonable value ranges.

### 7. Electron Preload Exposes `removeAllListeners`

**Severity: Low | Category: Security**

`electron/preload.js:23`:
```javascript
removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
```

This allows the renderer to strip all IPC listeners from any channel, which could be exploited to bypass security controls.

**Recommendation:** Only expose removal for specific, known channels, or scope listener management to individual callback cleanup functions.

---

## Performance Issues

### 8. Duplicate Debt Payoff Calculator

**Severity: Medium | Category: Performance**

The debt payoff calculator algorithm exists in two places:
- `src/App.jsx:437-497` (used)
- `src/hooks/useDebts.js:43-116` (unused)

Both implement O(n * 360) loops for snowball/avalanche calculations. This runs on every re-render when `debts` changes.

**Recommendation:** Use the hook version. If debts rarely change, the useMemo dependency is sufficient. For large debt portfolios, consider Web Workers.

### 9. Bill Reminder Notifications Fire on Every Mount

**Severity: Medium | Category: Performance/UX**

`App.jsx:165-179` fires desktop notifications in a `useEffect` that runs on every mount and whenever `recurringExpenses` changes. There's no deduplication - users see the same reminders repeatedly.

**Recommendation:** Track which reminders have been shown (e.g., store last notification date per bill in localStorage or IndexedDB). Only fire notifications once per day per bill.

### 10. No Code Splitting or Lazy Loading

**Severity: Low | Category: Performance**

The entire application is bundled into a single chunk. All views (dashboard, transactions, budgets, debts, settings) are loaded upfront regardless of which view the user visits.

**Recommendation:** Use `React.lazy()` and `Suspense` for route-level code splitting once the component is broken up.

---

## Code Quality Issues

### 11. Dead Files in Source Directory

**Severity: Medium | Category: Maintainability**

- `src/App2.0.jsx` (208KB, 3,460 lines) - appears to be a previous version
- `src/App-1-7-0.jsx` (184KB, 2,947 lines) - appears to be an older version

These increase bundle analysis noise and confuse contributors.

**Recommendation:** Remove dead files. Use git history to recover them if needed.

### 12. No `.gitignore` File

**Severity: Medium | Category: DevOps**

No `.gitignore` exists. This risks committing `node_modules/`, `dist/`, `release/`, `.env` files, and OS artifacts to the repository.

**Recommendation:** Add a `.gitignore` with at minimum:
```
node_modules/
dist/
release/
.env
.DS_Store
*.log
```

### 13. No Linting or Formatting Configuration

**Severity: Medium | Category: Code Quality**

No ESLint, Prettier, or any code formatting tools are configured. The codebase has inconsistent formatting - some components are spread across multiple lines while `Modal`, `TxForm`, and `RecurringForm` are compressed into single lines hundreds of characters long.

**Recommendation:** Add ESLint + Prettier with a shared config. Add a `lint` npm script and consider adding a pre-commit hook.

### 14. No Test Suite

**Severity: Medium | Category: Quality Assurance**

No test framework is installed or configured (no Vitest, Jest, or similar). No test files exist. The CI pipeline has no test step.

**Recommendation:** Add Vitest (natural fit with Vite) and start with:
- Unit tests for utility functions (`formatters.js`, `constants.js`)
- Unit tests for the database layer (`database.js`)
- Unit tests for custom hooks
- Integration tests for the debt payoff calculator

### 15. `isMobile` Detection is Static

**Severity: Low | Category: UX**

`App.jsx:59`:
```javascript
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
```

This evaluates once at module load time. If the user resizes their browser or rotates their device, the sidebar state won't update.

**Recommendation:** Use a `useMediaQuery` hook or `window.matchMedia('(max-width: 768px)')` with an event listener.

### 16. `uid()` Function Is Not Collision-Safe

**Severity: Low | Category: Data Integrity**

`App.jsx:41`:
```javascript
const uid = () => Date.now().toString(36) + Math.random().toString(36).substr(2);
```

`Date.now()` has millisecond resolution. If two transactions are created within the same millisecond (e.g., during bulk import), `Math.random()` provides the only differentiation - which is not guaranteed to be unique.

**Recommendation:** Use `crypto.randomUUID()` (available in all modern browsers and Node 19+) or a proper UUID library for guaranteed uniqueness.

---

## Electron Issues

### 17. Aggressive `process.exit(0)` on Quit

**Severity: Medium | Category: Electron**

`electron/main.js:359`:
```javascript
app.on('quit', () => {
  // Force exit to ensure no hanging processes
  process.exit(0);
});
```

This forcefully terminates the process, bypassing any pending async operations (e.g., IndexedDB writes, file saves). Data loss can occur if the user quits while a save is in progress.

**Recommendation:** Remove the `process.exit(0)` call. Electron's default quit behavior handles cleanup properly. If hanging processes are an issue, investigate the root cause rather than force-killing.

### 18. No Auto-Updater

**Severity: Low | Category: Electron**

The desktop app has no auto-update mechanism. Users must manually download new versions.

**Recommendation:** Integrate `electron-updater` (part of electron-builder) to check for and install updates from GitHub Releases automatically.

---

## CI/CD Issues

### 19. Stale Default Version in Workflow

**Severity: Low | Category: CI/CD**

`.github/workflows/build-installers.yml:14`:
```yaml
default: '1.7.1'
```

The actual app version is `2.0.3`. This default is used for manual `workflow_dispatch` triggers.

**Recommendation:** Update the default to match the current version, or better, read it from `package.json` during the workflow.

### 20. No Dependency Caching in CI

**Severity: Low | Category: CI/CD**

All three platform builds run `npm install` without caching. This adds unnecessary build time and network traffic.

**Recommendation:** Add npm caching:
```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
```

### 21. No Lint/Test Steps in CI

**Severity: Medium | Category: CI/CD**

The CI pipeline only builds installers. There are no lint, type-check, or test steps. Broken code can be released.

**Recommendation:** Add a `validate` job that runs before builds:
```yaml
validate:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with: { node-version: '20', cache: 'npm' }
    - run: npm ci
    - run: npm run lint
    - run: npm run test
    - run: npm run build
```

### 22. Unpinned GitHub Action (`softprops/action-gh-release@v1`)

**Severity: Low | Category: Security/CI**

Using a mutable tag (`@v1`) for the release action means the action code could change without notice.

**Recommendation:** Pin to a specific commit SHA for supply chain safety.

---

## Summary of Recommendations by Priority

### Must Fix (Before Next Release)
1. **Integrate the existing IndexedDB/hooks layer** - the modular code is already written
2. **Fix Dropbox OAuth** - switch to Authorization Code + PKCE flow
3. **Add `.gitignore`** - prevent accidental commits of sensitive/large files
4. **Create PWA assets or remove PWA code** - currently broken
5. **Add SRI hash to CDN script** or bundle xlsx via npm

### Should Fix (Next Sprint)
6. Break up `App.jsx` into feature modules
7. Remove dead files (`App2.0.jsx`, `App-1-7-0.jsx`)
8. Add input validation on data restore
9. Fix bill reminder notification deduplication
10. Remove `process.exit(0)` from Electron quit handler
11. Add ESLint + Prettier

### Nice to Have (Backlog)
12. Add Vitest test suite
13. Add CI validation steps (lint, test, build)
14. Implement code splitting with React.lazy
15. Replace `uid()` with `crypto.randomUUID()`
16. Add auto-updater for Electron
17. Use `useMediaQuery` for responsive sidebar
18. Add npm caching in CI
19. Pin GitHub Action SHAs

---

*Review generated for the `claude/code-review-YquQR` branch.*
