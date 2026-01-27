// src/db/database.js
import Dexie from 'dexie';

export const db = new Dexie('BalanceBooksDB');

db.version(1).stores({
  transactions: '++id, date, category, amount, paid',
  recurringExpenses: '++id, name, category, dueDay, active',
  debts: '++id, name, type, balance',
  monthlyBalances: 'monthKey',
  settings: 'key'
});

export async function initializeSettings() {
  const settings = await db.settings.get('user');
  if (!settings) {
    await db.settings.put({ key: 'user', savingsGoal: 500, budgetGoals: {} });
  }
}

export async function getSettings() {
  const settings = await db.settings.get('user');
  return settings || { savingsGoal: 500, budgetGoals: {} };
}

export async function updateSettings(updates) {
  const current = await getSettings();
  await db.settings.put({ key: 'user', ...current, ...updates });
}

export async function exportAllData() {
  const [transactions, recurringExpenses, debts, monthlyBalances] = await Promise.all([
    db.transactions.toArray(),
    db.recurringExpenses.toArray(),
    db.debts.toArray(),
    db.monthlyBalances.toArray()
  ]);
  const settings = await getSettings();
  return {
    appName: 'Balance Books Pro',
    version: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.7.0',
    exportDate: new Date().toISOString(),
    data: { transactions, recurringExpenses, debts, monthlyBalances, savingsGoal: settings.savingsGoal, budgetGoals: settings.budgetGoals }
  };
}

export async function importData(backup) {
  const data = backup.data || backup;
  await Promise.all([db.transactions.clear(), db.recurringExpenses.clear(), db.debts.clear(), db.monthlyBalances.clear()]);
  if (data.transactions?.length) await db.transactions.bulkAdd(data.transactions);
  if (data.recurringExpenses?.length) await db.recurringExpenses.bulkAdd(data.recurringExpenses);
  if (data.debts?.length) await db.debts.bulkAdd(data.debts);
  if (data.savingsGoal) await updateSettings({ savingsGoal: data.savingsGoal, budgetGoals: data.budgetGoals || {} });
}
