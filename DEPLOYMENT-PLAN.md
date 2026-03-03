# BalanceBooks Pro — Deployment Plan

## Current State Assessment

| Dimension | Status |
|-----------|--------|
| **Codebase** | 3,399-line monolithic `App.jsx`; shared modules exist (`src/utils/`, `src/db/`, `src/hooks/`) but `src/db/` and `src/hooks/` are **not wired in** |
| **Storage** | localStorage only (5-10 MB cap). Dexie schema + migration already written in `src/db/` but unused |
| **Build** | Vite 5, React 18, Tailwind 3, Electron 28. Builds clean in ~6s |
| **CI/CD** | GitHub Actions builds Win/Mac/Linux installers on tag push (just fixed: caching, validate job, pinned actions) |
| **Hosting** | Netlify config ready (`netlify.toml` with caching headers, SPA redirects). No Vercel config. |
| **PWA** | Partial — manifest referenced but `sw.js` does not exist. No `vite-plugin-pwa`. |
| **Testing** | Zero test files. No Vitest/Jest configured. |
| **Linting** | ESLint config just added (`.eslintrc.json`), but no `lint` script in package.json |
| **Security** | CSP added in `index.html` and Electron session. SRI on CDN script. Dropbox key moved to env var. |
| **Dropbox** | Implicit OAuth flow — deprecated. PKCE migration required. |
| **Licensing** | None. App is fully functional without key validation. |
| **Analytics** | None. No feature usage or error telemetry. |

### What the Code Review Already Fixed (37 findings)

The previous commit addressed: floating-point arithmetic, CSV injection, uid collisions, getMonthKey inconsistency, fake bank connection removal, accessibility (WCAG), modal focus trap, notification deduplication, auto-backup rewrite, pagination, timezone sorting, Object URL leaks, scoped factory reset, Electron process.exit/DevTools/CSP, CI/CD caching + action pinning, dead file removal, and .gitignore.

---

## Deployment Plan — Three Phases

### Phase 1: Production-Ready Web Release (Q2 2026, Weeks 1-3)

**Goal:** Ship a stable, hostable web app on Netlify with working PWA.

#### 1.1 Add `lint` and `lint:fix` scripts to package.json

```
"lint": "eslint src/ --ext .js,.jsx",
"lint:fix": "eslint src/ --ext .js,.jsx --fix"
```

#### 1.2 PWA Hardening — Add vite-plugin-pwa

- Install `vite-plugin-pwa` and configure in `vite.config.mjs`
- Generate a proper service worker via Workbox (cache-first for assets, network-first for HTML)
- Create `public/manifest.json` with icons, theme color, start_url, screenshots
- Add "Update available" banner using the plugin's `registerSW` callback
- Remove the dead `sw.js` reference from `netlify.toml`

#### 1.3 Wire in IndexedDB (Dexie) — Already Written

The `src/db/database.js` and `src/db/migration.js` files exist. The `src/hooks/` directory has `useTransactions.js`, `useDebts.js`, `useRecurringExpenses.js`, and `useAppInit.js`. These need to be:

1. Imported and called in `App.jsx` replacing the current `loadData`/`saveData` localStorage calls
2. The migration script needs to run on first load (read localStorage → write to IndexedDB → set flag)
3. All `useEffect(() => { saveData(...) })` hooks replaced with the Dexie-backed equivalents
4. Fallback: if IndexedDB is unavailable (rare), keep localStorage path

#### 1.4 Dropbox PKCE OAuth Migration

- Install `dropbox` SDK v10+ (`npm install dropbox`)
- Replace implicit flow (`response_type=token`) with Authorization Code + PKCE
- Remove token from URL hash handling; use `code` query param instead
- Store refresh token (not access token) in IndexedDB settings table
- Remove `VITE_DROPBOX_APP_KEY` from localStorage; keep only in env var

#### 1.5 Netlify Deployment

- Set `VITE_DROPBOX_APP_KEY` in Netlify environment variables
- Connect GitHub repo to Netlify (auto-deploy on push to `main`)
- Update `netlify.toml`: remove `sw.js` header rule, add CSP header
- Verify custom domain if applicable
- Smoke test: add transaction, refresh, verify data persists in IndexedDB

#### 1.6 Deliverables Checklist

- [ ] `npm run build` succeeds with zero warnings
- [ ] `npm run lint` passes
- [ ] PWA installs on Chrome, Safari, Android
- [ ] Offline mode works (kill network → app loads from cache)
- [ ] IndexedDB migration completes silently for existing users
- [ ] Dropbox connect/sync works with PKCE
- [ ] Netlify deploy live at production URL

---

### Phase 2: Architecture & Testing (Q2-Q3 2026, Weeks 4-8)

**Goal:** Decompose the monolith, add test coverage, enable parallel development.

#### 2.1 Component Decomposition

Split `src/App.jsx` (3,399 lines) into:

```
src/
├── App.jsx              (shell: routing, sidebar, layout — ~200 lines)
├── context/
│   └── AppContext.jsx   (shared state via Zustand or Context+useReducer)
├── views/
│   ├── Dashboard.jsx
│   ├── Transactions.jsx
│   ├── Recurring.jsx
│   ├── Accounts.jsx
│   ├── Cycle.jsx
│   ├── Savings.jsx
│   ├── Budget.jsx
│   ├── Debts.jsx
│   ├── Analytics.jsx
│   ├── Recommendations.jsx
│   └── Settings.jsx
├── components/
│   ├── Modal.jsx
│   ├── NavItem.jsx
│   ├── StatCard.jsx
│   ├── TxForm.jsx
│   ├── RecurringForm.jsx
│   ├── DebtForm.jsx
│   └── Pagination.jsx
├── hooks/
│   ├── useTransactions.js  (already exists)
│   ├── useDebts.js         (already exists)
│   ├── useRecurringExpenses.js (already exists)
│   ├── useAppInit.js       (already exists)
│   ├── useBudget.js
│   ├── useDropbox.js
│   └── useMediaQuery.js    (already in App.jsx, extract)
├── db/
│   ├── database.js         (already exists)
│   └── migration.js        (already exists)
└── utils/
    ├── constants.js        (already exists)
    └── formatters.js       (already exists)
```

**Approach:** Extract one view at a time, starting with the simplest (Settings), then Transactions, then Dashboard. Each extraction is a single PR that can be reviewed independently.

#### 2.2 State Management — Zustand

- Install Zustand (~1KB)
- Create slices: `transactionStore`, `budgetStore`, `uiStore`, `syncStore`
- Each store connects to the corresponding Dexie DB module
- Components subscribe to only the slices they need (surgical re-renders)

#### 2.3 Testing Infrastructure — Vitest

- Install `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`
- Add `"test": "vitest"` and `"test:coverage": "vitest run --coverage"` scripts
- Priority test targets:
  1. **Unit:** `roundCents`, `escapeCSVField`, `getMonthKey`, `shortDate`, `uid` (formatters.js)
  2. **Unit:** Debt payoff calculations, budget analysis math
  3. **Integration:** CSV/Excel import parsing, backup restore validation
  4. **Component:** TxForm submit, Modal focus trap, Pagination navigation
- CI gate: add `npm test` to the `validate` job in `build-installers.yml`
- Target: >80% coverage on `src/utils/` and `src/db/`

#### 2.4 Deliverables Checklist

- [ ] App.jsx < 300 lines (routing shell only)
- [ ] Every view is its own file with a single default export
- [ ] Zustand stores replace all `useState` at root level
- [ ] `npm test` runs >50 tests, all green
- [ ] CI runs lint + tests before building installers

---

### Phase 3: Features & Growth (Q3-Q4 2026, Weeks 9-14)

**Goal:** Add competitive features and monetization infrastructure.

#### 3.1 Recurring Transaction Auto-Generation

- On app load, check each active recurring expense against current month's transactions
- If no matching transaction exists (same name + category + month), auto-create one dated to `dueDay`
- Mark with `autoGenerated: true` flag; show subtle indicator in UI
- Respect user edits: if user deletes an auto-generated tx, don't re-create it that month

#### 3.2 Multi-Account Support

- Add `accountId` field to transactions (default: `'primary'`)
- New `accounts` table in Dexie: `{id, name, type, icon, color, initialBalance}`
- Dashboard shows consolidated totals with per-account drill-down
- Account transfer transactions link two accounts

#### 3.3 Onboarding Wizard

- First-launch detection via `settingsDB.get('onboarded')`
- 3-step flow: Set beginning balance → Import or start fresh → Set first budget goal
- Skip option on each step; "Show me around" tooltip tour
- Mark `onboarded: true` on completion

#### 3.4 Search & Filter Enhancements

- Amount range filters (min/max inputs)
- Date range picker (from/to)
- "Search all months" toggle (removes month filter)
- Saved filter presets stored in IndexedDB settings

#### 3.5 Data Visualization — Recharts

- Install `recharts`
- Replace hand-built SVG charts with interactive components
- Add: income vs. expense area chart, category heatmap, net worth trend line
- Hover tooltips and click-to-filter interactivity

#### 3.6 Stripe License Activation

- Free tier: core tracking (100 tx/month), basic budgets, CSV export
- Pro tier: unlimited transactions, Dropbox sync, debt planner, analytics, priority support
- License key validation via Stripe API on app launch
- Grace period: 7-day trial of Pro features for new users
- Store license status in IndexedDB settings

#### 3.7 Privacy-Respecting Analytics (Opt-in)

- Integrate Plausible or PostHog (self-hosted)
- Track only: feature usage counts, error rates, session duration
- Never track financial data
- Opt-in toggle in Settings with clear explanation
- Disabled by default

#### 3.8 Deliverables Checklist

- [ ] Recurring bills auto-populate each month
- [ ] Multi-account UI with per-account balances
- [ ] Onboarding wizard on first launch
- [ ] Advanced search with amount range + date range
- [ ] Interactive charts with tooltips
- [ ] Stripe license gate working
- [ ] Analytics opt-in toggle in Settings

---

## Deployment Environments

| Environment | URL/Target | Branch | Trigger |
|-------------|-----------|--------|---------|
| **Development** | `localhost:5173` | any | `npm run dev` |
| **Staging** | `staging.balancebooksapp.com` | `staging` | Push to `staging` branch |
| **Production Web** | `app.balancebooksapp.com` | `main` | Push to `main` |
| **Desktop Installers** | GitHub Releases | `v*` tags | Tag push triggers CI |

### Netlify Setup (Production)

```
Build command:    npm run build
Publish dir:      dist
Node version:     20
Environment vars: VITE_DROPBOX_APP_KEY=<real key>
```

### Staging (Netlify Branch Deploy)

- Enable branch deploys for `staging` in Netlify site settings
- Auto-deploys at `staging--<site-name>.netlify.app`
- Use for QA before merging to `main`

---

## Risk Mitigations

| Risk | Mitigation |
|------|-----------|
| IndexedDB migration corrupts data | Migration reads localStorage first, writes to IDB, only sets flag after success. Keep localStorage as read-only fallback for 2 releases. |
| Dropbox PKCE breaks existing token flow | Detect existing implicit tokens and prompt re-auth once. Don't auto-revoke. |
| Component decomposition introduces regressions | Extract one view per PR. Each PR must pass `npm run build` + visual smoke test. Add Vitest tests for extracted components before merging. |
| Electron build breaks on new architecture | CI validate job already runs `npm run build` before installer builds. Add Electron smoke test (launch → screenshot → close) in CI. |
| localStorage quota hit before migration ships | Add a storage usage indicator in Settings. Warn at 80% capacity. Ship Phase 1.3 as highest priority. |

---

## Quick Wins (Can Ship Immediately)

These are small changes that can land in a single PR today:

1. **Auto-check "paid" for income transactions** — TxForm: `paid: tx?.paid || (form.type === 'income')`
2. **Typed confirmation for Factory Reset** — Require user to type "DELETE" instead of just clicking OK
3. **Duplicate transaction button** — Add copy icon next to edit/delete; pre-fills form with today's date
4. **`lint` script in package.json** — Wire up the ESLint config we just added
5. **Remove `sw.js` header from `netlify.toml`** — References a file that doesn't exist

---

## Summary Timeline

```
Q2 2026 (Weeks 1-8)
├── Week 1-3:  Phase 1 — PWA, IndexedDB, PKCE, Netlify deploy
├── Week 4-6:  Phase 2a — Component decomposition + Zustand
└── Week 7-8:  Phase 2b — Vitest infrastructure + CI gate

Q3 2026 (Weeks 9-14)
├── Week 9-10:  Recurring auto-gen + onboarding wizard
├── Week 11-12: Multi-account + search enhancements
└── Week 13-14: Recharts + Stripe licensing

Q4 2026
└── Analytics, polish, trucking product foundation
```

**Total estimated effort:** 8-12 weeks (single developer), 4-6 weeks (parallel workstreams).
