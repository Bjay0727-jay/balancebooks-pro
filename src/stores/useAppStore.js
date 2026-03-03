import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { transactionsDB, recurringDB, balancesDB, budgetDB, debtsDB, settingsDB } from '../db/database';
import { uid, getMonthKey, getDateParts } from '../utils/formatters';
import { suppressAutoGen } from '../utils/suppressAutoGen';

const saveData = (key, data) => { try { localStorage.setItem('bb_' + key, JSON.stringify(data)); } catch {} };
const loadData = (key, defaultValue) => { try { const saved = localStorage.getItem('bb_' + key); return saved ? JSON.parse(saved) : defaultValue; } catch { return defaultValue; } };

export const useAppStore = create(
  subscribeWithSelector((set, get) => ({
    // ── Domain Data ──────────────────────────────────────────
    transactions: loadData('transactions', []),
    recurringExpenses: loadData('recurring', []),
    monthlyBalances: loadData('monthlyBalances', {}),
    savingsGoal: loadData('savingsGoal', 500),
    budgetGoals: loadData('budgetGoals', {}),
    debts: loadData('debts', []),
    accounts: loadData('accounts', [{ id: 'primary', name: 'Primary Account', type: 'checking', icon: '🏦', color: '#12233d', initialBalance: 0 }]),

    // ── Settings ─────────────────────────────────────────────
    autoBackupEnabled: loadData('autoBackup', false),
    lastBackupDate: loadData('lastBackup', null),
    notificationsEnabled: loadData('notifications', false),
    dashboardWidget: loadData('dashboardWidget', 'ytd'),
    onboarded: loadData('onboarded', false),

    // ── License ──────────────────────────────────────────────
    licenseKey: loadData('licenseKey', null),
    licenseEmail: loadData('licenseEmail', null),
    licenseStatus: loadData('licenseStatus', 'trial'), // 'trial' | 'active' | 'expired' | 'invalid'
    licenseExpiry: loadData('licenseExpiry', null),
    licenseActivating: false,
    licenseError: null,

    // ── Analytics ────────────────────────────────────────────
    analyticsConsent: loadData('analyticsConsent', 'not-asked'), // 'not-asked' | 'opted-in' | 'opted-out'

    // ── Dropbox ──────────────────────────────────────────────
    dropboxConnected: loadData('dropboxConnected', false),
    dropboxToken: loadData('dropboxToken', null),
    dropboxSyncing: false,
    dropboxLastSync: loadData('dropboxLastSync', null),
    dropboxError: null,

    // ── UI State ─────────────────────────────────────────────
    view: 'dashboard',
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
    modal: null,
    editTx: null,
    editRecurring: null,
    editDebt: null,
    editBudget: null,
    search: '',
    filterCat: 'all',
    filterPaid: 'all',
    filterAmountMin: '',
    filterAmountMax: '',
    filterDateFrom: '',
    filterDateTo: '',
    searchAllMonths: false,
    filterAccount: 'all',
    txPage: 0,
    sidebarOpen: typeof window !== 'undefined' && window.innerWidth >= 768,
    linkedAccounts: [],
    plaidLoading: false,
    importData: null,
    importNotification: null,
    restoreData: null,

    // ── Hydration ────────────────────────────────────────────
    hydrated: false,

    // ── Setters (domain) ─────────────────────────────────────
    setTransactions: (txs) => set({ transactions: txs }),
    setRecurringExpenses: (rec) => set({ recurringExpenses: rec }),
    setMonthlyBalances: (bal) => set({ monthlyBalances: bal }),
    setSavingsGoal: (goal) => set({ savingsGoal: goal }),
    setBudgetGoals: (goals) => set({ budgetGoals: goals }),
    setDebts: (d) => set({ debts: d }),
    setAccounts: (a) => set({ accounts: a }),

    // ── Setters (settings) ───────────────────────────────────
    setOnboarded: (val) => set({ onboarded: val }),
    setAutoBackupEnabled: (val) => set({ autoBackupEnabled: val }),
    setLastBackupDate: (date) => set({ lastBackupDate: date }),
    setNotificationsEnabled: (val) => set({ notificationsEnabled: val }),
    setDashboardWidget: (widget) => set({ dashboardWidget: widget }),

    // ── Setters (license) ─────────────────────────────────────
    setLicenseKey: (key) => set({ licenseKey: key }),
    setLicenseEmail: (email) => set({ licenseEmail: email }),
    setLicenseStatus: (status) => set({ licenseStatus: status }),
    setLicenseExpiry: (expiry) => set({ licenseExpiry: expiry }),
    setLicenseActivating: (val) => set({ licenseActivating: val }),
    setLicenseError: (err) => set({ licenseError: err }),

    activateLicense: async (key, email) => {
      set({ licenseActivating: true, licenseError: null });
      try {
        const res = await fetch('https://api.lemonsqueezy.com/v1/licenses/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ license_key: key, instance_name: 'BalanceBooks Pro' }),
        });
        const data = await res.json();
        if (data.activated || data.valid) {
          set({ licenseKey: key, licenseEmail: email, licenseStatus: 'active', licenseExpiry: data.license_key?.expires_at || null });
          return { success: true };
        }
        const msg = data.error || data.message || 'Invalid license key';
        set({ licenseStatus: 'invalid', licenseError: msg });
        return { success: false, error: msg };
      } catch (err) {
        set({ licenseError: err.message });
        return { success: false, error: err.message };
      } finally {
        set({ licenseActivating: false });
      }
    },

    deactivateLicense: () => {
      set({ licenseKey: null, licenseEmail: null, licenseStatus: 'trial', licenseExpiry: null, licenseError: null });
      ['licenseKey', 'licenseEmail', 'licenseStatus', 'licenseExpiry'].forEach(k => localStorage.removeItem('bb_' + k));
    },

    // ── Setters (analytics) ─────────────────────────────────
    setAnalyticsConsent: (val) => set({ analyticsConsent: val }),

    // ── Setters (dropbox) ────────────────────────────────────
    setDropboxConnected: (val) => set({ dropboxConnected: val }),
    setDropboxToken: (token) => set({ dropboxToken: token }),
    setDropboxSyncing: (val) => set({ dropboxSyncing: val }),
    setDropboxLastSync: (sync) => set({ dropboxLastSync: sync }),
    setDropboxError: (err) => set({ dropboxError: err }),

    // ── Setters (UI) ─────────────────────────────────────────
    setView: (v) => set({ view: v }),
    setMonth: (m) => set({ month: m }),
    setYear: (y) => set({ year: y }),
    setModal: (m) => set({ modal: m }),
    setEditTx: (tx) => set({ editTx: tx }),
    setEditRecurring: (r) => set({ editRecurring: r }),
    setEditDebt: (d) => set({ editDebt: d }),
    setEditBudget: (b) => set({ editBudget: b }),
    setSearch: (s) => set({ search: s }),
    setFilterCat: (c) => set({ filterCat: c }),
    setFilterPaid: (p) => set({ filterPaid: p }),
    setFilterAmountMin: (v) => set({ filterAmountMin: v }),
    setFilterAmountMax: (v) => set({ filterAmountMax: v }),
    setFilterDateFrom: (v) => set({ filterDateFrom: v }),
    setFilterDateTo: (v) => set({ filterDateTo: v }),
    setSearchAllMonths: (v) => set({ searchAllMonths: v }),
    setFilterAccount: (v) => set({ filterAccount: v }),
    setTxPage: (p) => set({ txPage: p }),
    setSidebarOpen: (o) => set({ sidebarOpen: o }),
    setLinkedAccounts: (a) => set({ linkedAccounts: a }),
    setPlaidLoading: (l) => set({ plaidLoading: l }),
    setImportData: (d) => set({ importData: d }),
    setImportNotification: (n) => set({ importNotification: n }),
    setRestoreData: (d) => set({ restoreData: d }),

    // ── Hydrate from IndexedDB ───────────────────────────────
    hydrate: (dbData) => {
      if (dbData.transactions?.length > 0 || dbData.recurringExpenses?.length > 0) {
        set({
          transactions: dbData.transactions || [],
          recurringExpenses: dbData.recurringExpenses || [],
          monthlyBalances: dbData.monthlyBalances || {},
          budgetGoals: dbData.budgetGoals || {},
          debts: dbData.debts || [],
          savingsGoal: dbData.savingsGoal ?? get().savingsGoal,
          autoBackupEnabled: dbData.autoBackup ?? get().autoBackupEnabled,
          lastBackupDate: dbData.lastBackup ?? get().lastBackupDate,
          notificationsEnabled: dbData.notifications ?? get().notificationsEnabled,
          onboarded: dbData.onboarded ?? get().onboarded,
          hydrated: true,
        });
      } else {
        set({ hydrated: true });
      }
    },

    // ── Transaction CRUD ────────────────────────────────────
    addTx: (tx) => {
      const accountId = tx.accountId || 'primary';
      set(s => ({ transactions: [...s.transactions, { ...tx, id: uid(), accountId }], modal: null }));
    },
    updateTx: (tx) => set(s => ({ transactions: s.transactions.map(t => t.id === tx.id ? tx : t), editTx: null })),
    deleteTx: (id) => {
      const tx = get().transactions.find(t => t.id === id);
      if (tx?.autoGenerated && tx?.recurringId) {
        const parts = getDateParts(tx.date);
        if (parts) suppressAutoGen(tx.recurringId, parts.month, parts.year);
      }
      set(s => ({ transactions: s.transactions.filter(t => t.id !== id) }));
    },
    duplicateTx: (tx) => {
      set(s => ({ transactions: [...s.transactions, { ...tx, id: uid(), date: new Date().toISOString().split('T')[0], paid: tx.amount > 0 }] }));
    },
    togglePaid: (id) => set(s => ({ transactions: s.transactions.map(t => t.id === id ? { ...t, paid: !t.paid } : t) })),

    // ── Recurring CRUD ───────────────────────────────────────
    addRecurring: (r) => {
      set(s => ({ recurringExpenses: [...s.recurringExpenses, { ...r, id: uid(), active: true }], modal: null }));
    },
    updateRecurring: (r) => set(s => ({ recurringExpenses: s.recurringExpenses.map(e => e.id === r.id ? r : e), editRecurring: null })),
    deleteRecurring: (id) => set(s => ({ recurringExpenses: s.recurringExpenses.filter(r => r.id !== id) })),
    toggleRecurringActive: (id) => set(s => ({ recurringExpenses: s.recurringExpenses.map(r => r.id === id ? { ...r, active: !r.active } : r) })),
    createFromRecurring: (r) => {
      const today = new Date();
      set(s => ({ transactions: [...s.transactions, { id: uid(), date: today.toISOString().split('T')[0], desc: r.name, amount: -r.amount, category: r.category, paid: r.autoPay }] }));
    },

    // ── Account CRUD ─────────────────────────────────────────
    addAccount: (account) => {
      set(s => ({ accounts: [...s.accounts, { ...account, id: uid() }], modal: null }));
    },
    updateAccount: (account) => set(s => ({ accounts: s.accounts.map(a => a.id === account.id ? account : a) })),
    deleteAccount: (id) => {
      if (id === 'primary') return; // prevent deleting primary
      // Move transactions from deleted account to primary
      set(s => ({
        accounts: s.accounts.filter(a => a.id !== id),
        transactions: s.transactions.map(t => t.accountId === id ? { ...t, accountId: 'primary' } : t),
      }));
    },

    // ── Balance Setters ──────────────────────────────────────
    setBeginningBalance: (value) => {
      const { month, year } = get();
      const key = getMonthKey(month, year);
      set(s => ({ monthlyBalances: { ...s.monthlyBalances, [key]: { ...s.monthlyBalances[key], beginning: parseFloat(value) || 0 } } }));
    },
    setEndingBalance: (value) => {
      const { month, year } = get();
      const key = getMonthKey(month, year);
      set(s => ({ monthlyBalances: { ...s.monthlyBalances, [key]: { ...s.monthlyBalances[key], ending: parseFloat(value) || 0 } } }));
    },

    // ── Dropbox Actions ──────────────────────────────────────
    disconnectDropbox: () => {
      set({
        dropboxToken: null,
        dropboxConnected: false,
        dropboxLastSync: null,
        dropboxError: null,
      });
      localStorage.removeItem('bb_dropboxToken');
      localStorage.removeItem('bb_dropboxConnected');
      localStorage.removeItem('bb_dropboxLastSync');
    },
  }))
);

// ── Persistence Subscriptions ──────────────────────────────────
// Dual-write: localStorage (fallback) + IndexedDB (primary)
const persistDual = (selector, lsKey, dbWrite) => {
  useAppStore.subscribe(selector, (val) => {
    saveData(lsKey, val);
    if (useAppStore.getState().hydrated) {
      dbWrite(val).catch(() => {});
    }
  });
};

persistDual(s => s.transactions,      'transactions',      v => transactionsDB.replaceAll(v));
persistDual(s => s.recurringExpenses,  'recurring',         v => recurringDB.replaceAll(v));
persistDual(s => s.monthlyBalances,    'monthlyBalances',   v => balancesDB.replaceAll(v));
persistDual(s => s.budgetGoals,        'budgetGoals',       v => budgetDB.replaceAll(v));
persistDual(s => s.debts,              'debts',             v => debtsDB.replaceAll(v));

persistDual(s => s.savingsGoal,        'savingsGoal',       v => settingsDB.set('savingsGoal', v));
persistDual(s => s.onboarded,          'onboarded',         v => settingsDB.set('onboarded', v));
persistDual(s => s.autoBackupEnabled,  'autoBackup',        v => settingsDB.set('autoBackup', v));
persistDual(s => s.lastBackupDate,     'lastBackup',        v => settingsDB.set('lastBackup', v));
persistDual(s => s.notificationsEnabled, 'notifications',   v => settingsDB.set('notifications', v));

// localStorage-only persistence
const persistLS = (selector, lsKey) => {
  useAppStore.subscribe(selector, (val) => saveData(lsKey, val));
};

persistLS(s => s.licenseKey,       'licenseKey');
persistLS(s => s.licenseEmail,     'licenseEmail');
persistLS(s => s.licenseStatus,    'licenseStatus');
persistLS(s => s.licenseExpiry,    'licenseExpiry');
persistLS(s => s.analyticsConsent, 'analyticsConsent');
persistLS(s => s.accounts,        'accounts');
persistLS(s => s.dashboardWidget,  'dashboardWidget');
persistLS(s => s.dropboxConnected, 'dropboxConnected');
persistLS(s => s.dropboxToken,     'dropboxToken');
persistLS(s => s.dropboxLastSync,  'dropboxLastSync');
