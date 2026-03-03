import React, { useEffect, useCallback } from 'react';
import { Download, PiggyBank, Calendar, Plus, X, Target, ChevronLeft, ChevronRight, Building2, Settings, LayoutGrid, Receipt, Link2, Loader2, Menu, RefreshCw, Upload, Lightbulb, AlertTriangle, CheckCircle, CreditCard, PieChart, FileSpreadsheet, Check, Clock } from 'lucide-react';
import { CATEGORIES, MONTHS, FULL_MONTHS } from './utils/constants';
import { uid, currency } from './utils/formatters';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useAppInit } from './hooks/useAppInit';
import { useMediaQuery } from './hooks/useMediaQuery';
import { useAppStore } from './stores/useAppStore';
import { useFinancialData } from './hooks/useFinancialData';
import { useImportExport } from './hooks/useImportExport';
import { useDropbox } from './hooks/useDropbox';
import Modal from './components/Modal';
import TxForm from './components/TxForm';
import RecurringForm from './components/RecurringForm';
import DebtForm from './components/DebtForm';
import OnboardingWizard from './components/OnboardingWizard';
import LicenseModal from './components/LicenseModal';
import AnalyticsConsentModal from './components/AnalyticsConsentModal';
import { useRecurringAutoGen } from './hooks/useRecurringAutoGen';
import { useLicenseManager } from './hooks/useLicenseManager';
import { useAnalytics } from './hooks/useAnalytics';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import Dashboard from './views/Dashboard';
import Transactions from './views/Transactions';
import Recurring from './views/Recurring';
import Accounts from './views/Accounts';
import Cycle from './views/Cycle';
import Savings from './views/Savings';
import Recommendations from './views/Recommendations';
import Budget from './views/Budget';
import Analytics from './views/Analytics';
import Debts from './views/Debts';
import SettingsView from './views/Settings';

const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron;

export default function App() {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const swReg = useRegisterSW({ immediate: !isElectron });
  const needRefresh = swReg.needRefresh?.[0] || false;
  const updateServiceWorker = swReg.updateServiceWorker;
  const { initialized: dbReady, data: dbData } = useAppInit();

  // Store state
  const view = useAppStore(s => s.view);
  const setView = useAppStore(s => s.setView);
  const month = useAppStore(s => s.month);
  const setMonth = useAppStore(s => s.setMonth);
  const year = useAppStore(s => s.year);
  const setYear = useAppStore(s => s.setYear);
  const modal = useAppStore(s => s.modal);
  const setModal = useAppStore(s => s.setModal);
  const editTx = useAppStore(s => s.editTx);
  const setEditTx = useAppStore(s => s.setEditTx);
  const editRecurring = useAppStore(s => s.editRecurring);
  const setEditRecurring = useAppStore(s => s.setEditRecurring);
  const editDebt = useAppStore(s => s.editDebt);
  const setEditDebt = useAppStore(s => s.setEditDebt);
  const sidebarOpen = useAppStore(s => s.sidebarOpen);
  const setSidebarOpen = useAppStore(s => s.setSidebarOpen);
  const linkedAccounts = useAppStore(s => s.linkedAccounts);
  const plaidLoading = useAppStore(s => s.plaidLoading);
  const importData = useAppStore(s => s.importData);
  const setImportData = useAppStore(s => s.setImportData);
  const importNotification = useAppStore(s => s.importNotification);
  const setImportNotification = useAppStore(s => s.setImportNotification);
  const restoreData = useAppStore(s => s.restoreData);
  const setRestoreData = useAppStore(s => s.setRestoreData);
  const transactions = useAppStore(s => s.transactions);
  const setTransactions = useAppStore(s => s.setTransactions);
  const recurringExpenses = useAppStore(s => s.recurringExpenses);
  const setRecurringExpenses = useAppStore(s => s.setRecurringExpenses);
  const monthlyBalances = useAppStore(s => s.monthlyBalances);
  const setMonthlyBalances = useAppStore(s => s.setMonthlyBalances);
  const savingsGoal = useAppStore(s => s.savingsGoal);
  const setSavingsGoal = useAppStore(s => s.setSavingsGoal);
  const budgetGoals = useAppStore(s => s.budgetGoals);
  const setBudgetGoals = useAppStore(s => s.setBudgetGoals);
  const debts = useAppStore(s => s.debts);
  const setDebts = useAppStore(s => s.setDebts);
  const autoBackupEnabled = useAppStore(s => s.autoBackupEnabled);
  const lastBackupDate = useAppStore(s => s.lastBackupDate);
  const setLastBackupDate = useAppStore(s => s.setLastBackupDate);
  const notificationsEnabled = useAppStore(s => s.notificationsEnabled);
  const hydrated = useAppStore(s => s.hydrated);
  const hydrate = useAppStore(s => s.hydrate);
  const onboarded = useAppStore(s => s.onboarded);
  const addTx = useAppStore(s => s.addTx);
  const updateTx = useAppStore(s => s.updateTx);
  const addRecurring = useAppStore(s => s.addRecurring);
  const updateRecurring = useAppStore(s => s.updateRecurring);

  // Computed data for nav badges
  const { stats, budgetStats, savingsRecommendations } = useFinancialData();

  // Import/Export handlers
  const { exportCSV, downloadTemplate, handleFileImport, confirmImport } = useImportExport();

  // Dropbox (handles OAuth callback via effect)
  useDropbox();

  // Auto-generate transactions from recurring expenses
  useRecurringAutoGen();

  // License manager
  useLicenseManager();

  // Analytics (tracks page views when opted in)
  const { trackPageView } = useAnalytics();
  const analyticsConsent = useAppStore(s => s.analyticsConsent);

  // Global keyboard shortcuts
  useKeyboardShortcuts();

  // Hydrate from IndexedDB
  useEffect(() => { if (dbReady && dbData && !hydrated) hydrate(dbData); }, [dbReady, dbData, hydrated, hydrate]);

  // Show analytics consent prompt after onboarding (one-time)
  useEffect(() => {
    if (hydrated && onboarded && analyticsConsent === 'not-asked') {
      // Delay slightly so it doesn't compete with onboarding
      const t = setTimeout(() => setModal('analytics-consent'), 1500);
      return () => clearTimeout(t);
    }
  }, [hydrated, onboarded, analyticsConsent, setModal]);

  // Track page views
  useEffect(() => { trackPageView(view); }, [view, trackPageView]);

  // Auto-backup every 24 hours
  const performAutoBackup = useCallback(() => {
    const state = useAppStore.getState();
    const backup = { version: __APP_VERSION__, exportDate: new Date().toISOString(), autoBackup: true, data: { transactions: state.transactions, recurringExpenses: state.recurringExpenses, monthlyBalances: state.monthlyBalances, savingsGoal: state.savingsGoal, budgetGoals: state.budgetGoals, debts: state.debts } };
    try { localStorage.setItem('bb_autoBackup', JSON.stringify(backup)); setLastBackupDate(new Date().toISOString()); } catch {}
  }, [setLastBackupDate]);

  useEffect(() => {
    if (!autoBackupEnabled) return;
    const check = () => { const last = lastBackupDate ? new Date(lastBackupDate) : null; if (!last || (Date.now() - last) > 86400000) performAutoBackup(); };
    check();
    const id = setInterval(check, 3600000);
    return () => clearInterval(id);
  }, [autoBackupEnabled, lastBackupDate, performAutoBackup]);

  // Request notification permission
  useEffect(() => { if (notificationsEnabled && 'Notification' in window) Notification.requestPermission(); }, [notificationsEnabled]);

  // Bill reminder notifications
  useEffect(() => {
    if (!notificationsEnabled || !('Notification' in window) || Notification.permission !== 'granted') return;
    const todayKey = new Date().toISOString().split('T')[0];
    const shownKey = 'bb_notified_' + todayKey;
    const alreadyShown = new Set(JSON.parse(localStorage.getItem(shownKey) || '[]'));
    const day = new Date().getDate();
    const newlyShown = [];
    recurringExpenses.filter(r => r.active).forEach(r => {
      if (alreadyShown.has(r.id)) return;
      const daysUntil = r.dueDay >= day ? r.dueDay - day : (30 - day) + r.dueDay;
      if (daysUntil <= 3 && daysUntil >= 0) {
        new Notification('Bill Reminder', { body: `${r.name} (${currency(r.amount)}) is due ${daysUntil === 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`}`, icon: '/icon.svg' });
        newlyShown.push(r.id);
      }
    });
    if (newlyShown.length > 0) { try { localStorage.setItem(shownKey, JSON.stringify([...alreadyShown, ...newlyShown])); } catch {} }
  }, [notificationsEnabled, recurringExpenses]);

  const connectBank = () => { alert('Bank connection is coming soon!\n\nPlaid integration is in development.'); setModal(null); };

  const NavItem = ({ id, icon: Icon, label, badge }) => (
    <button onClick={() => { setView(id); if (isMobile) setSidebarOpen(false); }} className={`flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all ${view === id ? 'bg-gradient-to-r from-[#1e3a5f] to-[#14b8a6] text-white shadow-lg' : 'text-slate-600 hover:bg-gradient-to-r hover:from-[#0f172a]/5 hover:to-[#14b8a6]/5'}`}>
      <div className="flex items-center gap-3"><Icon size={20} /><span className="font-medium">{label}</span></div>
      {badge && <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${view === id ? 'bg-white/20' : 'bg-gradient-to-r from-green-100 to-blue-100 text-[#14b8a6]'}`}>{badge}</span>}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f]/10 via-white to-[#14b8a6]/10" style={{ fontFamily: "'Inter', sans-serif" }}>
      {isMobile && sidebarOpen && <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside role="navigation" aria-label="Main navigation" className={`fixed left-0 top-0 bottom-0 w-64 bg-gradient-to-b from-white via-[#1e3a5f]/5 to-[#14b8a6]/5 border-r border-[#1e3a5f]/20 p-6 flex flex-col z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#0f172a] flex items-center justify-center shadow-lg overflow-hidden">
            <svg viewBox="0 0 100 100" className="w-8 h-8">
              <defs><linearGradient id="navyGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style={{stopColor:'#1e3a5f'}} /><stop offset="100%" style={{stopColor:'#0f172a'}} /></linearGradient><linearGradient id="tealGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{stopColor:'#14b8a6'}} /><stop offset="100%" style={{stopColor:'#0d9488'}} /></linearGradient></defs>
              <path d="M 50 5 L 92 18 L 92 55 C 92 78 73 92 50 98 C 27 92 8 78 8 55 L 8 18 Z" fill="url(#navyGrad)"/><path d="M 50 14 L 82 24 L 82 54 C 82 72 67 83 50 88 C 33 83 18 72 18 54 L 18 24 Z" fill="none" stroke="url(#tealGrad)" strokeWidth="3"/><circle cx="50" cy="52" r="24" fill="url(#tealGrad)"/><path d="M 36 52 L 46 62 L 66 42" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div><h1 className="font-bold text-lg bg-gradient-to-r from-[#1e3a5f] to-[#14b8a6] bg-clip-text text-transparent">BalanceBooks</h1><p className="text-xs text-slate-400">Pro &bull; v{__APP_VERSION__}</p></div>
        </div>
        <nav className="space-y-1 flex-1 overflow-y-auto">
          <NavItem id="dashboard" icon={LayoutGrid} label="Dashboard" />
          <NavItem id="transactions" icon={Receipt} label="Transactions" badge={stats.unpaidCount || null} />
          <NavItem id="budget" icon={Target} label="Budget Goals" badge={budgetStats.categoriesOverBudget || null} />
          <NavItem id="analytics" icon={PieChart} label="Analytics" />
          <NavItem id="debts" icon={CreditCard} label="Debt Payoff" badge={debts.length || null} />
          <NavItem id="recurring" icon={RefreshCw} label="Recurring" badge={recurringExpenses.filter(r => r.active).length || null} />
          <NavItem id="accounts" icon={Building2} label="Bank Accounts" badge={linkedAccounts.length || null} />
          <NavItem id="cycle" icon={Calendar} label="12-Month Cycle" />
          <NavItem id="savings" icon={PiggyBank} label="Savings" />
          <NavItem id="recommendations" icon={Lightbulb} label="Smart Tips" badge={savingsRecommendations.filter(r => r.priority === 'high').length || null} />
          <NavItem id="settings" icon={Settings} label="Settings" />
        </nav>
        <div className="pt-6 border-t border-[#1e3a5f]/20 space-y-2">
          <button onClick={() => setModal('connect')} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-gradient-to-r from-[#14b8a6] to-[#0d9488] text-white font-medium hover:from-[#0d9488] hover:to-[#0f172a] shadow-md"><Link2 size={20} /><span>Connect Bank</span></button>
          <button onClick={() => setModal('import')} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-gradient-to-r from-[#1e3a5f] to-[#14b8a6] text-white font-medium hover:from-[#1e3a5f] hover:to-[#0f172a] shadow-md"><Upload size={20} /><span>Import</span></button>
          <button onClick={exportCSV} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-slate-500 hover:bg-white border border-[#1e3a5f]/20"><Download size={20} /><span className="font-medium">Export</span></button>
        </div>
      </aside>

      {/* Main Content */}
      <main id="main-content" className={`transition-all duration-300 ${sidebarOpen && !isMobile ? 'ml-64' : 'ml-0'}`}>
        <header className="sticky top-0 z-30 bg-gradient-to-r from-[#0f172a]/5/95 via-white/95 to-[#14b8a6]/5/95 backdrop-blur-lg border-b border-[#1e3a5f]/20">
          <div className="flex items-center justify-between px-4 md:px-8 py-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'} className="p-2 rounded-lg hover:bg-[#14b8a6]/10 text-[#14b8a6]"><Menu size={20} /></button>
              <div><h2 className="font-bold text-slate-900 text-xl capitalize">{view === 'accounts' ? 'Bank Accounts' : view === 'recommendations' ? 'Smart Tips' : view}</h2><p className="text-sm text-[#14b8a6] font-medium">{FULL_MONTHS[month]} {year}</p></div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-gradient-to-r from-[#0f172a]/5 to-[#14b8a6]/5 border-2 border-[#1e3a5f]/20 rounded-xl overflow-hidden shadow-sm">
                <button onClick={() => { if (month === 0) { setMonth(11); setYear(year - 1); } else setMonth(month - 1); }} aria-label="Previous month" className="p-3 hover:bg-[#14b8a6]/10 text-[#14b8a6]"><ChevronLeft size={18} /></button>
                <span className="px-4 font-semibold text-slate-700 min-w-[60px] text-center">{MONTHS[month]}</span>
                <button onClick={() => { if (month === 11) { setMonth(0); setYear(year + 1); } else setMonth(month + 1); }} aria-label="Next month" className="p-3 hover:bg-[#14b8a6]/10 text-[#14b8a6]"><ChevronRight size={18} /></button>
              </div>
              {!isMobile && <button onClick={() => setModal('add')} aria-label="Add new transaction" className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#1e3a5f] to-[#14b8a6] text-white rounded-xl font-medium hover:from-blue-700 hover:to-green-600 shadow-lg"><Plus size={18} />Add</button>}
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8">
          {view === 'dashboard' && <Dashboard />}
          {view === 'transactions' && <Transactions />}
          {view === 'recurring' && <Recurring />}
          {view === 'accounts' && <Accounts />}
          {view === 'cycle' && <Cycle />}
          {view === 'savings' && <Savings />}
          {view === 'recommendations' && <Recommendations />}
          {view === 'budget' && <Budget />}
          {view === 'analytics' && <Analytics />}
          {view === 'debts' && <Debts />}
          {view === 'settings' && <SettingsView />}
        </div>
      </main>

      {/* Mobile FAB */}
      {isMobile && <button onClick={() => setModal('add')} aria-label="Add transaction" className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-[#1e3a5f] to-[#14b8a6] text-white rounded-full shadow-xl flex items-center justify-center z-30 hover:from-blue-700 hover:to-green-600"><Plus size={24} /></button>}

      {/* PWA Update Banner */}
      {needRefresh && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#1e3a5f] to-[#14b8a6] text-white p-4 flex items-center justify-between z-50 shadow-lg">
          <div><strong>Update Available</strong><p className="text-sm opacity-90">A new version of Balance Books Pro is ready.</p></div>
          <button onClick={() => updateServiceWorker(true)} className="px-4 py-2 bg-white text-[#1e3a5f] rounded-lg font-semibold hover:bg-slate-100">Update Now</button>
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────── */}
      {modal === 'edit-beginning' && (
        <Modal title="Edit Beginning Balance" onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-[#0f172a]/5 to-[#14b8a6]/5 rounded-xl p-4 border border-[#1e3a5f]/20"><p className="text-sm text-slate-600">Set the starting balance for <strong>{FULL_MONTHS[month]} {year}</strong>.</p></div>
            <div><label className="block text-sm text-slate-600 font-medium mb-2">Beginning Balance</label><input type="number" defaultValue={stats.beginning} onChange={(e) => useAppStore.getState().setBeginningBalance(e.target.value)} className="w-full px-4 py-4 bg-white border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-[#14b8a6] text-2xl font-bold text-[#14b8a6]" autoFocus /></div>
            <div className="flex gap-3"><button onClick={() => setModal(null)} className="flex-1 px-4 py-3 bg-slate-100 rounded-xl text-slate-700 font-medium hover:bg-slate-200">Close</button><button onClick={() => setModal(null)} className="flex-1 px-4 py-3 bg-gradient-to-r from-[#1e3a5f] to-[#14b8a6] text-white rounded-xl font-semibold shadow-lg hover:from-blue-700 hover:to-green-600">Save</button></div>
          </div>
        </Modal>
      )}

      {modal === 'edit-ending' && (
        <Modal title="Edit Ending Balance" onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-[#14b8a6]/5 to-blue-50 rounded-xl p-4 border border-[#14b8a6]/20"><p className="text-sm text-slate-600">Override the ending balance for <strong>{FULL_MONTHS[month]} {year}</strong>.</p><p className="text-xs text-slate-400 mt-2">Calculated value: {currency(stats.calculatedEnding)}</p></div>
            <div><label className="block text-sm text-slate-600 font-medium mb-2">Ending Balance</label><input type="number" defaultValue={stats.ending} onChange={(e) => useAppStore.getState().setEndingBalance(e.target.value)} className="w-full px-4 py-4 bg-white border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-[#14b8a6] text-2xl font-bold text-[#14b8a6]" autoFocus /></div>
            <div className="flex gap-3"><button onClick={() => setModal(null)} className="flex-1 px-4 py-3 bg-slate-100 rounded-xl text-slate-700 font-medium hover:bg-slate-200">Close</button><button onClick={() => setModal(null)} className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-blue-500 text-white rounded-xl font-semibold shadow-lg">Save</button></div>
          </div>
        </Modal>
      )}

      {modal === 'edit-income' && (
        <Modal title="Add/Adjust Income" onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-[#14b8a6]/5 to-blue-50 rounded-xl p-4 border border-[#14b8a6]/20"><p className="text-sm text-slate-600">Current income for <strong>{FULL_MONTHS[month]} {year}</strong>: <span className="font-bold text-[#14b8a6]">{currency(stats.income)}</span></p></div>
            <button onClick={() => setModal('add')} className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-green-600 to-[#14b8a6]/50 text-white rounded-xl font-semibold shadow-lg"><Plus size={18} />Add Income Transaction</button>
            <button onClick={() => { setView('transactions'); useAppStore.getState().setFilterCat('income'); setModal(null); }} className="w-full flex items-center justify-center gap-2 py-3 bg-[#14b8a6]/5 text-green-700 rounded-xl font-medium border border-[#14b8a6]/20"><Receipt size={18} />View All Income</button>
            <button onClick={() => setModal(null)} className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200"><X size={18} className="inline mr-1" />Close</button>
          </div>
        </Modal>
      )}

      {modal === 'edit-expenses' && (
        <Modal title="Add/Adjust Expenses" onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-rose-50 to-orange-50 rounded-xl p-4 border border-rose-200"><p className="text-sm text-slate-600">Current expenses for <strong>{FULL_MONTHS[month]} {year}</strong>: <span className="font-bold text-rose-600">{currency(stats.expenses)}</span></p>{stats.unpaidCount > 0 && <p className="text-xs text-amber-600 mt-2 font-medium">{stats.unpaidCount} transactions marked as unpaid</p>}</div>
            <button onClick={() => setModal('add')} className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-rose-600 to-rose-500 text-white rounded-xl font-semibold shadow-lg"><Plus size={18} />Add Expense</button>
            <button onClick={() => { setView('transactions'); useAppStore.getState().setFilterPaid('unpaid'); setModal(null); }} className="w-full py-3 bg-amber-50 text-amber-700 rounded-xl font-medium border border-amber-200"><Clock size={18} className="inline mr-1" />View Unpaid ({stats.unpaidCount})</button>
            <button onClick={() => { setView('transactions'); setModal(null); }} className="w-full py-3 bg-rose-50 text-rose-700 rounded-xl font-medium border border-rose-200"><Receipt size={18} className="inline mr-1" />View All</button>
            <button onClick={() => setModal(null)} className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-medium"><X size={18} className="inline mr-1" />Close</button>
          </div>
        </Modal>
      )}

      {modal === 'edit-goal' && (
        <Modal title="Edit Savings Goal" onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-[#14b8a6]/5 to-blue-50 rounded-xl p-4 border border-[#14b8a6]/20"><p className="text-sm text-slate-600">Set your monthly savings target. Experts recommend at least 20% of income.</p></div>
            <div><label className="block text-sm text-slate-600 font-medium mb-2">Monthly Savings Goal</label><input type="number" defaultValue={savingsGoal} onChange={(e) => setSavingsGoal(parseFloat(e.target.value) || 0)} className="w-full px-4 py-4 bg-white border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-[#14b8a6] text-2xl font-bold text-[#14b8a6]" autoFocus /></div>
            <button onClick={() => setModal(null)} className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-blue-500 text-white rounded-xl font-semibold shadow-lg">Save</button>
          </div>
        </Modal>
      )}

      {modal === 'add' && <Modal title="Add Transaction" onClose={() => setModal(null)}><TxForm onSubmit={addTx} onCancel={() => setModal(null)} showPaid /></Modal>}
      {editTx && <Modal title="Edit Transaction" onClose={() => setEditTx(null)}><TxForm tx={editTx} onSubmit={updateTx} onCancel={() => setEditTx(null)} showPaid /></Modal>}
      {modal === 'add-recurring' && <Modal title="Add Recurring Expense" onClose={() => setModal(null)}><RecurringForm onSubmit={addRecurring} onCancel={() => setModal(null)} /></Modal>}
      {editRecurring && <Modal title="Edit Recurring Expense" onClose={() => setEditRecurring(null)}><RecurringForm recurring={editRecurring} onSubmit={updateRecurring} onCancel={() => setEditRecurring(null)} /></Modal>}

      {modal === 'import' && (
        <Modal title="Import Expenses" onClose={() => setModal(null)}>
          <div className="space-y-6">
            <div className="text-center py-4"><div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1e3a5f] to-[#14b8a6] flex items-center justify-center mx-auto mb-4 shadow-lg"><FileSpreadsheet size={32} className="text-white" /></div><h3 className="text-lg font-semibold text-slate-900 mb-2">Bulk Import</h3><p className="text-slate-500 text-sm">Import from CSV/Excel template</p></div>
            <button onClick={downloadTemplate} className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-[#0f172a]/5 to-[#14b8a6]/5 text-slate-700 rounded-xl font-medium border-2 border-[#1e3a5f]/20"><Download size={18} className="text-[#14b8a6]" />Download Template</button>
            <div className="relative"><input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileImport} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" /><div className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-[#1e3a5f] to-[#14b8a6] text-white rounded-xl font-semibold shadow-lg"><Upload size={18} />Select File</div></div>
            <button onClick={() => setModal(null)} className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-medium border border-slate-200"><X size={18} className="inline mr-1" />Close</button>
          </div>
        </Modal>
      )}

      {modal === 'import-confirm' && importData && (
        <Modal title="Confirm Import" onClose={() => { setImportData(null); setModal(null); }}>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-xl p-4 border border-[#14b8a6]/20"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-[#14b8a6]/50 rounded-full flex items-center justify-center"><CheckCircle size={20} className="text-white" /></div><div><p className="font-bold text-green-800">{importData.transactions.length} transactions ready to import</p><p className="text-sm text-green-700">From: {importData.filename}</p></div></div></div>
            {importData.summary && <div className="grid grid-cols-2 gap-3"><div className="bg-[#14b8a6]/5 rounded-lg p-3 border border-[#14b8a6]/20"><p className="text-xs text-[#14b8a6] font-medium">Income</p><p className="text-lg font-bold text-green-700">{currency(importData.summary.income)}</p></div><div className="bg-red-50 rounded-lg p-3 border border-red-200"><p className="text-xs text-red-600 font-medium">Expenses</p><p className="text-lg font-bold text-red-700">{currency(importData.summary.expenses)}</p></div></div>}
            {importData.errors?.length > 0 && <div className="bg-amber-50 rounded-lg p-3 border border-amber-200"><p className="font-semibold text-amber-800 text-sm flex items-center gap-2"><AlertTriangle size={16} />{importData.errors.length} row(s) skipped</p><ul className="mt-2 text-xs text-amber-700 max-h-16 overflow-y-auto space-y-1">{importData.errors.slice(0, 3).map((err, i) => <li key={i}>&bull; {err}</li>)}{importData.errors.length > 3 && <li>...and {importData.errors.length - 3} more</li>}</ul></div>}
            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg">{importData.transactions.slice(0, 8).map((tx, i) => { const cat = CATEGORIES.find(c => c.id === tx.category); return (<div key={i} className="flex items-center justify-between p-3 border-b border-slate-100 last:border-b-0"><div className="flex items-center gap-3"><span className="text-lg">{cat?.icon || '📦'}</span><div><p className="font-medium text-sm text-slate-900">{tx.desc}</p><p className="text-xs text-slate-500">{tx.date} &bull; {cat?.name || 'Other'}</p></div></div><span className={`font-bold text-sm ${tx.amount > 0 ? 'text-[#14b8a6]' : 'text-slate-900'}`}>{tx.amount > 0 ? '+' : ''}{currency(tx.amount)}</span></div>); })}{importData.transactions.length > 8 && <p className="p-3 text-center text-sm text-slate-500 bg-slate-50">...and {importData.transactions.length - 8} more</p>}</div>
            <div className="flex gap-3 pt-2"><button onClick={() => { setImportData(null); setModal(null); }} className="flex-1 px-4 py-3 bg-slate-100 rounded-xl text-slate-700 font-medium">Cancel</button><button onClick={confirmImport} className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg">Import {importData.transactions.length}</button></div>
          </div>
        </Modal>
      )}

      {modal === 'connect' && (
        <Modal title="Connect Bank" onClose={() => setModal(null)}>
          <div className="space-y-5">
            <div className="text-center py-4"><div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1e3a5f] to-[#14b8a6] flex items-center justify-center mx-auto mb-4 shadow-lg"><Building2 size={32} className="text-white" /></div><h3 className="text-lg font-semibold text-slate-900 mb-2">Secure Bank Connection</h3><p className="text-slate-500 text-sm">Connect your bank to automatically track payments</p></div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3"><p className="text-sm text-amber-700"><strong>Demo Mode:</strong> This will simulate a bank connection.</p></div>
            <button onClick={connectBank} disabled={plaidLoading} className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-green-600 to-[#14b8a6]/50 text-white rounded-xl font-semibold disabled:opacity-50 shadow-lg">{plaidLoading ? <><Loader2 size={18} className="animate-spin" />Connecting...</> : <><Link2 size={18} />Connect Demo Bank</>}</button>
            <p className="text-xs text-slate-400 text-center">Your data is encrypted and stored locally</p>
          </div>
        </Modal>
      )}

      {modal === 'set-budgets' && (
        <Modal title="Set Budget Goals" onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-[#0f172a]/5 to-[#14b8a6]/5 rounded-xl p-4 border border-[#1e3a5f]/20"><p className="text-sm text-slate-600">Set monthly spending limits for each category.</p></div>
            <div className="max-h-96 overflow-y-auto space-y-3">{CATEGORIES.filter(c => c.id !== 'income').map(cat => (<div key={cat.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:border-blue-300"><span className="text-xl">{cat.icon}</span><span className="flex-1 font-medium text-slate-700">{cat.name}</span><div className="flex items-center gap-1"><span className="text-slate-400">$</span><input type="number" min="0" step="10" placeholder="0" value={budgetGoals[cat.id] || ''} onChange={(e) => setBudgetGoals({ ...budgetGoals, [cat.id]: parseFloat(e.target.value) || 0 })} className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-right font-medium focus:ring-2 focus:ring-[#14b8a6]" /></div></div>))}</div>
            <div className="flex gap-3 pt-4"><button onClick={() => setModal(null)} className="flex-1 px-4 py-3 bg-slate-100 rounded-xl text-slate-700 font-medium">Close</button><button onClick={() => setModal(null)} className="flex-1 px-4 py-3 bg-gradient-to-r from-[#1e3a5f] to-[#14b8a6] text-white rounded-xl font-semibold shadow-lg">Save Budgets</button></div>
          </div>
        </Modal>
      )}

      {modal === 'add-debt' && <Modal title="Add Debt" onClose={() => setModal(null)}><DebtForm onSubmit={(debt) => { setDebts([...debts, { ...debt, id: uid() }]); setModal(null); }} onCancel={() => setModal(null)} /></Modal>}
      {editDebt && <Modal title="Edit Debt" onClose={() => setEditDebt(null)}><DebtForm debt={editDebt} onSubmit={(debt) => { setDebts(debts.map(d => d.id === debt.id ? debt : d)); setEditDebt(null); }} onCancel={() => setEditDebt(null)} /></Modal>}

      {modal === 'restore-wizard' && (
        <Modal title="Restore Your Data" onClose={() => { setModal(null); setRestoreData(null); }}>
          <div className="space-y-4">
            {!restoreData ? (
              <div className="space-y-4">
                <div className="text-center py-6"><div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0f172a]/50 to-indigo-500 flex items-center justify-center mx-auto mb-4 shadow-lg"><Upload size={36} className="text-white" /></div><h3 className="text-lg font-semibold text-slate-900 mb-2">Select Your Backup File</h3><p className="text-sm text-slate-500">Choose the backup file you previously saved.</p></div>
                <div className="bg-blue-50 rounded-xl p-4 border border-[#1e3a5f]/20"><p className="text-sm text-blue-800 mb-2 font-medium">Where to find your backup:</p><ul className="text-sm text-blue-700 space-y-1"><li>&bull; Check your <strong>Downloads</strong> folder</li><li>&bull; Look for <strong>BalanceBooks-Backup-...</strong></li><li>&bull; Or check your email</li></ul></div>
                <div className="relative"><input type="file" accept=".backup,.json" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => { try { const parsed = JSON.parse(ev.target.result); const data = parsed.data || parsed; const txs = data.transactions || parsed.transactions; if (txs && Array.isArray(txs)) { setRestoreData({ filename: file.name, date: parsed.exportDateFormatted || parsed.exportDate || 'Unknown', version: parsed.version || '1.0', summary: parsed.summary || { transactions: txs.length, recurringBills: (data.recurringExpenses || []).length, debts: (data.debts || []).length, budgetGoals: Object.keys(data.budgetGoals || {}).filter(k => (data.budgetGoals || {})[k] > 0).length }, raw: parsed }); } else { alert('Not a valid backup file.'); } } catch { alert('Could not read this file.'); } }; reader.readAsText(file); e.target.value = ''; }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" /><div className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg cursor-pointer"><Upload size={18} />Choose Backup File</div></div>
                <button onClick={() => { setModal(null); setRestoreData(null); }} className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-medium">Cancel</button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center"><div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#14b8a6]/50 to-emerald-500 flex items-center justify-center mx-auto mb-3 shadow-lg"><CheckCircle size={32} className="text-white" /></div><h3 className="text-lg font-semibold text-slate-900">Backup Found!</h3></div>
                <div className="bg-gradient-to-r from-[#14b8a6]/5 to-emerald-50 rounded-xl p-4 border border-[#14b8a6]/20"><div className="flex items-center gap-2 mb-3"><FileSpreadsheet size={18} className="text-[#14b8a6]" /><span className="font-medium text-green-800">{restoreData.filename}</span></div><div className="text-sm text-green-700 space-y-1"><p>Saved: <strong>{typeof restoreData.date === 'string' && restoreData.date.includes('T') ? new Date(restoreData.date).toLocaleDateString() : restoreData.date}</strong></p><p>Version: <strong>{restoreData.version}</strong></p></div></div>
                <div className="bg-blue-50 rounded-xl p-4 border border-[#1e3a5f]/20"><p className="font-medium text-blue-800 mb-3">This backup contains:</p><div className="grid grid-cols-2 gap-3"><div className="bg-white rounded-lg p-3 text-center"><p className="text-2xl font-bold text-[#14b8a6]">{restoreData.summary.transactions}</p><p className="text-xs text-slate-500">Transactions</p></div><div className="bg-white rounded-lg p-3 text-center"><p className="text-2xl font-bold text-[#14b8a6]">{restoreData.summary.recurringBills}</p><p className="text-xs text-slate-500">Recurring</p></div><div className="bg-white rounded-lg p-3 text-center"><p className="text-2xl font-bold text-purple-600">{restoreData.summary.debts}</p><p className="text-xs text-slate-500">Debts</p></div><div className="bg-white rounded-lg p-3 text-center"><p className="text-2xl font-bold text-amber-600">{restoreData.summary.budgetGoals}</p><p className="text-xs text-slate-500">Budgets</p></div></div></div>
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200"><p className="text-sm text-amber-800 flex items-start gap-2"><AlertTriangle size={18} className="shrink-0 mt-0.5" /><span><strong>Warning:</strong> This replaces all current data.</span></p></div>
                <div className="flex gap-3"><button onClick={() => setRestoreData(null)} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium">&larr; Back</button><button onClick={() => { const parsed = restoreData.raw; const data = parsed.data || parsed; const txs = Array.isArray(data.transactions || parsed.transactions) ? (data.transactions || parsed.transactions) : []; const validTxs = txs.filter(t => t && t.date && typeof t.amount === 'number'); setTransactions(validTxs); setRecurringExpenses(Array.isArray(data.recurringExpenses || parsed.recurringExpenses) ? (data.recurringExpenses || parsed.recurringExpenses) : []); setMonthlyBalances(typeof (data.monthlyBalances || parsed.monthlyBalances) === 'object' ? (data.monthlyBalances || parsed.monthlyBalances) : {}); const g = data.savingsGoal || parsed.savingsGoal; if (typeof g === 'number') setSavingsGoal(g); const bg = data.budgetGoals || parsed.budgetGoals; if (bg && typeof bg === 'object') setBudgetGoals(bg); const rd = data.debts || parsed.debts; if (Array.isArray(rd)) setDebts(rd); setRestoreData(null); setModal(null); setTimeout(() => alert(`Restore Complete!\n\n${restoreData.summary.transactions} transactions restored.`), 100); }} className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold shadow-lg">Restore My Data</button></div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {modal === 'license' && <LicenseModal onClose={() => setModal(null)} />}
      {modal === 'analytics-consent' && <AnalyticsConsentModal onClose={() => setModal(null)} />}

      {modal === 'keyboard-shortcuts' && (
        <Modal title="Keyboard Shortcuts" onClose={() => setModal(null)}>
          <div className="space-y-3">
            {[
              ['N', 'New transaction'],
              ['/', 'Search transactions'],
              ['\u2190 \u2192', 'Previous / next month'],
              ['1-5', 'Switch view (Dashboard, Transactions, Budget, Analytics, Recurring)'],
              ['Esc', 'Close modal'],
              ['?', 'Show this help'],
            ].map(([key, desc]) => (
              <div key={key} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <span className="text-sm text-slate-700">{desc}</span>
                <kbd className="px-2.5 py-1 bg-slate-100 border border-slate-300 rounded-lg text-xs font-mono font-semibold text-slate-600 shadow-sm">{key}</kbd>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* Onboarding Wizard */}
      {hydrated && !onboarded && <OnboardingWizard />}

      {/* Import Success Toast */}
      {importNotification && (
        <div className="fixed bottom-6 right-6 bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 animate-pulse max-w-sm">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0"><CheckCircle size={24} /></div>
            <div className="flex-1"><p className="font-bold text-lg">Import Successful!</p><p className="text-sm text-green-100 mt-1">{importNotification.count} transactions imported</p><div className="flex gap-4 mt-2 text-sm"><span className="text-green-200">+{currency(importNotification.income)} income</span><span className="text-red-200">-{currency(importNotification.expenses)} expenses</span></div></div>
            <button onClick={() => setImportNotification(null)} aria-label="Dismiss notification" className="text-white/70 hover:text-white p-1"><X size={18} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
