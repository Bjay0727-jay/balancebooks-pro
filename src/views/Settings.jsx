import React from 'react';
import { useAppStore } from '../stores/useAppStore';
import { useFinancialData } from '../hooks/useFinancialData';
import {
  Download, Upload, Trash2, Target, Calculator, Save, FileSpreadsheet,
  Cloud, HardDrive, Bell, AlertTriangle, Check, Loader2, Unlink, Mail,
  Crown, BarChart3
} from 'lucide-react';
import { FULL_MONTHS, CATEGORIES } from '../utils/constants';
import { currency } from '../utils/formatters';

const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron;

export default function Settings() {
  const transactions = useAppStore(s => s.transactions);
  const recurringExpenses = useAppStore(s => s.recurringExpenses);
  const monthlyBalances = useAppStore(s => s.monthlyBalances);
  const savingsGoal = useAppStore(s => s.savingsGoal);
  const budgetGoals = useAppStore(s => s.budgetGoals);
  const debts = useAppStore(s => s.debts);
  const month = useAppStore(s => s.month);
  const year = useAppStore(s => s.year);
  const autoBackupEnabled = useAppStore(s => s.autoBackupEnabled);
  const lastBackupDate = useAppStore(s => s.lastBackupDate);
  const notificationsEnabled = useAppStore(s => s.notificationsEnabled);
  const dropboxConnected = useAppStore(s => s.dropboxConnected);
  const dropboxToken = useAppStore(s => s.dropboxToken);
  const dropboxSyncing = useAppStore(s => s.dropboxSyncing);
  const dropboxLastSync = useAppStore(s => s.dropboxLastSync);
  const dropboxError = useAppStore(s => s.dropboxError);

  const setTransactions = useAppStore(s => s.setTransactions);
  const setRecurringExpenses = useAppStore(s => s.setRecurringExpenses);
  const setMonthlyBalances = useAppStore(s => s.setMonthlyBalances);
  const setSavingsGoal = useAppStore(s => s.setSavingsGoal);
  const setBudgetGoals = useAppStore(s => s.setBudgetGoals);
  const setDebts = useAppStore(s => s.setDebts);
  const setAutoBackupEnabled = useAppStore(s => s.setAutoBackupEnabled);
  const setLastBackupDate = useAppStore(s => s.setLastBackupDate);
  const setNotificationsEnabled = useAppStore(s => s.setNotificationsEnabled);
  const setModal = useAppStore(s => s.setModal);
  const setDropboxSyncing = useAppStore(s => s.setDropboxSyncing);
  const setDropboxLastSync = useAppStore(s => s.setDropboxLastSync);
  const setDropboxError = useAppStore(s => s.setDropboxError);
  const setDropboxConnected = useAppStore(s => s.setDropboxConnected);
  const setDropboxToken = useAppStore(s => s.setDropboxToken);

  const setBeginningBalance = useAppStore(s => s.setBeginningBalance);
  const setEndingBalance = useAppStore(s => s.setEndingBalance);
  const disconnectDropbox = useAppStore(s => s.disconnectDropbox);

  const licenseStatus = useAppStore(s => s.licenseStatus);
  const licenseEmail = useAppStore(s => s.licenseEmail);
  const licenseExpiry = useAppStore(s => s.licenseExpiry);
  const analyticsConsent = useAppStore(s => s.analyticsConsent);
  const setAnalyticsConsent = useAppStore(s => s.setAnalyticsConsent);

  const { stats } = useFinancialData();

  // ── Dropbox OAuth ─────────────────────────────────────────────
  const connectDropbox = () => {
    // TODO: Move Dropbox OAuth logic here
    alert('Dropbox integration coming soon.');
  };

  // ── Sync to Dropbox ───────────────────────────────────────────
  const syncToDropbox = async () => {
    if (!dropboxToken) return;
    setDropboxSyncing(true);
    setDropboxError(null);
    try {
      const backup = {
        appName: 'Balance Books Pro',
        version: __APP_VERSION__,
        exportDate: new Date().toISOString(),
        data: { transactions, recurringExpenses, monthlyBalances, savingsGoal, budgetGoals, debts }
      };
      const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${dropboxToken}`,
          'Content-Type': 'application/octet-stream',
          'Dropbox-API-Arg': JSON.stringify({
            path: '/BalanceBooks/backup.json',
            mode: 'overwrite',
            autorename: false,
            mute: true
          })
        },
        body: JSON.stringify(backup, null, 2)
      });
      if (response.ok) {
        setDropboxLastSync(new Date().toISOString());
      } else if (response.status === 401) {
        disconnectDropbox();
        setDropboxError('Session expired. Please reconnect.');
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      console.error('Dropbox sync error:', err);
      setDropboxError(err.message || 'Sync failed. Please try again.');
    } finally {
      setDropboxSyncing(false);
    }
  };

  // ── Restore from Dropbox ──────────────────────────────────────
  const restoreFromDropbox = async () => {
    if (!dropboxToken) return;
    setDropboxSyncing(true);
    setDropboxError(null);
    try {
      const response = await fetch('https://content.dropboxapi.com/2/files/download', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${dropboxToken}`,
          'Dropbox-API-Arg': JSON.stringify({ path: '/BalanceBooks/backup.json' })
        }
      });
      if (response.ok) {
        const backup = await response.json();
        useAppStore.getState().setRestoreData({
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

  // ── Export CSV ────────────────────────────────────────────────
  const exportCSV = () => {
    const escapeField = (s) => {
      const str = String(s == null ? '' : s);
      const escaped = str.replace(/"/g, '""');
      if (/^[=+\-@\t\r]/.test(escaped)) return `"'${escaped}"`;
      return `"${escaped}"`;
    };

    const roundCents = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

    const rows = [
      ['Balance Books Pro - Transaction Export'],
      [`Export Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`],
      ['Report Period: All Transactions'],
      [''],
      ['Date', 'Description', 'Amount', 'Category', 'Type', 'Status', 'Notes']
    ];

    const sortedTx = [...transactions].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    sortedTx.forEach(t => {
      const cat = CATEGORIES.find(c => c.id === t.category);
      rows.push([
        t.date,
        escapeField(t.desc),
        roundCents(t.amount).toFixed(2),
        escapeField(cat ? cat.name : t.category),
        t.amount >= 0 ? 'Income' : 'Expense',
        t.paid ? 'Paid' : 'Unpaid',
        ''
      ]);
    });

    const totalIncome = roundCents(transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0));
    const totalExpenses = roundCents(transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0));
    const netAmount = roundCents(totalIncome - totalExpenses);

    rows.push(['']);
    rows.push(['SUMMARY']);
    rows.push(['Total Income', '', totalIncome.toFixed(2)]);
    rows.push(['Total Expenses', '', (-totalExpenses).toFixed(2)]);
    rows.push(['Net Amount', '', netAmount.toFixed(2)]);
    rows.push(['Total Transactions', '', transactions.length]);
    rows.push(['']);
    rows.push([`Generated by Balance Books Pro ${__APP_VERSION__}`]);

    const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `balance-books-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Download CSV Template ─────────────────────────────────────
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
    URL.revokeObjectURL(a.href);
  };

  return (
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

      {/* Premium License */}
      <div className="bg-gradient-to-r from-purple-50 via-white to-blue-50 rounded-2xl border-2 border-purple-200 shadow-sm p-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Crown size={18} className="text-purple-600" />
          Premium License
        </h3>
        {licenseStatus === 'active' ? (
          <div className="space-y-3">
            <div className="bg-green-50 rounded-xl p-4 border border-green-300 flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                <Check size={20} className="text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-green-800">Premium Active</p>
                <p className="text-sm text-green-700 mt-1">Licensed to: {licenseEmail}</p>
                {licenseExpiry && <p className="text-xs text-green-600 mt-0.5">Expires: {new Date(licenseExpiry).toLocaleDateString()}</p>}
              </div>
            </div>
            <button onClick={() => setModal('license')} className="w-full px-4 py-2.5 bg-purple-100 text-purple-700 rounded-xl font-medium hover:bg-purple-200">
              Manage License
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Upgrade to Premium to unlock unlimited transactions, cloud sync, advanced analytics, and more.
            </p>
            <button onClick={() => setModal('license')} className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:from-purple-700 hover:to-blue-700">
              Activate Premium License
            </button>
          </div>
        )}
      </div>

      {/* Analytics Preferences */}
      <div className="bg-gradient-to-r from-blue-50 via-white to-indigo-50 rounded-2xl border-2 border-blue-200 shadow-sm p-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <BarChart3 size={18} className="text-blue-600" />
          Privacy & Analytics
        </h3>
        <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <BarChart3 size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Anonymous Analytics</p>
              <p className="text-sm text-slate-500">Help improve the app with anonymous usage data</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={analyticsConsent === 'opted-in'}
              onChange={(e) => setAnalyticsConsent(e.target.checked ? 'opted-in' : 'opted-out')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        <p className="text-xs text-slate-400 mt-3 px-1">
          Only feature usage counts and error rates are collected. No financial data, names, or personal information ever leaves your device.
        </p>
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
          <p className="text-sm font-medium text-slate-700 mb-2">Your Data Summary</p>
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
                <h4 className="font-semibold text-green-800 mb-1">Save a Backup</h4>
                <p className="text-sm text-green-700 mb-3">Download a copy of all your data to your computer. You can use this to restore your data if anything goes wrong.</p>
                <button
                  onClick={() => {
                    const data = {
                      appName: 'Balance Books Pro',
                      version: __APP_VERSION__,
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
                    alert('Backup saved!\n\nYour backup file has been downloaded.\n\nTip: Keep this file somewhere safe, like:\n- Email it to yourself\n- Save to Google Drive or Dropbox\n- Copy to a USB drive');
                  }}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all"
                >
                  <Download size={18} />
                  Save Backup to Computer
                </button>
                {lastBackupDate && (
                  <p className="text-xs text-[#14b8a6] mt-2 text-center">
                    Last backup: {new Date(lastBackupDate).toLocaleDateString()} at {new Date(lastBackupDate).toLocaleTimeString()}
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
                <h4 className="font-semibold text-blue-800 mb-1">Restore from Backup</h4>
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
          <p className="text-sm font-medium text-slate-600 mb-3">Other Export Options</p>
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
              Last auto-backup: {new Date(lastBackupDate).toLocaleDateString()} at {new Date(lastBackupDate).toLocaleTimeString()}
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
                        new Notification('Notifications Enabled', { body: 'You will now receive bill reminders!' });
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

          {/* Dropbox Cloud Backup */}
          <div className={`p-4 rounded-xl border-2 ${dropboxConnected ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-slate-700 flex items-center gap-2">
                <Cloud size={16} className={dropboxConnected ? 'text-blue-600' : 'text-slate-500'} />
                Dropbox Cloud Backup
                {dropboxConnected && (
                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                    <Check size={10} /> Connected
                  </span>
                )}
              </h4>
            </div>

            {!dropboxConnected ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">Connect to Dropbox to automatically backup your data to the cloud.</p>
                <button
                  onClick={connectDropbox}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all"
                >
                  <Cloud size={18} />
                  Connect Dropbox
                </button>
                <p className="text-xs text-slate-400 text-center">Your data stays private in your own Dropbox account</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dropboxLastSync && (
                  <p className="text-xs text-blue-600 flex items-center gap-1">
                    <Check size={12} />
                    Last synced: {new Date(dropboxLastSync).toLocaleDateString()} at {new Date(dropboxLastSync).toLocaleTimeString()}
                  </p>
                )}

                {dropboxError && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertTriangle size={12} />
                      {dropboxError}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => syncToDropbox()}
                    disabled={dropboxSyncing}
                    className="flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium shadow hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all"
                  >
                    {dropboxSyncing ? (
                      <><Loader2 size={14} className="animate-spin" /> Syncing...</>
                    ) : (
                      <><Cloud size={14} /> Sync Now</>
                    )}
                  </button>
                  <button
                    onClick={restoreFromDropbox}
                    disabled={dropboxSyncing}
                    className="flex items-center justify-center gap-2 py-2.5 bg-white text-blue-700 border-2 border-blue-300 rounded-lg font-medium hover:bg-blue-50 disabled:opacity-50 transition-all"
                  >
                    <Download size={14} /> Restore
                  </button>
                </div>

                <button
                  onClick={disconnectDropbox}
                  className="w-full flex items-center justify-center gap-1 py-2 text-slate-500 text-xs hover:text-red-600 transition-colors"
                >
                  <Unlink size={12} /> Disconnect Dropbox
                </button>
              </div>
            )}
          </div>

          {/* Other Cloud Options (Coming Soon) */}
          <div className="grid grid-cols-2 gap-2">
            <button disabled className="flex items-center justify-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 opacity-50 cursor-not-allowed">
              <HardDrive size={18} className="text-slate-600" />
              <span className="text-xs text-slate-500">Google Drive (Soon)</span>
            </button>
            <button disabled className="flex items-center justify-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 opacity-50 cursor-not-allowed">
              <Cloud size={18} className="text-slate-600" />
              <span className="text-xs text-slate-500">OneDrive (Soon)</span>
            </button>
          </div>

          {/* Email Backup - Quick Win Feature */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border-2 border-purple-200">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                <Mail size={24} />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-purple-800 mb-1">Email Backup to Yourself</h4>
                <p className="text-sm text-purple-700 mb-3">Download your backup then email it to yourself for safekeeping in Gmail, Outlook, or any email.</p>
                <button
                  onClick={() => {
                    // Generate backup
                    const dateStr = new Date().toISOString().split('T')[0];
                    const backup = {
                      appName: 'BalanceBooks Pro',
                      version: __APP_VERSION__,
                      exportDate: new Date().toISOString(),
                      summary: {
                        transactions: transactions.length,
                        recurringBills: recurringExpenses.length,
                        debts: debts.length
                      },
                      data: { transactions, recurringExpenses, monthlyBalances, savingsGoal, budgetGoals, debts }
                    };

                    // Download the backup file
                    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = `BalanceBooks-Backup-${dateStr}.json`;
                    a.click();
                    URL.revokeObjectURL(a.href);

                    // Open email client with pre-filled message
                    const subject = encodeURIComponent(`BalanceBooks Backup - ${dateStr}`);
                    const body = encodeURIComponent(
                      `BalanceBooks Pro Backup\n` +
                      `========================\n\n` +
                      `Date: ${new Date().toLocaleDateString()}\n` +
                      `Transactions: ${transactions.length}\n` +
                      `Recurring Bills: ${recurringExpenses.length}\n` +
                      `Debts Tracked: ${debts.length}\n\n` +
                      `IMPORTANT: Attach the downloaded backup file to this email!\n\n` +
                      `The file should be named: BalanceBooks-Backup-${dateStr}.json\n\n` +
                      `To restore: Go to Settings > Restore from Backup in BalanceBooks Pro.`
                    );

                    // Small delay to ensure download starts first
                    setTimeout(() => {
                      window.location.href = `mailto:?subject=${subject}&body=${body}`;
                    }, 500);

                    setLastBackupDate(new Date().toISOString());
                  }}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                >
                  <Mail size={18} />
                  Download & Email Backup
                </button>
                <p className="text-xs text-purple-500 mt-2 text-center">
                  Downloads file &rarr; Opens email &rarr; You attach & send!
                </p>
              </div>
            </div>
          </div>
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
              const typed = prompt('RESET EVERYTHING?\n\nThis will permanently delete ALL your data including:\n- Transactions\n- Recurring expenses\n- Monthly balances\n- Savings goal\n- Budget goals\n- Debts\n\nType DELETE to confirm:');
              if (typed === 'DELETE') {
                setTransactions([]);
                setRecurringExpenses([]);
                setMonthlyBalances({});
                setSavingsGoal(500);
                setBudgetGoals({});
                setDebts([]);
                // Only clear bb_ prefixed keys, not all localStorage
                Object.keys(localStorage).filter(k => k.startsWith('bb_')).forEach(k => localStorage.removeItem(k));
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
        <p className="text-sm text-slate-600"><span className="font-medium text-[#14b8a6]">Version:</span> {__APP_VERSION__}</p>
        <p className="text-sm text-slate-600"><span className="font-medium text-[#14b8a6]">Platform:</span> {isElectron ? 'Desktop' : 'Web'}</p>
        <p className="text-sm text-slate-600"><span className="font-medium text-purple-600">Storage:</span> Local (your data stays on your device)</p>
      </div>
    </div>
  );
}
