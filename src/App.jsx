import React, { useState, useMemo, useEffect, useCallback } from 'react';

// Categories with proper emoji icons
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
    return `${MONTHS[parseInt(match[2]) - 1]} ${parseInt(match[3])}`;
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron;
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

const saveData = (key, data) => { try { localStorage.setItem('bb_' + key, JSON.stringify(data)); } catch {} };
const loadData = (key, defaultValue) => { try { const saved = localStorage.getItem('bb_' + key); return saved ? JSON.parse(saved) : defaultValue; } catch { return defaultValue; } };

// Theme definitions
const getTheme = (darkMode) => darkMode ? {
  // Dark Mode
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
  // Light Mode
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
  // Core State
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
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768);
  const [linkedAccounts, setLinkedAccounts] = useState([]);
  const [plaidLoading, setPlaidLoading] = useState(false);
  const [importData, setImportData] = useState(null);
  const [importNotification, setImportNotification] = useState(null);
  
  // New Feature States
  const [budgetGoals, setBudgetGoals] = useState(() => loadData('budgetGoals', {}));
  const [debts, setDebts] = useState(() => loadData('debts', []));
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(() => loadData('autoBackup', false));
  const [lastBackupDate, setLastBackupDate] = useState(() => loadData('lastBackup', null));
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => loadData('notifications', false));
  const [editDebt, setEditDebt] = useState(null);
  const [restoreData, setRestoreData] = useState(null);
  
  // Theme State
  const [darkMode, setDarkMode] = useState(() => loadData('darkMode', false));
  const theme = getTheme(darkMode);

  // Persistence
  useEffect(() => { saveData('transactions', transactions); }, [transactions]);
  useEffect(() => { saveData('recurring', recurringExpenses); }, [recurringExpenses]);
  useEffect(() => { saveData('monthlyBalances', monthlyBalances); }, [monthlyBalances]);
  useEffect(() => { saveData('savingsGoal', savingsGoal); }, [savingsGoal]);
  useEffect(() => { saveData('budgetGoals', budgetGoals); }, [budgetGoals]);
  useEffect(() => { saveData('debts', debts); }, [debts]);
  useEffect(() => { saveData('autoBackup', autoBackupEnabled); }, [autoBackupEnabled]);
  useEffect(() => { saveData('lastBackup', lastBackupDate); }, [lastBackupDate]);
  useEffect(() => { saveData('notifications', notificationsEnabled); }, [notificationsEnabled]);
  useEffect(() => { saveData('darkMode', darkMode); }, [darkMode]);

  // Balance calculations
  const getMonthKey = (m, y) => `${y}-${String(m).padStart(2, '0')}`;
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
      ...CATEGORIES.find(c => c.id === id), total, pct: stats.expenses > 0 ? (total / stats.expenses) * 100 : 0 
    })).sort((a, b) => b.total - a.total);
  }, [monthTx, stats.expenses]);

  const upcomingBills = useMemo(() => {
    const today = new Date();
    const day = today.getDate();
    return recurringExpenses.filter(r => r.active).map(r => {
      let dueDate = new Date(year, month, r.dueDay);
      if (r.dueDay < day) dueDate = new Date(year, month + 1, r.dueDay);
      const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      return { ...r, dueDate, daysUntil };
    }).filter(r => r.daysUntil >= 0 && r.daysUntil <= 14).sort((a, b) => a.daysUntil - b.daysUntil);
  }, [recurringExpenses, month, year]);

  const totalMonthlyRecurring = recurringExpenses.filter(r => r.active).reduce((s, r) => s + r.amount, 0);

  // Savings recommendations
  const savingsRecommendations = useMemo(() => {
    const recs = [];
    const avgIncome = stats.income || 0;
    const savingsRate = avgIncome > 0 ? (stats.saved / avgIncome) * 100 : 0;
    
    const dining = catBreakdown.find(c => c.id === 'dining')?.total || 0;
    if (dining > 150) {
      recs.push({ 
        id: 1, type: 'reduce', priority: 'high',
        title: 'Reduce Dining Out', 
        description: `You spent ${currency(dining)} on dining this month. Consider meal prepping to save money.`, 
        potential: dining * 0.4,
        icon: '🍽️',
        tips: ['Cook at home 2-3 more days per week', 'Try meal prepping on Sundays', 'Bring lunch to work instead of buying']
      });
    }
    
    const subs = catBreakdown.find(c => c.id === 'subscriptions')?.total || 0;
    if (subs > 50) {
      recs.push({ 
        id: 2, type: 'audit', priority: 'medium',
        title: 'Audit Subscriptions', 
        description: `${currency(subs)} in monthly subscriptions. Review each service you're paying for.`, 
        potential: subs * 0.3,
        icon: '📱',
        tips: ['List all active subscriptions', 'Cancel services you rarely use', 'Look for annual payment discounts (save 15-20%)']
      });
    }

    const shopping = catBreakdown.find(c => c.id === 'shopping')?.total || 0;
    if (shopping > 200) {
      recs.push({ 
        id: 5, type: 'reduce', priority: 'medium',
        title: 'Control Shopping Spending', 
        description: `${currency(shopping)} on shopping this month. Try the 24-hour rule for non-essential purchases.`, 
        potential: shopping * 0.35,
        icon: '🛍️',
        tips: ['Wait 24 hours before buying anything over $50', 'Unsubscribe from retail email lists', 'Use a shopping list and stick to it']
      });
    }

    if (savingsRate < 10 && avgIncome > 0) {
      recs.push({ 
        id: 3, type: 'alert', priority: 'high',
        title: 'Savings Rate Low', 
        description: `Only saving ${savingsRate.toFixed(1)}% of income. Aim for at least 20% for financial security.`, 
        potential: avgIncome * 0.1 - stats.saved,
        icon: '⚠️',
        tips: ['Set up automatic transfer to savings on payday', 'Start with just $25-50 per paycheck', 'Build a 3-month emergency fund first']
      });
    } else if (savingsRate >= 20) {
      recs.push({ 
        id: 4, type: 'success', priority: 'low',
        title: 'Great Savings Rate!', 
        description: `Saving ${savingsRate.toFixed(1)}% of income - above the recommended 20%!`, 
        potential: 0,
        icon: '🏆',
        tips: ['Consider maxing retirement accounts', 'Look into index fund investing', 'Keep up the excellent work!']
      });
    }

    if (stats.unpaidCount > 3) {
      recs.push({ 
        id: 6, type: 'alert', priority: 'high',
        title: 'Manage Unpaid Bills', 
        description: `You have ${stats.unpaidCount} unpaid expenses this month. Stay on top of due dates to avoid late fees.`, 
        potential: 0,
        icon: '📋',
        tips: ['Set calendar reminders for due dates', 'Enable autopay for fixed bills', 'Review bills weekly, not monthly']
      });
    }

    return recs.sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]));
  }, [catBreakdown, stats]);

  // Transaction operations
  const addTx = (tx) => { setTransactions([...transactions, { ...tx, id: uid() }]); setModal(null); };
  const updateTx = (tx) => { setTransactions(transactions.map(t => t.id === tx.id ? tx : t)); setEditTx(null); };
  const deleteTx = (id) => setTransactions(transactions.filter(t => t.id !== id));
  const togglePaid = (id) => setTransactions(transactions.map(t => t.id === id ? { ...t, paid: !t.paid } : t));

  const addRecurring = (r) => { setRecurringExpenses([...recurringExpenses, { ...r, id: uid(), active: true }]); setModal(null); };
  const updateRecurring = (r) => { setRecurringExpenses(recurringExpenses.map(e => e.id === r.id ? r : e)); setEditRecurring(null); };
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

  // Export CSV
  const exportCSV = () => {
    const rows = [
      ['Date', 'Description', 'Amount', 'Category', 'Status']
    ];
    const sortedTx = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    sortedTx.forEach(t => {
      const cat = CATEGORIES.find(c => c.id === t.category);
      rows.push([t.date, `"${t.desc}"`, t.amount.toFixed(2), cat?.name || t.category, t.paid ? 'Paid' : 'Unpaid']);
    });
    const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); 
    a.href = URL.createObjectURL(blob); 
    a.download = `balance-books-export-${new Date().toISOString().split('T')[0]}.csv`; 
    a.click();
  };

  // Bank connection (demo)
  const connectBank = () => { 
    setPlaidLoading(true); 
    setTimeout(() => { 
      setLinkedAccounts([{ 
        id: uid(), 
        institution: 'USAA', 
        accounts: [
          { id: '1', name: 'Checking', mask: '4523', subtype: 'checking' }, 
          { id: '2', name: 'Savings', mask: '7891', subtype: 'savings' }
        ] 
      }]); 
      setTransactions(p => p.map(t => ({ ...t, paid: true }))); 
      setPlaidLoading(false); 
      setModal(null);
      setView('accounts');
    }, 2500); 
  };

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Navigation items grouped
  const navSections = [
    { section: 'Overview', items: [
      { id: 'dashboard', icon: '📊', label: 'Dashboard' },
      { id: 'transactions', icon: '💳', label: 'Transactions', badge: stats.unpaidCount || null },
    ]},
    { section: 'Planning', items: [
      { id: 'budget', icon: '🎯', label: 'Budget Goals' },
      { id: 'analytics', icon: '📈', label: 'Analytics' },
      { id: 'debts', icon: '💳', label: 'Debt Payoff', badge: debts.length || null },
    ]},
    { section: 'Automation', items: [
      { id: 'recurring', icon: '🔄', label: 'Recurring', badge: recurringExpenses.filter(r => r.active).length || null },
      { id: 'accounts', icon: '🏦', label: 'Accounts', badge: linkedAccounts.length || null },
      { id: 'cycle', icon: '📅', label: '12-Month Cycle' },
    ]},
    { section: 'Insights', items: [
      { id: 'savings', icon: '🐷', label: 'Savings' },
      { id: 'tips', icon: '💡', label: 'Smart Tips', badge: savingsRecommendations.filter(r => r.priority === 'high').length || null },
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
              <span style={{ fontSize: '11px', color: theme.textMuted, fontWeight: '500' }}>Pro • v1.9.0</span>
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
              gap: '8px',
              marginBottom: '8px'
            }}
          >
            🔗 Connect Bank
          </button>
          
          <button 
            onClick={() => setModal('import')}
            style={{
              width: '100%',
              padding: '12px',
              background: 'transparent',
              color: theme.text,
              border: `2px solid ${theme.border}`,
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
            📤 Import Data
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 90
          }}
        />
      )}

      {/* ============ MAIN CONTENT ============ */}
      <main style={{ 
        marginLeft: !isMobile && sidebarOpen ? '260px' : '0', 
        minHeight: '100vh', 
        transition: 'margin-left 300ms ease',
        width: !isMobile && sidebarOpen ? 'calc(100% - 260px)' : '100%'
      }}>
        
        {/* ============ HEADER ============ */}
        <header style={{
          background: theme.headerBg,
          padding: '20px 28px 28px',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}>
          {/* Top Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '18px'
                }}
              >
                ☰
              </button>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginBottom: '2px' }}>{getGreeting()}, Stan</div>
                <div style={{ color: 'white', fontSize: '22px', fontWeight: '700', textTransform: 'capitalize' }}>{view === 'tips' ? 'Smart Tips' : view}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Search */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '8px 14px',
                gap: '8px'
              }}>
                <span style={{ fontSize: '14px' }}>🔍</span>
                <input 
                  type="text" 
                  placeholder="Search..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    outline: 'none',
                    width: '140px',
                    fontSize: '13px'
                  }}
                />
              </div>
              
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
                >
                  ◀
                </button>
                <span style={{ color: 'white', fontWeight: '600', padding: '0 10px', fontSize: '13px' }}>{MONTHS[month]} {year}</span>
                <button 
                  onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }}
                  style={{ background: 'transparent', border: 'none', color: 'white', padding: '6px 10px', cursor: 'pointer', fontSize: '12px' }}
                >
                  ▶
                </button>
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
                <span style={{ fontWeight: '700' }}>+</span> Add
              </button>
            </div>
          </div>

          {/* Balance Stats in Header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {[
              { label: 'Beginning', value: currency(stats.beginning), color: 'white' },
              { label: 'Income', value: '+' + currency(stats.income), color: '#4ade80', sub: stats.income > 0 ? '↑' : '' },
              { label: 'Expenses', value: '-' + currency(stats.expenses), color: '#fca5a5', sub: stats.expenses > 0 ? '' : '' },
              { label: 'Balance', value: currency(stats.ending), color: stats.net >= 0 ? '#4ade80' : '#fca5a5', sub: (stats.net >= 0 ? '+' : '') + currency(stats.net) },
            ].map((stat, i) => (
              <div 
                key={i} 
                onClick={() => i === 0 ? setModal('edit-beginning') : i === 3 ? setModal('edit-ending') : null}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '2px solid rgba(255,255,255,0.15)',
                  cursor: i === 0 || i === 3 ? 'pointer' : 'default'
                }}
              >
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginBottom: '6px' }}>{stat.label}</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: stat.color }}>{stat.value}</div>
                {stat.sub && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{stat.sub}</div>}
              </div>
            ))}
          </div>
        </header>

        {/* ============ CONTENT AREA ============ */}
        <div style={{ padding: '24px 28px' }}>
          
          {/* Dashboard View */}
          {view === 'dashboard' && (
            <>
              {/* Quick Actions */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
                {[
                  { icon: '💵', title: 'Add Income', action: () => setModal('add-income') },
                  { icon: '🛒', title: 'Add Expense', action: () => setModal('add') },
                  { icon: '🔄', title: 'Recurring', action: () => setView('recurring') },
                  { icon: '🎯', title: 'Set Budget', action: () => setView('budget') },
                ].map((item, i) => (
                  <div 
                    key={i} 
                    onClick={item.action}
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
                      {item.icon}
                    </div>
                    <span style={{ fontWeight: '600', fontSize: '13px', color: theme.text }}>{item.title}</span>
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
                    >
                      View All →
                    </span>
                  </div>
                  
                  <div>
                    {monthTx.length === 0 ? (
                      <div style={{ padding: '40px 20px', textAlign: 'center', color: theme.textMuted }}>
                        <div style={{ fontSize: '32px', marginBottom: '12px' }}>📝</div>
                        <p style={{ margin: 0 }}>No transactions this month</p>
                        <button 
                          onClick={() => setModal('add')}
                          style={{
                            marginTop: '12px',
                            padding: '8px 16px',
                            background: theme.accent,
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Add Transaction
                        </button>
                      </div>
                    ) : monthTx.slice(0, 6).map((tx, i) => {
                      const cat = CATEGORIES.find(c => c.id === tx.category);
                      return (
                        <div key={tx.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '12px 20px',
                          borderBottom: i < Math.min(monthTx.length, 6) - 1 ? `1px solid ${theme.borderLight}` : 'none',
                          transition: 'background 150ms ease',
                          cursor: 'pointer'
                        }}>
                          {/* Checkbox */}
                          <div 
                            onClick={(e) => { e.stopPropagation(); togglePaid(tx.id); }}
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
                          
                          {/* Icon */}
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
                          
                          {/* Info */}
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
                          
                          {/* Amount */}
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
                      <span style={{ fontSize: '16px', fontWeight: '700' }}>{savingsGoal > 0 ? Math.round((stats.saved / savingsGoal) * 100) : 0}%</span>
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: '700', marginBottom: '4px' }}>{currency(stats.saved)}</div>
                    <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '14px' }}>of {currency(savingsGoal)} goal</div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.3)', borderRadius: '4px', overflow: 'hidden', marginBottom: '10px' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, savingsGoal > 0 ? (stats.saved / savingsGoal) * 100 : 0)}%`, background: 'white', borderRadius: '4px' }} />
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
                      <span 
                        onClick={() => setView('recurring')}
                        style={{ color: theme.accent, fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}
                      >
                        Manage →
                      </span>
                    </div>
                    
                    <div style={{ padding: '6px 18px 12px' }}>
                      {upcomingBills.length === 0 ? (
                        <div style={{ padding: '20px 0', textAlign: 'center', color: theme.textMuted }}>
                          <div style={{ fontSize: '24px', marginBottom: '8px' }}>✨</div>
                          <p style={{ margin: 0, fontSize: '13px' }}>No bills due soon</p>
                        </div>
                      ) : upcomingBills.slice(0, 3).map((bill, i) => {
                        const cat = CATEGORIES.find(c => c.id === bill.category);
                        const urgent = bill.daysUntil <= 1;
                        const soon = bill.daysUntil <= 3;
                        return (
                          <div key={bill.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '10px 0',
                            borderBottom: i < Math.min(upcomingBills.length, 3) - 1 ? `1px solid ${theme.borderLight}` : 'none'
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
                              {cat?.icon || '📄'}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '13px', fontWeight: '500', color: theme.text }}>{bill.name}</div>
                              <div style={{ 
                                fontSize: '11px', 
                                fontWeight: urgent ? '600' : '500',
                                color: urgent ? theme.danger : soon ? theme.warning : theme.textMuted
                              }}>
                                {bill.daysUntil === 0 ? 'Due today' : bill.daysUntil === 1 ? 'Due tomorrow' : `Due in ${bill.daysUntil} days`}
                              </div>
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: theme.text }}>
                              {currency(bill.amount)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Smart Insights Widget */}
                  {savingsRecommendations.length > 0 && (
                    <div 
                      onClick={() => setView('tips')}
                      style={{
                        background: theme.insightsGradient,
                        borderRadius: '12px',
                        padding: '18px',
                        color: 'white',
                        border: '2px solid rgba(255,255,255,0.2)',
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                        cursor: 'pointer',
                        transition: 'transform 150ms ease, box-shadow 150ms ease'
                      }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '14px', opacity: 0.9, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>💡 Insights</span>
                        <span style={{ fontSize: '11px', opacity: 0.7 }}>{savingsRecommendations.length} tips →</span>
                      </div>
                      
                      {savingsRecommendations.slice(0, 2).map((rec, i) => (
                        <div key={rec.id} style={{
                          background: 'rgba(255,255,255,0.12)',
                          borderRadius: '8px',
                          padding: '12px',
                          marginBottom: i < Math.min(savingsRecommendations.length, 2) - 1 ? '8px' : 0
                        }}>
                          <p style={{ margin: '0 0 4px 0', fontSize: '12px', lineHeight: 1.5 }}>
                            {rec.icon} {rec.title}
                          </p>
                          {rec.potential > 0 && (
                            <span style={{ fontSize: '11px', color: '#fde047', fontWeight: '500' }}>
                              Save {currency(rec.potential)}/mo
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Transactions View */}
          {view === 'transactions' && (
            <div>
              {/* Filters */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <select 
                  value={filterCat} 
                  onChange={(e) => setFilterCat(e.target.value)}
                  style={{
                    padding: '10px 16px',
                    background: theme.bgCard,
                    border: theme.cardBorder,
                    borderRadius: '8px',
                    color: theme.text,
                    fontSize: '13px',
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
                    padding: '10px 16px',
                    background: theme.bgCard,
                    border: theme.cardBorder,
                    borderRadius: '8px',
                    color: theme.text,
                    fontSize: '13px',
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
                {filtered.length === 0 ? (
                  <div style={{ padding: '60px 20px', textAlign: 'center', color: theme.textMuted }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                    <h3 style={{ margin: '0 0 8px 0', color: theme.text }}>No transactions found</h3>
                    <p style={{ margin: 0 }}>Add your first transaction to get started</p>
                  </div>
                ) : filtered.slice(0, 50).map((tx, i) => {
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
                        {tx.paid && <span style={{ color: 'white', fontSize: '11px' }}>✓</span>}
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
                        <div style={{ fontSize: '12px', color: theme.textMuted }}>
                          {shortDate(tx.date)} • {cat?.name || 'Other'}
                        </div>
                      </div>
                      
                      <div style={{
                        fontSize: '15px',
                        fontWeight: '600',
                        color: tx.amount > 0 ? theme.success : theme.text,
                        marginRight: '16px'
                      }}>
                        {tx.amount > 0 ? '+' : ''}{currency(tx.amount)}
                      </div>
                      
                      <button 
                        onClick={() => setEditTx(tx)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: theme.textMuted,
                          cursor: 'pointer',
                          padding: '8px',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => deleteTx(tx.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: theme.danger,
                          cursor: 'pointer',
                          padding: '8px',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recurring View */}
          {view === 'recurring' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: theme.text }}>Monthly Recurring: {currency(totalMonthlyRecurring)}</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: theme.textMuted }}>{recurringExpenses.filter(r => r.active).length} active bills</p>
                </div>
                <button 
                  onClick={() => setModal('add-recurring')}
                  style={{
                    padding: '10px 20px',
                    background: theme.accent,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  + Add Recurring
                </button>
              </div>
              
              <div style={{
                background: theme.bgCard,
                borderRadius: '12px',
                border: theme.cardBorder,
                boxShadow: theme.cardShadow,
                overflow: 'hidden'
              }}>
                {recurringExpenses.length === 0 ? (
                  <div style={{ padding: '60px 20px', textAlign: 'center', color: theme.textMuted }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
                    <h3 style={{ margin: '0 0 8px 0', color: theme.text }}>No recurring expenses</h3>
                    <p style={{ margin: 0 }}>Add bills that repeat monthly</p>
                  </div>
                ) : recurringExpenses.map((r, i) => {
                  const cat = CATEGORIES.find(c => c.id === r.category);
                  return (
                    <div key={r.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '14px 20px',
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
                          cursor: 'pointer',
                          flexShrink: 0
                        }}
                      >
                        {r.active && <span style={{ color: 'white', fontSize: '11px' }}>✓</span>}
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
                        {cat?.icon || '📄'}
                      </div>
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: theme.text, marginBottom: '2px' }}>{r.name}</div>
                        <div style={{ fontSize: '12px', color: theme.textMuted }}>
                          Due day {r.dueDay} • {r.autoPay ? '✓ Auto-pay' : 'Manual'}
                        </div>
                      </div>
                      
                      <div style={{
                        fontSize: '15px',
                        fontWeight: '600',
                        color: theme.text,
                        marginRight: '16px'
                      }}>
                        {currency(r.amount)}
                      </div>
                      
                      <button 
                        onClick={() => createFromRecurring(r)}
                        style={{
                          background: theme.successBg,
                          border: 'none',
                          color: theme.success,
                          cursor: 'pointer',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          marginRight: '8px'
                        }}
                      >
                        + Pay Now
                      </button>
                      <button 
                        onClick={() => setEditRecurring(r)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: theme.textMuted,
                          cursor: 'pointer',
                          padding: '8px',
                          fontSize: '14px'
                        }}
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => deleteRecurring(r.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: theme.danger,
                          cursor: 'pointer',
                          padding: '8px',
                          fontSize: '14px'
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Accounts View */}
          {view === 'accounts' && (
            <div>
              <div style={{
                background: theme.bgCard,
                borderRadius: '12px',
                border: theme.cardBorder,
                boxShadow: theme.cardShadow,
                padding: '24px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: theme.navActive,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px'
                  }}>
                    🔒
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: theme.text }}>Secure Bank Connection</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: theme.textMuted }}>Auto-mark transactions as paid when cleared</p>
                  </div>
                </div>
              </div>
              
              {linkedAccounts.length > 0 ? linkedAccounts.map(acc => (
                <div key={acc.id} style={{
                  background: theme.bgCard,
                  borderRadius: '12px',
                  border: theme.cardBorder,
                  boxShadow: theme.cardShadow,
                  padding: '20px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '10px',
                        background: theme.navActive,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '18px',
                        fontWeight: '700'
                      }}>
                        {acc.institution.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: theme.text }}>{acc.institution}</div>
                        <div style={{ fontSize: '12px', color: theme.success }}>✓ Connected</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setLinkedAccounts([])}
                      style={{
                        background: theme.dangerBg,
                        border: 'none',
                        color: theme.danger,
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Disconnect
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    {acc.accounts.map(a => (
                      <div key={a.id} style={{
                        padding: '14px',
                        background: theme.bgHover,
                        borderRadius: '8px'
                      }}>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: theme.text, textTransform: 'capitalize' }}>{a.subtype}</div>
                        <div style={{ fontSize: '12px', color: theme.textMuted }}>••••{a.mask}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )) : (
                <div style={{
                  background: theme.bgCard,
                  borderRadius: '12px',
                  border: theme.cardBorder,
                  boxShadow: theme.cardShadow,
                  padding: '60px 20px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏦</div>
                  <h3 style={{ margin: '0 0 8px 0', color: theme.text }}>No Banks Connected</h3>
                  <p style={{ margin: '0 0 20px 0', color: theme.textMuted }}>Connect your bank to auto-track payments</p>
                  <button 
                    onClick={() => setModal('connect')}
                    style={{
                      padding: '12px 24px',
                      background: theme.accent,
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    🔗 Connect Bank
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Savings View */}
          {view === 'savings' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div style={{
                  background: theme.savingsGradient,
                  borderRadius: '12px',
                  padding: '24px',
                  color: 'white'
                }}>
                  <div style={{ fontSize: '13px', opacity: 0.8, marginBottom: '8px' }}>This Month</div>
                  <div style={{ fontSize: '32px', fontWeight: '700' }}>{currency(stats.saved)}</div>
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.3)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, savingsGoal > 0 ? (stats.saved / savingsGoal) * 100 : 0)}%`, background: 'white', borderRadius: '4px' }} />
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>{Math.min(100, savingsGoal > 0 ? Math.round((stats.saved / savingsGoal) * 100) : 0)}% of goal</div>
                  </div>
                </div>
                
                <div style={{
                  background: theme.bgCard,
                  borderRadius: '12px',
                  border: theme.cardBorder,
                  boxShadow: theme.cardShadow,
                  padding: '24px'
                }}>
                  <div style={{ fontSize: '13px', color: theme.textMuted, marginBottom: '8px' }}>Year to Date</div>
                  <div style={{ fontSize: '32px', fontWeight: '700', color: theme.success }}>
                    {currency(transactions.filter(t => t.category === 'savings' && new Date(t.date).getFullYear() === year).reduce((s, t) => s + Math.abs(t.amount), 0))}
                  </div>
                </div>
                
                <div 
                  onClick={() => setModal('edit-goal')}
                  style={{
                    background: theme.bgCard,
                    borderRadius: '12px',
                    border: theme.cardBorder,
                    boxShadow: theme.cardShadow,
                    padding: '24px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: '13px', color: theme.textMuted, marginBottom: '8px' }}>Monthly Goal</div>
                  <div style={{ fontSize: '32px', fontWeight: '700', color: theme.accent }}>{currency(savingsGoal)}</div>
                  <div style={{ fontSize: '12px', color: theme.textMuted, marginTop: '8px' }}>Click to edit →</div>
                </div>
              </div>
            </div>
          )}

          {/* Smart Tips View */}
          {view === 'tips' && (
            <div>
              <div style={{
                background: theme.insightsGradient,
                borderRadius: '12px',
                padding: '24px',
                color: 'white',
                marginBottom: '24px'
              }}>
                <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>💡 Smart Money Tips</div>
                <p style={{ margin: 0, opacity: 0.9 }}>Personalized recommendations based on your spending</p>
              </div>
              
              {savingsRecommendations.length === 0 ? (
                <div style={{
                  background: theme.bgCard,
                  borderRadius: '12px',
                  border: theme.cardBorder,
                  boxShadow: theme.cardShadow,
                  padding: '60px 20px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>✨</div>
                  <h3 style={{ margin: '0 0 8px 0', color: theme.text }}>You're Doing Great!</h3>
                  <p style={{ margin: 0, color: theme.textMuted }}>No recommendations at this time</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                  {savingsRecommendations.map(rec => (
                    <div key={rec.id} style={{
                      background: theme.bgCard,
                      borderRadius: '12px',
                      border: theme.cardBorder,
                      boxShadow: theme.cardShadow,
                      padding: '20px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '12px',
                          background: rec.type === 'success' ? theme.successBg : rec.type === 'alert' ? theme.dangerBg : theme.warningBg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px',
                          flexShrink: 0
                        }}>
                          {rec.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: theme.text }}>{rec.title}</h4>
                            {rec.priority === 'high' && rec.type !== 'success' && (
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '10px',
                                fontSize: '10px',
                                fontWeight: '600',
                                background: theme.warningBg,
                                color: theme.warning
                              }}>
                                High Priority
                              </span>
                            )}
                          </div>
                          <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: theme.textSecondary }}>{rec.description}</p>
                          
                          {rec.potential > 0 && (
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 12px',
                              background: theme.successBg,
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              color: theme.success,
                              marginBottom: '12px'
                            }}>
                              💰 Save up to {currency(rec.potential)}/mo
                            </div>
                          )}
                          
                          {/* Action Tips */}
                          {rec.tips && rec.tips.length > 0 && (
                            <div style={{
                              background: theme.bgHover,
                              borderRadius: '8px',
                              padding: '12px',
                              marginTop: rec.potential > 0 ? '0' : '0'
                            }}>
                              <div style={{ fontSize: '12px', fontWeight: '600', color: theme.text, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                ✨ Action Steps
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {rec.tips.map((tip, ti) => (
                                  <div key={ti} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                    <span style={{
                                      width: '18px',
                                      height: '18px',
                                      borderRadius: '50%',
                                      background: theme.accent,
                                      color: 'white',
                                      fontSize: '10px',
                                      fontWeight: '600',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0
                                    }}>
                                      {ti + 1}
                                    </span>
                                    <span style={{ fontSize: '12px', color: theme.textSecondary, lineHeight: 1.4 }}>{tip}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                marginBottom: '16px'
              }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '600', color: theme.text }}>💰 Balance Settings</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: theme.textSecondary, marginBottom: '8px' }}>Beginning Balance</label>
                    <input 
                      type="number" 
                      value={stats.beginning}
                      onChange={(e) => setBeginningBalance(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: theme.bgHover,
                        border: `2px solid ${theme.border}`,
                        borderRadius: '8px',
                        color: theme.text,
                        fontSize: '16px',
                        fontWeight: '600'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: theme.textSecondary, marginBottom: '8px' }}>Ending Balance Override</label>
                    <input 
                      type="number" 
                      value={stats.ending}
                      onChange={(e) => setEndingBalance(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: theme.bgHover,
                        border: `2px solid ${theme.border}`,
                        borderRadius: '8px',
                        color: theme.text,
                        fontSize: '16px',
                        fontWeight: '600'
                      }}
                    />
                    <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: theme.textMuted }}>Calculated: {currency(stats.calculatedEnding)}</p>
                  </div>
                </div>
              </div>
              
              <div style={{
                background: theme.bgCard,
                borderRadius: '12px',
                border: theme.cardBorder,
                boxShadow: theme.cardShadow,
                padding: '24px',
                marginBottom: '16px'
              }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '600', color: theme.text }}>🎯 Savings Goal</h3>
                <input 
                  type="number" 
                  value={savingsGoal}
                  onChange={(e) => setSavingsGoal(parseFloat(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: theme.bgHover,
                    border: `2px solid ${theme.border}`,
                    borderRadius: '8px',
                    color: theme.text,
                    fontSize: '16px',
                    fontWeight: '600'
                  }}
                />
              </div>
              
              <div style={{
                background: theme.bgCard,
                borderRadius: '12px',
                border: theme.cardBorder,
                boxShadow: theme.cardShadow,
                padding: '24px',
                marginBottom: '16px'
              }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '600', color: theme.text }}>💾 Data Management</h3>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => {
                      const data = {
                        version: '1.9.0',
                        exportDate: new Date().toISOString(),
                        transactions,
                        recurringExpenses,
                        monthlyBalances,
                        savingsGoal,
                        budgetGoals,
                        debts
                      };
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                      const a = document.createElement('a');
                      a.href = URL.createObjectURL(blob);
                      a.download = `balance-books-backup-${new Date().toISOString().split('T')[0]}.json`;
                      a.click();
                    }}
                    style={{
                      padding: '12px 20px',
                      background: theme.accent,
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    📥 Backup Data
                  </button>
                  <button 
                    onClick={exportCSV}
                    style={{
                      padding: '12px 20px',
                      background: 'transparent',
                      color: theme.text,
                      border: `2px solid ${theme.border}`,
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    📊 Export CSV
                  </button>
                </div>
              </div>
              
              <div style={{
                background: theme.bgCard,
                borderRadius: '12px',
                border: `2px solid ${theme.danger}40`,
                boxShadow: theme.cardShadow,
                padding: '24px'
              }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '600', color: theme.danger }}>⚠️ Danger Zone</h3>
                <button 
                  onClick={() => { 
                    if (confirm('Delete ALL data? This cannot be undone!')) { 
                      setTransactions([]); 
                      setRecurringExpenses([]); 
                      setMonthlyBalances({}); 
                      setSavingsGoal(500);
                      setBudgetGoals({});
                      setDebts([]);
                      localStorage.clear(); 
                    }
                  }}
                  style={{
                    padding: '12px 20px',
                    background: theme.dangerBg,
                    color: theme.danger,
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  🗑️ Reset All Data
                </button>
              </div>
              
              <div style={{ marginTop: '24px', textAlign: 'center', color: theme.textMuted, fontSize: '12px' }}>
                <p>BalanceBooks Pro v1.9.0</p>
                <p>{isElectron ? 'Desktop' : 'Web'} • Data stored locally</p>
              </div>
            </div>
          )}

          {/* Budget, Analytics, Debts, Cycle views - placeholder */}
          {(view === 'budget' || view === 'analytics' || view === 'debts' || view === 'cycle') && (
            <div style={{
              background: theme.bgCard,
              borderRadius: '12px',
              border: theme.cardBorder,
              boxShadow: theme.cardShadow,
              padding: '60px 20px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚧</div>
              <h3 style={{ margin: '0 0 8px 0', color: theme.text }}>Coming Soon</h3>
              <p style={{ margin: 0, color: theme.textMuted }}>This feature is under development</p>
            </div>
          )}
        </div>
      </main>

      {/* ============ MODALS ============ */}
      
      {/* Add Transaction Modal */}
      {modal === 'add' && (
        <Modal title="Add Transaction" theme={theme} onClose={() => setModal(null)}>
          <TxForm theme={theme} onSubmit={addTx} onCancel={() => setModal(null)} showPaid />
        </Modal>
      )}
      
      {/* Add Income Modal */}
      {modal === 'add-income' && (
        <Modal title="Add Income" theme={theme} onClose={() => setModal(null)}>
          <TxForm theme={theme} onSubmit={addTx} onCancel={() => setModal(null)} showPaid defaultType="income" />
        </Modal>
      )}
      
      {/* Edit Transaction Modal */}
      {editTx && (
        <Modal title="Edit Transaction" theme={theme} onClose={() => setEditTx(null)}>
          <TxForm theme={theme} tx={editTx} onSubmit={updateTx} onCancel={() => setEditTx(null)} showPaid />
        </Modal>
      )}
      
      {/* Add Recurring Modal */}
      {modal === 'add-recurring' && (
        <Modal title="Add Recurring Expense" theme={theme} onClose={() => setModal(null)}>
          <RecurringForm theme={theme} onSubmit={addRecurring} onCancel={() => setModal(null)} />
        </Modal>
      )}
      
      {/* Edit Recurring Modal */}
      {editRecurring && (
        <Modal title="Edit Recurring Expense" theme={theme} onClose={() => setEditRecurring(null)}>
          <RecurringForm theme={theme} recurring={editRecurring} onSubmit={updateRecurring} onCancel={() => setEditRecurring(null)} />
        </Modal>
      )}
      
      {/* Edit Goal Modal */}
      {modal === 'edit-goal' && (
        <Modal title="Edit Savings Goal" theme={theme} onClose={() => setModal(null)}>
          <div style={{ padding: '0' }}>
            <p style={{ margin: '0 0 16px 0', color: theme.textSecondary, fontSize: '13px' }}>Set your monthly savings target</p>
            <input 
              type="number" 
              defaultValue={savingsGoal}
              onChange={(e) => setSavingsGoal(parseFloat(e.target.value) || 0)}
              style={{
                width: '100%',
                padding: '14px',
                background: theme.bgHover,
                border: `2px solid ${theme.border}`,
                borderRadius: '8px',
                color: theme.text,
                fontSize: '20px',
                fontWeight: '700',
                marginBottom: '16px'
              }}
            />
            <button 
              onClick={() => setModal(null)}
              style={{
                width: '100%',
                padding: '14px',
                background: theme.accent,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Save Goal
            </button>
          </div>
        </Modal>
      )}
      
      {/* Edit Beginning Balance Modal */}
      {modal === 'edit-beginning' && (
        <Modal title="Edit Beginning Balance" theme={theme} onClose={() => setModal(null)}>
          <div style={{ padding: '0' }}>
            <p style={{ margin: '0 0 16px 0', color: theme.textSecondary, fontSize: '13px' }}>Set the starting balance for {FULL_MONTHS[month]} {year}</p>
            <input 
              type="number" 
              defaultValue={stats.beginning}
              onChange={(e) => setBeginningBalance(e.target.value)}
              style={{
                width: '100%',
                padding: '14px',
                background: theme.bgHover,
                border: `2px solid ${theme.border}`,
                borderRadius: '8px',
                color: theme.text,
                fontSize: '20px',
                fontWeight: '700',
                marginBottom: '16px'
              }}
            />
            <button 
              onClick={() => setModal(null)}
              style={{
                width: '100%',
                padding: '14px',
                background: theme.accent,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Save
            </button>
          </div>
        </Modal>
      )}
      
      {/* Edit Ending Balance Modal */}
      {modal === 'edit-ending' && (
        <Modal title="Edit Ending Balance" theme={theme} onClose={() => setModal(null)}>
          <div style={{ padding: '0' }}>
            <p style={{ margin: '0 0 16px 0', color: theme.textSecondary, fontSize: '13px' }}>Override the ending balance for {FULL_MONTHS[month]} {year}</p>
            <input 
              type="number" 
              defaultValue={stats.ending}
              onChange={(e) => setEndingBalance(e.target.value)}
              style={{
                width: '100%',
                padding: '14px',
                background: theme.bgHover,
                border: `2px solid ${theme.border}`,
                borderRadius: '8px',
                color: theme.text,
                fontSize: '20px',
                fontWeight: '700',
                marginBottom: '8px'
              }}
            />
            <p style={{ margin: '0 0 16px 0', color: theme.textMuted, fontSize: '11px' }}>Calculated: {currency(stats.calculatedEnding)}</p>
            <button 
              onClick={() => setModal(null)}
              style={{
                width: '100%',
                padding: '14px',
                background: theme.accent,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Save
            </button>
          </div>
        </Modal>
      )}
      
      {/* Connect Bank Modal */}
      {modal === 'connect' && (
        <Modal title="Connect Bank" theme={theme} onClose={() => setModal(null)}>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: theme.navActive,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              margin: '0 auto 16px'
            }}>
              🏦
            </div>
            <h3 style={{ margin: '0 0 8px 0', color: theme.text }}>Secure Bank Connection</h3>
            <p style={{ margin: '0 0 24px 0', color: theme.textSecondary, fontSize: '13px' }}>Connect your bank to automatically track when bills are paid</p>
            
            <div style={{
              background: theme.bgHover,
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px',
              textAlign: 'left'
            }}>
              <p style={{ margin: '0 0 8px 0', color: theme.text, fontSize: '13px', fontWeight: '600' }}>🔒 What we access:</p>
              <ul style={{ margin: 0, padding: '0 0 0 20px', color: theme.textSecondary, fontSize: '12px' }}>
                <li>Transaction history</li>
                <li>Account balances</li>
                <li>Account names</li>
              </ul>
            </div>
            
            <div style={{
              background: theme.warningBg,
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px'
            }}>
              <p style={{ margin: 0, color: theme.warning, fontSize: '12px' }}>
                <strong>Demo Mode:</strong> This will simulate a connection
              </p>
            </div>
            
            <button 
              onClick={connectBank}
              disabled={plaidLoading}
              style={{
                width: '100%',
                padding: '14px',
                background: theme.accent,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: plaidLoading ? 'not-allowed' : 'pointer',
                opacity: plaidLoading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {plaidLoading ? '⏳ Connecting...' : '🔗 Connect Demo Bank'}
            </button>
          </div>
        </Modal>
      )}
      
      {/* Import Modal */}
      {modal === 'import' && (
        <Modal title="Import Data" theme={theme} onClose={() => setModal(null)}>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: theme.navActive,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              margin: '0 auto 16px'
            }}>
              📤
            </div>
            <h3 style={{ margin: '0 0 8px 0', color: theme.text }}>Import Transactions</h3>
            <p style={{ margin: '0 0 24px 0', color: theme.textSecondary, fontSize: '13px' }}>Import from CSV or restore from backup</p>
            
            <input 
              type="file" 
              accept=".csv,.json"
              style={{ display: 'none' }}
              id="import-file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  alert('Import functionality ready for: ' + file.name);
                }
              }}
            />
            
            <button 
              onClick={() => document.getElementById('import-file')?.click()}
              style={{
                width: '100%',
                padding: '14px',
                background: theme.accent,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: '12px'
              }}
            >
              📁 Select File
            </button>
            
            <button 
              onClick={() => setModal(null)}
              style={{
                width: '100%',
                padding: '14px',
                background: 'transparent',
                color: theme.text,
                border: `2px solid ${theme.border}`,
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </Modal>
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
            background: theme.accent,
            color: 'white',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(20, 184, 166, 0.4)',
            zIndex: 50
          }}
        >
          +
        </button>
      )}
    </div>
  );
}

// ============ COMPONENTS ============

function Modal({ title, theme, onClose, children }) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      padding: '20px'
    }}>
      <div style={{
        background: theme.bgCard,
        borderRadius: '16px',
        width: '100%',
        maxWidth: '440px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          borderBottom: `1px solid ${theme.border}`
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: theme.text }}>{title}</h2>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: theme.textMuted,
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: '24px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function TxForm({ theme, tx, onSubmit, onCancel, showPaid, defaultType }) {
  const [form, setForm] = useState({ 
    date: tx?.date || new Date().toISOString().split('T')[0], 
    desc: tx?.desc || '', 
    amount: tx ? Math.abs(tx.amount) : '', 
    type: defaultType || (tx?.amount > 0 ? 'income' : 'expense'), 
    category: tx?.category || (defaultType === 'income' ? 'income' : 'other'), 
    paid: tx?.paid || false 
  });
  
  const handle = (e) => { 
    e.preventDefault(); 
    const amt = form.type === 'income' ? Math.abs(parseFloat(form.amount)) : -Math.abs(parseFloat(form.amount)); 
    onSubmit({ ...tx, date: form.date, desc: form.desc, amount: amt, category: form.category, paid: form.paid }); 
  };
  
  const inputStyle = {
    width: '100%',
    padding: '12px',
    background: theme.bgHover,
    border: `2px solid ${theme.border}`,
    borderRadius: '8px',
    color: theme.text,
    fontSize: '14px'
  };
  
  return (
    <form onSubmit={handle}>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', color: theme.textSecondary, marginBottom: '6px' }}>Date</label>
        <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={inputStyle} required />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', color: theme.textSecondary, marginBottom: '6px' }}>Description</label>
        <input type="text" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} placeholder="Enter description" style={inputStyle} required />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', color: theme.textSecondary, marginBottom: '6px' }}>Amount</label>
        <input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" style={inputStyle} required />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', color: theme.textSecondary, marginBottom: '6px' }}>Type</label>
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, category: e.target.value === 'income' ? 'income' : form.category })} style={inputStyle}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', color: theme.textSecondary, marginBottom: '6px' }}>Category</label>
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={inputStyle}>
          {CATEGORIES.filter(c => form.type === 'income' ? c.id === 'income' : c.id !== 'income').map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
      </div>
      {showPaid && (
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: theme.bgHover, borderRadius: '8px', marginBottom: '20px', cursor: 'pointer' }}>
          <input type="checkbox" checked={form.paid} onChange={(e) => setForm({ ...form, paid: e.target.checked })} style={{ width: '18px', height: '18px' }} />
          <span style={{ color: theme.text, fontSize: '14px' }}>Mark as paid</span>
        </label>
      )}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button type="button" onClick={onCancel} style={{ flex: 1, padding: '14px', background: 'transparent', border: `2px solid ${theme.border}`, borderRadius: '8px', color: theme.text, fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
        <button type="submit" style={{ flex: 1, padding: '14px', background: theme.accent, border: 'none', borderRadius: '8px', color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>{tx ? 'Update' : 'Add'}</button>
      </div>
    </form>
  );
}

function RecurringForm({ theme, recurring, onSubmit, onCancel }) {
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
    padding: '12px',
    background: theme.bgHover,
    border: `2px solid ${theme.border}`,
    borderRadius: '8px',
    color: theme.text,
    fontSize: '14px'
  };
  
  return (
    <form onSubmit={handle}>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', color: theme.textSecondary, marginBottom: '6px' }}>Name</label>
        <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Netflix, Rent" style={inputStyle} required />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', color: theme.textSecondary, marginBottom: '6px' }}>Amount</label>
        <input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" style={inputStyle} required />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', color: theme.textSecondary, marginBottom: '6px' }}>Category</label>
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={inputStyle}>
          {CATEGORIES.filter(c => c.id !== 'income').map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', color: theme.textSecondary, marginBottom: '6px' }}>Frequency</label>
          <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} style={inputStyle}>
            {FREQUENCY_OPTIONS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', color: theme.textSecondary, marginBottom: '6px' }}>Due Day</label>
          <input type="number" min="1" max="31" value={form.dueDay} onChange={(e) => setForm({ ...form, dueDay: e.target.value })} style={inputStyle} required />
        </div>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: theme.bgHover, borderRadius: '8px', marginBottom: '20px', cursor: 'pointer' }}>
        <input type="checkbox" checked={form.autoPay} onChange={(e) => setForm({ ...form, autoPay: e.target.checked })} style={{ width: '18px', height: '18px' }} />
        <span style={{ color: theme.text, fontSize: '14px' }}>Auto-pay enabled</span>
      </label>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button type="button" onClick={onCancel} style={{ flex: 1, padding: '14px', background: 'transparent', border: `2px solid ${theme.border}`, borderRadius: '8px', color: theme.text, fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
        <button type="submit" style={{ flex: 1, padding: '14px', background: theme.accent, border: 'none', borderRadius: '8px', color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>{recurring ? 'Update' : 'Add'}</button>
      </div>
    </form>
  );
}
