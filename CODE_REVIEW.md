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

## Part 2: Production-Readiness Audit

The following additional findings focus on data integrity, user safety, accessibility, and runtime edge cases that must be addressed before shipping to paying customers.

---

### Data Integrity & Financial Accuracy

#### 23. Floating-Point Currency Arithmetic

**Severity: Critical | Category: Data Integrity**

All financial calculations use native JavaScript floating-point numbers. In a finance app, this is a correctness risk:

```javascript
// JavaScript: 0.1 + 0.2 === 0.30000000000000004
const income = monthTx.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
```

This runs throughout the app: balance calculations, budget comparisons, debt payoff projections, YTD stats, and CSV exports. Over hundreds of transactions, rounding errors accumulate and can produce visible discrepancies (e.g., totals off by a cent, balance sheets that don't reconcile).

**Impact:** Users see balances that don't add up. For a finance app marketed as "pro," this erodes trust.

**Recommendation:** Operate in cents (integers) internally and format to dollars only for display. Alternatively, use a library like `dinero.js` or `currency.js` that handles decimal arithmetic correctly. At minimum, round all intermediate results with `Math.round(value * 100) / 100`.

#### 24. `getMonthKey` Inconsistency Between App.jsx and Formatters

**Severity: High | Category: Data Integrity**

Two different implementations exist with different behavior:

`App.jsx:326` (used):
```javascript
const getMonthKey = (m, y) => `${y}-${String(m).padStart(2, '0')}`;
// January (month=0) produces "2025-00"
```

`src/utils/formatters.js:28` (unused):
```javascript
export const getMonthKey = (month, year) => `${year}-${String(month + 1).padStart(2, '0')}`;
// January (month=0) produces "2025-01"
```

The App.jsx version generates non-standard month keys (`2025-00` for January). If the IndexedDB layer is ever integrated, it will use `2025-01`, creating a data format mismatch that silently breaks monthly balance lookups.

**Recommendation:** Standardize on the ISO-style format (`YYYY-MM` with 1-indexed months). Use the formatters.js version and remove the duplicate from App.jsx.

#### 25. Inconsistent Backup Version Strings

**Severity: Medium | Category: Data Integrity**

Different backup functions embed different version identifiers:

| Location | Version String | Context |
|----------|---------------|---------|
| `App.jsx:183` | `'1.6.0'` | Auto-backup |
| `App.jsx:1663` | `'1.2'` | Manual backup (transactions view) |
| `App.jsx:2334` | `'1.6.0'` | Manual backup (settings) |
| `App.jsx:226` | `__APP_VERSION__` (2.0.3) | Dropbox sync |
| `App.jsx:793` | `'v1.3'` | CSV export footer |

**Impact:** If restore logic ever gates on version strings, older-format backups from the same app version will behave inconsistently. Users can't tell which backup is newest by looking at the version field.

**Recommendation:** Use `__APP_VERSION__` consistently across all backup/export functions.

#### 26. No Concurrent Tab Protection

**Severity: Medium | Category: Data Integrity**

If a user opens the app in two browser tabs, both instances read/write the same localStorage keys. There is no locking, versioning, or change detection. Edits in one tab silently overwrite the other.

**Recommendation:** Use the `BroadcastChannel` API or `storage` event listener to detect concurrent tabs and either sync or warn the user. IndexedDB (once integrated) handles concurrent access better than localStorage.

---

### Security Vulnerabilities

#### 27. CSV Injection (Formula Injection)

**Severity: High | Category: Security**

`App.jsx:770-771`:
```javascript
rows.push([
  t.date,
  `"${t.desc}"`,       // Not escaped for formula injection
  t.amount.toFixed(2),
  ...
]);
```

If a transaction description starts with `=`, `+`, `-`, or `@`, Excel/Sheets will interpret the cell as a formula. A malicious or accidental description like `=HYPERLINK("http://evil.com","Click")` or `=CMD|'/C calc'!A0` executes when the CSV is opened.

**Recommendation:** Prefix all string cells with a tab character or single quote to prevent formula execution. Also escape double quotes within descriptions (a `"` inside the field produces malformed CSV):
```javascript
const escape = (s) => `"${String(s).replace(/"/g, '""').replace(/^([=+\-@\t\r])/, "'$1")}"`;
```

#### 28. Fake Bank Connection Modifies Real Data

**Severity: High | Category: Functional/Trust**

`App.jsx:1307-1316`:
```javascript
const connectBank = () => {
  setPlaidLoading(true);
  setTimeout(() => {
    setLinkedAccounts([{ id: uid(), institution: 'USAA', accounts: [...] }]);
    setTransactions(p => p.map(t => ({ ...t, paid: true })));  // Marks ALL real transactions as paid!
    ...
  }, 2500);
};
```

This simulates a bank connection with hardcoded USAA data after a 2.5-second fake loading animation. **Critically, it marks every real user transaction as "paid."** This is not a demo or test mode - it silently modifies production data with no way to undo.

**Impact:** Users who click "Connect Bank" expecting Plaid integration will have all their unpaid bills marked as paid, losing track of what they actually owe. This is a data corruption bug masquerading as a feature.

**Recommendation:** Either implement real Plaid integration or remove the "Connect Bank" feature entirely. If keeping it as a placeholder, it must NOT modify real transaction data. Show a "Coming Soon" message instead.

---

### Accessibility (WCAG Compliance)

#### 29. No Accessibility Support

**Severity: High | Category: Accessibility / Legal**

The application has no accessibility accommodations:

- **`user-scalable=no` in viewport** (`index.html:6`): Prevents pinch-to-zoom, violating WCAG 2.1 Success Criterion 1.4.4 (Resize Text). This is a compliance failure that can expose the business to ADA lawsuits, particularly for a financial product.
- **No ARIA labels:** Custom buttons, toggle switches, progress bars, and interactive cards have no `aria-label`, `aria-role`, or `aria-describedby` attributes.
- **No keyboard navigation:** Custom components (paid/unpaid toggles, category selectors, sidebar nav) are only operable via mouse click. Tab order is unmanaged.
- **No focus management for modals:** When a modal opens, focus is not trapped inside it. Screen readers and keyboard users can tab behind the modal to invisible elements.
- **Low color contrast in some areas:** Light text on gradient backgrounds (e.g., `text-[#14b8a6]/70` on dark gradients) may not meet WCAG AA 4.5:1 contrast ratio.
- **No skip-to-content link:** Screen reader users must tab through the entire sidebar on every page load.

**Recommendation:** As a minimum for production:
1. Remove `user-scalable=no` from the viewport meta tag
2. Add `aria-label` to all interactive elements without visible text
3. Implement focus trapping in the `Modal` component
4. Add `role="dialog"` and `aria-modal="true"` to modals
5. Ensure all interactive elements are keyboard-accessible

#### 30. Destructive Actions Have No Undo Mechanism

**Severity: Medium | Category: UX / Data Safety**

All delete operations rely solely on `confirm()` dialogs:
- Delete single transaction (line 1298)
- Delete filtered transactions (line 1687)
- Delete all transactions (line 1705 - double confirm)
- Delete recurring expenses (line 1303, 2660)
- Factory Reset with `localStorage.clear()` (line 2671)

None offer an undo path. The Factory Reset at line 2676 calls `localStorage.clear()` which wipes ALL localStorage, not just `bb_`-prefixed keys - destroying PWA preferences, Dropbox tokens, and any third-party data.

**Recommendation:** Implement soft-delete with a 30-second undo toast (similar to Gmail). For Factory Reset, only clear `bb_*` keys. Consider requiring the user to type a confirmation phrase for destructive bulk operations.

---

### Runtime Edge Cases

#### 31. Auto-Backup Silently Downloads Files

**Severity: Medium | Category: UX**

`App.jsx:181-194`:
```javascript
const performAutoBackup = useCallback(() => {
  ...
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `balance-books-auto-backup-${...}.json`;
  a.click();
  ...
});
```

The "auto-backup" feature triggers a browser file download every 24 hours. Most modern browsers block programmatic downloads or require user gesture. Even when it works, files accumulate silently in the Downloads folder with no cleanup.

**Recommendation:** Replace with IndexedDB-based rolling backups (keep last N snapshots internally) or use the Dropbox sync for cloud backup. If file downloads are desired, make them user-initiated with an explicit "Download Backup Now" button.

#### 32. Object URL Memory Leaks

**Severity: Low | Category: Performance**

Several download functions create `URL.createObjectURL()` but don't call `URL.revokeObjectURL()`:
- `App.jsx:192` (auto-backup) - never revoked
- `App.jsx:797-799` (CSV export) - never revoked

Others do correctly revoke: lines 818, 2360. In a long-running session (especially on mobile), leaked object URLs consume memory.

**Recommendation:** Always call `URL.revokeObjectURL(url)` after triggering the download, ideally in a `finally` block or `setTimeout`.

#### 33. Transaction List Has No Pagination

**Severity: Medium | Category: UX**

`App.jsx:1725`:
```javascript
filtered.slice(0, 50).map(tx => { ... })
```

The transaction list hard-caps at 50 items with a small note at the bottom. Users with 500+ transactions (common after a year of use) cannot view, edit, or delete transactions beyond position 50 unless they happen to match a filter. There's no "Load More," infinite scroll, or pagination.

**Recommendation:** Add virtual scrolling (e.g., `react-window` or `@tanstack/virtual`) or simple page-based pagination to allow access to all transactions.

#### 34. Timezone Bug in Sorting

**Severity: Medium | Category: Data Integrity**

While `getDateParts()` correctly parses `YYYY-MM-DD` strings without timezone shifting, multiple sort operations still use `new Date()`:

`App.jsx:387`:
```javascript
let list = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
```

`new Date('2025-01-15')` is interpreted as UTC midnight. For users in timezones west of UTC (Americas), this shifts to the previous day. Sorting is correct (relative order preserved), but if any code compares sorted dates to `getDateParts()` results, inconsistencies can appear.

**Recommendation:** Use string comparison for `YYYY-MM-DD` dates (lexicographic ordering is correct for this format): `(a, b) => b.date.localeCompare(a.date)`.

#### 35. Hardcoded USD Currency

**Severity: Low | Category: Internationalization**

All currency formatting is locked to USD:
```javascript
const currency = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
```

There's no way for users in other countries to change the currency symbol or number format.

**Recommendation:** Add a currency preference to settings. Store the ISO currency code (e.g., `'USD'`, `'EUR'`, `'GBP'`) and pass it to `Intl.NumberFormat`.

---

### Electron Production Hardening

#### 36. No Content Security Policy

**Severity: Medium | Category: Security/Electron**

Neither the web app nor the Electron app sets a Content Security Policy (CSP). The CDN script tag, inline scripts in `index.html`, and the lack of CSP headers mean:
- Any XSS vulnerability has unrestricted access
- The Dropbox token in localStorage is fully exposed
- Inline script execution is unrestricted

**Recommendation:** Add a CSP meta tag or HTTP header:
```html
<meta http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self' https://content.dropboxapi.com https://api.dropboxapi.com;">
```

For Electron, set CSP in the `session` webRequest headers.

#### 37. DevTools Accessible in Production Electron Builds

**Severity: Low | Category: Security/Electron**

`electron/main.js:166-172` exposes DevTools toggle in the View menu for all builds. Additionally, `Ctrl+Shift+I` works by default. End users can inspect localStorage, view Dropbox tokens, and modify application state.

**Recommendation:** Remove the DevTools menu item and keyboard shortcut in production builds. Only enable when `isDev` is true.

---

## Updated Summary: Production Release Blockers

### Release Blockers (Must fix before any production release)
| # | Issue | Risk |
|---|-------|------|
| 23 | Floating-point currency arithmetic | Incorrect financial calculations |
| 27 | CSV injection vulnerability | Security exploit when users open exports |
| 28 | Fake bank connection corrupts data | Marks all transactions as paid |
| 29 | No accessibility (`user-scalable=no`) | ADA/WCAG legal exposure |
| 1-4 | Monolithic architecture, unused modular code, Dropbox OAuth, missing PWA | From initial review |

### High Priority (Fix within first production sprint)
| # | Issue | Risk |
|---|-------|------|
| 24 | `getMonthKey` format inconsistency | Data corruption on IndexedDB migration |
| 25 | Inconsistent backup versions | Restore failures |
| 30 | No undo for destructive actions / `localStorage.clear()` | Data loss |
| 33 | Transaction list capped at 50 | Users can't access their data |
| 36 | No Content Security Policy | XSS has full access |

### Should Fix (Before scaling to more users)
| # | Issue | Risk |
|---|-------|------|
| 26 | No concurrent tab protection | Silent data loss |
| 31 | Auto-backup downloads files silently | Blocked by browsers, confusing UX |
| 34 | Timezone bug in sorting | Incorrect transaction order |
| 35 | Hardcoded USD currency | Limits market to US users |
| 37 | DevTools in production | Token exposure |
| 32 | Object URL memory leaks | Performance degradation |

---

*Review updated for the `claude/code-review-YquQR` branch.*
