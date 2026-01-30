import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { db } from './db/database';
import { migrateFromLocalStorage } from './db/migration';
import { Download, PiggyBank, TrendingUp, TrendingDown, Calendar, Plus, Trash2, Edit2, X, ArrowUpRight, ArrowDownRight, Wallet, Target, ChevronLeft, ChevronRight, Building2, Settings, Search, LayoutGrid, Receipt, Shield, Link2, Unlink, Loader2, Menu, RefreshCw, Check, Clock, AlertCircle, FileSpreadsheet, Upload, Lightbulb, DollarSign, Bell, Calculator, Sparkles, AlertTriangle, CheckCircle, Info, CreditCard, Percent, Zap, TrendingUp as Trending, PieChart, BarChart3, Goal, Smartphone, Cloud, HardDrive, Mail, Save, Moon, Sun } from 'lucide-react';

// App version - uses build-time injection or fallback
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '2.1.0';

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

const saveData = (key, data) => { try { localStorage.setItem('bb_' + key, JSON.stringify(data)); } catch {} };
const loadData = (key, defaultValue) => { try { const saved = localStorage.getItem('bb_' + key); return saved ? JSON.parse(saved) : defaultValue; } catch { return defaultValue; } };

// v3 Theme System
const getTheme = (darkMode) => darkMode ? {
  bg: '#0f0f0f',
  bgSecondary: '#1a1a1a',
  bgCard: '#1f1f1f',
  bgSidebar: '#1a1a1a',
  bgHover: '#2a2a2a',
  border: '#2e2e2e',
  borderLight: '#3a3a3a',
  cardBorder: '2px solid #454545',
  cardShadow: '0 2px 8px rgba(0,0,0,0.4)',
  text: '#ffffff',
  textSecondary: '#a0a0a0',
  textMuted: '#6b6b6b',
  accent: '#14b8a6',
  accentLight: 'rgba(20, 184, 166, 0.15)',
  success: '#22c55e',
  successBg: 'rgba(34, 197, 94, 0.15)',
  warning: '#f59e0b',
  warningBg: 'rgba(245, 158, 11, 0.15)',
  danger: '#ef4444',
  dangerBg: 'rgba(239, 68, 68, 0.15)',
  headerBg: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
  navActive: 'linear-gradient(135deg, #1e3a5f, #14b8a6)',
  savingsGradient: 'linear-gradient(135deg, #0d9488, #14b8a6)',
  insightsGradient: 'linear-gradient(135deg, #4f46e5, #6366f1)',
} : {
  bg: '#f5f5f5',
  bgSecondary: '#fafafa',
  bgCard: '#ffffff',
  bgSidebar: '#f0f0f0',
  bgHover: '#e8e8e8',
  border: '#d4d4d4',
  borderLight: '#e5e5e5',
  cardBorder: '2px solid #b0b0b0',
  cardShadow: '0 2px 8px rgba(0,0,0,0.08)',
  text: '#171717',
  textSecondary: '#525252',
  textMuted: '#a3a3a3',
  accent: '#14b8a6',
  accentLight: 'rgba(20, 184, 166, 0.1)',
  success: '#22c55e',
  successBg: '#dcfce7',
  warning: '#f59e0b',
  warningBg: '#fef3c7',
  danger: '#ef4444',
  dangerBg: '#fee2e2',
  headerBg: 'linear-gradient(135deg, #1e3a5f 0%, #14b8a6 100%)',
  navActive: 'linear-gradient(135deg, #1e3a5f, #14b8a6)',
  savingsGradient: 'linear-gradient(135deg, #10b981, #14b8a6)',
  insightsGradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
};

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState(() => loadData('darkMode', false));
  const theme = getTheme(darkMode);
  
  // Core states
  const [view, setView] = useState('dashboard');
  const [transactions, setTransactions] = useState(() => loadData('transactions', []));
  const [recurringExpenses, setRecurringExpenses] = useState(() => loadData('recurring', []));
  const [monthlyBalances, setMonthlyBalances] = useState(() => loadData('monthlyBalances', {}));
  const [savingsGoal, setSavingsGoal] = useState(() => loadData('savingsGoal', 500));
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
  
  // Feature States
  const [budgetGoals, setBudgetGoals] = useState(() => loadData('budgetGoals', {}));
  const [debts, setDebts] = useState(() => loadData('debts', []));
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(() => loadData('autoBackup', false));
  const [lastBackupDate, setLastBackupDate] = useState(() => loadData('lastBackup', null));
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => loadData('notifications', false));
  const [editDebt, setEditDebt] = useState(null);
  const [restoreData, setRestoreData] = useState(null);
  
  // Dropbox Cloud Backup States
  const [dropboxConnected, setDropboxConnected] = useState(() => loadData('dropboxConnected', false));
  const [dropboxToken, setDropboxToken] = useState(() => loadData('dropboxToken', null));
  const [dropboxSyncing, setDropboxSyncing] = useState(false);
  const [dropboxLastSync, setDropboxLastSync] = useState(() => loadData('dropboxLastSync', null));
  const [dropboxError, setDropboxError] = useState(null);
  
  // Dropbox App Key
  const DROPBOX_APP_KEY = 'YOUR_APP_KEY_HERE';
  const DROPBOX_REDIRECT_URI = typeof window !== 'undefined' ? window.location.origin : '';
  
  // Multi-Select State
  const [selectedTxIds, setSelectedTxIds] = useState(new Set());

  // Initialize IndexedDB and migrate data
  useEffect(() => {
    migrateFromLocalStorage().then(migrated => {
      if (migrated) console.log('Migration complete - reload to use IndexedDB');
    }).catch(err => console.error('Migration error:', err));
  }, []);

  // Save effects
  useEffect(() => { saveData('darkMode', darkMode); }, [darkMode]);
  useEffect(() => { saveData('transactions', transactions); }, [transactions]);
  useEffect(() => { saveData('recurring', recurringExpenses); }, [recurringExpenses]);
  useEffect(() => { saveData('monthlyBalances', monthlyBalances); }, [monthlyBalances]);
  useEffect(() => { saveData('savingsGoal', savingsGoal); }, [savingsGoal]);
  useEffect(() => { saveData('budgetGoals', budgetGoals); }, [budgetGoals]);
  useEffect(() => { saveData('debts', debts); }, [debts]);
  useEffect(() => { saveData('autoBackup', autoBackupEnabled); }, [autoBackupEnabled]);
  useEffect(() => { saveData('lastBackup', lastBackupDate); }, [lastBackupDate]);
  useEffect(() => { saveData('notifications', notificationsEnabled); }, [notificationsEnabled]);
  useEffect(() => { saveData('dropboxConnected', dropboxConnected); }, [dropboxConnected]);
  useEffect(() => { saveData('dropboxToken', dropboxToken); }, [dropboxToken]);
  useEffect(() => { saveData('dropboxLastSync', dropboxLastSync); }, [dropboxLastSync]);

  // Handle Dropbox OAuth callback
  useEffect(() => {
    const handleDropboxCallback = () => {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        const params = new URLSearchParams(hash.substring(1));
        const token = params.get('access_token');
        if (token) {
          setDropboxToken(token);
          setDropboxConnected(true);
          setDropboxError(null);
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    };
    handleDropboxCallback();
  }, []);

  // Auto-backup
  useEffect(() => {
    if (autoBackupEnabled) {
      const checkBackup = () => {
        const last = lastBackupDate ? new Date(lastBackupDate) : null;
        const now = new Date();
        if (!last || (now - last) > 24 * 60 * 60 * 1000) performAutoBackup();
      };
      checkBackup();
      const interval = setInterval(checkBackup, 60 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [autoBackupEnabled, lastBackupDate]);

  // Notification permission
  useEffect(() => {
    if (notificationsEnabled && 'Notification' in window) {
      Notification.requestPermission();
    }
  }, [notificationsEnabled]);

  // Bill reminder notifications
  useEffect(() => {
    if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
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

  const performAutoBackup = useCallback(() => {
    const backup = {
      version: APP_VERSION,
      exportDate: new Date().toISOString(),
      autoBackup: true,
      data: { transactions, recurringExpenses, monthlyBalances, savingsGoal, budgetGoals, debts }
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `balance-books-auto-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    setLastBackupDate(new Date().toISOString());
  }, [transactions, recurringExpenses, monthlyBalances, savingsGoal, budgetGoals, debts]);

  // Dropbox Functions
  const connectDropbox = () => {
    const authUrl = `https://www.dropbox.com/oauth2/authorize?client_id=${DROPBOX_APP_KEY}&response_type=token&redirect_uri=${encodeURIComponent(DROPBOX_REDIRECT_URI)}`;
    window.location.href = authUrl;
  };

  const disconnectDropbox = () => {
    setDropboxToken(null);
    setDropboxConnected(false);
    setDropboxLastSync(null);
    setDropboxError(null);
    localStorage.removeItem('bb_dropboxToken');
    localStorage.removeItem('bb_dropboxConnected');
    localStorage.removeItem('bb_dropboxLastSync');
  };

  const syncToDropbox = async (token = dropboxToken) => {
    if (!token) { setDropboxError('Not connected to Dropbox'); return; }
    setDropboxSyncing(true);
    setDropboxError(null);
    try {
      const backup = {
        appName: 'BalanceBooks Pro',
        version: APP_VERSION,
        exportDate: new Date().toISOString(),
        syncedFrom: window.location.hostname,
        data: { transactions, recurringExpenses, monthlyBalances, savingsGoal, budgetGoals, debts }
      };
      const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/octet-stream',
          'Dropbox-API-Arg': JSON.stringify({ path: '/balancebooks-backup.json', mode: 'overwrite', autorename: false, mute: false })
        },
        body: JSON.stringify(backup, null, 2)
      });
      if (response.ok) {
        const now = new Date().toISOString();
        setDropboxLastSync(now);
        setLastBackupDate(now);
        setDropboxError(null);
      } else if (response.status === 401) {
        disconnectDropbox();
        setDropboxError('Session expired. Please reconnect.');
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error_summary || 'Upload failed');
      }
    } catch (err) {
      console.error('Dropbox sync error:', err);
      setDropboxError(err.message || 'Sync failed. Please try again.');
    } finally {
      setDropboxSyncing(false);
    }
  };

  const restoreFromDropbox = async () => {
    if (!dropboxToken) { setDropboxError('Not connected to Dropbox'); return; }
    setDropboxSyncing(true);
    setDropboxError(null);
    try {
      const response = await fetch('https://content.dropboxapi.com/2/files/download', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${dropboxToken}`,
          'Dropbox-API-Arg': JSON.stringify({ path: '/balancebooks-backup.json' })
        }
      });
      if (response.ok) {
        const backup = await response.json();
        setRestoreData({
          filename: 'Dropbox Cloud Backup',
          date: backup.exportDate,
          version: backup.version || '1.0',
          summary: {
            transactions: backup.data?.transactions?.length || 0,
            recurringBills: backup.data?.recurringExpenses?.length || 0,
            debts: backup.data?.debts?.length || 0,
            budgetGoals: Object.keys(backup.data?.budgetGoals || {}).filter(k => backup.data.budgetGoals[k] > 0).length
          },
          raw: backup,
          source: 'dropbox'
        });
        setModal('restore-wizard');
      } else if (response.status === 409) {
        setDropboxError('No backup found in Dropbox. Sync your data first!');
      } else if (response.status === 401) {
        disconnectDropbox();
        setDropboxError('Session expired. Please reconnect.');
      } else {
        throw new Error('Download failed');
      }
    } catch (err) {
      console.error('Dropbox restore error:', err);
      setDropboxError(err.message || 'Restore failed. Please try again.');
    } finally {
      setDropboxSyncing(false);
    }
  };

  // Balance helpers
  const getMonthKey = (m, y) => `${y}-${String(m).padStart(2, '0')}`;
  const currentMonthKey = getMonthKey(month, year);

  const getBeginningBalance = (m, y) => {
    const key = getMonthKey(m, y);
    if (monthlyBalances[key]?.beginning !== undefined) return monthlyBalances[key].beginning;
    const prevMonth = m === 0 ? 11 : m - 1;
    const prevYear = m === 0 ? y - 1 : y;
    const prevKey = getMonthKey(prevMonth, prevYear);
    if (monthlyBalances[prevKey]?.ending !== undefined) return monthlyBalances[prevKey].ending;
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
    if (match) return { year: parseInt(match[1]), month: parseInt(match[2]) - 1, day: parseInt(match[3]) };
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
    return null;
  };

  // Memoized computations
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
    monthTx.filter(t => t.amount < 0 && t.category !== 'savings').forEach(t => { map[t.category] = (map[t.category] || 0) + Math.abs(t.amount); });
    return Object.entries(map).map(([id, total]) => ({ ...CATEGORIES.find(c => c.id === id), total, pct: stats.expenses > 0 ? (total / stats.expenses) * 100 : 0 })).sort((a, b) => b.total - a.total);
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
    const calculatePayoff = (sortedDebts, extraPayment = 0) => {
      let totalInterestPaid = 0;
      let months = 0;
      const maxMonths = 360;
      let balances = sortedDebts.map(d => ({ ...d, currentBalance: d.balance }));
      while (balances.some(d => d.currentBalance > 0) && months < maxMonths) {
        months++;
        let availableExtra = extraPayment;
        for (let i = 0; i < balances.length; i++) {
          const d = balances[i];
          if (d.currentBalance <= 0) continue;
          const monthlyInterest = (d.currentBalance * (d.interestRate / 100)) / 12;
          totalInterestPaid += monthlyInterest;
          d.currentBalance += monthlyInterest;
          let payment = d.minPayment + (i === balances.findIndex(b => b.currentBalance > 0) ? availableExtra : 0);
          payment = Math.min(payment, d.currentBalance);
          d.currentBalance -= payment;
          if (d.currentBalance <= 0) availableExtra += d.minPayment;
        }
      }
      return { months, totalInterestPaid: Math.round(totalInterestPaid) };
    };
    const snowballResult = calculatePayoff(snowball, 0);
    const avalancheResult = calculatePayoff(avalanche, 0);
    return { 
      snowball, avalanche, totalDebt, totalMinPayment,
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
      recs.push({ id: 1, type: 'reduce', priority: 'high', title: 'Reduce Dining Out Costs', 
        description: `You spent ${currency(dining)} on dining this month.`, potential: dining * 0.4,
        tips: ['Cook at home 2 more days per week', 'Use meal planning apps', 'Bring lunch to work'], icon: '🍽️' });
    }
    
    const subs = catBreakdown.find(c => c.id === 'subscriptions')?.total || 0;
    if (subs > 50) {
      recs.push({ id: 2, type: 'audit', priority: 'medium', title: 'Audit Your Subscriptions', 
        description: `${currency(subs)} in monthly subscriptions.`, potential: subs * 0.3,
        tips: ['Cancel unused services', 'Look for annual discounts', 'Share family plans'], icon: '📱' });
    }

    const shopping = catBreakdown.find(c => c.id === 'shopping')?.total || 0;
    if (shopping > 200) {
      recs.push({ id: 3, type: 'reduce', priority: 'high', title: 'Curb Impulse Shopping', 
        description: `${currency(shopping)} on shopping this month.`, potential: shopping * 0.35,
        tips: ['Wait 24 hours before buying', 'Unsubscribe from retail emails', 'Use a shopping list'], icon: '🛍️' });
    }

    if (savingsRate < 10 && avgIncome > 0) {
      recs.push({ id: 4, type: 'alert', priority: 'high', title: '🚨 Savings Rate Below 10%', 
        description: `You're only saving ${savingsRate.toFixed(1)}% of income.`, potential: avgIncome * 0.1 - stats.saved,
        tips: ['Set up automatic transfers', 'Start with $25-50 per paycheck', 'Build 3-month emergency fund'], icon: '⚠️' });
    } else if (savingsRate >= 20) {
      recs.push({ id: 5, type: 'success', priority: 'low', title: '🎉 Excellent Savings Rate!', 
        description: `You're saving ${savingsRate.toFixed(1)}% of your income!`, potential: 0,
        tips: ['Consider maxing out retirement', 'Look into index funds', 'Keep it up!'], icon: '🏆' });
    }

    if (stats.unpaidCount > 3) {
      recs.push({ id: 6, type: 'alert', priority: 'high', title: 'Manage Unpaid Bills', 
        description: `You have ${stats.unpaidCount} unpaid expenses this month.`, potential: 0,
        tips: ['Set up calendar reminders', 'Enable autopay', 'Review bills weekly'], icon: '📋' });
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

  // CRUD operations
  const addTx = (tx) => { setTransactions([...transactions, { ...tx, id: uid() }]); setModal(null); };
  const updateTx = (tx) => { setTransactions(transactions.map(t => t.id === tx.id ? tx : t)); setEditTx(null); };
  const deleteTx = (id) => setTransactions(transactions.filter(t => t.id !== id));
  const togglePaid = (id) => setTransactions(transactions.map(t => t.id === id ? { ...t, paid: !t.paid } : t));

  const addRecurring = (r) => { setRecurringExpenses([...recurringExpenses, { ...r, id: uid(), active: true }]); setModal(null); };
  const updateRecurring = (r) => { setRecurringExpenses(recurringExpenses.map(e => e.id === r.id ? r : e)); setEditRecurring(null); };
  const deleteRecurring = (id) => setRecurringExpenses(recurringExpenses.filter(r => r.id !== id));
  const toggleRecurringActive = (id) => setRecurringExpenses(recurringExpenses.map(r => r.id === id ? { ...r, active: !r.active } : r));
  const createFromRecurring = (r) => { const today = new Date(); setTransactions([...transactions, { id: uid(), date: today.toISOString().split('T')[0], desc: r.name, amount: -r.amount, category: r.category, paid: r.autoPay }]); };

  // Bank connection (demo)
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

  // Export functions
  const exportCSV = () => {
    const rows = [
      ['Balance Books Pro - Transaction Export'],
      [`Export Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`],
      [''],
      ['Date', 'Description', 'Amount', 'Category', 'Type', 'Status']
    ];
    const sortedTx = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    sortedTx.forEach(t => {
      const cat = CATEGORIES.find(c => c.id === t.category);
      rows.push([t.date, `"${t.desc}"`, t.amount.toFixed(2), cat ? cat.name : t.category, t.amount >= 0 ? 'Income' : 'Expense', t.paid ? 'Paid' : 'Unpaid']);
    });
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
      ['2025-01-01', 'Paycheck', '2500.00', 'income', 'income', 'yes']
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'balance-books-template.csv';
    a.click();
  };

  // Import functions
  const parseDate = (dateValue) => {
    if (!dateValue && dateValue !== 0) return null;
    if (typeof dateValue === 'number' || (typeof dateValue === 'string' && /^\d+$/.test(dateValue.trim()))) {
      const num = parseFloat(dateValue);
      if (num > 0 && num < 100000) {
        const excelEpoch = new Date(Date.UTC(1899, 11, 30));
        const date = new Date(excelEpoch.getTime() + num * 86400000);
        if (!isNaN(date.getTime())) {
          return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
        }
      }
    }
    const str = String(dateValue).trim();
    if (!str) return null;
    const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
    const usMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (usMatch) return `${usMatch[3]}-${usMatch[1].padStart(2, '0')}-${usMatch[2].padStart(2, '0')}`;
    const d = new Date(str);
    if (!isNaN(d.getTime())) return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return null;
  };

  const mapCategory = (catName) => {
    if (!catName) return 'other';
    const lower = String(catName).toLowerCase().trim();
    const exactMatch = CATEGORIES.find(c => c.id === lower || c.name.toLowerCase() === lower);
    if (exactMatch) return exactMatch.id;
    const aliases = {
      'tithe': 'tithes', 'church': 'tithes', 'donation': 'gifts', 'car': 'transportation', 
      'gas': 'transportation', 'food': 'groceries', 'restaurant': 'dining', 'netflix': 'subscriptions',
      'rent': 'housing', 'electric': 'utilities', 'salary': 'income', 'paycheck': 'income'
    };
    for (const [alias, catId] of Object.entries(aliases)) {
      if (lower.includes(alias)) return catId;
    }
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
          if (char === '"') inQuotes = !inQuotes;
          else if (char === ',' && !inQuotes) { parts.push(current.trim()); current = ''; }
          else current += char;
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
        txs.push({
          id: uid(), date, desc,
          amount: isIncome ? Math.abs(amount) : -Math.abs(amount),
          category: isIncome ? 'income' : mapCategory(cat),
          paid: ['yes', '1', 'true', 'y', 'paid'].includes(String(paid).toLowerCase())
        });
      } catch (e) { errors.push(`Row ${i + 1}: Parse error`); }
    }
    return { transactions: txs, errors };
  };

  // Parse Excel file - using SheetJS loaded via CDN
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
            const descCol = headers.findIndex(h => h.includes('desc') || h.includes('memo') || h.includes('payee') || h.includes('name'));
            const amountCol = headers.findIndex(h => h.includes('amount') || h.includes('sum') || h.includes('total'));
            const catCol = headers.findIndex(h => h.includes('cat') || h.includes('type'));
            const typeCol = headers.findIndex(h => h === 'type' || h.includes('income') || h.includes('expense'));
            const paidCol = headers.findIndex(h => h.includes('paid') || h.includes('status') || h.includes('cleared'));
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
              if (!date) { errors.push(`Row ${i + 1}: Invalid date "${dateVal}"`); continue; }
              if (!desc) { errors.push(`Row ${i + 1}: Missing description`); continue; }
              if (isNaN(amount) || amount === 0) { errors.push(`Row ${i + 1}: Invalid amount "${amountVal}"`); continue; }
              const isIncome = String(type || '').toLowerCase() === 'income' || String(cat || '').toLowerCase() === 'income' || amount > 0;
              txs.push({
                id: uid(), date, desc: String(desc).trim(),
                amount: isIncome ? Math.abs(amount) : -Math.abs(amount),
                category: isIncome ? 'income' : mapCategory(cat),
                paid: ['yes', '1', 'true', 'y', 'cleared', 'paid'].includes(String(paid || '').toLowerCase())
              });
            }
            resolve({ transactions: txs, errors });
          } catch (err) {
            resolve({ transactions: [], errors: [`Failed to parse Excel file: ${err.message}. Please save as CSV and try again.`] });
          }
        };
        reader.onerror = () => resolve({ transactions: [], errors: ['Failed to read file. Please try again.'] });
        reader.readAsArrayBuffer(file);
      } else {
        resolve({ transactions: [], errors: ['Excel (.xlsx) files require the XLSX library. Please save your file as CSV (File → Save As → CSV) and import that instead.'] });
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
          alert(`Unable to read Excel file.\n\n${result.errors[0]}\n\nTip: In Excel, use File → Save As → CSV UTF-8`);
          e.target.value = '';
          return;
        }
      } else if (filename.endsWith('.csv') || filename.endsWith('.txt')) {
        const content = await file.text();
        result = parseCSV(content);
      } else {
        alert('Please upload a CSV or Excel file.\n\nSupported formats:\n• CSV (.csv)\n• Excel (.xlsx, .xls)\n• Text (.txt)');
        e.target.value = '';
        return;
      }
      if (result.transactions.length > 0) {
        result.transactions.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
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
        const errorMsg = result.errors.length > 0 ? `\n\nIssues found:\n${result.errors.slice(0, 5).join('\n')}` : '';
        alert(`No valid transactions found in "${file.name}".${errorMsg}`);
      }
    } catch (err) {
      alert(`Error reading file: ${err.message}`);
    }
    e.target.value = '';
  };

  const confirmImport = () => {
    if (importData && importData.transactions.length > 0) {
      setTransactions([...transactions, ...importData.transactions]);
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

  // Navigation sections for v3 design
  const navSections = [
    { section: 'Overview', items: [
      { id: 'dashboard', icon: '📊', label: 'Dashboard' },
      { id: 'transactions', icon: '💳', label: 'Transactions', badge: stats.unpaidCount || null },
    ]},
    { section: 'Planning', items: [
      { id: 'budget', icon: '🎯', label: 'Budget Goals', badge: budgetStats.categoriesOverBudget || null },
      { id: 'analytics', icon: '📈', label: 'Analytics' },
      { id: 'debts', icon: '💳', label: 'Debt Payoff', badge: debts.length || null },
    ]},
    { section: 'Automation', items: [
      { id: 'recurring', icon: '🔄', label: 'Recurring', badge: recurringExpenses.filter(r => r.active).length || null },
      { id: 'accounts', icon: '🏦', label: 'Bank Accounts', badge: linkedAccounts.length || null },
      { id: 'cycle', icon: '📅', label: '12-Month Cycle' },
    ]},
    { section: 'Insights', items: [
      { id: 'savings', icon: '🐷', label: 'Savings' },
      { id: 'recommendations', icon: '💡', label: 'Smart Tips', badge: savingsRecommendations.filter(r => r.priority === 'high').length || null },
      { id: 'settings', icon: '⚙️', label: 'Settings' },
    ]},
  ];

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      background: theme.bg,
      color: theme.text,
      fontSize: '14px',
      transition: 'all 200ms ease'
    }}>
      
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div 
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ============ SIDEBAR ============ */}
      <aside style={{
        width: '260px',
        background: theme.bgSidebar,
        borderRight: `1px solid ${theme.border}`,
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 50,
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 300ms ease'
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px', borderBottom: `1px solid ${theme.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: theme.navActive,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="white" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '18px', color: theme.text }}>BalanceBooks</div>
              <div style={{ fontSize: '11px', color: theme.textMuted }}>Pro • v{APP_VERSION}</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          {navSections.map((section, si) => (
            <div key={si} style={{ marginBottom: '24px' }}>
              <div style={{ 
                fontSize: '10px', 
                fontWeight: '600', 
                textTransform: 'uppercase', 
                letterSpacing: '0.5px', 
                color: theme.textMuted, 
                padding: '0 12px', 
                marginBottom: '8px' 
              }}>
                {section.section}
              </div>
              {section.items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => { setView(item.id); if (isMobile) setSidebarOpen(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: view === item.id ? 'white' : theme.text,
                    background: view === item.id ? theme.navActive : 'transparent',
                    cursor: 'pointer',
                    marginBottom: '2px',
                    transition: 'all 150ms ease'
                  }}
                >
                  <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge && (
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontSize: '10px',
                      fontWeight: '600',
                      background: view === item.id ? 'rgba(255,255,255,0.2)' : theme.warningBg,
                      color: view === item.id ? 'white' : theme.warning
                    }}>
                      {item.badge}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div style={{ padding: '16px', borderTop: `1px solid ${theme.border}` }}>
          {/* Dark Mode Toggle */}
          <div 
            onClick={() => setDarkMode(!darkMode)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: '8px',
              background: theme.bgHover,
              cursor: 'pointer',
              marginBottom: '12px'
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: '500', color: theme.textSecondary }}>
              {darkMode ? '🌙 Dark Mode' : '☀️ Light Mode'}
            </span>
            <div style={{
              width: '36px',
              height: '20px',
              borderRadius: '10px',
              background: darkMode ? theme.accent : theme.border,
              position: 'relative',
              transition: 'background 200ms ease'
            }}>
              <div style={{
                position: 'absolute',
                top: '2px',
                left: darkMode ? '18px' : '2px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: 'white',
                transition: 'left 200ms ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
              }} />
            </div>
          </div>
          
          {/* Quick Actions */}
          <button 
            onClick={() => setModal('connect')}
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '8px',
              borderRadius: '8px',
              border: 'none',
              background: theme.accent,
              color: 'white',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Link2 size={16} /> Connect Bank
          </button>
          <button 
            onClick={() => setModal('import')}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: `1px solid ${theme.border}`,
              background: 'transparent',
              color: theme.text,
              fontWeight: '500',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Upload size={16} /> Import Data
          </button>
        </div>
      </aside>

      {/* ============ MAIN CONTENT ============ */}
      <main style={{ 
        flex: 1, 
        marginLeft: sidebarOpen && !isMobile ? '260px' : '0',
        transition: 'margin-left 300ms ease',
        minHeight: '100vh'
      }}>
        {/* Header */}
        <header style={{
          background: theme.headerBg,
          padding: '20px 28px',
          position: 'sticky',
          top: 0,
          zIndex: 30
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'white' }}
              >
                <Menu size={20} />
              </button>
              <div>
                <div style={{ color: 'white', fontSize: '22px', fontWeight: '700' }}>{view.charAt(0).toUpperCase() + view.slice(1).replace(/([A-Z])/g, ' $1')}</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>{FULL_MONTHS[month]} {year}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Month Selector */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '2px'
              }}>
                <button 
                  onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }}
                  style={{ background: 'transparent', border: 'none', color: 'white', padding: '6px 10px', cursor: 'pointer', fontSize: '12px' }}
                >◀</button>
                <span style={{ color: 'white', fontWeight: '600', padding: '0 10px', fontSize: '13px' }}>{MONTHS[month]} {year}</span>
                <button 
                  onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }}
                  style={{ background: 'transparent', border: 'none', color: 'white', padding: '6px 10px', cursor: 'pointer', fontSize: '12px' }}
                >▶</button>
              </div>
              
              {/* Add Button */}
              <button 
                onClick={() => setModal('add')}
                style={{
                  background: 'white',
                  color: '#1e3a5f',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Plus size={16} /> Add
              </button>
            </div>
          </div>

          {/* Balance Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {[
              { label: 'Beginning', value: currency(stats.beginning), color: 'white' },
              { label: 'Income', value: `+${currency(stats.income)}`, color: '#4ade80' },
              { label: 'Expenses', value: `-${currency(stats.expenses)}`, color: '#fca5a5' },
              { label: 'Balance', value: currency(stats.ending), color: '#4ade80', sub: `${stats.net >= 0 ? '+' : ''}${currency(stats.net)}` },
            ].map((stat, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '16px',
                border: '2px solid rgba(255,255,255,0.15)',
                cursor: 'pointer'
              }} onClick={() => setModal(i === 0 ? 'edit-beginning' : i === 3 ? 'edit-ending' : null)}>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginBottom: '6px' }}>{stat.label}</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: stat.color }}>{stat.value}</div>
                {stat.sub && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{stat.sub}</div>}
              </div>
            ))}
          </div>
        </header>

        {/* ============ VIEWS ============ */}
        <div style={{ padding: '24px 28px' }}>
          
          {/* Dashboard View */}
          {view === 'dashboard' && (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
              {/* Left Column - Transactions */}
              <div>
                <div style={{
                  background: theme.bgCard,
                  borderRadius: '16px',
                  border: theme.cardBorder,
                  boxShadow: theme.cardShadow,
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    padding: '16px 20px', 
                    borderBottom: `1px solid ${theme.border}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontWeight: '600', color: theme.text }}>Recent Transactions</span>
                    <button 
                      onClick={() => setView('transactions')}
                      style={{ 
                        background: theme.accentLight, 
                        border: 'none', 
                        color: theme.accent, 
                        padding: '6px 12px', 
                        borderRadius: '6px', 
                        fontSize: '12px', 
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >View All →</button>
                  </div>
                  <div>
                    {monthTx.slice(0, 8).map(tx => {
                      const cat = CATEGORIES.find(c => c.id === tx.category);
                      return (
                        <div key={tx.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '14px 20px',
                          borderBottom: `1px solid ${theme.borderLight}`,
                          cursor: 'pointer'
                        }} onClick={() => setEditTx(tx)}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: theme.bgHover,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px',
                            marginRight: '14px'
                          }}>{cat?.icon}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: '600', fontSize: '13px', color: theme.text }}>{tx.desc}</span>
                              {tx.paid ? <Check size={14} style={{ color: theme.success }} /> : <Clock size={14} style={{ color: theme.warning }} />}
                            </div>
                            <div style={{ fontSize: '12px', color: theme.textMuted }}>{shortDate(tx.date)}</div>
                          </div>
                          <span style={{ 
                            fontWeight: '700', 
                            fontSize: '14px', 
                            color: tx.amount > 0 ? theme.success : theme.text 
                          }}>
                            {tx.amount > 0 ? '+' : ''}{currency(tx.amount)}
                          </span>
                        </div>
                      );
                    })}
                    {monthTx.length === 0 && (
                      <div style={{ padding: '40px', textAlign: 'center', color: theme.textMuted }}>
                        <Receipt size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                        <div>No transactions this month</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Widgets */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Savings Goal Widget */}
                <div style={{
                  background: theme.savingsGradient,
                  borderRadius: '16px',
                  padding: '20px',
                  color: 'white'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <PiggyBank size={20} />
                    <span style={{ fontWeight: '600' }}>Savings Goal</span>
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>{currency(stats.saved)}</div>
                  <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '12px' }}>of {currency(savingsGoal)} goal</div>
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.3)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      background: 'white', 
                      borderRadius: '4px',
                      width: `${Math.min(100, (stats.saved / savingsGoal) * 100)}%`
                    }} />
                  </div>
                </div>

                {/* Upcoming Bills Widget */}
                <div style={{
                  background: theme.bgCard,
                  borderRadius: '16px',
                  border: theme.cardBorder,
                  boxShadow: theme.cardShadow,
                  padding: '20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <Bell size={18} style={{ color: theme.warning }} />
                    <span style={{ fontWeight: '600', color: theme.text }}>Upcoming Bills</span>
                  </div>
                  {upcomingBills.slice(0, 3).map(bill => (
                    <div key={bill.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 0',
                      borderBottom: `1px solid ${theme.borderLight}`
                    }}>
                      <div>
                        <div style={{ fontWeight: '500', fontSize: '13px', color: theme.text }}>{bill.name}</div>
                        <div style={{ fontSize: '11px', color: bill.daysUntil <= 1 ? theme.danger : theme.textMuted }}>
                          {bill.daysUntil === 0 ? 'Due today' : bill.daysUntil === 1 ? 'Due tomorrow' : `Due in ${bill.daysUntil} days`}
                        </div>
                      </div>
                      <span style={{ fontWeight: '600', color: theme.text }}>{currency(bill.amount)}</span>
                    </div>
                  ))}
                  {upcomingBills.length === 0 && (
                    <div style={{ textAlign: 'center', color: theme.textMuted, padding: '20px 0', fontSize: '13px' }}>
                      No upcoming bills this week 🎉
                    </div>
                  )}
                </div>

                {/* Smart Insights Widget */}
                {savingsRecommendations.length > 0 && (
                  <div style={{
                    background: theme.insightsGradient,
                    borderRadius: '16px',
                    padding: '20px',
                    color: 'white'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                      <Lightbulb size={18} />
                      <span style={{ fontWeight: '600' }}>Smart Insights</span>
                    </div>
                    {savingsRecommendations.slice(0, 2).map(rec => (
                      <div key={rec.id} style={{
                        background: 'rgba(255,255,255,0.15)',
                        borderRadius: '10px',
                        padding: '12px',
                        marginBottom: '8px',
                        fontSize: '12px'
                      }}>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>{rec.title}</div>
                        {rec.potential > 0 && (
                          <div style={{ opacity: 0.8 }}>Save up to {currency(rec.potential)}/mo</div>
                        )}
                      </div>
                    ))}
                    <button 
                      onClick={() => setView('recommendations')}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(255,255,255,0.2)',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        fontWeight: '500',
                        fontSize: '12px',
                        cursor: 'pointer',
                        marginTop: '8px'
                      }}
                    >View All Tips →</button>
                  </div>
                )}

                {/* Category Breakdown Widget */}
                <div style={{
                  background: theme.bgCard,
                  borderRadius: '16px',
                  border: theme.cardBorder,
                  boxShadow: theme.cardShadow,
                  padding: '20px'
                }}>
                  <div style={{ fontWeight: '600', marginBottom: '16px', color: theme.text }}>Spending by Category</div>
                  {catBreakdown.slice(0, 5).map(cat => (
                    <div key={cat.id} style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', color: theme.textSecondary }}>{cat.icon} {cat.name}</span>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: theme.text }}>{currency(cat.total)}</span>
                      </div>
                      <div style={{ height: '6px', background: theme.bgHover, borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: cat.color, borderRadius: '3px', width: `${cat.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Transactions View with Multi-Select */}
          {view === 'transactions' && (
            <div>
              {/* Filters */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                  <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: theme.textMuted }} />
                  <input 
                    type="text"
                    placeholder="Search transactions..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 12px 12px 44px',
                      borderRadius: '10px',
                      border: `2px solid ${theme.border}`,
                      background: theme.bgCard,
                      color: theme.text,
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
                <select 
                  value={filterCat} 
                  onChange={(e) => setFilterCat(e.target.value)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: `2px solid ${theme.border}`,
                    background: theme.bgCard,
                    color: theme.text,
                    fontSize: '14px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">All Categories</option>
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
                <select 
                  value={filterPaid} 
                  onChange={(e) => setFilterPaid(e.target.value)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: `2px solid ${theme.border}`,
                    background: theme.bgCard,
                    color: theme.text,
                    fontSize: '14px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="paid">✓ Paid</option>
                  <option value="unpaid">○ Unpaid</option>
                </select>
              </div>

              {/* Multi-Select Actions Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: theme.bgCard,
                borderRadius: '12px',
                border: theme.cardBorder,
                marginBottom: '16px',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '13px', color: theme.textSecondary }}>
                    <strong>{filtered.length}</strong> transactions
                    {selectedTxIds.size > 0 && (
                      <span style={{ 
                        marginLeft: '8px', 
                        padding: '4px 10px', 
                        background: theme.accentLight, 
                        color: theme.accent, 
                        borderRadius: '20px',
                        fontWeight: '600'
                      }}>
                        {selectedTxIds.size} selected
                      </span>
                    )}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {filtered.length > 0 && (
                    <>
                      <button 
                        onClick={() => setSelectedTxIds(new Set(filtered.map(t => t.id)))}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '8px',
                          border: 'none',
                          background: theme.accentLight,
                          color: theme.accent,
                          fontWeight: '600',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Check size={14} /> Select All
                      </button>
                      {selectedTxIds.size > 0 && (
                        <button 
                          onClick={() => setSelectedTxIds(new Set())}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '8px',
                            border: `1px solid ${theme.border}`,
                            background: 'transparent',
                            color: theme.textSecondary,
                            fontWeight: '500',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <X size={14} /> Deselect
                        </button>
                      )}
                    </>
                  )}
                  {selectedTxIds.size > 0 && (
                    <>
                      <div style={{ width: '1px', height: '24px', background: theme.border }} />
                      <button 
                        onClick={() => {
                          setTransactions(prev => prev.map(t => selectedTxIds.has(t.id) ? { ...t, paid: true } : t));
                          setSelectedTxIds(new Set());
                        }}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '8px',
                          border: 'none',
                          background: theme.success,
                          color: 'white',
                          fontWeight: '600',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Check size={14} /> Mark Paid
                      </button>
                      <button 
                        onClick={() => {
                          setTransactions(prev => prev.map(t => selectedTxIds.has(t.id) ? { ...t, paid: false } : t));
                          setSelectedTxIds(new Set());
                        }}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '8px',
                          border: 'none',
                          background: theme.warning,
                          color: 'white',
                          fontWeight: '600',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Clock size={14} /> Mark Unpaid
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm(`Delete ${selectedTxIds.size} selected transactions?\n\nThis cannot be undone.`)) {
                            setTransactions(prev => prev.filter(t => !selectedTxIds.has(t.id)));
                            setSelectedTxIds(new Set());
                          }
                        }}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '8px',
                          border: 'none',
                          background: theme.danger,
                          color: 'white',
                          fontWeight: '600',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Trash2 size={14} /> Delete ({selectedTxIds.size})
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Transaction List */}
              <div style={{
                background: theme.bgCard,
                borderRadius: '16px',
                border: theme.cardBorder,
                boxShadow: theme.cardShadow,
                overflow: 'hidden'
              }}>
                {filtered.slice(0, 50).map(tx => {
                  const cat = CATEGORIES.find(c => c.id === tx.category);
                  const isSelected = selectedTxIds.has(tx.id);
                  return (
                    <div key={tx.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '14px 20px',
                      borderBottom: `1px solid ${theme.borderLight}`,
                      background: isSelected ? theme.accentLight : 'transparent'
                    }}>
                      <div 
                        onClick={() => {
                          const newSet = new Set(selectedTxIds);
                          if (isSelected) newSet.delete(tx.id);
                          else newSet.add(tx.id);
                          setSelectedTxIds(newSet);
                        }}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          border: `2px solid ${isSelected ? theme.accent : theme.border}`,
                          background: isSelected ? theme.accent : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '14px',
                          cursor: 'pointer',
                          transition: 'all 150ms ease'
                        }}
                      >
                        {isSelected && <Check size={14} style={{ color: 'white' }} />}
                      </div>
                      <div 
                        onClick={() => togglePaid(tx.id)}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          border: `2px solid ${tx.paid ? theme.success : theme.border}`,
                          background: tx.paid ? theme.success : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '14px',
                          cursor: 'pointer'
                        }}
                      >
                        {tx.paid && <Check size={12} style={{ color: 'white' }} />}
                      </div>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: theme.bgHover,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        marginRight: '14px'
                      }}>{cat?.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', fontSize: '13px', color: theme.text }}>{tx.desc}</div>
                        <div style={{ fontSize: '12px', color: theme.textMuted }}>{shortDate(tx.date)} • {cat?.name}</div>
                      </div>
                      <span style={{ 
                        fontWeight: '700', 
                        fontSize: '14px', 
                        color: tx.amount > 0 ? theme.success : theme.text,
                        marginRight: '12px'
                      }}>
                        {tx.amount > 0 ? '+' : ''}{currency(tx.amount)}
                      </span>
                      <button 
                        onClick={() => setEditTx(tx)}
                        style={{ background: 'transparent', border: 'none', color: theme.textMuted, cursor: 'pointer', padding: '8px' }}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => deleteTx(tx.id)}
                        style={{ background: 'transparent', border: 'none', color: theme.danger, cursor: 'pointer', padding: '8px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
                {filtered.length === 0 && (
                  <div style={{ padding: '60px', textAlign: 'center', color: theme.textMuted }}>
                    <Receipt size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                    <div style={{ fontWeight: '600', marginBottom: '8px' }}>No transactions found</div>
                    <div style={{ fontSize: '13px' }}>Try adjusting your filters or add a new transaction</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Other Views - Simplified for brevity */}
          {view === 'budget' && (
            <div style={{ background: theme.bgCard, borderRadius: '16px', border: theme.cardBorder, padding: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', color: theme.text }}>Budget Goals</h2>
              <div style={{ display: 'grid', gap: '16px' }}>
                {budgetAnalysis.map(b => (
                  <div key={b.id} style={{ padding: '16px', background: theme.bgHover, borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '600', color: theme.text }}>{b.icon} {b.name}</span>
                      <span style={{ color: b.status === 'over' ? theme.danger : theme.text }}>{currency(b.spent)} / {currency(b.budget)}</span>
                    </div>
                    <div style={{ height: '8px', background: theme.border, borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ 
                        height: '100%', 
                        background: b.status === 'over' ? theme.danger : b.status === 'warning' ? theme.warning : theme.success,
                        width: `${Math.min(b.percentUsed, 100)}%`
                      }} />
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setModal('set-budgets')}
                style={{
                  marginTop: '20px',
                  padding: '12px 20px',
                  background: theme.accent,
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} style={{ marginRight: '8px' }} /> Set Budget Goals
              </button>
            </div>
          )}

          {view === 'recurring' && (
            <div style={{ background: theme.bgCard, borderRadius: '16px', border: theme.cardBorder, padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: theme.text }}>Recurring Expenses</h2>
                <button 
                  onClick={() => setModal('add-recurring')}
                  style={{ padding: '10px 16px', background: theme.accent, color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}
                >
                  <Plus size={16} style={{ marginRight: '6px' }} /> Add
                </button>
              </div>
              <div style={{ color: theme.textSecondary, marginBottom: '16px' }}>Monthly Total: <strong style={{ color: theme.text }}>{currency(totalMonthlyRecurring)}</strong></div>
              {recurringExpenses.map(r => {
                const cat = CATEGORIES.find(c => c.id === r.category);
                return (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', padding: '14px', background: theme.bgHover, borderRadius: '12px', marginBottom: '10px', opacity: r.active ? 1 : 0.5 }}>
                    <div style={{ fontSize: '24px', marginRight: '14px' }}>{cat?.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: theme.text }}>{r.name}</div>
                      <div style={{ fontSize: '12px', color: theme.textMuted }}>Due: {r.dueDay} • {r.autoPay ? 'Auto-pay' : 'Manual'}</div>
                    </div>
                    <span style={{ fontWeight: '700', color: theme.text, marginRight: '12px' }}>{currency(r.amount)}</span>
                    <button onClick={() => createFromRecurring(r)} style={{ background: 'transparent', border: 'none', color: theme.success, cursor: 'pointer', padding: '8px' }}><Plus size={16} /></button>
                    <button onClick={() => setEditRecurring(r)} style={{ background: 'transparent', border: 'none', color: theme.textMuted, cursor: 'pointer', padding: '8px' }}><Edit2 size={16} /></button>
                    <button onClick={() => deleteRecurring(r.id)} style={{ background: 'transparent', border: 'none', color: theme.danger, cursor: 'pointer', padding: '8px' }}><Trash2 size={16} /></button>
                  </div>
                );
              })}
            </div>
          )}

          {view === 'settings' && (
            <div style={{ maxWidth: '600px' }}>
              <div style={{ background: theme.bgCard, borderRadius: '16px', border: theme.cardBorder, padding: '24px', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: theme.text }}>💾 Backup & Sync</h2>
                
                {/* Dropbox Section */}
                <div style={{ padding: '16px', background: theme.bgHover, borderRadius: '12px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Cloud size={20} style={{ color: '#0061FF' }} />
                      <div>
                        <div style={{ fontWeight: '600', color: theme.text }}>Dropbox Cloud Backup</div>
                        <div style={{ fontSize: '12px', color: theme.textMuted }}>
                          {dropboxConnected ? `Connected • Last sync: ${dropboxLastSync ? new Date(dropboxLastSync).toLocaleDateString() : 'Never'}` : 'Not connected'}
                        </div>
                      </div>
                    </div>
                    {dropboxConnected ? (
                      <button onClick={disconnectDropbox} style={{ padding: '8px 14px', background: theme.dangerBg, color: theme.danger, border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>
                        Disconnect
                      </button>
                    ) : (
                      <button onClick={connectDropbox} style={{ padding: '8px 14px', background: '#0061FF', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>
                        Connect
                      </button>
                    )}
                  </div>
                  {dropboxConnected && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => syncToDropbox()}
                        disabled={dropboxSyncing}
                        style={{ flex: 1, padding: '10px', background: theme.accent, color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', opacity: dropboxSyncing ? 0.7 : 1 }}
                      >
                        {dropboxSyncing ? 'Syncing...' : '⬆️ Sync to Cloud'}
                      </button>
                      <button 
                        onClick={restoreFromDropbox}
                        disabled={dropboxSyncing}
                        style={{ flex: 1, padding: '10px', background: theme.bgCard, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
                      >
                        ⬇️ Restore from Cloud
                      </button>
                    </div>
                  )}
                  {dropboxError && <div style={{ marginTop: '8px', padding: '8px', background: theme.dangerBg, color: theme.danger, borderRadius: '8px', fontSize: '12px' }}>{dropboxError}</div>}
                </div>

                {/* Local Backup */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => {
                      const backup = { version: APP_VERSION, exportDate: new Date().toISOString(), data: { transactions, recurringExpenses, monthlyBalances, savingsGoal, budgetGoals, debts } };
                      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
                      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `balancebooks-backup-${new Date().toISOString().split('T')[0]}.json`; a.click();
                    }}
                    style={{ flex: 1, padding: '12px', background: theme.accent, color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    <Download size={16} style={{ marginRight: '8px' }} /> Download Backup
                  </button>
                  <button 
                    onClick={exportCSV}
                    style={{ flex: 1, padding: '12px', background: theme.bgHover, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    <FileSpreadsheet size={16} style={{ marginRight: '8px' }} /> Export CSV
                  </button>
                </div>
              </div>

              <div style={{ background: theme.bgCard, borderRadius: '16px', border: theme.cardBorder, padding: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: theme.text }}>ℹ️ About</h2>
                <div style={{ fontSize: '14px', color: theme.textSecondary }}>
                  <div style={{ marginBottom: '8px' }}>Version: <strong style={{ color: theme.text }}>{APP_VERSION}</strong></div>
                  <div style={{ marginBottom: '8px' }}>Platform: <strong style={{ color: theme.text }}>{isElectron ? 'Desktop' : 'Web'}</strong></div>
                  <div>Storage: <strong style={{ color: theme.text }}>Local + Cloud Sync</strong></div>
                </div>
              </div>
            </div>
          )}

          {/* Placeholder for other views */}
          {['analytics', 'debts', 'accounts', 'cycle', 'savings', 'recommendations'].includes(view) && (
            <div style={{ background: theme.bgCard, borderRadius: '16px', border: theme.cardBorder, padding: '40px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                {view === 'analytics' ? '📊' : view === 'debts' ? '💳' : view === 'accounts' ? '🏦' : view === 'cycle' ? '📅' : view === 'savings' ? '🐷' : '💡'}
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: theme.text, marginBottom: '8px' }}>
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </h2>
              <p style={{ color: theme.textMuted }}>This view is available in the full application.</p>
            </div>
          )}
        </div>
      </main>

      {/* ============ MODALS ============ */}
      {modal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }} onClick={() => setModal(null)}>
          <div style={{
            background: theme.bgCard,
            borderRadius: '20px',
            width: '100%',
            maxWidth: '480px',
            maxHeight: '90vh',
            overflow: 'auto'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: theme.text }}>
                {modal === 'add' ? 'Add Transaction' : modal === 'add-recurring' ? 'Add Recurring' : modal === 'import' ? 'Import Data' : modal === 'connect' ? 'Connect Bank' : 'Edit'}
              </h3>
              <button onClick={() => setModal(null)} style={{ background: 'transparent', border: 'none', color: theme.textMuted, cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '20px' }}>
              {modal === 'add' && <TxForm onSubmit={addTx} onCancel={() => setModal(null)} theme={theme} />}
              {modal === 'add-recurring' && <RecurringForm onSubmit={addRecurring} onCancel={() => setModal(null)} theme={theme} />}
              {modal === 'import' && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📤</div>
                  <h4 style={{ marginBottom: '8px', color: theme.text }}>Import Transactions</h4>
                  <p style={{ fontSize: '13px', color: theme.textMuted, marginBottom: '20px' }}>Upload a CSV file with your transactions</p>
                  <button onClick={downloadTemplate} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: theme.bgHover, border: `1px solid ${theme.border}`, borderRadius: '10px', color: theme.text, fontWeight: '500', cursor: 'pointer' }}>
                    <Download size={16} style={{ marginRight: '8px' }} /> Download Template
                  </button>
                  <label style={{ display: 'block', width: '100%', padding: '12px', background: theme.accent, color: 'white', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>
                    <Upload size={16} style={{ marginRight: '8px' }} /> Select File
                    <input type="file" accept=".csv,.xlsx,.xls,.txt" onChange={handleFileImport} style={{ display: 'none' }} />
                  </label>
                </div>
              )}
              {modal === 'connect' && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏦</div>
                  <h4 style={{ marginBottom: '8px', color: theme.text }}>Connect Your Bank</h4>
                  <p style={{ fontSize: '13px', color: theme.textMuted, marginBottom: '20px' }}>Automatically track when bills are paid</p>
                  <button 
                    onClick={connectBank}
                    disabled={plaidLoading}
                    style={{ width: '100%', padding: '14px', background: theme.accent, color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    {plaidLoading ? <><Loader2 size={16} style={{ marginRight: '8px', animation: 'spin 1s linear infinite' }} /> Connecting...</> : <><Link2 size={16} style={{ marginRight: '8px' }} /> Connect Bank (Demo)</>}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {editTx && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }} onClick={() => setEditTx(null)}>
          <div style={{
            background: theme.bgCard,
            borderRadius: '20px',
            width: '100%',
            maxWidth: '480px',
            maxHeight: '90vh',
            overflow: 'auto'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: theme.text }}>Edit Transaction</h3>
              <button onClick={() => setEditTx(null)} style={{ background: 'transparent', border: 'none', color: theme.textMuted, cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '20px' }}>
              <TxForm tx={editTx} onSubmit={updateTx} onCancel={() => setEditTx(null)} theme={theme} />
            </div>
          </div>
        </div>
      )}

      {/* Edit Recurring Modal */}
      {editRecurring && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }} onClick={() => setEditRecurring(null)}>
          <div style={{
            background: theme.bgCard,
            borderRadius: '20px',
            width: '100%',
            maxWidth: '480px',
            maxHeight: '90vh',
            overflow: 'auto'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: theme.text }}>Edit Recurring</h3>
              <button onClick={() => setEditRecurring(null)} style={{ background: 'transparent', border: 'none', color: theme.textMuted, cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '20px' }}>
              <RecurringForm recurring={editRecurring} onSubmit={updateRecurring} onCancel={() => setEditRecurring(null)} theme={theme} />
            </div>
          </div>
        </div>
      )}

      {/* Import Notification Toast */}
      {importNotification && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: theme.success,
          color: 'white',
          padding: '16px 24px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 200
        }}>
          <CheckCircle size={20} />
          <div>
            <div style={{ fontWeight: '600' }}>Import Successful!</div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>{importNotification.count} transactions imported</div>
          </div>
          <button onClick={() => setImportNotification(null)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', marginLeft: '8px' }}><X size={16} /></button>
        </div>
      )}

      {/* Mobile FAB */}
      {isMobile && (
        <button 
          onClick={() => setModal('add')}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: theme.navActive,
            color: 'white',
            border: 'none',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50
          }}
        >
          <Plus size={24} />
        </button>
      )}
    </div>
  );
}

// ============ FORM COMPONENTS ============

function TxForm({ tx, onSubmit, onCancel, theme }) {
  const [form, setForm] = useState({
    date: tx?.date || new Date().toISOString().split('T')[0],
    desc: tx?.desc || '',
    amount: tx ? Math.abs(tx.amount) : '',
    type: tx?.amount > 0 ? 'income' : 'expense',
    category: tx?.category || 'other',
    paid: tx?.paid || false
  });

  const handle = (e) => {
    e.preventDefault();
    const amt = form.type === 'income' ? Math.abs(parseFloat(form.amount)) : -Math.abs(parseFloat(form.amount));
    onSubmit({ ...tx, date: form.date, desc: form.desc, amount: amt, category: form.category, paid: form.paid });
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '10px',
    border: `2px solid ${theme.border}`,
    background: theme.bgCard,
    color: theme.text,
    fontSize: '14px',
    outline: 'none'
  };

  return (
    <form onSubmit={handle}>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: theme.textSecondary }}>Date</label>
        <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inputStyle} required />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: theme.textSecondary }}>Description</label>
        <input type="text" value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} placeholder="Enter description" style={inputStyle} required />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: theme.textSecondary }}>Amount</label>
        <input type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00" style={inputStyle} required />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: theme.textSecondary }}>Type</label>
          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value, category: e.target.value === 'income' ? 'income' : form.category })} style={inputStyle}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: theme.textSecondary }}>Category</label>
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle}>
            {CATEGORIES.filter(c => form.type === 'income' ? c.id === 'income' : c.id !== 'income').map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
        </div>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: theme.bgHover, borderRadius: '10px', cursor: 'pointer', marginBottom: '20px' }}>
        <input type="checkbox" checked={form.paid} onChange={e => setForm({ ...form, paid: e.target.checked })} style={{ width: '18px', height: '18px' }} />
        <span style={{ fontWeight: '500', color: theme.text }}>Mark as paid</span>
      </label>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button type="button" onClick={onCancel} style={{ flex: 1, padding: '12px', background: theme.bgHover, border: 'none', borderRadius: '10px', color: theme.text, fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
        <button type="submit" style={{ flex: 1, padding: '12px', background: theme.accent, border: 'none', borderRadius: '10px', color: 'white', fontWeight: '600', cursor: 'pointer' }}>{tx ? 'Update' : 'Add'}</button>
      </div>
    </form>
  );
}

function RecurringForm({ recurring, onSubmit, onCancel, theme }) {
  const [form, setForm] = useState({
    name: recurring?.name || '',
    amount: recurring?.amount || '',
    category: recurring?.category || 'utilities',
    frequency: recurring?.frequency || 'monthly',
    dueDay: recurring?.dueDay || 1,
    autoPay: recurring?.autoPay || false
  });

  const handle = (e) => {
    e.preventDefault();
    onSubmit({ ...recurring, ...form, amount: parseFloat(form.amount), dueDay: parseInt(form.dueDay) });
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '10px',
    border: `2px solid ${theme.border}`,
    background: theme.bgCard,
    color: theme.text,
    fontSize: '14px',
    outline: 'none'
  };

  return (
    <form onSubmit={handle}>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: theme.textSecondary }}>Name</label>
        <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Netflix, Rent" style={inputStyle} required />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: theme.textSecondary }}>Amount</label>
        <input type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00" style={inputStyle} required />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: theme.textSecondary }}>Category</label>
        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle}>
          {CATEGORIES.filter(c => c.id !== 'income').map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: theme.textSecondary }}>Frequency</label>
          <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })} style={inputStyle}>
            {FREQUENCY_OPTIONS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: theme.textSecondary }}>Due Day</label>
          <input type="number" min="1" max="31" value={form.dueDay} onChange={e => setForm({ ...form, dueDay: e.target.value })} style={inputStyle} required />
        </div>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: theme.bgHover, borderRadius: '10px', cursor: 'pointer', marginBottom: '20px' }}>
        <input type="checkbox" checked={form.autoPay} onChange={e => setForm({ ...form, autoPay: e.target.checked })} style={{ width: '18px', height: '18px' }} />
        <span style={{ fontWeight: '500', color: theme.text }}>Auto-pay enabled</span>
      </label>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button type="button" onClick={onCancel} style={{ flex: 1, padding: '12px', background: theme.bgHover, border: 'none', borderRadius: '10px', color: theme.text, fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
        <button type="submit" style={{ flex: 1, padding: '12px', background: theme.accent, border: 'none', borderRadius: '10px', color: 'white', fontWeight: '600', cursor: 'pointer' }}>{recurring ? 'Update' : 'Add'}</button>
      </div>
    </form>
  );
}
