import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { 
  db, 
  transactionsDB, 
  recurringDB, 
  balancesDB, 
  budgetDB, 
  debtsDB, 
  settingsDB,
  exportAllData,
  importAllData,
  clearAllData
} from './db/database';
import { migrateFromLocalStorage, loadFromIndexedDB, needsMigration } from './db/migration';
import { Download, PiggyBank, TrendingUp, TrendingDown, Calendar, Plus, Trash2, Edit2, X, ArrowUpRight, ArrowDownRight, Wallet, Target, ChevronLeft, ChevronRight, Building2, Settings, Search, LayoutGrid, Receipt, Shield, Link2, Unlink, Loader2, Menu, RefreshCw, Check, Clock, AlertCircle, FileSpreadsheet, Upload, Lightbulb, DollarSign, Bell, Calculator, Sparkles, AlertTriangle, CheckCircle, Info, CreditCard, Percent, Zap, TrendingUp as Trending, PieChart, BarChart3, Goal, Smartphone, Cloud, HardDrive, Mail, Save } from 'lucide-react';

// App version
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.8.0';

// Cache version for force refresh
const CACHE_VERSION = '1.8.0';
const forceRefreshOnNewVersion = () => {
  const storedVersion = localStorage.getItem('bb_app_version');
  if (storedVersion && storedVersion !== CACHE_VERSION) {
    console.log(`Version changed from ${storedVersion} to ${CACHE_VERSION}, clearing cache...`);
    if ('caches' in window) {
      caches.keys().then(names => names.forEach(name => caches.delete(name)));
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
    }
    localStorage.setItem('bb_app_version', CACHE_VERSION);
    window.location.reload(true);
    return true;
  }
  localStorage.setItem('bb_app_version', CACHE_VERSION);
  return false;
};

if (typeof window !== 'undefined') {
  forceRefreshOnNewVersion();
}

// Categories
const CATEGORIES = [
  { id: 'income', name: 'Income', color: '#059669', bg: '#ecfdf5', icon: '💵' },
  { id: 'housing', name: 'Housing', color: '#4f46e5', bg: '#eef2ff', icon: '🏠' },
  { id: 'utilities', name: 'Utilities', color: '#7c3aed', bg: '#f5f3ff', icon: '💡' },
  { id: 'groceries', name: 'Groceries', color: '#16a34a', bg: '#f0fdf4', icon: '🛒' },
  { id: 'transportation', name: 'Transportation', color: '#d97706', bg: '#fffbeb', icon: '🚗' },
  { id: 'healthcare', name: 'Healthcare', color: '#dc2626', bg: '#fef2f2', icon: '🏥' },
  { id: 'insurance', name: 'Insurance', color: '#0284c7', bg: '#f0f9ff', icon: '🛡️' },
  { id: 'entertainment', name: 'Entertainment', color: '#db2777', bg: '#fdf2f8', icon: '🎬' },
  { id: 'dining', name: 'Dining', color: '#ea580c', bg: '#fff7ed', icon: '🍽️' },
  { id: 'shopping', name: 'Shopping', color: '#9333ea', bg: '#faf5ff', icon: '🛍️' },
  { id: 'subscriptions', name: 'Subscriptions', color: '#0d9488', bg: '#f0fdfa', icon: '📱' },
  { id: 'education', name: 'Education', color: '#2563eb', bg: '#eff6ff', icon: '📚' },
  { id: 'tithes', name: 'Tithes & Offerings', color: '#7c3aed', bg: '#f5f3ff', icon: '⛪' },
  { id: 'savings', name: 'Savings', color: '#047857', bg: '#ecfdf5', icon: '💰' },
  { id: 'investment', name: 'Investment', color: '#065f46', bg: '#ecfdf5', icon: '📈' },
  { id: 'debt', name: 'Debt Payment', color: '#b91c1c', bg: '#fef2f2', icon: '💳' },
  { id: 'childcare', name: 'Childcare', color: '#f472b6', bg: '#fdf2f8', icon: '👶' },
  { id: 'pets', name: 'Pets', color: '#f59e0b', bg: '#fffbeb', icon: '🐾' },
  { id: 'personal', name: 'Personal Care', color: '#ec4899', bg: '#fdf2f8', icon: '💇' },
  { id: 'gifts', name: 'Gifts & Donations', color: '#8b5cf6', bg: '#f5f3ff', icon: '🎁' },
  { id: 'transfer', name: 'Transfer', color: '#475569', bg: '#f8fafc', icon: '🔄' },
  { id: 'other', name: 'Other', color: '#64748b', bg: '#f8fafc', icon: '📦' },
];

const FREQUENCY_OPTIONS = [
  { id: 'weekly', name: 'Weekly', days: 7 },
  { id: 'biweekly', name: 'Bi-Weekly', days: 14 },
  { id: 'monthly', name: 'Monthly', days: 30 },
  { id: 'quarterly', name: 'Quarterly', days: 90 },
  { id: 'yearly', name: 'Yearly', days: 365 },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const uid = () => Date.now().toString(36) + Math.random().toString(36).substr(2);
const currency = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const shortDate = (dateStr) => {
  if (!dateStr) return '';
  const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(match[2]) - 1]} ${parseInt(match[3])}`;
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron;
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

export default function App() {
  // Loading state - show spinner until IndexedDB data loads
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  
  // UI States
  const [view, setView] = useState('dashboard');
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [modal, setModal] = useState(null);
  const [editTx, setEditTx] = useState(null);
  const [editRecurring, setEditRecurring] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterPaid, setFilterPaid] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [linkedAccounts, setLinkedAccounts] = useState([]);
  const [plaidLoading, setPlaidLoading] = useState(false);
  const [importData, setImportData] = useState(null);
  const [importNotification, setImportNotification] = useState(null);
  const [editDebt, setEditDebt] = useState(null);
  const [editBudget, setEditBudget] = useState(null);
  const [restoreData, setRestoreData] = useState(null);
  const [selectedTxIds, setSelectedTxIds] = useState(new Set());
  
  // Data States - initialized empty, loaded from IndexedDB
  const [transactions, setTransactions] = useState([]);
  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [monthlyBalances, setMonthlyBalances] = useState({});
  const [savingsGoal, setSavingsGoal] = useState(500);
  const [budgetGoals, setBudgetGoals] = useState({});
  const [debts, setDebts] = useState([]);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  // Ref to track if initial load is complete (prevents save on load)
  const initialLoadComplete = useRef(false);

  // ============================================
  // INDEXEDDB INITIALIZATION
  // ============================================
  
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log(`[BalanceBooks] Initializing v${APP_VERSION}...`);
        
        // Check if migration from localStorage is needed
        if (needsMigration()) {
          console.log('[BalanceBooks] Migrating from localStorage...');
          const result = await migrateFromLocalStorage();
          if (!result.success && !result.skipped) {
            console.error('[BalanceBooks] Migration failed:', result.error);
          }
        }
        
        // Load all data from IndexedDB
        const data = await loadFromIndexedDB();
        
        // Set state with loaded data
        setTransactions(data.transactions || []);
        setRecurringExpenses(data.recurringExpenses || []);
        setMonthlyBalances(data.monthlyBalances || {});
        setBudgetGoals(data.budgetGoals || {});
        setDebts(data.debts || []);
        setSavingsGoal(data.savingsGoal ?? 500);
        setAutoBackupEnabled(data.autoBackup ?? false);
        setLastBackupDate(data.lastBackup ?? null);
        setNotificationsEnabled(data.notifications ?? false);
        
        console.log(`[BalanceBooks] Loaded ${data.transactions?.length || 0} transactions from IndexedDB`);
        
        // Mark initial load complete after state is set
        setTimeout(() => {
          initialLoadComplete.current = true;
        }, 100);
        
        setIsLoading(false);
      } catch (error) {
        console.error('[BalanceBooks] Initialization error:', error);
        setLoadError(error.message);
        setIsLoading(false);
      }
    };
    
    initializeApp();
  }, []);

  // ============================================
  // INDEXEDDB SAVE OPERATIONS
  // ============================================
  
  // Save transactions to IndexedDB when they change
  useEffect(() => {
    if (!initialLoadComplete.current) return;
    transactionsDB.replaceAll(transactions).catch(err => 
      console.error('[IndexedDB] Failed to save transactions:', err)
    );
  }, [transactions]);
  
  // Save recurring expenses
  useEffect(() => {
    if (!initialLoadComplete.current) return;
    recurringDB.replaceAll(recurringExpenses).catch(err => 
      console.error('[IndexedDB] Failed to save recurring:', err)
    );
  }, [recurringExpenses]);
  
  // Save monthly balances
  useEffect(() => {
    if (!initialLoadComplete.current) return;
    balancesDB.replaceAll(monthlyBalances).catch(err => 
      console.error('[IndexedDB] Failed to save balances:', err)
    );
  }, [monthlyBalances]);
  
  // Save budget goals
  useEffect(() => {
    if (!initialLoadComplete.current) return;
    budgetDB.replaceAll(budgetGoals).catch(err => 
      console.error('[IndexedDB] Failed to save budgets:', err)
    );
  }, [budgetGoals]);
  
  // Save debts
  useEffect(() => {
    if (!initialLoadComplete.current) return;
    debtsDB.replaceAll(debts).catch(err => 
      console.error('[IndexedDB] Failed to save debts:', err)
    );
  }, [debts]);
  
  // Save settings
  useEffect(() => {
    if (!initialLoadComplete.current) return;
    settingsDB.set('savingsGoal', savingsGoal).catch(err => 
      console.error('[IndexedDB] Failed to save savingsGoal:', err)
    );
  }, [savingsGoal]);
  
  useEffect(() => {
    if (!initialLoadComplete.current) return;
    settingsDB.set('autoBackup', autoBackupEnabled).catch(err => 
      console.error('[IndexedDB] Failed to save autoBackup:', err)
    );
  }, [autoBackupEnabled]);
  
  useEffect(() => {
    if (!initialLoadComplete.current) return;
    settingsDB.set('lastBackup', lastBackupDate).catch(err => 
      console.error('[IndexedDB] Failed to save lastBackup:', err)
    );
  }, [lastBackupDate]);
  
  useEffect(() => {
    if (!initialLoadComplete.current) return;
    settingsDB.set('notifications', notificationsEnabled).catch(err => 
      console.error('[IndexedDB] Failed to save notifications:', err)
    );
  }, [notificationsEnabled]);

  // ============================================
  // AUTO-BACKUP & NOTIFICATIONS
  // ============================================

  useEffect(() => {
    if (autoBackupEnabled && initialLoadComplete.current) {
      const checkBackup = () => {
        const last = lastBackupDate ? new Date(lastBackupDate) : null;
        const now = new Date();
        if (!last || (now - last) > 24 * 60 * 60 * 1000) {
          performAutoBackup();
        }
      };
      checkBackup();
      const interval = setInterval(checkBackup, 60 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [autoBackupEnabled, lastBackupDate]);

  useEffect(() => {
    if (notificationsEnabled && 'Notification' in window) {
      Notification.requestPermission();
    }
  }, [notificationsEnabled]);

  useEffect(() => {
    if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted' && initialLoadComplete.current) {
      const today = new Date();
      const day = today.getDate();
      recurringExpenses.filter(r => r.active).forEach(r => {
        const daysUntil = r.dueDay >= day ? r.dueDay - day : (30 - day) + r.dueDay;
        if (daysUntil <= 3 && daysUntil >= 0) {
          new Notification('💰 Bill Reminder', {
            body: `${r.name} (${currency(r.amount)}) is due ${daysUntil === 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`}`,
            icon: '/icon.svg'
          });
        }
      });
    }
  }, [notificationsEnabled, recurringExpenses]);

  const performAutoBackup = useCallback(async () => {
    try {
      const data = await exportAllData();
      const backup = {
        version: APP_VERSION,
        exportDate: new Date().toISOString(),
        autoBackup: true,
        storage: 'IndexedDB',
        data
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `balance-books-auto-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      setLastBackupDate(new Date().toISOString());
    } catch (err) {
      console.error('[AutoBackup] Failed:', err);
    }
  }, []);

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const getMonthKey = (m, y) => `${y}-${String(m + 1).padStart(2, '0')}`;
  const currentMonthKey = getMonthKey(month, year);

  const getBeginningBalance = (m, y) => {
    const key = getMonthKey(m, y);
    if (monthlyBalances[key]?.beginning !== undefined) {
      return monthlyBalances[key].beginning;
    }
    const prevMonth = m === 0 ? 11 : m - 1;
    const prevYear = m === 0 ? y - 1 : y;
    const prevKey = getMonthKey(prevMonth, prevYear);
    if (monthlyBalances[prevKey]?.ending !== undefined) {
      return monthlyBalances[prevKey].ending;
    }
    return 0;
  };

  const beginningBalance = getBeginningBalance(month, year);

  const setBeginningBalance = (value) => {
    setMonthlyBalances(prev => ({
      ...prev,
      [currentMonthKey]: { ...prev[currentMonthKey], beginning: parseFloat(value) || 0 }
    }));
  };

  const setEndingBalance = (value) => {
    setMonthlyBalances(prev => ({
      ...prev,
      [currentMonthKey]: { ...prev[currentMonthKey], ending: parseFloat(value) || 0 }
    }));
  };

  const getDateParts = (dateStr) => {
    if (!dateStr) return null;
    const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return { year: parseInt(match[1]), month: parseInt(match[2]) - 1, day: parseInt(match[3]) };
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
    }
    return null;
  };

  const monthTx = useMemo(() => transactions.filter(t => { 
    const parts = getDateParts(t.date);
    return parts && parts.month === month && parts.year === year; 
  }), [transactions, month, year]);

  const filtered = useMemo(() => {
    let list = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (search) list = list.filter(t => t.desc.toLowerCase().includes(search.toLowerCase()));
    if (filterCat !== 'all') list = list.filter(t => t.category === filterCat);
    if (filterPaid === 'paid') list = list.filter(t => t.paid);
    if (filterPaid === 'unpaid') list = list.filter(t => !t.paid);
    return list;
  }, [transactions, search, filterCat, filterPaid]);

  const stats = useMemo(() => {
    const income = monthTx.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const expenses = monthTx.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    const saved = monthTx.filter(t => t.category === 'savings').reduce((s, t) => s + Math.abs(t.amount), 0);
    const unpaidCount = monthTx.filter(t => !t.paid && t.amount < 0).length;
    const net = income - expenses;
    const calculatedEnding = beginningBalance + net;
    const ending = monthlyBalances[currentMonthKey]?.ending !== undefined 
      ? monthlyBalances[currentMonthKey].ending 
      : calculatedEnding;
    return { income, expenses, net, saved, unpaidCount, beginning: beginningBalance, ending, calculatedEnding };
  }, [monthTx, beginningBalance, monthlyBalances, currentMonthKey]);

  const catBreakdown = useMemo(() => {
    const map = {};
    monthTx.filter(t => t.amount < 0 && t.category !== 'savings').forEach(t => { 
      map[t.category] = (map[t.category] || 0) + Math.abs(t.amount); 
    });
    return Object.entries(map).map(([id, total]) => ({ 
      ...CATEGORIES.find(c => c.id === id), 
      total, 
      pct: stats.expenses > 0 ? (total / stats.expenses) * 100 : 0 
    })).sort((a, b) => b.total - a.total);
  }, [monthTx, stats.expenses]);

  const budgetAnalysis = useMemo(() => {
    return CATEGORIES.filter(c => c.id !== 'income').map(cat => {
      const spent = catBreakdown.find(c => c.id === cat.id)?.total || 0;
      const budget = budgetGoals[cat.id] || 0;
      const remaining = budget - spent;
      const percentUsed = budget > 0 ? (spent / budget) * 100 : 0;
      const status = budget === 0 ? 'no-budget' : percentUsed > 100 ? 'over' : percentUsed > 80 ? 'warning' : 'good';
      return { ...cat, spent, budget, remaining, percentUsed, status };
    }).filter(b => b.budget > 0 || b.spent > 0).sort((a, b) => b.spent - a.spent);
  }, [catBreakdown, budgetGoals]);

  const budgetStats = useMemo(() => {
    const totalBudget = Object.values(budgetGoals).reduce((s, v) => s + (v || 0), 0);
    const totalSpent = budgetAnalysis.reduce((s, b) => s + b.spent, 0);
    const categoriesOverBudget = budgetAnalysis.filter(b => b.status === 'over').length;
    const categoriesNearLimit = budgetAnalysis.filter(b => b.status === 'warning').length;
    return { totalBudget, totalSpent, remaining: totalBudget - totalSpent, categoriesOverBudget, categoriesNearLimit };
  }, [budgetGoals, budgetAnalysis]);

  const debtPayoffPlan = useMemo(() => {
    if (debts.length === 0) return { snowball: [], avalanche: [], totalDebt: 0, totalInterest: 0 };
    
    const totalDebt = debts.reduce((s, d) => s + d.balance, 0);
    const totalMinPayment = debts.reduce((s, d) => s + d.minPayment, 0);
    const snowball = [...debts].sort((a, b) => a.balance - b.balance);
    const avalanche = [...debts].sort((a, b) => b.interestRate - a.interestRate);
    
    const calculatePayoff = (sortedDebts) => {
      let totalInterestPaid = 0;
      let months = 0;
      const maxMonths = 360;
      let balances = sortedDebts.map(d => ({ ...d, currentBalance: d.balance }));
      
      while (balances.some(d => d.currentBalance > 0) && months < maxMonths) {
        months++;
        let availableExtra = 0;
        
        for (let i = 0; i < balances.length; i++) {
          const d = balances[i];
          if (d.currentBalance <= 0) continue;
          
          const monthlyInterest = (d.currentBalance * (d.interestRate / 100)) / 12;
          totalInterestPaid += monthlyInterest;
          d.currentBalance += monthlyInterest;
          
          let payment = d.minPayment + (i === balances.findIndex(b => b.currentBalance > 0) ? availableExtra : 0);
          payment = Math.min(payment, d.currentBalance);
          d.currentBalance -= payment;
          
          if (d.currentBalance <= 0) {
            availableExtra += d.minPayment;
          }
        }
      }
      
      return { months, totalInterestPaid: Math.round(totalInterestPaid) };
    };
    
    const snowballResult = calculatePayoff(snowball);
    const avalancheResult = calculatePayoff(avalanche);
    
    return { 
      snowball, 
      avalanche, 
      totalDebt, 
      totalMinPayment,
      snowballMonths: snowballResult.months,
      snowballInterest: snowballResult.totalInterestPaid,
      avalancheMonths: avalancheResult.months,
      avalancheInterest: avalancheResult.totalInterestPaid,
      interestSavings: snowballResult.totalInterestPaid - avalancheResult.totalInterestPaid
    };
  }, [debts]);

  const spendingTrends = useMemo(() => {
    const trends = [];
    for (let i = 5; i >= 0; i--) {
      const m = (month - i + 12) % 12;
      const y = month - i < 0 ? year - 1 : year;
      const txs = transactions.filter(t => {
        const parts = getDateParts(t.date);
        return parts && parts.month === m && parts.year === y;
      });
      const income = txs.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
      const expenses = txs.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
      trends.push({ month: MONTHS[m], year: y, income, expenses, net: income - expenses });
    }
    return trends;
  }, [transactions, month, year]);

  const savingsRecommendations = useMemo(() => {
    const recs = [];
    const avgIncome = stats.income || 0;
    const savingsRate = avgIncome > 0 ? (stats.saved / avgIncome) * 100 : 0;
    const expenseRatio = avgIncome > 0 ? (stats.expenses / avgIncome) * 100 : 0;
    
    const dining = catBreakdown.find(c => c.id === 'dining')?.total || 0;
    if (dining > 150) {
      recs.push({ 
        id: 1, type: 'reduce', priority: 'high',
        title: 'Reduce Dining Out Costs', 
        description: `You spent ${currency(dining)} on dining this month.`, 
        potential: dining * 0.4,
        tips: ['Cook at home 2 more days per week', 'Use meal planning apps', 'Bring lunch to work'],
        icon: '🍽️'
      });
    }
    
    const subs = catBreakdown.find(c => c.id === 'subscriptions')?.total || 0;
    if (subs > 50) {
      recs.push({ 
        id: 2, type: 'audit', priority: 'medium',
        title: 'Audit Your Subscriptions', 
        description: `${currency(subs)} in monthly subscriptions.`, 
        potential: subs * 0.3,
        tips: ['Cancel unused streaming services', 'Look for annual payment discounts', 'Share family plans'],
        icon: '📱'
      });
    }

    if (savingsRate < 10 && avgIncome > 0) {
      recs.push({ 
        id: 4, type: 'alert', priority: 'high',
        title: '🚨 Savings Rate Below 10%', 
        description: `You're only saving ${savingsRate.toFixed(1)}% of income.`, 
        potential: avgIncome * 0.1 - stats.saved,
        tips: ['Set up automatic transfer to savings', 'Start with $25-50 per paycheck', 'Build emergency fund first'],
        icon: '⚠️'
      });
    }

    if (savingsRate >= 20) {
      recs.push({ 
        id: 5, type: 'success', priority: 'low',
        title: '🎉 Excellent Savings Rate!', 
        description: `You're saving ${savingsRate.toFixed(1)}% of your income!`, 
        potential: 0,
        tips: ['Consider maxing retirement accounts', 'Look into index fund investing'],
        icon: '🏆'
      });
    }

    return recs.sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]));
  }, [catBreakdown, stats]);

  const upcomingBills = useMemo(() => {
    const today = new Date();
    const day = today.getDate();
    return recurringExpenses.filter(r => r.active).map(r => {
      let dueDate = new Date(year, month, r.dueDay);
      if (r.dueDay < day) dueDate = new Date(year, month + 1, r.dueDay);
      const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      return { ...r, dueDate, daysUntil };
    }).filter(r => r.daysUntil >= 0 && r.daysUntil <= 7).sort((a, b) => a.daysUntil - b.daysUntil);
  }, [recurringExpenses, month, year]);

  const cycleData = useMemo(() => {
    const data = [];
    for (let i = 0; i < 12; i++) {
      const m = (month - 11 + i + 12) % 12;
      const y = year - (month - 11 + i < 0 ? 1 : 0);
      const key = getMonthKey(m, y);
      const txs = transactions.filter(t => { 
        const parts = getDateParts(t.date);
        return parts && parts.month === m && parts.year === y; 
      });
      const inc = txs.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
      const exp = txs.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
      const beginning = getBeginningBalance(m, y);
      const calculated = beginning + inc - exp;
      const ending = monthlyBalances[key]?.ending !== undefined ? monthlyBalances[key].ending : calculated;
      data.push({ month: MONTHS[m], year: y, monthNum: m, income: inc, expenses: exp, net: inc - exp, beginning, ending });
    }
    return data;
  }, [transactions, month, year, monthlyBalances]);

  const totalMonthlyRecurring = recurringExpenses.filter(r => r.active).reduce((s, r) => s + r.amount, 0);

  // ============================================
  // EXPORT & IMPORT FUNCTIONS
  // ============================================

  const exportCSV = () => {
    const rows = [
      ['Balance Books Pro - Transaction Export'],
      [`Export Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`],
      [`Report Period: All Transactions`],
      [''],
      ['Date', 'Description', 'Amount', 'Category', 'Type', 'Status', 'Notes']
    ];
    
    const sortedTx = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedTx.forEach(t => {
      const cat = CATEGORIES.find(c => c.id === t.category);
      rows.push([
        t.date,
        `"${t.desc}"`,
        t.amount.toFixed(2),
        cat ? cat.name : t.category,
        t.amount >= 0 ? 'Income' : 'Expense',
        t.paid ? 'Paid' : 'Unpaid',
        ''
      ]);
    });
    
    const totalIncome = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    const netAmount = totalIncome - totalExpenses;
    
    rows.push(['']);
    rows.push(['=== SUMMARY ===']);
    rows.push(['Total Income', '', totalIncome.toFixed(2)]);
    rows.push(['Total Expenses', '', (-totalExpenses).toFixed(2)]);
    rows.push(['Net Amount', '', netAmount.toFixed(2)]);
    rows.push(['Total Transactions', '', transactions.length]);
    rows.push(['']);
    rows.push([`Generated by Balance Books Pro v${APP_VERSION}`]);
    
    const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); 
    a.href = URL.createObjectURL(blob); 
    a.download = `balance-books-export-${new Date().toISOString().split('T')[0]}.csv`; 
    a.click();
  };

  const downloadTemplate = () => {
    const rows = [
      ['Date', 'Description', 'Amount', 'Category', 'Type', 'Paid'],
      ['2025-01-15', 'Grocery Shopping', '-85.50', 'groceries', 'expense', 'yes'],
      ['2025-01-14', 'Gas Station', '-45.00', 'transportation', 'expense', 'yes'],
      ['2025-01-10', 'Electric Bill', '-125.00', 'utilities', 'expense', 'no'],
      ['2025-01-01', 'Paycheck', '2500.00', 'income', 'income', 'yes'],
      ['2025-01-05', 'Freelance Work', '350.00', 'income', 'income', 'yes']
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'balance-books-template.csv';
    a.click();
  };

  const parseDate = (dateValue) => {
    if (!dateValue && dateValue !== 0) return null;
    
    if (typeof dateValue === 'number' || (typeof dateValue === 'string' && /^\d+$/.test(dateValue.trim()))) {
      const num = parseFloat(dateValue);
      if (num > 0 && num < 100000) {
        const excelEpoch = new Date(Date.UTC(1899, 11, 30));
        const date = new Date(excelEpoch.getTime() + num * 86400000);
        if (!isNaN(date.getTime())) {
          const y = date.getUTCFullYear();
          const m = String(date.getUTCMonth() + 1).padStart(2, '0');
          const d = String(date.getUTCDate()).padStart(2, '0');
          return `${y}-${m}-${d}`;
        }
      }
    }
    
    const str = String(dateValue).trim();
    if (!str) return null;
    
    const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      const [, y, m, d] = isoMatch;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    
    const usMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (usMatch) {
      const [, m, d, y] = usMatch;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    
    const usShortMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
    if (usShortMatch) {
      const [, m, d, yy] = usShortMatch;
      const y = parseInt(yy) > 50 ? '19' + yy : '20' + yy;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
    
    return null;
  };

  const mapCategory = (catName) => {
    if (!catName) return 'other';
    const lower = String(catName).toLowerCase().trim();
    
    const exactMatch = CATEGORIES.find(c => c.id === lower || c.name.toLowerCase() === lower);
    if (exactMatch) return exactMatch.id;
    
    const aliases = {
      'tithe': 'tithes', 'tithes': 'tithes', 'offering': 'tithes', 'church': 'tithes',
      'donation': 'gifts', 'gift': 'gifts', 'charity': 'gifts',
      'baby': 'childcare', 'daycare': 'childcare', 'kids': 'childcare',
      'pet': 'pets', 'dog': 'pets', 'cat': 'pets', 'vet': 'pets',
      'hair': 'personal', 'salon': 'personal', 'spa': 'personal',
      'gym': 'healthcare', 'medical': 'healthcare', 'doctor': 'healthcare', 'pharmacy': 'healthcare',
      'car': 'transportation', 'gas': 'transportation', 'fuel': 'transportation', 'uber': 'transportation',
      'food': 'groceries', 'grocery': 'groceries', 'supermarket': 'groceries',
      'restaurant': 'dining', 'coffee': 'dining', 'cafe': 'dining',
      'netflix': 'subscriptions', 'spotify': 'subscriptions', 'hulu': 'subscriptions',
      'amazon': 'shopping', 'walmart': 'shopping', 'target': 'shopping',
      'rent': 'housing', 'mortgage': 'housing',
      'electric': 'utilities', 'water': 'utilities', 'internet': 'utilities', 'phone': 'utilities',
      'salary': 'income', 'paycheck': 'income', 'wages': 'income', 'freelance': 'income',
    };
    
    for (const [alias, catId] of Object.entries(aliases)) {
      if (lower.includes(alias)) return catId;
    }
    
    const partialMatch = CATEGORIES.find(c => 
      c.name.toLowerCase().includes(lower) || lower.includes(c.id)
    );
    if (partialMatch) return partialMatch.id;
    
    return 'other';
  };

  const parseCSV = (content) => {
    const lines = content.split(/\r?\n/).filter(l => l.trim());
    const txs = [];
    const errors = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      try {
        const parts = [];
        let current = '';
        let inQuotes = false;
        
        for (const char of line) {
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            parts.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        parts.push(current.trim());
        
        if (parts.length < 3) continue;
        
        const [dateStr, desc, amountStr, cat = '', type = '', paid = ''] = parts.map(p => p.replace(/"/g, '').trim());
        
        const date = parseDate(dateStr);
        const amount = parseFloat(amountStr.replace(/[$,]/g, ''));
        
        if (!date) { errors.push(`Row ${i + 1}: Invalid date`); continue; }
        if (!desc) { errors.push(`Row ${i + 1}: Missing description`); continue; }
        if (isNaN(amount)) { errors.push(`Row ${i + 1}: Invalid amount`); continue; }
        
        const isIncome = type.toLowerCase() === 'income' || (amount > 0 && !type);
        const category = isIncome ? 'income' : mapCategory(cat);
        
        txs.push({
          id: uid(),
          date,
          desc,
          amount: isIncome ? Math.abs(amount) : -Math.abs(amount),
          category,
          paid: ['yes', '1', 'true', 'y', 'paid'].includes(String(paid).toLowerCase())
        });
      } catch (e) {
        errors.push(`Row ${i + 1}: Parse error`);
      }
    }
    
    return { transactions: txs, errors };
  };

  const parseExcel = async (file) => {
    return new Promise((resolve) => {
      const XLSX = window.XLSX;
      
      if (XLSX) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array', cellDates: true });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            
            const json = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, dateNF: 'yyyy-mm-dd', defval: '' });
            
            const txs = [];
            const errors = [];
            
            const headers = json[0]?.map(h => String(h || '').toLowerCase().trim()) || [];
            
            const dateCol = headers.findIndex(h => h.includes('date'));
            const descCol = headers.findIndex(h => h.includes('desc') || h.includes('memo') || h.includes('payee'));
            const amountCol = headers.findIndex(h => h.includes('amount') || h.includes('sum'));
            const catCol = headers.findIndex(h => h.includes('cat') || h.includes('type'));
            const typeCol = headers.findIndex(h => h === 'type');
            const paidCol = headers.findIndex(h => h.includes('paid') || h.includes('status'));
            
            for (let i = 1; i < json.length; i++) {
              const row = json[i];
              if (!row || row.every(cell => !cell)) continue;
              
              const dateVal = row[dateCol >= 0 ? dateCol : 0];
              const desc = row[descCol >= 0 ? descCol : 1];
              const amountVal = row[amountCol >= 0 ? amountCol : 2];
              const cat = row[catCol >= 0 ? catCol : 3];
              const type = row[typeCol >= 0 ? typeCol : 4];
              const paid = row[paidCol >= 0 ? paidCol : 5];
              
              const date = parseDate(dateVal);
              const amount = parseFloat(String(amountVal || '0').replace(/[$,]/g, ''));
              
              if (!date) { errors.push(`Row ${i + 1}: Invalid date`); continue; }
              if (!desc) { errors.push(`Row ${i + 1}: Missing description`); continue; }
              if (isNaN(amount) || amount === 0) { errors.push(`Row ${i + 1}: Invalid amount`); continue; }
              
              const isIncome = String(type || '').toLowerCase() === 'income' || 
                               String(cat || '').toLowerCase() === 'income' ||
                               amount > 0;
              
              txs.push({
                id: uid(),
                date,
                desc: String(desc).trim(),
                amount: isIncome ? Math.abs(amount) : -Math.abs(amount),
                category: isIncome ? 'income' : mapCategory(cat),
                paid: ['yes', '1', 'true', 'y', 'cleared', 'paid'].includes(String(paid || '').toLowerCase())
              });
            }
            
            resolve({ transactions: txs, errors });
          } catch (err) {
            resolve({ transactions: [], errors: [`Failed to parse Excel: ${err.message}`] });
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        resolve({ transactions: [], errors: ['Excel library not loaded. Please save as CSV.'] });
      }
    });
  };

  const handleFileImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const filename = file.name.toLowerCase();
    let result;
    
    try {
      if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
        result = await parseExcel(file);
        if (result.transactions.length === 0 && result.errors.length > 0) {
          alert(`Unable to read Excel file.\n\n${result.errors[0]}`);
          e.target.value = '';
          return;
        }
      } else if (filename.endsWith('.csv') || filename.endsWith('.txt')) {
        const content = await file.text();
        result = parseCSV(content);
      } else {
        alert('Please upload a CSV or Excel file.');
        e.target.value = '';
        return;
      }
      
      if (result.transactions.length > 0) {
        result.transactions.sort((a, b) => b.date.localeCompare(a.date));
        
        setImportData({
          transactions: result.transactions,
          errors: result.errors,
          filename: file.name,
          summary: {
            total: result.transactions.length,
            income: result.transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0),
            expenses: result.transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)
          }
        });
        setModal('import-confirm');
      } else {
        alert(`No valid transactions found in "${file.name}".`);
      }
    } catch (err) {
      alert(`Error reading file: ${err.message}`);
    }
    
    e.target.value = '';
  };

  const confirmImport = () => {
    if (importData && importData.transactions.length > 0) {
      const newTransactions = [...transactions, ...importData.transactions];
      setTransactions(newTransactions);
      
      const monthCounts = {};
      importData.transactions.forEach(t => {
        const parts = getDateParts(t.date);
        if (parts) {
          const key = `${parts.year}-${parts.month}`;
          monthCounts[key] = (monthCounts[key] || 0) + 1;
        }
      });
      
      const topMonth = Object.entries(monthCounts).sort((a, b) => b[1] - a[1])[0];
      if (topMonth) {
        const [yearMonth] = topMonth;
        const [y, m] = yearMonth.split('-').map(Number);
        setYear(y);
        setMonth(m);
      }
      
      setImportNotification({
        count: importData.transactions.length,
        income: importData.summary.income,
        expenses: importData.summary.expenses
      });
      
      setTimeout(() => setImportNotification(null), 5000);
      
      setView('dashboard');
      setImportData(null);
      setModal(null);
    }
  };

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  const addTx = (tx) => { 
    setTransactions([...transactions, { ...tx, id: uid() }]); 
    setModal(null); 
  };
  
  const updateTx = (tx) => { 
    setTransactions(transactions.map(t => t.id === tx.id ? tx : t)); 
    setEditTx(null); 
  };
  
  const deleteTx = (id) => setTransactions(transactions.filter(t => t.id !== id));
  
  const togglePaid = (id) => setTransactions(transactions.map(t => t.id === id ? { ...t, paid: !t.paid } : t));

  // Multi-select helpers
  const toggleSelectTx = (id) => {
    setSelectedTxIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };
  
  const selectAllFiltered = () => {
    const filteredIds = filtered.map(t => t.id);
    setSelectedTxIds(new Set(filteredIds));
  };
  
  const deselectAll = () => setSelectedTxIds(new Set());
  
  const deleteSelectedTx = () => {
    if (selectedTxIds.size === 0) return;
    if (confirm(`Delete ${selectedTxIds.size} selected transaction(s)?`)) {
      setTransactions(prev => prev.filter(t => !selectedTxIds.has(t.id)));
      setSelectedTxIds(new Set());
    }
  };
  
  const markSelectedAsPaid = () => {
    if (selectedTxIds.size === 0) return;
    setTransactions(prev => prev.map(t => selectedTxIds.has(t.id) ? { ...t, paid: true } : t));
  };
  
  const markSelectedAsUnpaid = () => {
    if (selectedTxIds.size === 0) return;
    setTransactions(prev => prev.map(t => selectedTxIds.has(t.id) ? { ...t, paid: false } : t));
  };
  
  useEffect(() => {
    setSelectedTxIds(new Set());
  }, [search, filterCat, filterPaid]);

  const addRecurring = (r) => { 
    setRecurringExpenses([...recurringExpenses, { ...r, id: uid(), active: true }]); 
    setModal(null); 
  };
  
  const updateRecurring = (r) => { 
    setRecurringExpenses(recurringExpenses.map(e => e.id === r.id ? r : e)); 
    setEditRecurring(null); 
  };
  
  const deleteRecurring = (id) => setRecurringExpenses(recurringExpenses.filter(r => r.id !== id));
  
  const toggleRecurringActive = (id) => setRecurringExpenses(recurringExpenses.map(r => r.id === id ? { ...r, active: !r.active } : r));
  
  const createFromRecurring = (r) => { 
    const today = new Date(); 
    setTransactions([...transactions, { 
      id: uid(), 
      date: today.toISOString().split('T')[0], 
      desc: r.name, 
      amount: -r.amount, 
      category: r.category, 
      paid: r.autoPay 
    }]); 
  };

  const connectBank = () => { 
    setPlaidLoading(true); 
    setTimeout(() => { 
      setLinkedAccounts([{ id: uid(), institution: 'USAA', accounts: [{ id: '1', name: 'Checking', mask: '4523', subtype: 'checking' }, { id: '2', name: 'Savings', mask: '7891', subtype: 'savings' }] }]); 
      setTransactions(p => p.map(t => ({ ...t, paid: true }))); 
      setPlaidLoading(false); 
      setModal(null);
      setView('accounts');
    }, 2500); 
  };

  // ============================================
  // UI COMPONENTS
  // ============================================

  const NavItem = ({ id, icon: Icon, label, badge }) => (
    <button onClick={() => { setView(id); if (isMobile) setSidebarOpen(false); }} className={`flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all ${view === id ? 'bg-gradient-to-r from-[#1e3a5f] to-[#14b8a6] text-white shadow-lg' : 'text-slate-600 hover:bg-gradient-to-r hover:from-[#0f172a]/5 hover:to-[#14b8a6]/5'}`}>
      <div className="flex items-center gap-3"><Icon size={20} /><span className="font-medium">{label}</span></div>
      {badge && <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${view === id ? 'bg-white/20' : 'bg-gradient-to-r from-green-100 to-blue-100 text-[#14b8a6]'}`}>{badge}</span>}
    </button>
  );

  const EditableStatCard = ({ label, value, icon: Icon, iconBg, valueColor, onEdit, editable = false, suffix = '' }) => (
    <div 
      onClick={() => editable && onEdit && setModal(onEdit)} 
      className={`bg-white rounded-2xl p-5 border-2 shadow-sm hover:shadow-lg transition-all ${editable ? 'cursor-pointer hover:border-blue-400 group' : ''} ${valueColor === 'text-[#14b8a6]' ? 'border-[#1e3a5f]/20' : valueColor === 'text-rose-600' ? 'border-rose-200' : 'border-[#1e3a5f]/10'}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-500 text-sm font-medium">{label}</span>
        <div className={`p-2 rounded-xl ${iconBg}`}><Icon size={16} className={valueColor} /></div>
      </div>
      <div className="flex items-baseline gap-1">
        <p className={`font-bold text-2xl ${valueColor}`}>{currency(value)}</p>
        {suffix && <span className="text-xs text-slate-400">{suffix}</span>}
        {editable && <Edit2 size={14} className="ml-2 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />}
      </div>
    </div>
  );

  // ============================================
  // LOADING STATE
  // ============================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f]/10 via-white to-[#14b8a6]/10 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-[#14b8a6] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-700">Loading BalanceBooks...</h2>
          <p className="text-slate-500 text-sm mt-2">Initializing your financial data</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f]/10 via-white to-[#14b8a6]/10 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-xl max-w-md text-center">
          <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Error Loading Data</h2>
          <p className="text-slate-500 mb-4">{loadError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-3 bg-[#14b8a6] text-white rounded-xl font-medium"
          >
            Reload App
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f]/10 via-white to-[#14b8a6]/10" style={{ fontFamily: "'Inter', sans-serif" }}>
      {isMobile && sidebarOpen && <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed left-0 top-0 bottom-0 w-64 bg-gradient-to-b from-white via-[#1e3a5f]/5 to-[#14b8a6]/5 border-r border-[#1e3a5f]/20 p-6 flex flex-col z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#0f172a] flex items-center justify-center shadow-lg overflow-hidden">
            <svg viewBox="0 0 100 100" className="w-8 h-8">
              <defs>
                <linearGradient id="navyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{stopColor:'#1e3a5f'}} />
                  <stop offset="100%" style={{stopColor:'#0f172a'}} />
                </linearGradient>
                <linearGradient id="tealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{stopColor:'#14b8a6'}} />
                  <stop offset="100%" style={{stopColor:'#0d9488'}} />
                </linearGradient>
              </defs>
              <path d="M 50 5 L 92 18 L 92 55 C 92 78 73 92 50 98 C 27 92 8 78 8 55 L 8 18 Z" fill="url(#navyGrad)"/>
              <path d="M 50 14 L 82 24 L 82 54 C 82 72 67 83 50 88 C 33 83 18 72 18 54 L 18 24 Z" fill="none" stroke="url(#tealGrad)" strokeWidth="3"/>
              <circle cx="50" cy="52" r="24" fill="url(#tealGrad)"/>
              <path d="M 36 52 L 46 62 L 66 42" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div><h1 className="font-bold text-lg bg-gradient-to-r from-[#1e3a5f] to-[#14b8a6] bg-clip-text text-transparent">BalanceBooks</h1><p className="text-xs text-slate-400">Pro • v{APP_VERSION}</p></div>
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

      <main className={`transition-all duration-300 ${sidebarOpen && !isMobile ? 'ml-64' : 'ml-0'}`}>
        <header className="sticky top-0 z-30 bg-gradient-to-r from-[#0f172a]/5/95 via-white/95 to-[#14b8a6]/5/95 backdrop-blur-lg border-b border-[#1e3a5f]/20">
          <div className="flex items-center justify-between px-4 md:px-8 py-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-[#14b8a6]/10 text-[#14b8a6]"><Menu size={20} /></button>
              <div><h2 className="font-bold text-slate-900 text-xl capitalize">{view === 'accounts' ? 'Bank Accounts' : view === 'recommendations' ? 'Smart Tips' : view}</h2><p className="text-sm text-[#14b8a6] font-medium">{FULL_MONTHS[month]} {year}</p></div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-gradient-to-r from-[#0f172a]/5 to-[#14b8a6]/5 border-2 border-[#1e3a5f]/20 rounded-xl overflow-hidden shadow-sm">
                <button onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }} className="p-3 hover:bg-[#14b8a6]/10 text-[#14b8a6]"><ChevronLeft size={18} /></button>
                <span className="px-4 font-semibold text-slate-700 min-w-[60px] text-center">{MONTHS[month]}</span>
                <button onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }} className="p-3 hover:bg-[#14b8a6]/10 text-[#14b8a6]"><ChevronRight size={18} /></button>
              </div>
              {!isMobile && <button onClick={() => setModal('add')} className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#1e3a5f] to-[#14b8a6] text-white rounded-xl font-medium hover:from-blue-700 hover:to-green-600 shadow-lg"><Plus size={18} />Add</button>}
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8">
          {view === 'dashboard' && (
            <div className="space-y-6">
              {/* Balance Overview Section - Editable */}
              <div className="bg-gradient-to-r from-blue-600 via-[#1e3a5f] to-[#14b8a6]/50 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Calculator size={24} />
                    <h3 className="font-bold text-lg">Monthly Balance Overview</h3>
                  </div>
                  <span className="text-white font-semibold text-sm bg-white/20 px-3 py-1 rounded-full">Click any card to edit</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/15 backdrop-blur rounded-xl p-4 cursor-pointer hover:bg-white/25 transition-all border border-white/20" onClick={() => setModal('edit-beginning')}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[#14b8a6]/70 text-sm">Beginning Balance</p>
                      <Edit2 size={12} className="text-blue-200" />
                    </div>
                    <p className="text-2xl font-bold">{currency(stats.beginning)}</p>
                  </div>
                  <div className="bg-white/15 backdrop-blur rounded-xl p-4 cursor-pointer hover:bg-white/25 transition-all border border-white/20" onClick={() => setModal('edit-income')}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-green-100 text-sm">+ Income</p>
                      <Edit2 size={12} className="text-green-200" />
                    </div>
                    <p className="text-2xl font-bold text-green-200">{currency(stats.income)}</p>
                  </div>
                  <div className="bg-white/15 backdrop-blur rounded-xl p-4 cursor-pointer hover:bg-white/25 transition-all border border-white/20" onClick={() => setModal('edit-expenses')}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-rose-100 text-sm">- Expenses</p>
                      <Edit2 size={12} className="text-rose-200" />
                    </div>
                    <p className="text-2xl font-bold text-rose-200">{currency(stats.expenses)}</p>
                  </div>
                  <div className="bg-white/15 backdrop-blur rounded-xl p-4 cursor-pointer hover:bg-white/25 transition-all border border-white/20" onClick={() => setModal('edit-ending')}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-green-100 text-sm">Ending Balance</p>
                      <Edit2 size={12} className="text-green-200" />
                    </div>
                    <p className="text-2xl font-bold text-green-300">{currency(stats.ending)}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className={stats.net >= 0 ? "text-green-300" : "text-rose-300"} />
                    <span className="text-sm">Net Change: <span className={`font-bold ${stats.net >= 0 ? "text-green-300" : "text-rose-300"}`}>{stats.net >= 0 ? '+' : ''}{currency(stats.net)}</span></span>
                  </div>
                  <span className="text-xs text-blue-200">Ending balance carries to next month</span>
                </div>
              </div>

              {upcomingBills.length > 0 && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-white to-orange-50 border-2 border-amber-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-3"><Bell size={20} className="text-amber-600" /><h3 className="font-semibold text-amber-800">Upcoming Bills</h3></div>
                  <div className="space-y-2">{upcomingBills.slice(0, 3).map(b => (<div key={b.id} className="flex items-center justify-between text-sm"><span className="text-amber-700">{b.name}</span><div className="flex items-center gap-2"><span className="font-semibold text-amber-900">{currency(b.amount)}</span><span className="text-amber-600">{b.daysUntil === 0 ? 'Today' : b.daysUntil === 1 ? 'Tomorrow' : `in ${b.daysUntil} days`}</span></div></div>))}</div>
                </div>
              )}

              {linkedAccounts.length === 0 && (
                <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0f172a]/50 via-[#1e3a5f] to-[#14b8a6]/50 text-white shadow-xl">
                  <div className="flex items-center justify-between"><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-white/20"><Building2 size={24} /></div><div><h3 className="font-semibold text-lg">Connect Your Bank</h3><p className="text-[#14b8a6]/70 text-sm">Auto-mark expenses as paid</p></div></div><button onClick={() => setModal('connect')} className="flex items-center gap-2 px-5 py-3 bg-white text-[#14b8a6] rounded-xl font-semibold hover:bg-blue-50 shadow-lg"><Link2 size={18} />Connect</button></div>
                </div>
              )}

              {/* Stats Cards - Clickable */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <EditableStatCard label="Beginning Balance" value={stats.beginning} icon={Wallet} iconBg="bg-gradient-to-br from-[#1e3a5f]/10 to-blue-200" valueColor="text-[#14b8a6]" editable onEdit="edit-beginning" />
                <EditableStatCard label="Income" value={stats.income} icon={ArrowUpRight} iconBg="bg-gradient-to-br from-green-100 to-green-200" valueColor="text-[#14b8a6]" editable onEdit="edit-income" />
                <div className="bg-white rounded-2xl p-5 border-2 border-rose-200 shadow-sm cursor-pointer hover:border-rose-400 hover:shadow-lg transition-all group" onClick={() => setModal('edit-expenses')}><div className="flex items-center justify-between mb-3"><span className="text-slate-500 text-sm font-medium">Expenses</span><div className="p-2 rounded-xl bg-gradient-to-br from-rose-100 to-rose-200"><ArrowDownRight size={16} className="text-rose-600" /></div></div><div className="flex items-baseline gap-1"><p className="font-bold text-rose-600 text-2xl">{currency(stats.expenses)}</p><Edit2 size={14} className="ml-2 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" /></div>{stats.unpaidCount > 0 && <p className="text-xs text-amber-600 mt-1 font-medium">{stats.unpaidCount} unpaid</p>}</div>
                <EditableStatCard label="Ending Balance" value={stats.ending} icon={Target} iconBg="bg-gradient-to-br from-green-100 to-green-200" valueColor="text-[#14b8a6]" editable onEdit="edit-ending" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-[#0f172a]/5 via-white to-[#14b8a6]/5 rounded-2xl p-5 border-2 border-[#1e3a5f]/20 shadow-sm"><div className="flex items-center justify-between mb-3"><span className="text-slate-500 text-sm font-medium">Net Change</span><div className="p-2 rounded-xl bg-gradient-to-br from-[#1e3a5f]/10 to-[#14b8a6]/10"><TrendingUp size={16} className={stats.net >= 0 ? "text-[#14b8a6]" : "text-rose-600"} /></div></div><p className={`font-bold text-2xl ${stats.net >= 0 ? 'text-[#14b8a6]' : 'text-rose-600'}`}>{stats.net >= 0 ? '+' : ''}{currency(stats.net)}</p></div>
                <div className="bg-gradient-to-r from-[#0f172a]/5 via-white to-[#14b8a6]/5 rounded-2xl p-5 border-2 border-[#1e3a5f]/20 shadow-sm"><div className="flex items-center justify-between mb-3"><span className="text-slate-500 text-sm font-medium">Monthly Recurring</span><div className="p-2 rounded-xl bg-gradient-to-br from-[#1e3a5f]/10 to-blue-200"><RefreshCw size={16} className="text-[#14b8a6]" /></div></div><p className="font-bold text-[#14b8a6] text-2xl">{currency(totalMonthlyRecurring)}</p><p className="text-xs text-slate-500 mt-1">/month committed</p></div>
              </div>

              {savingsRecommendations.filter(r => r.priority === 'high').length > 0 && (
                <div className="bg-gradient-to-r from-[#14b8a6]/5 via-white to-blue-50 rounded-2xl p-6 border-2 border-[#14b8a6]/20 shadow-sm">
                  <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-3"><Sparkles size={20} className="text-[#14b8a6]" /><h3 className="font-semibold text-slate-900">Priority Recommendations</h3></div><button onClick={() => setView('recommendations')} className="text-sm text-[#14b8a6] font-medium hover:text-[#0d9488] bg-blue-50 px-3 py-1 rounded-full">View All →</button></div>
                  <div className="space-y-3">{savingsRecommendations.filter(r => r.priority === 'high').slice(0, 2).map(rec => (<div key={rec.id} className="flex items-start gap-3 bg-white rounded-xl p-4 border border-[#14b8a6]/10 shadow-sm hover:shadow-md transition-all"><div className={`p-2 rounded-xl ${rec.type === 'alert' ? 'bg-gradient-to-br from-rose-100 to-rose-200' : rec.type === 'success' ? 'bg-gradient-to-br from-green-100 to-green-200' : 'bg-gradient-to-br from-[#1e3a5f]/10 to-[#14b8a6]/10'}`}>{rec.type === 'alert' ? <AlertTriangle size={16} className="text-rose-600" /> : <Lightbulb size={16} className="text-[#14b8a6]" />}</div><div className="flex-1"><p className="font-medium text-slate-900">{rec.title}</p><p className="text-sm text-slate-500 line-clamp-2">{rec.description}</p>{rec.potential > 0 && <p className="text-sm text-[#14b8a6] font-semibold mt-1">💰 Save up to {currency(rec.potential)}/mo</p>}</div></div>))}</div>
                </div>
              )}

              <div className="bg-white rounded-2xl p-6 border-2 border-[#1e3a5f]/10 shadow-sm"><h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><CreditCard size={18} className="text-[#14b8a6]" />Spending by Category</h3><div className="space-y-4">{catBreakdown.slice(0, 5).map(cat => (<div key={cat.id}><div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><span>{cat.icon}</span><span className="font-medium text-slate-700 text-sm">{cat.name}</span></div><span className="font-bold text-slate-900 text-sm">{currency(cat.total)}</span></div><div className="h-3 bg-gradient-to-r from-[#0f172a]/5 to-[#14b8a6]/5 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${cat.pct}%`, backgroundColor: cat.color }} /></div></div>))}</div></div>
              
              <div className="bg-white rounded-2xl border-2 border-[#14b8a6]/10 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-[#14b8a6]/10 bg-gradient-to-r from-[#14b8a6]/5 via-white to-blue-50"><h3 className="font-semibold text-slate-900 flex items-center gap-2"><Receipt size={18} className="text-[#14b8a6]" />Recent Transactions</h3><button onClick={() => setView('transactions')} className="text-sm text-[#14b8a6] font-medium hover:text-green-700 bg-[#14b8a6]/5 px-3 py-1 rounded-full">View All →</button></div>
                <div className="divide-y divide-slate-100">{monthTx.slice(0, 6).map(tx => { const cat = CATEGORIES.find(c => c.id === tx.category); return (<div key={tx.id} className="flex items-center justify-between px-6 py-4 hover:bg-gradient-to-r hover:from-[#0f172a]/5/30 hover:to-[#14b8a6]/5/30"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: cat?.bg }}>{cat?.icon}</div><div><div className="flex items-center gap-2"><p className="font-medium text-slate-900 text-sm">{tx.desc}</p>{tx.paid ? <Check size={14} className="text-green-500" /> : <Clock size={14} className="text-amber-500" />}</div><p className="text-xs text-slate-500">{shortDate(tx.date)}</p></div></div><span className={`font-bold text-sm ${tx.amount > 0 ? 'text-[#14b8a6]' : 'text-slate-900'}`}>{tx.amount > 0 ? '+' : ''}{currency(tx.amount)}</span></div>); })}</div>
              </div>
            </div>
          )}

          {view === 'transactions' && (
            <div className="space-y-4">
              {/* Filters Row */}
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px] relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#14b8a6]" size={18} /><input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gradient-to-r from-[#0f172a]/5 to-white border-2 border-[#1e3a5f]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14b8a6]" /></div>
                <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="px-4 py-3 bg-gradient-to-r from-[#0f172a]/5 to-white border-2 border-[#1e3a5f]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"><option value="all">All Categories</option>{CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select>
                <select value={filterPaid} onChange={(e) => setFilterPaid(e.target.value)} className="px-4 py-3 bg-gradient-to-r from-[#14b8a6]/5 to-white border-2 border-[#14b8a6]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"><option value="all">All Status</option><option value="paid">✓ Paid</option><option value="unpaid">○ Unpaid</option></select>
              </div>
              
              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Receipt size={16} className="text-blue-500" />
                    <span><strong>{filtered.length}</strong> transactions {filterCat !== 'all' || filterPaid !== 'all' || search ? '(filtered)' : ''}</span>
                    {transactions.length > 0 && <span className="text-slate-400">• Total: {transactions.length}</span>}
                  </div>
                  {/* Selection indicator */}
                  {selectedTxIds.size > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                      <CheckCircle size={14} />
                      <span>{selectedTxIds.size} selected</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Selection Controls */}
                  {filtered.length > 0 && (
                    <>
                      <button 
                        onClick={selectAllFiltered}
                        className="flex items-center gap-2 px-3 py-2 bg-white border-2 border-blue-300 text-blue-600 rounded-lg font-medium hover:bg-blue-50 hover:border-blue-400 text-sm transition-all"
                        title="Select all visible transactions"
                      >
                        <CheckCircle size={16} />
                        <span>Select All</span>
                      </button>
                      {selectedTxIds.size > 0 && (
                        <button 
                          onClick={deselectAll}
                          className="flex items-center gap-2 px-3 py-2 bg-white border-2 border-slate-300 text-slate-600 rounded-lg font-medium hover:bg-slate-50 hover:border-slate-400 text-sm transition-all"
                          title="Clear selection"
                        >
                          <X size={16} />
                          <span>Deselect</span>
                        </button>
                      )}
                    </>
                  )}
                  
                  {/* Bulk Actions for Selected Items */}
                  {selectedTxIds.size > 0 && (
                    <>
                      <div className="w-px h-6 bg-slate-300 mx-1" />
                      <button 
                        onClick={markSelectedAsPaid}
                        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 shadow-sm text-sm"
                        title="Mark selected as paid"
                      >
                        <Check size={16} />
                        <span>Mark Paid</span>
                      </button>
                      <button 
                        onClick={markSelectedAsUnpaid}
                        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-400 to-amber-500 text-white rounded-lg font-medium hover:from-amber-500 hover:to-amber-600 shadow-sm text-sm"
                        title="Mark selected as unpaid"
                      >
                        <Clock size={16} />
                        <span>Mark Unpaid</span>
                      </button>
                      <button 
                        onClick={deleteSelectedTx}
                        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-lg font-medium hover:from-rose-600 hover:to-rose-700 shadow-sm text-sm"
                        title="Delete selected transactions"
                      >
                        <Trash2 size={16} />
                        <span>Delete ({selectedTxIds.size})</span>
                      </button>
                    </>
                  )}
                  
                  {selectedTxIds.size === 0 && (
                    <>
                      {/* Save/Backup Button */}
                      <button 
                        onClick={() => {
                          const data = {
                            version: APP_VERSION,
                            exportDate: new Date().toISOString(),
                            transactions,
                            recurringExpenses,
                            monthlyBalances,
                            savingsGoal
                          };
                          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                          const a = document.createElement('a');
                          a.href = URL.createObjectURL(blob);
                          a.download = `balance-books-backup-${new Date().toISOString().split('T')[0]}.json`;
                          a.click();
                          URL.revokeObjectURL(a.href);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#1e3a5f] to-[#14b8a6] text-white rounded-lg font-medium hover:from-[#1e3a5f] hover:to-[#0f172a] shadow-sm text-sm"
                      >
                        <Download size={16} />
                        <span>Backup All</span>
                      </button>
                      
                      {/* Delete All Button */}
                      <button 
                        onClick={() => {
                          if (confirm(`⚠️ DELETE ALL ${transactions.length} TRANSACTIONS?\n\nThis will permanently remove ALL your transaction data.\n\nTip: Use "Backup All" first to save your data.\n\nThis cannot be undone!`)) {
                            if (confirm('Are you absolutely sure? Type "yes" in your mind and click OK to confirm.')) {
                              setTransactions([]);
                              setSearch('');
                              setFilterCat('all');
                              setFilterPaid('all');
                            }
                          }
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-lg font-medium hover:from-rose-600 hover:to-rose-700 shadow-sm text-sm"
                        disabled={transactions.length === 0}
                      >
                        <Trash2 size={16} />
                        <span>Delete All</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {/* Transactions List */}
              <div className="bg-white rounded-2xl border-2 border-[#1e3a5f]/10 shadow-sm divide-y divide-slate-100">
                {/* Header row with select all checkbox */}
                {filtered.length > 0 && (
                  <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <button 
                      onClick={() => {
                        const filteredIds = filtered.slice(0, 50).map(t => t.id);
                        const allSelected = filteredIds.every(id => selectedTxIds.has(id));
                        if (allSelected) {
                          deselectAll();
                        } else {
                          setSelectedTxIds(new Set(filteredIds));
                        }
                      }}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        filtered.slice(0, 50).every(t => selectedTxIds.has(t.id)) && filtered.length > 0
                          ? 'bg-blue-500 border-blue-500' 
                          : filtered.slice(0, 50).some(t => selectedTxIds.has(t.id))
                          ? 'bg-blue-200 border-blue-400'
                          : 'border-slate-300 hover:border-blue-400'
                      }`}
                    >
                      {filtered.slice(0, 50).every(t => selectedTxIds.has(t.id)) && filtered.length > 0 && <Check size={12} className="text-white" />}
                      {filtered.slice(0, 50).some(t => selectedTxIds.has(t.id)) && !filtered.slice(0, 50).every(t => selectedTxIds.has(t.id)) && <div className="w-2 h-2 bg-blue-500 rounded-sm" />}
                    </button>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Select</span>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide ml-8">Status</span>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide ml-12 flex-1">Transaction</span>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Amount</span>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide ml-4">Actions</span>
                  </div>
                )}
                {filtered.length > 0 ? filtered.slice(0, 50).map(tx => { 
                  const cat = CATEGORIES.find(c => c.id === tx.category); 
                  const isSelected = selectedTxIds.has(tx.id);
                  return (
                  <div key={tx.id} className={`flex items-center justify-between px-4 py-3 transition-all ${isSelected ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gradient-to-r hover:from-[#0f172a]/5/50 hover:to-[#14b8a6]/5/50'}`}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Selection checkbox */}
                      <button 
                        onClick={() => toggleSelectTx(tx.id)} 
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0 ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-300 hover:border-blue-400'}`}
                      >
                        {isSelected && <Check size={12} className="text-white" />}
                      </button>
                      {/* Paid status toggle */}
                      <button onClick={() => togglePaid(tx.id)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${tx.paid ? 'bg-gradient-to-r from-[#14b8a6]/50 to-green-400 border-green-500' : 'border-amber-300 hover:border-green-400'}`}>{tx.paid ? <Check size={14} className="text-white" /> : <Clock size={12} className="text-amber-400" />}</button>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ backgroundColor: cat?.bg }}>{cat?.icon}</div>
                      <div className="min-w-0"><p className={`font-medium text-sm truncate ${tx.paid ? 'text-slate-900' : 'text-slate-600'}`}>{tx.desc}</p><p className="text-xs text-slate-500">{shortDate(tx.date)}</p></div>
                    </div>
                    <div className="flex items-center gap-2"><span className={`font-bold text-sm ${tx.amount > 0 ? 'text-[#14b8a6]' : 'text-slate-900'}`}>{currency(tx.amount)}</span><button onClick={() => setEditTx(tx)} className="p-2 rounded-lg hover:bg-[#14b8a6]/10 text-[#14b8a6] hover:text-[#14b8a6]"><Edit2 size={14} /></button><button onClick={() => deleteTx(tx.id)} className="p-2 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600"><Trash2 size={14} /></button></div>
                  </div>
                ); }) : (
                  <div className="p-12 text-center">
                    <Receipt className="mx-auto text-slate-300 mb-4" size={48} />
                    <h3 className="font-semibold text-slate-600 mb-2">No transactions found</h3>
                    <p className="text-sm text-slate-400 mb-4">
                      {search || filterCat !== 'all' || filterPaid !== 'all' 
                        ? 'Try adjusting your filters' 
                        : 'Add your first transaction to get started'}
                    </p>
                    {!(search || filterCat !== 'all' || filterPaid !== 'all') && (
                      <button onClick={() => setModal('add')} className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#1e3a5f] to-[#14b8a6] text-white rounded-lg font-medium hover:shadow-lg">
                        <Plus size={16} />Add Transaction
                      </button>
                    )}
                  </div>
                )}
                {filtered.length > 50 && (
                  <div className="p-4 text-center text-sm text-slate-500 bg-slate-50">
                    Showing first 50 of {filtered.length} transactions. Use filters to narrow results.
                  </div>
                )}
              </div>
            </div>
          )}

          {view === 'recurring' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-600 via-[#1e3a5f] to-[#14b8a6]/50 rounded-2xl text-white shadow-xl"><div><h3 className="text-lg font-semibold">Monthly Recurring</h3><p className="text-3xl font-bold">{currency(totalMonthlyRecurring)}</p></div><button onClick={() => setModal('add-recurring')} className="flex items-center gap-2 px-4 py-3 bg-white text-[#14b8a6] rounded-xl font-medium hover:bg-blue-50 shadow-lg"><Plus size={18} />Add</button></div>
              <div className="bg-white rounded-2xl border-2 border-[#1e3a5f]/10 shadow-sm divide-y divide-slate-100">
                {recurringExpenses.map(r => { const cat = CATEGORIES.find(c => c.id === r.category); const freq = FREQUENCY_OPTIONS.find(f => f.id === r.frequency); return (
                  <div key={r.id} className={`flex items-center justify-between px-4 py-4 hover:bg-gradient-to-r hover:from-[#0f172a]/5/50 hover:to-[#14b8a6]/5/50 ${!r.active ? 'opacity-50' : ''}`}>
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleRecurringActive(r.id)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${r.active ? 'bg-gradient-to-r from-[#1e3a5f] to-[#14b8a6] border-blue-500' : 'border-slate-300'}`}>{r.active && <Check size={14} className="text-white" />}</button>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: cat?.bg }}>{cat?.icon}</div>
                      <div><p className="font-medium text-slate-900">{r.name}</p><div className="flex items-center gap-2 text-xs text-slate-500"><span>{freq?.name}</span><span>•</span><span>Due: {r.dueDay}</span>{r.autoPay && <><span>•</span><span className="text-[#14b8a6] font-medium">Auto-pay</span></>}</div></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900">{currency(r.amount)}</span>
                      <button onClick={() => createFromRecurring(r)} className="p-2 rounded-lg hover:bg-[#14b8a6]/10 text-green-500 hover:text-[#14b8a6]" title="Create transaction"><Plus size={14} /></button>
                      <button onClick={() => setEditRecurring(r)} className="p-2 rounded-lg hover:bg-[#14b8a6]/10 text-[#14b8a6] hover:text-[#14b8a6]"><Edit2 size={14} /></button>
                      <button onClick={() => deleteRecurring(r.id)} className="p-2 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ); })}
              </div>
            </div>
          )}

          {view === 'accounts' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0f172a]/5 via-white to-[#14b8a6]/5 border-2 border-[#1e3a5f]/20 shadow-sm"><div className="flex items-start gap-4"><div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#14b8a6] shadow-lg"><Shield size={24} className="text-white" /></div><div><h3 className="font-semibold text-lg text-slate-900 mb-2">Secure Bank Connection</h3><p className="text-slate-500 text-sm">Transactions auto-marked as paid when cleared</p></div></div></div>
              {linkedAccounts.length > 0 ? linkedAccounts.map(acc => (
                <div key={acc.id} className="bg-gradient-to-r from-white via-[#1e3a5f]/5 to-[#14b8a6]/5 rounded-2xl border-2 border-[#14b8a6]/20 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#14b8a6] flex items-center justify-center text-white font-bold text-xl shadow-lg">{acc.institution.charAt(0)}</div><div><h4 className="font-bold text-slate-900">{acc.institution}</h4><p className="text-xs text-[#14b8a6] font-medium">✓ Auto-marking enabled</p></div></div><button onClick={() => setLinkedAccounts([])} className="px-3 py-2 rounded-xl bg-rose-100 text-rose-600 hover:bg-rose-200"><Unlink size={14} /></button></div>
                  <div className="grid grid-cols-2 gap-2">{acc.accounts.map(a => (<div key={a.id} className="p-3 rounded-xl bg-white border-2 border-[#1e3a5f]/10"><p className="text-sm font-medium text-slate-700">{a.subtype}</p><p className="text-xs text-slate-400">••••{a.mask}</p></div>))}</div>
                </div>
              )) : (
                <div className="bg-gradient-to-r from-white via-[#1e3a5f]/5 to-[#14b8a6]/5 rounded-2xl border-2 border-[#1e3a5f]/20 shadow-sm p-8 text-center">
                  <Building2 className="mx-auto text-blue-300 mb-4" size={48} />
                  <h3 className="font-bold text-slate-900 mb-2">No Banks Connected</h3>
                  <p className="text-slate-500 text-sm mb-4">Connect your bank to auto-track payments</p>
                  <button onClick={() => setModal('connect')} className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#1e3a5f] to-[#14b8a6] text-white rounded-xl font-medium hover:from-blue-700 hover:to-green-600 shadow-lg transition-all">
                    <Link2 size={18} />Connect Bank
                  </button>
                </div>
              )}
            </div>
          )}

          {view === 'cycle' && (
            <div className="bg-white rounded-2xl border-2 border-[#1e3a5f]/10 shadow-sm overflow-x-auto">
              <table className="w-full text-sm"><thead className="bg-gradient-to-r from-[#1e3a5f]/10 via-white to-[#14b8a6]/10 border-b border-[#1e3a5f]/20"><tr><th className="px-4 py-4 text-left font-bold text-slate-700">Month</th><th className="px-4 py-4 text-right font-bold text-[#14b8a6]">Beginning</th><th className="px-4 py-4 text-right font-bold text-[#14b8a6]">Income</th><th className="px-4 py-4 text-right font-bold text-rose-600">Expenses</th><th className="px-4 py-4 text-right font-bold text-slate-600">Net</th><th className="px-4 py-4 text-right font-bold text-[#14b8a6]">Ending</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{cycleData.map((row, i) => (<tr key={i} className="hover:bg-gradient-to-r hover:from-[#0f172a]/5/30 hover:to-[#14b8a6]/5/30"><td className="px-4 py-3 font-medium text-slate-900">{row.month} {row.year}</td><td className="px-4 py-3 text-right text-[#14b8a6]">{currency(row.beginning)}</td><td className="px-4 py-3 text-right text-[#14b8a6] font-medium">{currency(row.income)}</td><td className="px-4 py-3 text-right text-rose-600">{currency(row.expenses)}</td><td className={`px-4 py-3 text-right font-bold ${row.net >= 0 ? 'text-[#14b8a6]' : 'text-rose-600'}`}>{row.net >= 0 ? '+' : ''}{currency(row.net)}</td><td className="px-4 py-3 text-right font-bold text-[#14b8a6]">{currency(row.ending)}</td></tr>))}</tbody></table>
            </div>
          )}

          {view === 'savings' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-r from-[#14b8a6]/5 via-white to-blue-50 rounded-2xl border-2 border-[#14b8a6]/20 shadow-sm p-6"><div className="flex items-center justify-between mb-4"><span className="text-slate-500 text-sm">This Month</span><div className="p-2 rounded-xl bg-gradient-to-br from-green-100 to-green-200"><PiggyBank size={20} className="text-[#14b8a6]" /></div></div><p className="text-3xl font-bold text-[#14b8a6]">{currency(stats.saved)}</p><div className="mt-4"><div className="h-3 bg-gradient-to-r from-[#1e3a5f]/10 to-[#14b8a6]/10 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#14b8a6]/50 to-green-400 rounded-full" style={{ width: `${Math.min(100, (stats.saved / savingsGoal * 100))}%` }} /></div><p className="text-xs text-slate-500 mt-2">{Math.min(100, (stats.saved / savingsGoal * 100)).toFixed(0)}% of {currency(savingsGoal)} goal</p></div></div>
                <div className="bg-gradient-to-r from-[#0f172a]/5 via-white to-[#14b8a6]/5 rounded-2xl border-2 border-[#1e3a5f]/20 shadow-sm p-6"><div className="flex items-center justify-between mb-4"><span className="text-slate-500 text-sm">Year to Date</span><div className="p-2 rounded-xl bg-gradient-to-br from-[#1e3a5f]/10 to-blue-200"><TrendingUp size={20} className="text-[#14b8a6]" /></div></div><p className="text-3xl font-bold text-[#14b8a6]">{currency(transactions.filter(t => t.category === 'savings' && new Date(t.date).getFullYear() === year).reduce((s, t) => s + Math.abs(t.amount), 0))}</p></div>
                <div className="bg-gradient-to-r from-[#0f172a]/5 via-white to-[#14b8a6]/5 rounded-2xl border-2 border-[#1e3a5f]/20 shadow-sm p-6 cursor-pointer hover:shadow-lg transition-all" onClick={() => setModal('edit-goal')}><div className="flex items-center justify-between mb-4"><span className="text-slate-500 text-sm">Monthly Goal</span><div className="p-2 rounded-xl bg-gradient-to-br from-[#1e3a5f]/10 to-[#14b8a6]/10"><Target size={20} className="text-[#14b8a6]" /></div></div><p className="text-3xl font-bold text-[#14b8a6]">{currency(savingsGoal)}</p><p className="text-xs text-slate-400 mt-2 flex items-center gap-1"><Edit2 size={12} /> Click to edit</p></div>
              </div>
            </div>
          )}

          {view === 'recommendations' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-600 via-[#1e3a5f] to-[#14b8a6]/50 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center gap-3 mb-2"><Sparkles size={24} /><h3 className="text-xl font-bold">Smart Money Tips</h3></div>
                <p className="text-[#14b8a6]/70">Personalized recommendations based on your spending patterns</p>
              </div>
              {savingsRecommendations.length === 0 ? (
                <div className="bg-gradient-to-r from-[#14b8a6]/5 via-white to-blue-50 rounded-2xl border-2 border-[#14b8a6]/20 p-8 text-center">
                  <CheckCircle size={48} className="mx-auto text-green-400 mb-4" />
                  <h3 className="font-bold text-slate-900 text-lg mb-2">You're Doing Great!</h3>
                  <p className="text-slate-500">No recommendations at this time. Keep up the good work!</p>
                </div>
              ) : (
                <div className="space-y-4">{savingsRecommendations.map(rec => (
                  <div key={rec.id} className={`bg-white rounded-2xl border-2 p-6 shadow-sm hover:shadow-lg transition-all ${rec.type === 'success' ? 'border-[#14b8a6]/20 bg-gradient-to-r from-[#14b8a6]/5 via-white to-blue-50' : rec.type === 'alert' ? 'border-rose-200 bg-gradient-to-r from-rose-50 via-white to-white' : rec.priority === 'high' ? 'border-amber-200 bg-gradient-to-r from-amber-50 via-white to-white' : 'border-[#1e3a5f]/10 bg-gradient-to-r from-[#0f172a]/5 via-white to-[#14b8a6]/5'}`}>
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl shadow-sm shrink-0 ${rec.type === 'success' ? 'bg-gradient-to-br from-green-400 to-[#14b8a6]/50' : rec.type === 'alert' ? 'bg-gradient-to-br from-rose-400 to-rose-500' : rec.type === 'increase' ? 'bg-gradient-to-br from-blue-400 to-blue-500' : 'bg-gradient-to-br from-amber-400 to-amber-500'}`}>
                        {rec.type === 'success' ? <CheckCircle size={20} className="text-white" /> : rec.type === 'alert' ? <AlertTriangle size={20} className="text-white" /> : rec.type === 'increase' ? <TrendingUp size={20} className="text-white" /> : <Lightbulb size={20} className="text-white" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-lg">{rec.title}</h4>
                          {rec.priority === 'high' && rec.type !== 'success' && <span className="px-2 py-1 text-xs font-bold bg-gradient-to-r from-amber-100 to-amber-200 text-amber-700 rounded-full">High Priority</span>}
                          {rec.priority === 'medium' && <span className="px-2 py-1 text-xs font-bold bg-gradient-to-r from-[#1e3a5f]/10 to-blue-200 text-blue-700 rounded-full">Medium</span>}
                        </div>
                        <p className="text-slate-600 mb-3">{rec.description}</p>
                        {rec.potential > 0 && (
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-[#14b8a6]/5 rounded-xl border border-[#14b8a6]/20 mb-3">
                            <DollarSign size={16} className="text-[#14b8a6]" />
                            <span className="font-bold text-green-700">Potential savings: {currency(rec.potential)}/mo</span>
                          </div>
                        )}
                        {rec.tips && rec.tips.length > 0 && (
                          <div className="mt-3 p-4 bg-gradient-to-r from-[#0f172a]/5 via-white to-[#14b8a6]/5 rounded-xl border border-[#1e3a5f]/10">
                            <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2"><Info size={14} className="text-[#14b8a6]" />Action Steps:</p>
                            <ul className="space-y-2">{rec.tips.map((tip, i) => (<li key={i} className="text-sm text-slate-600 flex items-start gap-2"><span className="w-5 h-5 rounded-full bg-gradient-to-r from-[#1e3a5f] to-[#14b8a6] text-white text-xs flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>{tip}</li>))}</ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}</div>
              )}
            </div>
          )}

          {/* Budget Goals View */}
          {view === 'budget' && (
            <div className="space-y-6 max-w-4xl">
              {/* Budget Overview Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 border-2 border-[#1e3a5f]/20 shadow-sm">
                  <p className="text-slate-500 text-sm font-medium mb-1">Total Budget</p>
                  <p className="text-2xl font-bold text-[#14b8a6]">{currency(budgetStats.totalBudget)}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border-2 border-[#14b8a6]/20 shadow-sm">
                  <p className="text-slate-500 text-sm font-medium mb-1">Total Spent</p>
                  <p className="text-2xl font-bold text-[#14b8a6]">{currency(budgetStats.totalSpent)}</p>
                </div>
                <div className={`bg-white rounded-2xl p-5 border-2 shadow-sm ${budgetStats.remaining >= 0 ? 'border-emerald-200' : 'border-rose-200'}`}>
                  <p className="text-slate-500 text-sm font-medium mb-1">Remaining</p>
                  <p className={`text-2xl font-bold ${budgetStats.remaining >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{currency(budgetStats.remaining)}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border-2 border-amber-200 shadow-sm">
                  <p className="text-slate-500 text-sm font-medium mb-1">Over Budget</p>
                  <p className="text-2xl font-bold text-amber-600">{budgetStats.categoriesOverBudget} categories</p>
                </div>
              </div>

              {/* Budget Alerts */}
              {budgetStats.categoriesOverBudget > 0 && (
                <div className="bg-rose-50 border-2 border-rose-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-rose-700 font-semibold mb-2">
                    <AlertTriangle size={18} />
                    Budget Alert: {budgetStats.categoriesOverBudget} category(s) over budget!
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {budgetAnalysis.filter(b => b.status === 'over').map(b => (
                      <span key={b.id} className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm font-medium">
                        {b.icon} {b.name}: {currency(b.spent - b.budget)} over
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Set Budget Goals */}
              <div className="bg-white rounded-2xl border-2 border-[#1e3a5f]/20 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Target size={18} className="text-[#14b8a6]" />
                    Category Budgets
                  </h3>
                  <button 
                    onClick={() => setModal('set-budgets')}
                    className="px-4 py-2 bg-gradient-to-r from-[#1e3a5f] to-[#14b8a6] text-white rounded-xl font-medium text-sm shadow-lg hover:from-blue-700 hover:to-green-600"
                  >
                    <Plus size={16} className="inline mr-1" />Set Budgets
                  </button>
                </div>

                {budgetAnalysis.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Target size={48} className="mx-auto mb-3 text-slate-300" />
                    <p className="font-medium">No budgets set yet</p>
                    <p className="text-sm">Click "Set Budgets" to create spending limits for each category</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {budgetAnalysis.map(b => (
                      <div key={b.id} className="border border-slate-200 rounded-xl p-4 hover:border-blue-300 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{b.icon}</span>
                            <span className="font-medium text-slate-900">{b.name}</span>
                          </div>
                          <div className="text-right">
                            <span className={`font-bold ${b.status === 'over' ? 'text-rose-600' : b.status === 'warning' ? 'text-amber-600' : 'text-[#14b8a6]'}`}>
                              {currency(b.spent)}
                            </span>
                            <span className="text-slate-400"> / {currency(b.budget)}</span>
                          </div>
                        </div>
                        <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`absolute h-full rounded-full transition-all ${
                              b.status === 'over' ? 'bg-gradient-to-r from-rose-500 to-rose-600' : 
                              b.status === 'warning' ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 
                              'bg-gradient-to-r from-green-400 to-[#14b8a6]/50'
                            }`}
                            style={{ width: `${Math.min(b.percentUsed, 100)}%` }}
                          />
                          {b.percentUsed > 100 && (
                            <div className="absolute right-0 top-0 h-full w-1 bg-rose-700 animate-pulse" />
                          )}
                        </div>
                        <div className="flex justify-between mt-1 text-xs">
                          <span className={b.status === 'over' ? 'text-rose-600 font-medium' : 'text-slate-500'}>
                            {b.percentUsed.toFixed(0)}% used
                          </span>
                          <span className={b.remaining >= 0 ? 'text-[#14b8a6]' : 'text-rose-600'}>
                            {b.remaining >= 0 ? `${currency(b.remaining)} left` : `${currency(Math.abs(b.remaining))} over`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Analytics View */}
          {view === 'analytics' && (
            <div className="space-y-6 max-w-4xl">
              {/* Analytics Header */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center gap-3 mb-2">
                  <BarChart3 size={24} />
                  <h3 className="font-bold text-lg">Financial Analytics</h3>
                </div>
                <p className="text-purple-100">Visualize your spending patterns and trends</p>
              </div>

              {/* Spending Trends Chart */}
              <div className="bg-white rounded-2xl border-2 border-[#1e3a5f]/20 shadow-sm p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <TrendingUp size={18} className="text-[#14b8a6]" />
                  6-Month Spending Trends
                </h3>
                <div className="h-64 flex items-end justify-between gap-2">
                  {spendingTrends.map((t, i) => {
                    const maxVal = Math.max(...spendingTrends.map(s => Math.max(s.income, s.expenses))) || 1;
                    const incomeHeight = (t.income / maxVal) * 200;
                    const expenseHeight = (t.expenses / maxVal) * 200;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center">
                        <div className="flex gap-1 items-end h-52 mb-2">
                          <div 
                            className="w-6 bg-gradient-to-t from-[#14b8a6]/50 to-green-400 rounded-t transition-all hover:from-[#0d9488] hover:to-[#14b8a6]/50" 
                            style={{ height: `${incomeHeight}px` }}
                            title={`Income: ${currency(t.income)}`}
                          />
                          <div 
                            className="w-6 bg-gradient-to-t from-rose-500 to-rose-400 rounded-t transition-all hover:from-rose-600 hover:to-rose-500" 
                            style={{ height: `${expenseHeight}px` }}
                            title={`Expenses: ${currency(t.expenses)}`}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-600">{t.month}</span>
                        <span className="text-xs text-slate-400">{t.year}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-r from-[#14b8a6]/50 to-green-400" />
                    <span className="text-sm text-slate-600">Income</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-r from-rose-500 to-rose-400" />
                    <span className="text-sm text-slate-600">Expenses</span>
                  </div>
                </div>
              </div>

              {/* Category Breakdown Pie Chart */}
              <div className="bg-white rounded-2xl border-2 border-[#1e3a5f]/20 shadow-sm p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <PieChart size={18} className="text-purple-600" />
                  Spending by Category ({FULL_MONTHS[month]})
                </h3>
                {catBreakdown.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <PieChart size={48} className="mx-auto mb-3 text-slate-300" />
                    <p>No spending data for this month</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Simple SVG Pie Chart */}
                    <div className="flex items-center justify-center">
                      <svg width="200" height="200" viewBox="0 0 200 200">
                        {(() => {
                          let cumulative = 0;
                          return catBreakdown.slice(0, 8).map((cat, i) => {
                            const pct = cat.pct / 100;
                            const startAngle = cumulative * 360;
                            cumulative += pct;
                            const endAngle = cumulative * 360;
                            const x1 = 100 + 80 * Math.cos((startAngle - 90) * Math.PI / 180);
                            const y1 = 100 + 80 * Math.sin((startAngle - 90) * Math.PI / 180);
                            const x2 = 100 + 80 * Math.cos((endAngle - 90) * Math.PI / 180);
                            const y2 = 100 + 80 * Math.sin((endAngle - 90) * Math.PI / 180);
                            const largeArc = pct > 0.5 ? 1 : 0;
                            return (
                              <path
                                key={cat.id}
                                d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                fill={cat.color}
                                opacity={0.8}
                                className="hover:opacity-100 transition-opacity cursor-pointer"
                              >
                                <title>{cat.name}: {currency(cat.total)} ({cat.pct.toFixed(1)}%)</title>
                              </path>
                            );
                          });
                        })()}
                        <circle cx="100" cy="100" r="40" fill="white" />
                        <text x="100" y="95" textAnchor="middle" className="text-sm font-bold fill-slate-700">Total</text>
                        <text x="100" y="115" textAnchor="middle" className="text-xs fill-slate-500">{currency(stats.expenses)}</text>
                      </svg>
                    </div>
                    {/* Legend */}
                    <div className="space-y-2">
                      {catBreakdown.slice(0, 8).map(cat => (
                        <div key={cat.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                            <span className="text-sm font-medium text-slate-700">{cat.icon} {cat.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-slate-900">{currency(cat.total)}</span>
                            <span className="text-xs text-slate-400 ml-2">({cat.pct.toFixed(1)}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Monthly Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-[#14b8a6]/5 to-[#14b8a6]/10 rounded-xl p-4 border border-[#14b8a6]/20">
                  <p className="text-[#14b8a6] text-sm font-medium">Avg Monthly Income</p>
                  <p className="text-xl font-bold text-green-700">{currency(spendingTrends.reduce((s, t) => s + t.income, 0) / 6)}</p>
                </div>
                <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl p-4 border border-rose-200">
                  <p className="text-rose-600 text-sm font-medium">Avg Monthly Expenses</p>
                  <p className="text-xl font-bold text-rose-700">{currency(spendingTrends.reduce((s, t) => s + t.expenses, 0) / 6)}</p>
                </div>
                <div className="bg-gradient-to-br from-[#0f172a]/5 to-blue-100 rounded-xl p-4 border border-[#1e3a5f]/20">
                  <p className="text-[#14b8a6] text-sm font-medium">Avg Savings</p>
                  <p className="text-xl font-bold text-blue-700">{currency(spendingTrends.reduce((s, t) => s + t.net, 0) / 6)}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                  <p className="text-purple-600 text-sm font-medium">Savings Rate</p>
                  <p className="text-xl font-bold text-purple-700">
                    {spendingTrends.reduce((s, t) => s + t.income, 0) > 0 
                      ? ((spendingTrends.reduce((s, t) => s + t.net, 0) / spendingTrends.reduce((s, t) => s + t.income, 0)) * 100).toFixed(1)
                      : 0}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Debt Payoff View */}
          {view === 'debts' && (
            <div className="space-y-6 max-w-4xl">
              {/* Debt Overview Header */}
              <div className="bg-gradient-to-r from-rose-600 to-orange-500 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <CreditCard size={24} />
                      <h3 className="font-bold text-lg">Debt Payoff Planner</h3>
                    </div>
                    <p className="text-rose-100">Track and eliminate your debts with proven strategies</p>
                  </div>
                  <button 
                    onClick={() => setModal('add-debt')}
                    className="px-5 py-3 bg-white text-rose-600 rounded-xl font-semibold shadow-lg hover:bg-rose-50"
                  >
                    <Plus size={18} className="inline mr-1" />Add Debt
                  </button>
                </div>
              </div>

              {/* Debt Summary Cards */}
              {debts.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-2xl p-5 border-2 border-rose-200 shadow-sm">
                    <p className="text-slate-500 text-sm font-medium mb-1">Total Debt</p>
                    <p className="text-2xl font-bold text-rose-600">{currency(debtPayoffPlan.totalDebt)}</p>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border-2 border-amber-200 shadow-sm">
                    <p className="text-slate-500 text-sm font-medium mb-1">Min. Payments</p>
                    <p className="text-2xl font-bold text-amber-600">{currency(debtPayoffPlan.totalMinPayment)}/mo</p>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border-2 border-[#1e3a5f]/20 shadow-sm">
                    <p className="text-slate-500 text-sm font-medium mb-1">Payoff Time</p>
                    <p className="text-2xl font-bold text-[#14b8a6]">{Math.ceil(debtPayoffPlan.avalancheMonths / 12)} years</p>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border-2 border-[#14b8a6]/20 shadow-sm">
                    <p className="text-slate-500 text-sm font-medium mb-1">Interest Saved</p>
                    <p className="text-2xl font-bold text-[#14b8a6]">{currency(debtPayoffPlan.interestSavings)}</p>
                    <p className="text-xs text-slate-400">with avalanche method</p>
                  </div>
                </div>
              )}

              {/* Debt List */}
              <div className="bg-white rounded-2xl border-2 border-[#1e3a5f]/20 shadow-sm p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <CreditCard size={18} className="text-rose-600" />
                  Your Debts
                </h3>
                
                {debts.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <CreditCard size={48} className="mx-auto mb-3 text-slate-300" />
                    <p className="font-medium">No debts added yet</p>
                    <p className="text-sm">Click "Add Debt" to start tracking your debts</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {debts.map(d => (
                      <div key={d.id} className="border border-slate-200 rounded-xl p-4 hover:border-rose-300 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-semibold text-slate-900">{d.name}</span>
                            <span className="ml-2 text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full">{d.type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => setEditDebt(d)} className="p-2 text-[#14b8a6] hover:bg-blue-50 rounded-lg">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => setDebts(debts.filter(x => x.id !== d.id))} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500">Balance</p>
                            <p className="font-bold text-rose-600">{currency(d.balance)}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Interest Rate</p>
                            <p className="font-bold text-amber-600">{d.interestRate}%</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Min Payment</p>
                            <p className="font-bold text-[#14b8a6]">{currency(d.minPayment)}/mo</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payoff Strategies */}
              {debts.length > 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Snowball Method */}
                  <div className="bg-gradient-to-br from-[#0f172a]/5 to-blue-100 rounded-2xl border-2 border-[#1e3a5f]/20 p-6">
                    <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                      ❄️ Debt Snowball
                    </h4>
                    <p className="text-sm text-[#14b8a6] mb-4">Pay smallest balances first for quick wins</p>
                    <div className="space-y-2 mb-4">
                      {debtPayoffPlan.snowball.map((d, i) => (
                        <div key={d.id} className="flex items-center gap-2 text-sm">
                          <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">{i + 1}</span>
                          <span className="text-slate-700">{d.name}</span>
                          <span className="text-[#14b8a6] ml-auto font-medium">{currency(d.balance)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-4 border-t border-[#1e3a5f]/20">
                      <p className="text-sm text-slate-600">Est. payoff: <strong>{Math.ceil(debtPayoffPlan.snowballMonths / 12)} years</strong></p>
                      <p className="text-sm text-slate-600">Total interest: <strong className="text-rose-600">{currency(debtPayoffPlan.snowballInterest)}</strong></p>
                    </div>
                  </div>

                  {/* Avalanche Method */}
                  <div className="bg-gradient-to-br from-[#14b8a6]/5 to-[#14b8a6]/10 rounded-2xl border-2 border-[#14b8a6]/20 p-6">
                    <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                      🏔️ Debt Avalanche
                      <span className="text-xs px-2 py-1 bg-[#14b8a6]/50 text-white rounded-full">Recommended</span>
                    </h4>
                    <p className="text-sm text-[#14b8a6] mb-4">Pay highest interest first to save money</p>
                    <div className="space-y-2 mb-4">
                      {debtPayoffPlan.avalanche.map((d, i) => (
                        <div key={d.id} className="flex items-center gap-2 text-sm">
                          <span className="w-6 h-6 rounded-full bg-[#14b8a6]/50 text-white text-xs flex items-center justify-center">{i + 1}</span>
                          <span className="text-slate-700">{d.name}</span>
                          <span className="text-amber-600 ml-auto font-medium">{d.interestRate}% APR</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-4 border-t border-[#14b8a6]/20">
                      <p className="text-sm text-slate-600">Est. payoff: <strong>{Math.ceil(debtPayoffPlan.avalancheMonths / 12)} years</strong></p>
                      <p className="text-sm text-slate-600">Total interest: <strong className="text-[#14b8a6]">{currency(debtPayoffPlan.avalancheInterest)}</strong></p>
                      <p className="text-sm font-semibold text-green-700 mt-2">💰 Save {currency(debtPayoffPlan.interestSavings)} vs snowball!</p>
                      <p className="text-sm font-semibold text-green-700 mt-2">💰 Save {currency(debtPayoffPlan.interestSavings)} vs snowball!</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {view === 'settings' && (
            <div className="space-y-4 max-w-2xl">
              <div className="bg-gradient-to-r from-[#0f172a]/5 via-white to-[#14b8a6]/5 rounded-2xl border-2 border-[#1e3a5f]/20 shadow-sm p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Calculator size={18} className="text-[#14b8a6]" />Balance Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-600 mb-2 font-medium">Beginning Balance ({FULL_MONTHS[month]} {year})</label>
                    <input type="number" value={stats.beginning} onChange={(e) => setBeginningBalance(e.target.value)} className="w-full px-4 py-3 bg-white border-2 border-[#1e3a5f]/20 rounded-xl focus:ring-2 focus:ring-[#14b8a6] text-lg font-semibold" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-2 font-medium">Ending Balance Override</label>
                    <input type="number" value={stats.ending} onChange={(e) => setEndingBalance(e.target.value)} className="w-full px-4 py-3 bg-white border-2 border-[#14b8a6]/20 rounded-xl focus:ring-2 focus:ring-[#14b8a6] text-lg font-semibold" />
                    <p className="text-xs text-slate-400 mt-1">Calculated: {currency(stats.calculatedEnding)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-[#14b8a6]/5 via-white to-blue-50 rounded-2xl border-2 border-[#14b8a6]/20 shadow-sm p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Target size={18} className="text-[#14b8a6]" />Savings Settings</h3>
                <div>
                  <label className="block text-sm text-slate-600 mb-2 font-medium">Monthly Savings Goal</label>
                  <input type="number" value={savingsGoal} onChange={(e) => setSavingsGoal(parseFloat(e.target.value) || 0)} className="w-full px-4 py-3 bg-white border-2 border-[#14b8a6]/20 rounded-xl focus:ring-2 focus:ring-[#14b8a6] text-lg font-semibold" />
                </div>
              </div>
              
              {/* Backup & Restore Section - User Friendly */}
              <div className="bg-white rounded-2xl border-2 border-[#1e3a5f]/10 shadow-sm p-6">
                <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <Save size={18} className="text-[#14b8a6]" />
                  Save & Restore Your Data
                </h3>
                <p className="text-sm text-slate-500 mb-4">Keep your financial data safe by saving a backup file to your computer.</p>
                
                {/* Your Data Summary */}
                <div className="bg-gradient-to-r from-[#0f172a]/5 to-[#14b8a6]/5 rounded-xl p-4 mb-4 border border-[#1e3a5f]/20">
                  <p className="text-sm font-medium text-slate-700 mb-2">📊 Your Data Summary</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="text-center">
                      <p className="text-xl font-bold text-[#14b8a6]">{transactions.length}</p>
                      <p className="text-xs text-slate-500">Transactions</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-[#14b8a6]">{recurringExpenses.length}</p>
                      <p className="text-xs text-slate-500">Recurring Bills</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-purple-600">{debts.length}</p>
                      <p className="text-xs text-slate-500">Debts Tracked</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-amber-600">{Object.keys(budgetGoals).filter(k => budgetGoals[k] > 0).length}</p>
                      <p className="text-xs text-slate-500">Budget Goals</p>
                    </div>
                  </div>
                </div>
                
                {/* Save Backup - Big Friendly Button */}
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-[#14b8a6]/5 to-emerald-50 rounded-xl p-5 border-2 border-[#14b8a6]/20">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-[#14b8a6]/50 text-white">
                        <Download size={24} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-green-800 mb-1">💾 Save a Backup</h4>
                        <p className="text-sm text-green-700 mb-3">Download a copy of all your data to your computer. You can use this to restore your data if anything goes wrong.</p>
                        <button 
                          onClick={() => {
                            const data = {
                              appName: 'Balance Books Pro',
                              version: APP_VERSION,
                              exportDate: new Date().toISOString(),
                              exportDateFormatted: new Date().toLocaleDateString('en-US', { 
                                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                              }),
                              summary: {
                                transactions: transactions.length,
                                recurringBills: recurringExpenses.length,
                                debts: debts.length,
                                budgetGoals: Object.keys(budgetGoals).filter(k => budgetGoals[k] > 0).length
                              },
                              data: {
                                transactions,
                                recurringExpenses,
                                monthlyBalances,
                                savingsGoal,
                                budgetGoals,
                                debts
                              }
                            };
                            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                            const a = document.createElement('a');
                            a.href = URL.createObjectURL(blob);
                            const dateStr = new Date().toISOString().split('T')[0];
                            a.download = `BalanceBooks-Backup-${dateStr}.backup`;
                            a.click();
                            URL.revokeObjectURL(a.href);
                            setLastBackupDate(new Date().toISOString());
                            alert('✅ Backup saved!\n\nYour backup file has been downloaded.\n\n💡 Tip: Keep this file somewhere safe, like:\n• Email it to yourself\n• Save to Google Drive or Dropbox\n• Copy to a USB drive');
                          }}
                          className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all"
                        >
                          <Download size={18} />
                          Save Backup to Computer
                        </button>
                        {lastBackupDate && (
                          <p className="text-xs text-[#14b8a6] mt-2 text-center">
                            ✓ Last backup: {new Date(lastBackupDate).toLocaleDateString()} at {new Date(lastBackupDate).toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Restore Backup - Visual & Friendly */}
                  <div className="bg-gradient-to-r from-[#0f172a]/5 to-indigo-50 rounded-xl p-5 border-2 border-[#1e3a5f]/20">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-blue-500 text-white">
                        <Upload size={24} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-800 mb-1">📂 Restore from Backup</h4>
                        <p className="text-sm text-blue-700 mb-3">Got a new computer or lost your data? Select a backup file to restore everything.</p>
                        <button 
                          onClick={() => setModal('restore-wizard')}
                          className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all"
                        >
                          <Upload size={18} />
                          Restore from Backup File
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Export Options */}
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-sm font-medium text-slate-600 mb-3">📤 Other Export Options</p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-200">
                      <FileSpreadsheet size={16} />Import Template
                    </button>
                    <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-200">
                      <Download size={16} />Export to Spreadsheet
                    </button>
                  </div>
                </div>
              </div>

              {/* Backup & Sync Section */}
              <div className="bg-gradient-to-r from-indigo-50 via-white to-purple-50 rounded-2xl border-2 border-indigo-200 shadow-sm p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Cloud size={18} className="text-indigo-600" />
                  Backup & Data Protection
                </h3>
                
                <div className="space-y-4">
                  {/* Auto-Backup Toggle */}
                  <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-indigo-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-indigo-100">
                        <HardDrive size={18} className="text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Auto-Backup (Local)</p>
                        <p className="text-sm text-slate-500">Automatically download backup every 24 hours</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={autoBackupEnabled} 
                        onChange={(e) => setAutoBackupEnabled(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                  
                  {lastBackupDate && (
                    <p className="text-sm text-slate-500 px-4">
                      ✓ Last auto-backup: {new Date(lastBackupDate).toLocaleDateString()} at {new Date(lastBackupDate).toLocaleTimeString()}
                    </p>
                  )}

                  {/* Bill Notifications Toggle */}
                  <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-amber-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-100">
                        <Bell size={18} className="text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Bill Reminders</p>
                        <p className="text-sm text-slate-500">Get desktop notifications for upcoming bills</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={notificationsEnabled} 
                        onChange={(e) => {
                          if (e.target.checked && 'Notification' in window) {
                            Notification.requestPermission().then(perm => {
                              if (perm === 'granted') {
                                setNotificationsEnabled(true);
                                new Notification('🔔 Notifications Enabled', { body: 'You will now receive bill reminders!' });
                              } else {
                                alert('Please enable notifications in your browser settings.');
                              }
                            });
                          } else {
                            setNotificationsEnabled(false);
                          }
                        }}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  {/* Cloud Backup Options (Coming Soon) */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 opacity-75">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-slate-700 flex items-center gap-2">
                        <Cloud size={16} className="text-slate-500" />
                        Cloud Backup Options
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-[#14b8a6] rounded-full">Coming Soon</span>
                      </h4>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button disabled className="flex flex-col items-center gap-1 p-3 bg-white rounded-lg border border-slate-200 opacity-50 cursor-not-allowed">
                        <span className="text-2xl">📁</span>
                        <span className="text-xs text-slate-500">Google Drive</span>
                      </button>
                      <button disabled className="flex flex-col items-center gap-1 p-3 bg-white rounded-lg border border-slate-200 opacity-50 cursor-not-allowed">
                        <span className="text-2xl">📦</span>
                        <span className="text-xs text-slate-500">Dropbox</span>
                      </button>
                      <button disabled className="flex flex-col items-center gap-1 p-3 bg-white rounded-lg border border-slate-200 opacity-50 cursor-not-allowed">
                        <span className="text-2xl">☁️</span>
                        <span className="text-xs text-slate-500">OneDrive</span>
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 text-center">Sync across devices while keeping your data private</p>
                  </div>

                  {/* Email Backup */}
                  <button 
                    onClick={() => {
                      const backup = {
                        version: APP_VERSION,
                        exportDate: new Date().toISOString(),
                        transactions,
                        recurringExpenses,
                        monthlyBalances,
                        savingsGoal,
                        budgetGoals,
                        debts
                      };
                      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
                      const a = document.createElement('a');
                      a.href = URL.createObjectURL(blob);
                      a.download = `balance-books-backup-${new Date().toISOString().split('T')[0]}.json`;
                      a.click();
                      URL.revokeObjectURL(a.href);
                      alert('💡 Tip: Email this backup file to yourself for safekeeping!\n\nYour backup has been downloaded.');
                    }}
                    className="w-full flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-600 shadow-md"
                  >
                    <Mail size={18} />
                    Download Backup for Email
                  </button>
                  
                  <p className="text-xs text-slate-400 text-center">
                    💡 Pro tip: Email your backup to yourself regularly for off-device protection
                  </p>
                </div>
              </div>
              
              {/* Danger Zone */}
              <div className="bg-white rounded-2xl border-2 border-rose-200 shadow-sm p-6">
                <h3 className="font-semibold text-rose-600 mb-4 flex items-center gap-2">
                  <AlertTriangle size={18} />
                  Danger Zone
                </h3>
                <p className="text-sm text-slate-600 mb-4">These actions cannot be undone. Make sure to backup your data first.</p>
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={() => { 
                      if (confirm(`Delete all ${transactions.length} transactions?\n\nThis cannot be undone. Consider backing up first.`)) { 
                        setTransactions([]); 
                      }
                    }} 
                    className="flex items-center gap-2 px-4 py-3 bg-rose-100 text-rose-600 rounded-xl font-medium hover:bg-rose-200"
                    disabled={transactions.length === 0}
                  >
                    <Trash2 size={18} />Delete All Transactions
                  </button>
                  <button 
                    onClick={() => { 
                      if (confirm(`Delete all ${recurringExpenses.length} recurring expenses?\n\nThis cannot be undone.`)) { 
                        setRecurringExpenses([]); 
                      }
                    }} 
                    className="flex items-center gap-2 px-4 py-3 bg-rose-100 text-rose-600 rounded-xl font-medium hover:bg-rose-200"
                    disabled={recurringExpenses.length === 0}
                  >
                    <Trash2 size={18} />Delete Recurring
                  </button>
                  <button 
                    onClick={() => { 
                      if (confirm('RESET EVERYTHING?\n\nThis will delete ALL your data including:\n• Transactions\n• Recurring expenses\n• Monthly balances\n• Savings goal\n\nThis cannot be undone!')) { 
                        setTransactions([]); 
                        setRecurringExpenses([]); 
                        setMonthlyBalances({}); 
                        setSavingsGoal(500);
                        localStorage.clear(); 
                      }
                    }} 
                    className="flex items-center gap-2 px-4 py-3 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 shadow-md"
                  >
                    <Trash2 size={18} />Factory Reset
                  </button>
                </div>
              </div>
              
              {/* About */}
              <div className="bg-white rounded-2xl border-2 border-[#1e3a5f]/10 shadow-sm p-6">
                <h3 className="font-semibold text-slate-900 mb-4">About</h3>
                <p className="text-sm text-slate-600"><span className="font-medium text-[#14b8a6]">Version:</span> {APP_VERSION}</p>
                <p className="text-sm text-slate-600"><span className="font-medium text-[#14b8a6]">Platform:</span> {isElectron ? 'Desktop' : 'Web'}</p>
                <p className="text-sm text-slate-600"><span className="font-medium text-purple-600">Storage:</span> Local (your data stays on your device)</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {isMobile && <button onClick={() => setModal('add')} className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-[#1e3a5f] to-[#14b8a6] text-white rounded-full shadow-xl flex items-center justify-center z-30 hover:from-blue-700 hover:to-green-600"><Plus size={24} /></button>}

      {/* Edit Beginning Balance Modal */}
      {modal === 'edit-beginning' && (
        <Modal title="Edit Beginning Balance" onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-[#0f172a]/5 to-[#14b8a6]/5 rounded-xl p-4 border border-[#1e3a5f]/20">
              <p className="text-sm text-slate-600">Set the starting balance for <strong>{FULL_MONTHS[month]} {year}</strong>. This is carried over from the previous month's ending balance by default.</p>
            </div>
            <div>
              <label className="block text-sm text-slate-600 font-medium mb-2">Beginning Balance</label>
              <input 
                type="number" 
                defaultValue={stats.beginning}
                onChange={(e) => setBeginningBalance(e.target.value)}
                className="w-full px-4 py-4 bg-white border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-[#14b8a6] text-2xl font-bold text-[#14b8a6]"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 px-4 py-3 bg-slate-100 rounded-xl text-slate-700 font-medium hover:bg-slate-200">Close</button>
              <button onClick={() => setModal(null)} className="flex-1 px-4 py-3 bg-gradient-to-r from-[#1e3a5f] to-[#14b8a6] text-white rounded-xl font-semibold shadow-lg hover:from-blue-700 hover:to-green-600">Save</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Ending Balance Modal */}
      {modal === 'edit-ending' && (
        <Modal title="Edit Ending Balance" onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-[#14b8a6]/5 to-blue-50 rounded-xl p-4 border border-[#14b8a6]/20">
              <p className="text-sm text-slate-600">Override the ending balance for <strong>{FULL_MONTHS[month]} {year}</strong>. This will carry over to next month's beginning balance.</p>
              <p className="text-xs text-slate-400 mt-2">Calculated value: {currency(stats.calculatedEnding)}</p>
            </div>
            <div>
              <label className="block text-sm text-slate-600 font-medium mb-2">Ending Balance</label>
              <input 
                type="number" 
                defaultValue={stats.ending}
                onChange={(e) => setEndingBalance(e.target.value)}
                className="w-full px-4 py-4 bg-white border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-[#14b8a6] text-2xl font-bold text-[#14b8a6]"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 px-4 py-3 bg-slate-100 rounded-xl text-slate-700 font-medium hover:bg-slate-200">Close</button>
              <button onClick={() => setModal(null)} className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:from-green-700 hover:to-blue-600">Save</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Income Modal - Quick add income transaction */}
      {modal === 'edit-income' && (
        <Modal title="Add/Adjust Income" onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-[#14b8a6]/5 to-blue-50 rounded-xl p-4 border border-[#14b8a6]/20">
              <p className="text-sm text-slate-600">Current income for <strong>{FULL_MONTHS[month]} {year}</strong>: <span className="font-bold text-[#14b8a6]">{currency(stats.income)}</span></p>
              <p className="text-xs text-slate-400 mt-2">Add a new income transaction or view all income in Transactions.</p>
            </div>
            <div className="space-y-3">
              <button 
                onClick={() => { setModal('add'); }}
                className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-green-600 to-[#14b8a6]/50 text-white rounded-xl font-semibold shadow-lg hover:from-green-700 hover:to-green-600"
              >
                <Plus size={18} />Add Income Transaction
              </button>
              <button 
                onClick={() => { setView('transactions'); setFilterCat('income'); setModal(null); }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#14b8a6]/5 text-green-700 rounded-xl font-medium hover:bg-[#14b8a6]/10 border border-[#14b8a6]/20"
              >
                <Receipt size={18} />View All Income Transactions
              </button>
            </div>
            <button onClick={() => setModal(null)} className="w-full flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200"><X size={18} />Close</button>
          </div>
        </Modal>
      )}

      {/* Edit Expenses Modal - Quick add expense or view */}
      {modal === 'edit-expenses' && (
        <Modal title="Add/Adjust Expenses" onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-rose-50 to-orange-50 rounded-xl p-4 border border-rose-200">
              <p className="text-sm text-slate-600">Current expenses for <strong>{FULL_MONTHS[month]} {year}</strong>: <span className="font-bold text-rose-600">{currency(stats.expenses)}</span></p>
              {stats.unpaidCount > 0 && <p className="text-xs text-amber-600 mt-2 font-medium">⚠️ {stats.unpaidCount} transactions marked as unpaid</p>}
            </div>
            <div className="space-y-3">
              <button 
                onClick={() => { setModal('add'); }}
                className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-rose-600 to-rose-500 text-white rounded-xl font-semibold shadow-lg hover:from-rose-700 hover:to-rose-600"
              >
                <Plus size={18} />Add Expense Transaction
              </button>
              <button 
                onClick={() => { setView('transactions'); setFilterPaid('unpaid'); setModal(null); }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-amber-50 text-amber-700 rounded-xl font-medium hover:bg-amber-100 border border-amber-200"
              >
                <Clock size={18} />View Unpaid Only ({stats.unpaidCount})
              </button>
              <button 
                onClick={() => { setView('transactions'); setModal(null); }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-rose-50 text-rose-700 rounded-xl font-medium hover:bg-rose-100 border border-rose-200"
              >
                <Receipt size={18} />View All Transactions
              </button>
            </div>
            <button onClick={() => setModal(null)} className="w-full flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200"><X size={18} />Close</button>
          </div>
        </Modal>
      )}

      {/* Edit Savings Goal Modal */}
      {modal === 'edit-goal' && (
        <Modal title="Edit Savings Goal" onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-[#14b8a6]/5 to-blue-50 rounded-xl p-4 border border-[#14b8a6]/20">
              <p className="text-sm text-slate-600">Set your monthly savings target. Experts recommend saving at least 20% of your income.</p>
            </div>
            <div>
              <label className="block text-sm text-slate-600 font-medium mb-2">Monthly Savings Goal</label>
              <input 
                type="number" 
                defaultValue={savingsGoal}
                onChange={(e) => setSavingsGoal(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-4 bg-white border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-[#14b8a6] text-2xl font-bold text-[#14b8a6]"
                autoFocus
              />
            </div>
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
            <button onClick={downloadTemplate} className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-[#0f172a]/5 to-[#14b8a6]/5 text-slate-700 rounded-xl font-medium hover:from-[#1e3a5f]/10 hover:to-[#14b8a6]/10 border-2 border-[#1e3a5f]/20"><Download size={18} className="text-[#14b8a6]" />Download Template</button>
            <div className="relative"><input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileImport} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" /><div className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-[#1e3a5f] to-[#14b8a6] text-white rounded-xl font-semibold shadow-lg"><Upload size={18} />Select File</div></div>
            <button onClick={() => setModal(null)} className="w-full flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 border border-slate-200"><X size={18} />Close</button>
          </div>
        </Modal>
      )}

      {modal === 'import-confirm' && importData && (
        <Modal title="Confirm Import" onClose={() => { setImportData(null); setModal(null); }}>
          <div className="space-y-4">
            {/* Success Summary */}
            <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-xl p-4 border border-[#14b8a6]/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#14b8a6]/50 rounded-full flex items-center justify-center">
                  <CheckCircle size={20} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-green-800">{importData.transactions.length} transactions ready to import</p>
                  <p className="text-sm text-green-700">From: {importData.filename}</p>
                </div>
              </div>
            </div>
            
            {/* Financial Summary */}
            {importData.summary && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#14b8a6]/5 rounded-lg p-3 border border-[#14b8a6]/20">
                  <p className="text-xs text-[#14b8a6] font-medium">Total Income</p>
                  <p className="text-lg font-bold text-green-700">{currency(importData.summary.income)}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                  <p className="text-xs text-red-600 font-medium">Total Expenses</p>
                  <p className="text-lg font-bold text-red-700">{currency(importData.summary.expenses)}</p>
                </div>
              </div>
            )}
            
            {/* Errors Warning */}
            {importData.errors && importData.errors.length > 0 && (
              <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                <p className="font-semibold text-amber-800 flex items-center gap-2 text-sm">
                  <AlertTriangle size={16} />
                  {importData.errors.length} row(s) skipped due to errors
                </p>
                <ul className="mt-2 text-xs text-amber-700 max-h-16 overflow-y-auto space-y-1">
                  {importData.errors.slice(0, 3).map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                  {importData.errors.length > 3 && <li className="text-amber-600">...and {importData.errors.length - 3} more</li>}
                </ul>
              </div>
            )}
            
            {/* Transaction Preview */}
            <div>
              <p className="text-sm font-medium text-slate-600 mb-2">Preview (newest first):</p>
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg">
                {importData.transactions.slice(0, 8).map((tx, i) => {
                  const cat = CATEGORIES.find(c => c.id === tx.category);
                  return (
                    <div key={i} className="flex items-center justify-between p-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{cat?.icon || '📦'}</span>
                        <div>
                          <p className="font-medium text-sm text-slate-900">{tx.desc}</p>
                          <p className="text-xs text-slate-500">{tx.date} • {cat?.name || 'Other'}</p>
                        </div>
                      </div>
                      <span className={`font-bold text-sm ${tx.amount > 0 ? 'text-[#14b8a6]' : 'text-slate-900'}`}>
                        {tx.amount > 0 ? '+' : ''}{currency(tx.amount)}
                      </span>
                    </div>
                  );
                })}
                {importData.transactions.length > 8 && (
                  <p className="p-3 text-center text-sm text-slate-500 bg-slate-50">
                    ...and {importData.transactions.length - 8} more transactions
                  </p>
                )}
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => { setImportData(null); setModal(null); }} 
                className="flex-1 px-4 py-3 bg-slate-100 rounded-xl text-slate-700 font-medium hover:bg-slate-200"
              >
                Cancel
              </button>
              <button 
                onClick={confirmImport} 
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:from-green-700 hover:to-[#0f172a]"
              >
                Import {importData.transactions.length} Transactions
              </button>
            </div>
          </div>
        </Modal>
      )}

      {modal === 'connect' && (
        <Modal title="Connect Bank" onClose={() => setModal(null)}>
          <div className="space-y-5">
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1e3a5f] to-[#14b8a6] flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Building2 size={32} className="text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Secure Bank Connection</h3>
              <p className="text-slate-500 text-sm">Connect your bank to automatically track when bills are paid</p>
            </div>
            
            <div className="bg-gradient-to-r from-[#0f172a]/5 to-[#14b8a6]/5 border-2 border-[#1e3a5f]/20 rounded-xl p-4">
              <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Shield size={16} className="text-[#14b8a6]" />
                What We Access & Why
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <Check size={14} className="text-[#14b8a6] mt-0.5 shrink-0" />
                  <span className="text-slate-600"><strong>Transaction history</strong> — To auto-match and mark your bills as paid</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={14} className="text-[#14b8a6] mt-0.5 shrink-0" />
                  <span className="text-slate-600"><strong>Account balances</strong> — To show your current financial status</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={14} className="text-[#14b8a6] mt-0.5 shrink-0" />
                  <span className="text-slate-600"><strong>Account names</strong> — To identify checking vs savings accounts</span>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                <X size={14} className="text-rose-500" />
                What We Never Access
              </h4>
              <div className="space-y-1 text-sm text-slate-600">
                <p>• Your login credentials (handled by your bank)</p>
                <p>• Ability to move or transfer money</p>
                <p>• Your SSN or personal identity info</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-sm text-amber-700"><strong>Demo Mode:</strong> This will simulate a USAA connection for demonstration.</p>
            </div>
            
            <button 
              onClick={connectBank} 
              disabled={plaidLoading} 
              className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-green-600 to-[#14b8a6]/50 text-white rounded-xl font-semibold disabled:opacity-50 shadow-lg hover:from-green-700 hover:to-green-600 transition-all"
            >
              {plaidLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Connecting to USAA...</span>
                </>
              ) : (
                <>
                  <Link2 size={18} />
                  <span>Connect Demo Bank</span>
                </>
              )}
            </button>
            <p className="text-xs text-slate-400 text-center">Your data is encrypted and stored locally on your device</p>
          </div>
        </Modal>
      )}

      {/* Set Budget Goals Modal */}
      {modal === 'set-budgets' && (
        <Modal title="Set Budget Goals" onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-[#0f172a]/5 to-[#14b8a6]/5 rounded-xl p-4 border border-[#1e3a5f]/20">
              <p className="text-sm text-slate-600">Set monthly spending limits for each category. Leave blank for no limit.</p>
            </div>
            <div className="max-h-96 overflow-y-auto space-y-3">
              {CATEGORIES.filter(c => c.id !== 'income').map(cat => (
                <div key={cat.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:border-blue-300">
                  <span className="text-xl">{cat.icon}</span>
                  <span className="flex-1 font-medium text-slate-700">{cat.name}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">$</span>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      placeholder="0"
                      value={budgetGoals[cat.id] || ''}
                      onChange={(e) => setBudgetGoals(prev => ({ ...prev, [cat.id]: parseFloat(e.target.value) || 0 }))}
                      className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-right font-medium focus:ring-2 focus:ring-[#14b8a6]"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setModal(null)} className="flex-1 px-4 py-3 bg-slate-100 rounded-xl text-slate-700 font-medium hover:bg-slate-200">Close</button>
              <button onClick={() => setModal(null)} className="flex-1 px-4 py-3 bg-gradient-to-r from-[#1e3a5f] to-[#14b8a6] text-white rounded-xl font-semibold shadow-lg">Save Budgets</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Debt Modal */}
      {modal === 'add-debt' && (
        <Modal title="Add Debt" onClose={() => setModal(null)}>
          <DebtForm 
            onSubmit={(debt) => { setDebts([...debts, { ...debt, id: uid() }]); setModal(null); }}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}

      {/* Edit Debt Modal */}
      {editDebt && (
        <Modal title="Edit Debt" onClose={() => setEditDebt(null)}>
          <DebtForm 
            debt={editDebt}
            onSubmit={(debt) => { setDebts(debts.map(d => d.id === debt.id ? debt : d)); setEditDebt(null); }}
            onCancel={() => setEditDebt(null)}
          />
        </Modal>
      )}

      {/* User-Friendly Restore Wizard */}
      {modal === 'restore-wizard' && (
        <Modal title="Restore Your Data" onClose={() => { setModal(null); setRestoreData(null); }}>
          <div className="space-y-4">
            {!restoreData ? (
              // Step 1: Select file
              <div className="space-y-4">
                <div className="text-center py-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0f172a]/50 to-indigo-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Upload size={36} className="text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Select Your Backup File</h3>
                  <p className="text-sm text-slate-500">Choose the backup file you previously saved to restore your data.</p>
                </div>
                
                <div className="bg-blue-50 rounded-xl p-4 border border-[#1e3a5f]/20">
                  <p className="text-sm text-blue-800 mb-2 font-medium">📁 Where to find your backup:</p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Check your <strong>Downloads</strong> folder</li>
                    <li>• Look for files named <strong>BalanceBooks-Backup-...</strong></li>
                    <li>• Or check your email if you sent it to yourself</li>
                  </ul>
                </div>

                <div className="relative">
                  <input 
                    type="file" 
                    accept=".backup,.json"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        try {
                          const parsed = JSON.parse(ev.target.result);
                          // Handle both old and new backup formats
                          const data = parsed.data || parsed;
                          const transactions = data.transactions || parsed.transactions;
                          
                          if (transactions && Array.isArray(transactions)) {
                            setRestoreData({
                              filename: file.name,
                              date: parsed.exportDateFormatted || parsed.exportDate || 'Unknown',
                              version: parsed.version || '1.0',
                              summary: parsed.summary || {
                                transactions: transactions.length,
                                recurringBills: (data.recurringExpenses || parsed.recurringExpenses || []).length,
                                debts: (data.debts || parsed.debts || []).length,
                                budgetGoals: Object.keys(data.budgetGoals || parsed.budgetGoals || {}).filter(k => (data.budgetGoals || parsed.budgetGoals || {})[k] > 0).length
                              },
                              raw: parsed
                            });
                          } else {
                            alert('❌ This doesn\'t look like a Balance Books backup file.\n\nPlease select a file that was created using the "Save Backup" button.');
                          }
                        } catch (err) {
                          alert('❌ Could not read this file.\n\nMake sure you\'re selecting a Balance Books backup file.');
                        }
                      };
                      reader.readAsText(file);
                      e.target.value = '';
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg cursor-pointer hover:from-blue-700 hover:to-indigo-700">
                    <Upload size={18} />
                    Choose Backup File
                  </div>
                </div>
                
                <button 
                  onClick={() => { setModal(null); setRestoreData(null); }}
                  className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200"
                >
                  Cancel
                </button>
              </div>
            ) : (
              // Step 2: Preview & Confirm
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#14b8a6]/50 to-emerald-500 flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <CheckCircle size={32} className="text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">Backup Found!</h3>
                </div>

                {/* Backup Details */}
                <div className="bg-gradient-to-r from-[#14b8a6]/5 to-emerald-50 rounded-xl p-4 border border-[#14b8a6]/20">
                  <div className="flex items-center gap-2 mb-3">
                    <FileSpreadsheet size={18} className="text-[#14b8a6]" />
                    <span className="font-medium text-green-800">{restoreData.filename}</span>
                  </div>
                  <div className="text-sm text-green-700 space-y-1">
                    <p>📅 Saved: <strong>{typeof restoreData.date === 'string' && restoreData.date.includes('T') ? new Date(restoreData.date).toLocaleDateString() : restoreData.date}</strong></p>
                    <p>📱 Version: <strong>{restoreData.version}</strong></p>
                  </div>
                </div>

                {/* What will be restored */}
                <div className="bg-blue-50 rounded-xl p-4 border border-[#1e3a5f]/20">
                  <p className="font-medium text-blue-800 mb-3">📦 This backup contains:</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-[#14b8a6]">{restoreData.summary.transactions}</p>
                      <p className="text-xs text-slate-500">Transactions</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-[#14b8a6]">{restoreData.summary.recurringBills}</p>
                      <p className="text-xs text-slate-500">Recurring Bills</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-purple-600">{restoreData.summary.debts}</p>
                      <p className="text-xs text-slate-500">Debts</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-amber-600">{restoreData.summary.budgetGoals}</p>
                      <p className="text-xs text-slate-500">Budget Goals</p>
                    </div>
                  </div>
                </div>

                {/* Warning */}
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                  <p className="text-sm text-amber-800 flex items-start gap-2">
                    <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                    <span><strong>Warning:</strong> This will replace all your current data with the data from this backup. Your current data will be lost.</span>
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button 
                    onClick={() => setRestoreData(null)}
                    className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200"
                  >
                    ← Back
                  </button>
                  <button 
                    onClick={() => {
                      const parsed = restoreData.raw;
                      const data = parsed.data || parsed;
                      
                      // Restore all data
                      setTransactions(data.transactions || parsed.transactions || []);
                      setRecurringExpenses(data.recurringExpenses || parsed.recurringExpenses || []);
                      setMonthlyBalances(data.monthlyBalances || parsed.monthlyBalances || {});
                      if (data.savingsGoal || parsed.savingsGoal) setSavingsGoal(data.savingsGoal || parsed.savingsGoal);
                      if (data.budgetGoals || parsed.budgetGoals) setBudgetGoals(data.budgetGoals || parsed.budgetGoals);
                      if (data.debts || parsed.debts) setDebts(data.debts || parsed.debts);
                      
                      // Close modal and show success
                      setRestoreData(null);
                      setModal(null);
                      
                      // Show success message
                      setTimeout(() => {
                        alert('✅ Restore Complete!\n\nYour data has been successfully restored from the backup.\n\n' + 
                          `• ${restoreData.summary.transactions} transactions\n` +
                          `• ${restoreData.summary.recurringBills} recurring bills\n` +
                          `• ${restoreData.summary.debts} debts\n` +
                          `• ${restoreData.summary.budgetGoals} budget goals`);
                      }, 100);
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:from-green-700 hover:to-emerald-700"
                  >
                    ✓ Restore My Data
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Import Success Notification Toast */}
      {importNotification && (
        <div className="fixed bottom-6 right-6 bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 animate-pulse max-w-sm">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle size={24} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg">Import Successful!</p>
              <p className="text-sm text-green-100 mt-1">
                {importNotification.count} transactions imported
              </p>
              <div className="flex gap-4 mt-2 text-sm">
                <span className="text-green-200">
                  +{currency(importNotification.income)} income
                </span>
                <span className="text-red-200">
                  -{currency(importNotification.expenses)} expenses
                </span>
              </div>
            </div>
            <button 
              onClick={() => setImportNotification(null)} 
              className="text-white/70 hover:text-white p-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (<div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div className="w-full max-w-md rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto"><div className="flex items-center justify-between p-6 border-b border-[#1e3a5f]/10 bg-gradient-to-r from-[#0f172a]/5 via-white to-[#14b8a6]/5"><h3 className="text-lg font-bold text-slate-900">{title}</h3><button onClick={onClose} className="p-2 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors"><X size={18} /></button></div><div className="p-6">{children}</div></div></div>);
}

function TxForm({ tx, onSubmit, onCancel, showPaid }) {
  const [form, setForm] = useState({ date: tx?.date || new Date().toISOString().split('T')[0], desc: tx?.desc || '', amount: tx ? Math.abs(tx.amount) : '', type: tx?.amount > 0 ? 'income' : 'expense', category: tx?.category || 'other', paid: tx?.paid || false });
  const handle = (e) => { e.preventDefault(); const amt = form.type === 'income' ? Math.abs(parseFloat(form.amount)) : -Math.abs(parseFloat(form.amount)); onSubmit({ ...tx, date: form.date, desc: form.desc, amount: amt, category: form.category, paid: form.paid }); };
  return (
    <form onSubmit={handle} className="space-y-4">
      <div><label className="block text-sm text-slate-600 font-medium mb-2">Date</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-4 py-3 bg-gradient-to-r from-[#0f172a]/5 to-white border-2 border-[#1e3a5f]/20 rounded-xl focus:ring-2 focus:ring-[#14b8a6]" required /></div>
      <div><label className="block text-sm text-slate-600 font-medium mb-2">Description</label><input type="text" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} placeholder="Enter description" className="w-full px-4 py-3 bg-white border-2 border-[#1e3a5f]/20 rounded-xl focus:ring-2 focus:ring-[#14b8a6]" required /></div>
      <div><label className="block text-sm text-slate-600 font-medium mb-2">Amount</label><input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" className="w-full px-4 py-3 bg-gradient-to-r from-[#14b8a6]/5 to-white border-2 border-[#14b8a6]/20 rounded-xl focus:ring-2 focus:ring-[#14b8a6]" required /></div>
      <div><label className="block text-sm text-slate-600 font-medium mb-2">Type</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, category: e.target.value === 'income' ? 'income' : form.category })} className="w-full px-4 py-3 bg-white border-2 border-[#1e3a5f]/20 rounded-xl focus:ring-2 focus:ring-[#14b8a6]"><option value="expense">Expense</option><option value="income">Income</option></select></div>
      <div><label className="block text-sm text-slate-600 font-medium mb-2">Category</label><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-3 bg-white border-2 border-[#1e3a5f]/20 rounded-xl focus:ring-2 focus:ring-[#14b8a6]">{CATEGORIES.filter(c => form.type === 'income' ? c.id === 'income' : c.id !== 'income').map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select></div>
      {showPaid && <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-gradient-to-r from-[#14b8a6]/5 to-blue-50 border-2 border-[#14b8a6]/20"><input type="checkbox" checked={form.paid} onChange={(e) => setForm({ ...form, paid: e.target.checked })} className="w-5 h-5 rounded border-green-300 text-[#14b8a6] focus:ring-[#14b8a6]" /><span className="text-slate-700 font-medium">Mark as paid</span></label>}
      <div className="flex gap-3 pt-4"><button type="button" onClick={onCancel} className="flex-1 px-4 py-3 bg-slate-100 rounded-xl text-slate-700 font-medium hover:bg-slate-200">Cancel</button><button type="submit" className="flex-1 px-4 py-3 bg-gradient-to-r from-[#1e3a5f] to-[#14b8a6] text-white rounded-xl font-semibold shadow-lg hover:from-blue-700 hover:to-green-600">{tx ? 'Update' : 'Add'}</button></div>
    </form>
  );
}

function RecurringForm({ recurring, onSubmit, onCancel }) {
  const [form, setForm] = useState({ name: recurring?.name || '', amount: recurring?.amount || '', category: recurring?.category || 'utilities', frequency: recurring?.frequency || 'monthly', dueDay: recurring?.dueDay || 1, autoPay: recurring?.autoPay || false });
  const handle = (e) => { e.preventDefault(); onSubmit({ ...recurring, ...form, amount: parseFloat(form.amount), dueDay: parseInt(form.dueDay) }); };
  return (
    <form onSubmit={handle} className="space-y-4">
      <div><label className="block text-sm text-slate-600 font-medium mb-2">Name</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Netflix, Rent" className="w-full px-4 py-3 bg-gradient-to-r from-[#0f172a]/5 to-white border-2 border-[#1e3a5f]/20 rounded-xl focus:ring-2 focus:ring-[#14b8a6]" required /></div>
      <div><label className="block text-sm text-slate-600 font-medium mb-2">Amount</label><input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" className="w-full px-4 py-3 bg-gradient-to-r from-[#14b8a6]/5 to-white border-2 border-[#14b8a6]/20 rounded-xl focus:ring-2 focus:ring-[#14b8a6]" required /></div>
      <div><label className="block text-sm text-slate-600 font-medium mb-2">Category</label><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-3 bg-white border-2 border-[#1e3a5f]/20 rounded-xl focus:ring-2 focus:ring-[#14b8a6]">{CATEGORIES.filter(c => c.id !== 'income').map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select></div>
      <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm text-slate-600 font-medium mb-2">Frequency</label><select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} className="w-full px-4 py-3 bg-white border-2 border-[#1e3a5f]/20 rounded-xl focus:ring-2 focus:ring-[#14b8a6]">{FREQUENCY_OPTIONS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></div><div><label className="block text-sm text-slate-600 font-medium mb-2">Due Day</label><input type="number" min="1" max="31" value={form.dueDay} onChange={(e) => setForm({ ...form, dueDay: e.target.value })} className="w-full px-4 py-3 bg-white border-2 border-[#14b8a6]/20 rounded-xl focus:ring-2 focus:ring-[#14b8a6]" required /></div></div>
      <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-gradient-to-r from-[#14b8a6]/5 to-blue-50 border-2 border-[#14b8a6]/20"><input type="checkbox" checked={form.autoPay} onChange={(e) => setForm({ ...form, autoPay: e.target.checked })} className="w-5 h-5 rounded border-green-300 text-[#14b8a6] focus:ring-[#14b8a6]" /><span className="text-slate-700 font-medium">Auto-pay (auto-marks as paid)</span></label>
      <div className="flex gap-3 pt-4"><button type="button" onClick={onCancel} className="flex-1 px-4 py-3 bg-slate-100 rounded-xl text-slate-700 font-medium hover:bg-slate-200">Cancel</button><button type="submit" className="flex-1 px-4 py-3 bg-gradient-to-r from-[#1e3a5f] to-[#14b8a6] text-white rounded-xl font-semibold shadow-lg hover:from-blue-700 hover:to-green-600">{recurring ? 'Update' : 'Add'}</button></div>
    </form>
  );
}

function DebtForm({ debt, onSubmit, onCancel }) {
  const [form, setForm] = useState({ 
    name: debt?.name || '', 
    balance: debt?.balance || '', 
    interestRate: debt?.interestRate || '', 
    minPayment: debt?.minPayment || '',
    type: debt?.type || 'credit-card'
  });
  const handle = (e) => { 
    e.preventDefault(); 
    onSubmit({ 
      ...debt, 
      ...form, 
      balance: parseFloat(form.balance), 
      interestRate: parseFloat(form.interestRate),
      minPayment: parseFloat(form.minPayment)
    }); 
  };
  return (
    <form onSubmit={handle} className="space-y-4">
      <div>
        <label className="block text-sm text-slate-600 font-medium mb-2">Debt Name</label>
        <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Chase Visa, Car Loan" className="w-full px-4 py-3 bg-gradient-to-r from-rose-50 to-white border-2 border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500" required />
      </div>
      <div>
        <label className="block text-sm text-slate-600 font-medium mb-2">Debt Type</label>
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-4 py-3 bg-white border-2 border-[#1e3a5f]/20 rounded-xl focus:ring-2 focus:ring-[#14b8a6]">
          <option value="credit-card">💳 Credit Card</option>
          <option value="car-loan">🚗 Car Loan</option>
          <option value="student-loan">🎓 Student Loan</option>
          <option value="mortgage">🏠 Mortgage</option>
          <option value="personal-loan">💰 Personal Loan</option>
          <option value="medical">🏥 Medical Debt</option>
          <option value="other">📋 Other</option>
        </select>
      </div>
      <div>
        <label className="block text-sm text-slate-600 font-medium mb-2">Current Balance</label>
        <input type="number" step="0.01" min="0" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} placeholder="0.00" className="w-full px-4 py-3 bg-gradient-to-r from-rose-50 to-white border-2 border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-600 font-medium mb-2">Interest Rate (%)</label>
          <input type="number" step="0.1" min="0" max="100" value={form.interestRate} onChange={(e) => setForm({ ...form, interestRate: e.target.value })} placeholder="18.9" className="w-full px-4 py-3 bg-white border-2 border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500" required />
        </div>
        <div>
          <label className="block text-sm text-slate-600 font-medium mb-2">Min Payment</label>
          <input type="number" step="0.01" min="0" value={form.minPayment} onChange={(e) => setForm({ ...form, minPayment: e.target.value })} placeholder="50.00" className="w-full px-4 py-3 bg-white border-2 border-[#1e3a5f]/20 rounded-xl focus:ring-2 focus:ring-[#14b8a6]" required />
        </div>
      </div>
      <div className="flex gap-3 pt-4">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-3 bg-slate-100 rounded-xl text-slate-700 font-medium hover:bg-slate-200">Cancel</button>
        <button type="submit" className="flex-1 px-4 py-3 bg-gradient-to-r from-rose-600 to-orange-500 text-white rounded-xl font-semibold shadow-lg hover:from-rose-700 hover:to-orange-600">{debt ? 'Update' : 'Add Debt'}</button>
      </div>
    </form>
  );
}
