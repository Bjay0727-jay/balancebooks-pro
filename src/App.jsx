import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Download, PiggyBank, TrendingUp, TrendingDown, Calendar, Plus, Trash2, Edit2, X, ArrowUpRight, ArrowDownRight, Wallet, Target, ChevronLeft, ChevronRight, Building2, Settings, Search, LayoutGrid, Receipt, Shield, Link2, Unlink, Loader2, Menu, RefreshCw, Check, Clock, AlertCircle, FileSpreadsheet, Upload, Lightbulb, DollarSign, Bell, Calculator, Sparkles, AlertTriangle, CheckCircle, Info, CreditCard, Percent, Zap, TrendingUp as Trending, PieChart, BarChart3, Goal, Smartphone, Cloud, HardDrive, Mail, Save, Moon, Sun } from 'lucide-react';

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

// Theme system from v3
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
  const [darkMode, setDarkMode] = useState(() => loadData('darkMode', false));
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
  const [budgetGoals, setBudgetGoals] = useState(() => loadData('budgetGoals', {}));
  const [debts, setDebts] = useState(() => loadData('debts', []));
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(() => loadData('autoBackup', false));
  const [lastBackupDate, setLastBackupDate] = useState(() => loadData('lastBackup', null));
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => loadData('notifications', false));
  const [editDebt, setEditDebt] = useState(null);
  const [restoreData, setRestoreData] = useState(null);

  const theme = getTheme(darkMode);

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
      ...CATEGORIES.find(c => c.id === id), total, pct: stats.expenses > 0 ? (total / stats.expenses) * 100 : 0 
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
    return { totalBudget, totalSpent, remaining: totalBudget - totalSpent, categoriesOverBudget };
  }, [budgetGoals, budgetAnalysis]);

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

  const savingsRecommendations = useMemo(() => {
    const recs = [];
    const avgIncome = stats.income || 0;
    const savingsRate = avgIncome > 0 ? (stats.saved / avgIncome) * 100 : 0;
    
    const dining = catBreakdown.find(c => c.id === 'dining')?.total || 0;
    if (dining > 150) {
      recs.push({ 
        id: 1, type: 'reduce', priority: 'high',
        title: 'Reduce Dining Out', 
        description: `Spent ${currency(dining)} on dining. Consider meal prepping.`, 
        potential: dining * 0.4,
        icon: '🍽️'
      });
    }

    if (savingsRate < 10 && avgIncome > 0) {
      recs.push({ 
        id: 4, type: 'alert', priority: 'high',
        title: 'Low Savings Rate', 
        description: `Only saving ${savingsRate.toFixed(1)}%. Target 20%.`, 
        potential: avgIncome * 0.1,
        icon: '⚠️'
      });
    }

    if (savingsRate >= 20) {
      recs.push({ 
        id: 5, type: 'success', priority: 'low',
        title: 'Great Savings!', 
        description: `Saving ${savingsRate.toFixed(1)}% - above the 20% target!`, 
        potential: 0,
        icon: '🎉'
      });
    }

    return recs;
  }, [catBreakdown, stats]);

  const totalMonthlyRecurring = recurringExpenses.filter(r => r.active).reduce((s, r) => s + r.amount, 0);

  // Navigation sections
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
      { id: 'accounts', icon: '🏦', label: 'Accounts', badge: linkedAccounts.length || null },
    ]},
    { section: 'Insights', items: [
      { id: 'cycle', icon: '📅', label: '12-Month Cycle' },
      { id: 'savings', icon: '🐷', label: 'Savings' },
      { id: 'recommendations', icon: '💡', label: 'Smart Tips', badge: savingsRecommendations.filter(r => r.priority === 'high').length || null },
      { id: 'settings', icon: '⚙️', label: 'Settings' },
    ]},
  ];

  const exportCSV = () => {
    const rows = [['Date', 'Description', 'Amount', 'Category', 'Status']];
    transactions.forEach(t => {
      const cat = CATEGORIES.find(c => c.id === t.category);
      rows.push([t.date, t.desc, t.amount.toFixed(2), cat?.name || t.category, t.paid ? 'Paid' : 'Unpaid']);
    });
    const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); 
    a.href = URL.createObjectURL(blob); 
    a.download = `balance-books-${new Date().toISOString().split('T')[0]}.csv`; 
    a.click();
  };

  const addTx = (tx) => { setTransactions([...transactions, { ...tx, id: uid() }]); setModal(null); };
  const updateTx = (tx) => { setTransactions(transactions.map(t => t.id === tx.id ? tx : t)); setEditTx(null); };
  const deleteTx = (id) => setTransactions(transactions.filter(t => t.id !== id));
  const togglePaid = (id) => setTransactions(transactions.map(t => t.id === id ? { ...t, paid: !t.paid } : t));

  const addRecurring = (r) => { setRecurringExpenses([...recurringExpenses, { ...r, id: uid(), active: true }]); setModal(null); };
  const updateRecurring = (r) => { setRecurringExpenses(recurringExpenses.map(e => e.id === r.id ? r : e)); setEditRecurring(null); };
  const deleteRecurring = (id) => setRecurringExpenses(recurringExpenses.filter(r => r.id !== id));
  const toggleRecurringActive = (id) => setRecurringExpenses(recurringExpenses.map(r => r.id === id ? { ...r, active: !r.active } : r));

  const connectBank = () => { 
    setPlaidLoading(true); 
    setTimeout(() => { 
      setLinkedAccounts([{ id: uid(), institution: 'USAA', accounts: [{ id: '1', name: 'Checking', mask: '4523' }, { id: '2', name: 'Savings', mask: '7891' }] }]); 
      setPlaidLoading(false); 
      setModal(null);
      setView('accounts');
    }, 2500); 
  };

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
      
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 99
          }}
        />
      )}

      {/* Sidebar */}
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
        zIndex: 100,
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
                <path d="M9 12l2 2 4-4"/>
                <path d="M12 3l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V7l8-4z"/>
              </svg>
            </div>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: '700', color: theme.text, margin: 0 }}>BalanceBooks</h1>
              <span style={{ fontSize: '11px', color: theme.textMuted, fontWeight: '500' }}>Pro • v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.8.0'}</span>
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
                color: theme.textSecondary, 
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
              width: '40px',
              height: '22px',
              borderRadius: '11px',
              background: darkMode ? theme.accent : theme.border,
              position: 'relative',
              transition: 'all 200ms ease'
            }}>
              <div style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: 'white',
                position: 'absolute',
                top: '2px',
                left: darkMode ? '20px' : '2px',
                transition: 'all 200ms ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
              }} />
            </div>
          </div>
          
          <button 
            onClick={() => setModal('connect')}
            style={{
              width: '100%',
              padding: '12px',
              background: theme.accent,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            🔗 Connect Bank
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, marginLeft: sidebarOpen && !isMobile ? '260px' : '0', minHeight: '100vh', transition: 'margin 300ms ease' }}>
        
        {/* Header */}
        <header style={{
          background: theme.headerBg,
          padding: '20px 28px 28px',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{ 
                  background: 'rgba(255,255,255,0.1)', 
                  border: 'none', 
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Menu size={20} />
              </button>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginBottom: '2px' }}>
                  {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'}
                </div>
                <div style={{ color: 'white', fontSize: '22px', fontWeight: '700', textTransform: 'capitalize' }}>
                  {view === 'recommendations' ? 'Smart Tips' : view}
                </div>
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
              { label: 'Beginning', value: stats.beginning, color: 'white', onClick: () => setModal('edit-beginning') },
              { label: 'Income', value: stats.income, color: '#4ade80', prefix: '+', onClick: () => setModal('edit-income') },
              { label: 'Expenses', value: stats.expenses, color: '#fca5a5', prefix: '-', onClick: () => setModal('edit-expenses') },
              { label: 'Balance', value: stats.ending, color: '#4ade80', onClick: () => setModal('edit-ending') },
            ].map((stat, i) => (
              <div 
                key={i} 
                onClick={stat.onClick}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '2px solid rgba(255,255,255,0.15)',
                  cursor: 'pointer',
                  transition: 'all 150ms ease'
                }}
              >
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {stat.label}
                  <Edit2 size={10} style={{ opacity: 0.5 }} />
                </div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: stat.color }}>
                  {stat.prefix || ''}{currency(stat.value)}
                </div>
              </div>
            ))}
          </div>
        </header>

        {/* Page Content */}
        <div style={{ padding: '24px 28px' }}>
          
          {/* Dashboard View */}
          {view === 'dashboard' && (
            <>
              {/* Quick Actions */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
                {[
                  { icon: '💵', title: 'Add Income', action: () => setModal('add') },
                  { icon: '🛒', title: 'Add Expense', action: () => setModal('add') },
                  { icon: '🔄', title: 'Recurring', action: () => setView('recurring') },
                  { icon: '📤', title: 'Export', action: exportCSV },
                ].map((action, i) => (
                  <div 
                    key={i} 
                    onClick={action.action}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      background: theme.bgCard,
                      borderRadius: '10px',
                      padding: '14px 16px',
                      border: theme.cardBorder,
                      boxShadow: theme.cardShadow,
                      cursor: 'pointer',
                      transition: 'all 150ms ease'
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: theme.bgHover,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px'
                    }}>
                      {action.icon}
                    </div>
                    <span style={{ fontWeight: '600', fontSize: '13px', color: theme.text }}>{action.title}</span>
                  </div>
                ))}
              </div>

              {/* Content Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px' }}>
                
                {/* Left Column - Recent Transactions */}
                <div style={{
                  background: theme.bgCard,
                  borderRadius: '12px',
                  border: theme.cardBorder,
                  boxShadow: theme.cardShadow,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                    borderBottom: `1px solid ${theme.border}`
                  }}>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: theme.text }}>Recent Transactions</h3>
                    <span 
                      onClick={() => setView('transactions')}
                      style={{ color: theme.accent, fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}
                    >View All →</span>
                  </div>
                  
                  <div>
                    {monthTx.slice(0, 8).map((tx, i) => {
                      const cat = CATEGORIES.find(c => c.id === tx.category);
                      return (
                        <div key={tx.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '12px 20px',
                          borderBottom: i < Math.min(monthTx.length, 8) - 1 ? `1px solid ${theme.borderLight}` : 'none',
                          cursor: 'pointer'
                        }}>
                          <div 
                            onClick={() => togglePaid(tx.id)}
                            style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '5px',
                              border: tx.paid ? 'none' : `2px solid ${theme.border}`,
                              background: tx.paid ? theme.accent : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: '12px',
                              cursor: 'pointer',
                              flexShrink: 0
                            }}
                          >
                            {tx.paid && <span style={{ color: 'white', fontSize: '10px' }}>✓</span>}
                          </div>
                          
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: theme.bgHover,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                            marginRight: '12px',
                            flexShrink: 0
                          }}>
                            {cat?.icon || '📦'}
                          </div>
                          
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: '500', color: theme.text, marginBottom: '2px' }}>{tx.desc}</div>
                            <div style={{ fontSize: '11px', color: theme.textMuted, display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {shortDate(tx.date)} • {cat?.name || 'Other'}
                              <span style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: '600',
                                background: tx.paid ? theme.successBg : theme.warningBg,
                                color: tx.paid ? theme.success : theme.warning
                              }}>
                                {tx.paid ? 'Paid' : 'Pending'}
                              </span>
                            </div>
                          </div>
                          
                          <div style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: tx.amount > 0 ? theme.success : theme.text
                          }}>
                            {tx.amount > 0 ? '+' : ''}{currency(tx.amount)}
                          </div>
                        </div>
                      );
                    })}
                    {monthTx.length === 0 && (
                      <div style={{ padding: '40px 20px', textAlign: 'center', color: theme.textMuted }}>
                        No transactions this month
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Widgets */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Savings Goal Widget */}
                  <div style={{
                    background: theme.savingsGradient,
                    borderRadius: '12px',
                    padding: '20px',
                    color: 'white',
                    border: '2px solid rgba(255,255,255,0.2)',
                    boxShadow: '0 4px 12px rgba(20, 184, 166, 0.3)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', opacity: 0.9 }}>Monthly Savings Goal</span>
                      <span style={{ fontSize: '16px', fontWeight: '700' }}>{savingsGoal > 0 ? Math.min(100, (stats.saved / savingsGoal * 100)).toFixed(0) : 0}%</span>
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: '700', marginBottom: '4px' }}>{currency(stats.saved)}</div>
                    <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '14px' }}>of {currency(savingsGoal)} goal</div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.3)', borderRadius: '4px', overflow: 'hidden', marginBottom: '10px' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, savingsGoal > 0 ? (stats.saved / savingsGoal * 100) : 0)}%`, background: 'white', borderRadius: '4px' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', opacity: 0.8 }}>
                      <span>{currency(Math.max(0, savingsGoal - stats.saved))} remaining</span>
                      <span onClick={() => setModal('edit-goal')} style={{ cursor: 'pointer' }}>Edit goal →</span>
                    </div>
                  </div>

                  {/* Upcoming Bills Widget */}
                  <div style={{
                    background: theme.bgCard,
                    borderRadius: '12px',
                    border: theme.cardBorder,
                    boxShadow: theme.cardShadow,
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px 18px',
                      borderBottom: `1px solid ${theme.border}`
                    }}>
                      <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: theme.text }}>Upcoming Bills</h3>
                      <span onClick={() => setView('recurring')} style={{ color: theme.accent, fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>Manage →</span>
                    </div>
                    
                    <div style={{ padding: '6px 18px 12px' }}>
                      {upcomingBills.length > 0 ? upcomingBills.slice(0, 4).map((bill, i) => {
                        const cat = CATEGORIES.find(c => c.id === bill.category);
                        return (
                          <div key={bill.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '10px 0',
                            borderBottom: i < Math.min(upcomingBills.length, 4) - 1 ? `1px solid ${theme.borderLight}` : 'none'
                          }}>
                            <div style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '8px',
                              background: theme.bgHover,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '16px',
                              marginRight: '12px'
                            }}>
                              {cat?.icon || '📦'}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '13px', fontWeight: '500', color: theme.text }}>{bill.name}</div>
                              <div style={{ 
                                fontSize: '11px', 
                                fontWeight: bill.daysUntil <= 1 ? '600' : '500',
                                color: bill.daysUntil <= 1 ? theme.danger : bill.daysUntil <= 3 ? theme.warning : theme.textMuted
                              }}>
                                {bill.daysUntil === 0 ? 'Due today' : bill.daysUntil === 1 ? 'Due tomorrow' : `Due in ${bill.daysUntil} days`}
                              </div>
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: theme.text }}>
                              {currency(bill.amount)}
                            </div>
                          </div>
                        );
                      }) : (
                        <div style={{ padding: '20px 0', textAlign: 'center', color: theme.textMuted, fontSize: '13px' }}>
                          No upcoming bills
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Smart Insights Widget */}
                  {savingsRecommendations.length > 0 && (
                    <div style={{
                      background: theme.insightsGradient,
                      borderRadius: '12px',
                      padding: '18px',
                      color: 'white',
                      border: '2px solid rgba(255,255,255,0.2)',
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                    }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '14px', opacity: 0.9 }}>💡 Insights</div>
                      
                      {savingsRecommendations.slice(0, 2).map((rec, i) => (
                        <div 
                          key={rec.id} 
                          onClick={() => setView('recommendations')}
                          style={{
                            background: 'rgba(255,255,255,0.12)',
                            borderRadius: '8px',
                            padding: '12px',
                            marginBottom: i < 1 ? '8px' : 0,
                            cursor: 'pointer'
                          }}
                        >
                          <p style={{ margin: '0 0 4px 0', fontSize: '12px', lineHeight: 1.5 }}>
                            {rec.icon} {rec.title}
                          </p>
                          <span style={{ fontSize: '11px', color: '#fde047', fontWeight: '500' }}>View details →</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Category Breakdown */}
                  <div style={{
                    background: theme.bgCard,
                    borderRadius: '12px',
                    border: theme.cardBorder,
                    boxShadow: theme.cardShadow,
                    padding: '18px'
                  }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '600', color: theme.text }}>Spending by Category</h3>
                    {catBreakdown.slice(0, 4).map(cat => (
                      <div key={cat.id} style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', color: theme.textSecondary }}>{cat.icon} {cat.name}</span>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: theme.text }}>{currency(cat.total)}</span>
                        </div>
                        <div style={{ height: '6px', background: theme.bgHover, borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${cat.pct}%`, background: cat.color, borderRadius: '3px' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Transactions View */}
          {view === 'transactions' && (
            <div>
              {/* Filters */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                  <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: theme.textMuted }} />
                  <input 
                    type="text"
                    placeholder="Search transactions..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 12px 12px 40px',
                      background: theme.bgCard,
                      border: theme.cardBorder,
                      borderRadius: '10px',
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
                    background: theme.bgCard,
                    border: theme.cardBorder,
                    borderRadius: '10px',
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
                    background: theme.bgCard,
                    border: theme.cardBorder,
                    borderRadius: '10px',
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

              {/* Transactions List */}
              <div style={{
                background: theme.bgCard,
                borderRadius: '12px',
                border: theme.cardBorder,
                boxShadow: theme.cardShadow,
                overflow: 'hidden'
              }}>
                {filtered.length > 0 ? filtered.slice(0, 50).map((tx, i) => {
                  const cat = CATEGORIES.find(c => c.id === tx.category);
                  return (
                    <div key={tx.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '14px 20px',
                      borderBottom: i < Math.min(filtered.length, 50) - 1 ? `1px solid ${theme.borderLight}` : 'none'
                    }}>
                      <div 
                        onClick={() => togglePaid(tx.id)}
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '6px',
                          border: tx.paid ? 'none' : `2px solid ${theme.border}`,
                          background: tx.paid ? theme.accent : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '14px',
                          cursor: 'pointer',
                          flexShrink: 0
                        }}
                      >
                        {tx.paid && <Check size={12} color="white" />}
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
                        marginRight: '14px',
                        flexShrink: 0
                      }}>
                        {cat?.icon || '📦'}
                      </div>
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: theme.text, marginBottom: '2px' }}>{tx.desc}</div>
                        <div style={{ fontSize: '12px', color: theme.textMuted }}>{shortDate(tx.date)} • {cat?.name || 'Other'}</div>
                      </div>
                      
                      <div style={{
                        fontSize: '15px',
                        fontWeight: '600',
                        color: tx.amount > 0 ? theme.success : theme.text,
                        marginRight: '16px'
                      }}>
                        {tx.amount > 0 ? '+' : ''}{currency(tx.amount)}
                      </div>
                      
                      <button onClick={() => setEditTx(tx)} style={{ background: 'none', border: 'none', color: theme.accent, cursor: 'pointer', padding: '8px' }}>
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => deleteTx(tx.id)} style={{ background: 'none', border: 'none', color: theme.danger, cursor: 'pointer', padding: '8px' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                }) : (
                  <div style={{ padding: '60px 20px', textAlign: 'center', color: theme.textMuted }}>
                    <Receipt size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                    <p style={{ margin: 0 }}>No transactions found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recurring View */}
          {view === 'recurring' && (
            <div>
              <div style={{
                background: theme.headerBg,
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '4px' }}>Monthly Recurring</div>
                  <div style={{ color: 'white', fontSize: '32px', fontWeight: '700' }}>{currency(totalMonthlyRecurring)}</div>
                </div>
                <button 
                  onClick={() => setModal('add-recurring')}
                  style={{
                    background: 'white',
                    color: '#1e3a5f',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '10px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Plus size={18} /> Add Recurring
                </button>
              </div>

              <div style={{
                background: theme.bgCard,
                borderRadius: '12px',
                border: theme.cardBorder,
                boxShadow: theme.cardShadow,
                overflow: 'hidden'
              }}>
                {recurringExpenses.map((r, i) => {
                  const cat = CATEGORIES.find(c => c.id === r.category);
                  const freq = FREQUENCY_OPTIONS.find(f => f.id === r.frequency);
                  return (
                    <div key={r.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '16px 20px',
                      borderBottom: i < recurringExpenses.length - 1 ? `1px solid ${theme.borderLight}` : 'none',
                      opacity: r.active ? 1 : 0.5
                    }}>
                      <div 
                        onClick={() => toggleRecurringActive(r.id)}
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '6px',
                          border: r.active ? 'none' : `2px solid ${theme.border}`,
                          background: r.active ? theme.accent : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '14px',
                          cursor: 'pointer'
                        }}
                      >
                        {r.active && <Check size={12} color="white" />}
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
                      }}>
                        {cat?.icon || '📦'}
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: theme.text }}>{r.name}</div>
                        <div style={{ fontSize: '12px', color: theme.textMuted }}>
                          {freq?.name} • Due: Day {r.dueDay}
                          {r.autoPay && <span style={{ color: theme.accent, marginLeft: '8px' }}>• Auto-pay</span>}
                        </div>
                      </div>
                      
                      <div style={{ fontSize: '15px', fontWeight: '600', color: theme.text, marginRight: '16px' }}>
                        {currency(r.amount)}
                      </div>
                      
                      <button onClick={() => setEditRecurring(r)} style={{ background: 'none', border: 'none', color: theme.accent, cursor: 'pointer', padding: '8px' }}>
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => deleteRecurring(r.id)} style={{ background: 'none', border: 'none', color: theme.danger, cursor: 'pointer', padding: '8px' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
                {recurringExpenses.length === 0 && (
                  <div style={{ padding: '60px 20px', textAlign: 'center', color: theme.textMuted }}>
                    <RefreshCw size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                    <p style={{ margin: 0 }}>No recurring expenses</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Budget View */}
          {view === 'budget' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, color: theme.text }}>Budget Goals</h2>
                <button 
                  onClick={() => setModal('set-budgets')}
                  style={{
                    background: theme.accent,
                    color: 'white',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '10px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Target size={18} /> Set Budgets
                </button>
              </div>

              <div style={{
                background: theme.bgCard,
                borderRadius: '12px',
                border: theme.cardBorder,
                boxShadow: theme.cardShadow,
                padding: '24px'
              }}>
                {budgetAnalysis.length > 0 ? budgetAnalysis.map(b => (
                  <div key={b.id} style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: theme.text }}>{b.icon} {b.name}</span>
                      <span style={{ fontSize: '14px', color: theme.textSecondary }}>
                        <span style={{ fontWeight: '600', color: b.status === 'over' ? theme.danger : theme.text }}>{currency(b.spent)}</span>
                        <span style={{ color: theme.textMuted }}> / {currency(b.budget)}</span>
                      </span>
                    </div>
                    <div style={{ height: '8px', background: theme.bgHover, borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${Math.min(b.percentUsed, 100)}%`, 
                        background: b.status === 'over' ? theme.danger : b.status === 'warning' ? theme.warning : theme.success,
                        borderRadius: '4px',
                        transition: 'width 300ms ease'
                      }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span style={{ fontSize: '11px', color: theme.textMuted }}>{b.percentUsed.toFixed(0)}% used</span>
                      <span style={{ fontSize: '11px', color: b.remaining >= 0 ? theme.success : theme.danger }}>
                        {b.remaining >= 0 ? `${currency(b.remaining)} left` : `${currency(Math.abs(b.remaining))} over`}
                      </span>
                    </div>
                  </div>
                )) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: theme.textMuted }}>
                    <Target size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                    <p>No budgets set. Click "Set Budgets" to get started.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Savings View */}
          {view === 'savings' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              <div style={{
                background: theme.savingsGradient,
                borderRadius: '16px',
                padding: '24px',
                color: 'white'
              }}>
                <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '8px' }}>This Month</div>
                <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '16px' }}>{currency(stats.saved)}</div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.3)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, savingsGoal > 0 ? (stats.saved / savingsGoal * 100) : 0)}%`, background: 'white', borderRadius: '4px' }} />
                </div>
                <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>{savingsGoal > 0 ? Math.min(100, (stats.saved / savingsGoal * 100)).toFixed(0) : 0}% of {currency(savingsGoal)} goal</div>
              </div>
              
              <div style={{
                background: theme.bgCard,
                borderRadius: '16px',
                padding: '24px',
                border: theme.cardBorder
              }}>
                <div style={{ fontSize: '14px', color: theme.textMuted, marginBottom: '8px' }}>Year to Date</div>
                <div style={{ fontSize: '32px', fontWeight: '700', color: theme.success }}>
                  {currency(transactions.filter(t => t.category === 'savings' && new Date(t.date).getFullYear() === year).reduce((s, t) => s + Math.abs(t.amount), 0))}
                </div>
              </div>
              
              <div 
                onClick={() => setModal('edit-goal')}
                style={{
                  background: theme.bgCard,
                  borderRadius: '16px',
                  padding: '24px',
                  border: theme.cardBorder,
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '14px', color: theme.textMuted, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Monthly Goal <Edit2 size={12} />
                </div>
                <div style={{ fontSize: '32px', fontWeight: '700', color: theme.accent }}>{currency(savingsGoal)}</div>
              </div>
            </div>
          )}

          {/* Settings View */}
          {view === 'settings' && (
            <div style={{ maxWidth: '600px' }}>
              <div style={{
                background: theme.bgCard,
                borderRadius: '12px',
                border: theme.cardBorder,
                boxShadow: theme.cardShadow,
                padding: '24px',
                marginBottom: '20px'
              }}>
                <h3 style={{ margin: '0 0 20px 0', color: theme.text }}>Balance Settings</h3>
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: theme.textSecondary, marginBottom: '8px' }}>Beginning Balance ({FULL_MONTHS[month]})</label>
                    <input 
                      type="number"
                      value={stats.beginning}
                      onChange={(e) => setBeginningBalance(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: theme.bgHover,
                        border: `2px solid ${theme.border}`,
                        borderRadius: '8px',
                        color: theme.text,
                        fontSize: '16px',
                        fontWeight: '600',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: theme.textSecondary, marginBottom: '8px' }}>Monthly Savings Goal</label>
                    <input 
                      type="number"
                      value={savingsGoal}
                      onChange={(e) => setSavingsGoal(parseFloat(e.target.value) || 0)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: theme.bgHover,
                        border: `2px solid ${theme.border}`,
                        borderRadius: '8px',
                        color: theme.text,
                        fontSize: '16px',
                        fontWeight: '600',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{
                background: theme.bgCard,
                borderRadius: '12px',
                border: theme.cardBorder,
                boxShadow: theme.cardShadow,
                padding: '24px',
                marginBottom: '20px'
              }}>
                <h3 style={{ margin: '0 0 20px 0', color: theme.text }}>Data Management</h3>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button 
                    onClick={exportCSV}
                    style={{
                      padding: '12px 20px',
                      background: theme.accent,
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Download size={18} /> Export CSV
                  </button>
                  <button 
                    onClick={() => {
                      const data = { transactions, recurringExpenses, monthlyBalances, savingsGoal, budgetGoals, debts };
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                      const a = document.createElement('a');
                      a.href = URL.createObjectURL(blob);
                      a.download = `balancebooks-backup-${new Date().toISOString().split('T')[0]}.json`;
                      a.click();
                    }}
                    style={{
                      padding: '12px 20px',
                      background: theme.bgHover,
                      color: theme.text,
                      border: theme.cardBorder,
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Save size={18} /> Backup Data
                  </button>
                </div>
              </div>

              <div style={{
                background: theme.bgCard,
                borderRadius: '12px',
                border: `2px solid ${theme.danger}`,
                padding: '24px'
              }}>
                <h3 style={{ margin: '0 0 12px 0', color: theme.danger }}>Danger Zone</h3>
                <p style={{ color: theme.textMuted, marginBottom: '16px', fontSize: '13px' }}>These actions cannot be undone.</p>
                <button 
                  onClick={() => {
                    if (confirm('Delete all transactions? This cannot be undone.')) {
                      setTransactions([]);
                    }
                  }}
                  style={{
                    padding: '12px 20px',
                    background: theme.dangerBg,
                    color: theme.danger,
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Delete All Transactions
                </button>
              </div>
            </div>
          )}

          {/* Accounts, Analytics, Debts, Cycle, Recommendations views - simplified */}
          {view === 'accounts' && (
            <div style={{
              background: theme.bgCard,
              borderRadius: '12px',
              border: theme.cardBorder,
              padding: '60px 40px',
              textAlign: 'center'
            }}>
              <Building2 size={48} style={{ color: theme.textMuted, marginBottom: '16px' }} />
              <h3 style={{ color: theme.text, marginBottom: '8px' }}>
                {linkedAccounts.length > 0 ? 'Connected Accounts' : 'No Banks Connected'}
              </h3>
              <p style={{ color: theme.textMuted, marginBottom: '24px' }}>
                {linkedAccounts.length > 0 
                  ? `Connected to ${linkedAccounts[0].institution}` 
                  : 'Connect your bank to auto-track payments'}
              </p>
              <button 
                onClick={() => setModal('connect')}
                style={{
                  padding: '14px 28px',
                  background: theme.accent,
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {linkedAccounts.length > 0 ? 'Manage Connection' : 'Connect Bank'}
              </button>
            </div>
          )}

          {view === 'analytics' && (
            <div style={{
              background: theme.bgCard,
              borderRadius: '12px',
              border: theme.cardBorder,
              padding: '24px'
            }}>
              <h3 style={{ color: theme.text, marginBottom: '24px' }}>Spending Breakdown</h3>
              {catBreakdown.map(cat => (
                <div key={cat.id} style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: theme.textSecondary }}>{cat.icon} {cat.name}</span>
                    <span style={{ fontWeight: '600', color: theme.text }}>{currency(cat.total)} ({cat.pct.toFixed(1)}%)</span>
                  </div>
                  <div style={{ height: '10px', background: theme.bgHover, borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${cat.pct}%`, background: cat.color, borderRadius: '5px' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {view === 'debts' && (
            <div style={{
              background: theme.bgCard,
              borderRadius: '12px',
              border: theme.cardBorder,
              padding: '60px 40px',
              textAlign: 'center'
            }}>
              <CreditCard size={48} style={{ color: theme.textMuted, marginBottom: '16px' }} />
              <h3 style={{ color: theme.text, marginBottom: '8px' }}>Debt Payoff Planner</h3>
              <p style={{ color: theme.textMuted, marginBottom: '24px' }}>
                {debts.length > 0 ? `Tracking ${debts.length} debts` : 'Track and eliminate your debts'}
              </p>
              <button 
                onClick={() => setModal('add-debt')}
                style={{
                  padding: '14px 28px',
                  background: theme.accent,
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Add Debt
              </button>
            </div>
          )}

          {view === 'cycle' && (
            <div style={{
              background: theme.bgCard,
              borderRadius: '12px',
              border: theme.cardBorder,
              overflow: 'hidden'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: theme.bgHover }}>
                    <th style={{ padding: '14px 20px', textAlign: 'left', color: theme.text, fontWeight: '600' }}>Month</th>
                    <th style={{ padding: '14px 20px', textAlign: 'right', color: theme.success }}>Income</th>
                    <th style={{ padding: '14px 20px', textAlign: 'right', color: theme.danger }}>Expenses</th>
                    <th style={{ padding: '14px 20px', textAlign: 'right', color: theme.text }}>Net</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 12 }, (_, i) => {
                    const m = (month - 11 + i + 12) % 12;
                    const y = year - (month - 11 + i < 0 ? 1 : 0);
                    const txs = transactions.filter(t => {
                      const parts = getDateParts(t.date);
                      return parts && parts.month === m && parts.year === y;
                    });
                    const inc = txs.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
                    const exp = txs.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
                    return (
                      <tr key={i} style={{ borderBottom: `1px solid ${theme.borderLight}` }}>
                        <td style={{ padding: '14px 20px', color: theme.text }}>{MONTHS[m]} {y}</td>
                        <td style={{ padding: '14px 20px', textAlign: 'right', color: theme.success }}>{currency(inc)}</td>
                        <td style={{ padding: '14px 20px', textAlign: 'right', color: theme.danger }}>{currency(exp)}</td>
                        <td style={{ padding: '14px 20px', textAlign: 'right', color: inc - exp >= 0 ? theme.success : theme.danger, fontWeight: '600' }}>
                          {inc - exp >= 0 ? '+' : ''}{currency(inc - exp)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {view === 'recommendations' && (
            <div>
              {savingsRecommendations.map(rec => (
                <div key={rec.id} style={{
                  background: theme.bgCard,
                  borderRadius: '12px',
                  border: theme.cardBorder,
                  padding: '20px',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '24px' }}>{rec.icon}</span>
                    <span style={{ fontWeight: '600', color: theme.text }}>{rec.title}</span>
                  </div>
                  <p style={{ color: theme.textSecondary, marginBottom: '8px' }}>{rec.description}</p>
                  {rec.potential > 0 && (
                    <div style={{ color: theme.success, fontWeight: '600' }}>
                      Potential savings: {currency(rec.potential)}/month
                    </div>
                  )}
                </div>
              ))}
              {savingsRecommendations.length === 0 && (
                <div style={{
                  background: theme.bgCard,
                  borderRadius: '12px',
                  border: theme.cardBorder,
                  padding: '60px 40px',
                  textAlign: 'center'
                }}>
                  <CheckCircle size={48} style={{ color: theme.success, marginBottom: '16px' }} />
                  <h3 style={{ color: theme.text }}>You're Doing Great!</h3>
                  <p style={{ color: theme.textMuted }}>No recommendations at this time.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

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
            background: theme.accent,
            color: 'white',
            border: 'none',
            boxShadow: '0 4px 12px rgba(20, 184, 166, 0.4)',
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

      {/* Modals */}
      {modal === 'add' && <Modal title="Add Transaction" onClose={() => setModal(null)} theme={theme}><TxForm onSubmit={addTx} onCancel={() => setModal(null)} theme={theme} /></Modal>}
      {editTx && <Modal title="Edit Transaction" onClose={() => setEditTx(null)} theme={theme}><TxForm tx={editTx} onSubmit={updateTx} onCancel={() => setEditTx(null)} theme={theme} /></Modal>}
      {modal === 'add-recurring' && <Modal title="Add Recurring" onClose={() => setModal(null)} theme={theme}><RecurringForm onSubmit={addRecurring} onCancel={() => setModal(null)} theme={theme} /></Modal>}
      {editRecurring && <Modal title="Edit Recurring" onClose={() => setEditRecurring(null)} theme={theme}><RecurringForm recurring={editRecurring} onSubmit={updateRecurring} onCancel={() => setEditRecurring(null)} theme={theme} /></Modal>}
      
      {modal === 'edit-beginning' && (
        <Modal title="Edit Beginning Balance" onClose={() => setModal(null)} theme={theme}>
          <div>
            <p style={{ color: theme.textSecondary, marginBottom: '16px' }}>Set the starting balance for {FULL_MONTHS[month]} {year}.</p>
            <input 
              type="number"
              defaultValue={stats.beginning}
              onChange={(e) => setBeginningBalance(e.target.value)}
              style={{
                width: '100%',
                padding: '16px',
                background: theme.bgHover,
                border: `2px solid ${theme.accent}`,
                borderRadius: '10px',
                color: theme.text,
                fontSize: '24px',
                fontWeight: '700',
                outline: 'none',
                marginBottom: '16px'
              }}
              autoFocus
            />
            <button onClick={() => setModal(null)} style={{ width: '100%', padding: '14px', background: theme.accent, color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>Save</button>
          </div>
        </Modal>
      )}

      {modal === 'edit-ending' && (
        <Modal title="Edit Ending Balance" onClose={() => setModal(null)} theme={theme}>
          <div>
            <p style={{ color: theme.textSecondary, marginBottom: '16px' }}>Override the ending balance for {FULL_MONTHS[month]} {year}.</p>
            <input 
              type="number"
              defaultValue={stats.ending}
              onChange={(e) => setEndingBalance(e.target.value)}
              style={{
                width: '100%',
                padding: '16px',
                background: theme.bgHover,
                border: `2px solid ${theme.accent}`,
                borderRadius: '10px',
                color: theme.text,
                fontSize: '24px',
                fontWeight: '700',
                outline: 'none',
                marginBottom: '16px'
              }}
              autoFocus
            />
            <button onClick={() => setModal(null)} style={{ width: '100%', padding: '14px', background: theme.accent, color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>Save</button>
          </div>
        </Modal>
      )}

      {modal === 'edit-goal' && (
        <Modal title="Edit Savings Goal" onClose={() => setModal(null)} theme={theme}>
          <div>
            <p style={{ color: theme.textSecondary, marginBottom: '16px' }}>Set your monthly savings target.</p>
            <input 
              type="number"
              defaultValue={savingsGoal}
              onChange={(e) => setSavingsGoal(parseFloat(e.target.value) || 0)}
              style={{
                width: '100%',
                padding: '16px',
                background: theme.bgHover,
                border: `2px solid ${theme.accent}`,
                borderRadius: '10px',
                color: theme.text,
                fontSize: '24px',
                fontWeight: '700',
                outline: 'none',
                marginBottom: '16px'
              }}
              autoFocus
            />
            <button onClick={() => setModal(null)} style={{ width: '100%', padding: '14px', background: theme.accent, color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>Save</button>
          </div>
        </Modal>
      )}

      {(modal === 'edit-income' || modal === 'edit-expenses') && (
        <Modal title={modal === 'edit-income' ? 'Income' : 'Expenses'} onClose={() => setModal(null)} theme={theme}>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: modal === 'edit-income' ? theme.success : theme.text, marginBottom: '16px' }}>
              {modal === 'edit-income' ? '+' : '-'}{currency(modal === 'edit-income' ? stats.income : stats.expenses)}
            </div>
            <p style={{ color: theme.textMuted, marginBottom: '20px' }}>
              {modal === 'edit-income' ? 'Total income' : 'Total expenses'} for {FULL_MONTHS[month]}
            </p>
            <button 
              onClick={() => { setModal('add'); }}
              style={{ padding: '14px 28px', background: theme.accent, color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}
            >
              Add {modal === 'edit-income' ? 'Income' : 'Expense'}
            </button>
          </div>
        </Modal>
      )}

      {modal === 'connect' && (
        <Modal title="Connect Bank" onClose={() => setModal(null)} theme={theme}>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: theme.navActive, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Building2 size={32} color="white" />
            </div>
            <h3 style={{ color: theme.text, marginBottom: '8px' }}>Secure Bank Connection</h3>
            <p style={{ color: theme.textMuted, marginBottom: '24px' }}>Connect your bank to automatically track when bills are paid.</p>
            <button 
              onClick={connectBank}
              disabled={plaidLoading}
              style={{ 
                width: '100%', 
                padding: '14px', 
                background: theme.accent, 
                color: 'white', 
                border: 'none', 
                borderRadius: '10px', 
                fontWeight: '600', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {plaidLoading ? <><Loader2 size={18} className="animate-spin" /> Connecting...</> : 'Connect Demo Bank'}
            </button>
          </div>
        </Modal>
      )}

      {modal === 'set-budgets' && (
        <Modal title="Set Budget Goals" onClose={() => setModal(null)} theme={theme}>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {CATEGORIES.filter(c => c.id !== 'income').map(cat => (
              <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: `1px solid ${theme.borderLight}` }}>
                <span style={{ fontSize: '20px' }}>{cat.icon}</span>
                <span style={{ flex: 1, color: theme.text }}>{cat.name}</span>
                <input 
                  type="number"
                  placeholder="0"
                  value={budgetGoals[cat.id] || ''}
                  onChange={(e) => setBudgetGoals(prev => ({ ...prev, [cat.id]: parseFloat(e.target.value) || 0 }))}
                  style={{
                    width: '100px',
                    padding: '8px 12px',
                    background: theme.bgHover,
                    border: `2px solid ${theme.border}`,
                    borderRadius: '8px',
                    color: theme.text,
                    textAlign: 'right',
                    outline: 'none'
                  }}
                />
              </div>
            ))}
          </div>
          <button onClick={() => setModal(null)} style={{ width: '100%', padding: '14px', background: theme.accent, color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', marginTop: '20px' }}>Save Budgets</button>
        </Modal>
      )}

      {modal === 'add-debt' && (
        <Modal title="Add Debt" onClose={() => setModal(null)} theme={theme}>
          <DebtForm onSubmit={(d) => { setDebts([...debts, { ...d, id: uid() }]); setModal(null); }} onCancel={() => setModal(null)} theme={theme} />
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose, theme }) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: theme.bgCard,
        borderRadius: '16px',
        width: '100%',
        maxWidth: '480px',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          borderBottom: `1px solid ${theme.border}`
        }}>
          <h3 style={{ margin: 0, color: theme.text, fontWeight: '600' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: '24px', overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

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
    padding: '12px 16px',
    background: theme.bgHover,
    border: `2px solid ${theme.border}`,
    borderRadius: '10px',
    color: theme.text,
    fontSize: '14px',
    outline: 'none'
  };

  return (
    <form onSubmit={handle}>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', color: theme.textSecondary, marginBottom: '8px' }}>Date</label>
        <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={inputStyle} required />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', color: theme.textSecondary, marginBottom: '8px' }}>Description</label>
        <input type="text" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} placeholder="Enter description" style={inputStyle} required />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', color: theme.textSecondary, marginBottom: '8px' }}>Amount</label>
        <input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" style={inputStyle} required />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', color: theme.textSecondary, marginBottom: '8px' }}>Type</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, category: e.target.value === 'income' ? 'income' : form.category })} style={inputStyle}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', color: theme.textSecondary, marginBottom: '8px' }}>Category</label>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={inputStyle}>
            {CATEGORIES.filter(c => form.type === 'income' ? c.id === 'income' : c.id !== 'income').map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </div>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: theme.bgHover, borderRadius: '10px', cursor: 'pointer', marginBottom: '20px' }}>
        <input type="checkbox" checked={form.paid} onChange={(e) => setForm({ ...form, paid: e.target.checked })} style={{ width: '18px', height: '18px' }} />
        <span style={{ color: theme.text }}>Mark as paid</span>
      </label>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button type="button" onClick={onCancel} style={{ flex: 1, padding: '14px', background: theme.bgHover, color: theme.text, border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
        <button type="submit" style={{ flex: 1, padding: '14px', background: theme.accent, color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>{tx ? 'Update' : 'Add'}</button>
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
    padding: '12px 16px',
    background: theme.bgHover,
    border: `2px solid ${theme.border}`,
    borderRadius: '10px',
    color: theme.text,
    fontSize: '14px',
    outline: 'none'
  };

  return (
    <form onSubmit={handle}>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', color: theme.textSecondary, marginBottom: '8px' }}>Name</label>
        <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Netflix" style={inputStyle} required />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', color: theme.textSecondary, marginBottom: '8px' }}>Amount</label>
        <input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" style={inputStyle} required />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', color: theme.textSecondary, marginBottom: '8px' }}>Category</label>
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={inputStyle}>
          {CATEGORIES.filter(c => c.id !== 'income').map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', color: theme.textSecondary, marginBottom: '8px' }}>Frequency</label>
          <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} style={inputStyle}>
            {FREQUENCY_OPTIONS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', color: theme.textSecondary, marginBottom: '8px' }}>Due Day</label>
          <input type="number" min="1" max="31" value={form.dueDay} onChange={(e) => setForm({ ...form, dueDay: e.target.value })} style={inputStyle} required />
        </div>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: theme.bgHover, borderRadius: '10px', cursor: 'pointer', marginBottom: '20px' }}>
        <input type="checkbox" checked={form.autoPay} onChange={(e) => setForm({ ...form, autoPay: e.target.checked })} style={{ width: '18px', height: '18px' }} />
        <span style={{ color: theme.text }}>Auto-pay enabled</span>
      </label>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button type="button" onClick={onCancel} style={{ flex: 1, padding: '14px', background: theme.bgHover, color: theme.text, border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
        <button type="submit" style={{ flex: 1, padding: '14px', background: theme.accent, color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>{recurring ? 'Update' : 'Add'}</button>
      </div>
    </form>
  );
}

function DebtForm({ debt, onSubmit, onCancel, theme }) {
  const [form, setForm] = useState({ 
    name: debt?.name || '', 
    balance: debt?.balance || '', 
    interestRate: debt?.interestRate || '', 
    minPayment: debt?.minPayment || '',
    type: debt?.type || 'credit-card'
  });

  const handle = (e) => { 
    e.preventDefault(); 
    onSubmit({ ...debt, ...form, balance: parseFloat(form.balance), interestRate: parseFloat(form.interestRate), minPayment: parseFloat(form.minPayment) }); 
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    background: theme.bgHover,
    border: `2px solid ${theme.border}`,
    borderRadius: '10px',
    color: theme.text,
    fontSize: '14px',
    outline: 'none'
  };

  return (
    <form onSubmit={handle}>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', color: theme.textSecondary, marginBottom: '8px' }}>Debt Name</label>
        <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Chase Visa" style={inputStyle} required />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', color: theme.textSecondary, marginBottom: '8px' }}>Current Balance</label>
        <input type="number" step="0.01" min="0" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} placeholder="0.00" style={inputStyle} required />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', color: theme.textSecondary, marginBottom: '8px' }}>Interest Rate (%)</label>
          <input type="number" step="0.1" min="0" value={form.interestRate} onChange={(e) => setForm({ ...form, interestRate: e.target.value })} placeholder="18.9" style={inputStyle} required />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', color: theme.textSecondary, marginBottom: '8px' }}>Min Payment</label>
          <input type="number" step="0.01" min="0" value={form.minPayment} onChange={(e) => setForm({ ...form, minPayment: e.target.value })} placeholder="50.00" style={inputStyle} required />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button type="button" onClick={onCancel} style={{ flex: 1, padding: '14px', background: theme.bgHover, color: theme.text, border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
        <button type="submit" style={{ flex: 1, padding: '14px', background: theme.accent, color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>{debt ? 'Update' : 'Add'}</button>
      </div>
    </form>
  );
}
