/**
 * BalanceBooks Pro - IndexedDB Database Schema
 * Uses Dexie.js for IndexedDB wrapper
 * 
 * Provides unlimited storage vs 5-10MB localStorage limit
 */

import Dexie from 'dexie';

export const db = new Dexie('BalanceBooksDB');

// Schema v1
db.version(1).stores({
  transactions: '++id, date, category, paid, amount',
  recurringExpenses: '++id, category, active, dueDay',
  monthlyBalances: 'monthKey',
  budgetGoals: 'category',
  debts: '++id, type, interestRate',
  settings: 'key'
});

// ============ TRANSACTIONS ============
export const transactionsDB = {
  async getAll() {
    return await db.transactions.toArray();
  },
  
  async add(tx) {
    const id = await db.transactions.add(tx);
    return { ...tx, id };
  },
  
  async bulkAdd(txs) {
    return await db.transactions.bulkAdd(txs, { allKeys: true });
  },
  
  async update(id, changes) {
    await db.transactions.update(id, changes);
    return await db.transactions.get(id);
  },
  
  async delete(id) {
    return await db.transactions.delete(id);
  },
  
  async bulkDelete(ids) {
    return await db.transactions.bulkDelete(ids);
  },
  
  async replaceAll(txs) {
    await db.transactions.clear();
    if (txs.length > 0) await db.transactions.bulkAdd(txs);
    return txs;
  },
  
  async clear() {
    return await db.transactions.clear();
  }
};

// ============ RECURRING ============
export const recurringDB = {
  async getAll() {
    return await db.recurringExpenses.toArray();
  },
  
  async add(expense) {
    const id = await db.recurringExpenses.add(expense);
    return { ...expense, id };
  },
  
  async update(id, changes) {
    await db.recurringExpenses.update(id, changes);
    return await db.recurringExpenses.get(id);
  },
  
  async delete(id) {
    return await db.recurringExpenses.delete(id);
  },
  
  async replaceAll(expenses) {
    await db.recurringExpenses.clear();
    if (expenses.length > 0) await db.recurringExpenses.bulkAdd(expenses);
    return expenses;
  },
  
  async clear() {
    return await db.recurringExpenses.clear();
  }
};

// ============ MONTHLY BALANCES ============
export const balancesDB = {
  async getAll() {
    const records = await db.monthlyBalances.toArray();
    const obj = {};
    records.forEach(r => { obj[r.monthKey] = { beginning: r.beginning, ending: r.ending }; });
    return obj;
  },
  
  async set(monthKey, data) {
    await db.monthlyBalances.put({ monthKey, ...data });
  },
  
  async replaceAll(balancesObj) {
    await db.monthlyBalances.clear();
    const records = Object.entries(balancesObj).map(([monthKey, data]) => ({ monthKey, ...data }));
    if (records.length > 0) await db.monthlyBalances.bulkAdd(records);
    return balancesObj;
  }
};

// ============ BUDGET GOALS ============
export const budgetDB = {
  async getAll() {
    const records = await db.budgetGoals.toArray();
    const obj = {};
    records.forEach(r => { obj[r.category] = r.amount; });
    return obj;
  },
  
  async replaceAll(goalsObj) {
    await db.budgetGoals.clear();
    const records = Object.entries(goalsObj).map(([category, amount]) => ({ category, amount }));
    if (records.length > 0) await db.budgetGoals.bulkAdd(records);
    return goalsObj;
  }
};

// ============ DEBTS ============
export const debtsDB = {
  async getAll() {
    return await db.debts.toArray();
  },
  
  async add(debt) {
    const id = await db.debts.add(debt);
    return { ...debt, id };
  },
  
  async update(id, changes) {
    await db.debts.update(id, changes);
    return await db.debts.get(id);
  },
  
  async delete(id) {
    return await db.debts.delete(id);
  },
  
  async replaceAll(debts) {
    await db.debts.clear();
    if (debts.length > 0) await db.debts.bulkAdd(debts);
    return debts;
  }
};

// ============ SETTINGS ============
export const settingsDB = {
  async get(key, defaultValue = null) {
    const record = await db.settings.get(key);
    return record ? record.value : defaultValue;
  },
  
  async set(key, value) {
    await db.settings.put({ key, value });
  },
  
  async getMultiple(keys, defaults = {}) {
    const records = await db.settings.where('key').anyOf(keys).toArray();
    const result = { ...defaults };
    records.forEach(r => { result[r.key] = r.value; });
    return result;
  }
};

// ============ UTILITIES ============
export const exportAllData = async () => ({
  transactions: await transactionsDB.getAll(),
  recurringExpenses: await recurringDB.getAll(),
  monthlyBalances: await balancesDB.getAll(),
  budgetGoals: await budgetDB.getAll(),
  debts: await debtsDB.getAll()
});

export const importAllData = async (data) => {
  await db.transaction('rw', db.transactions, db.recurringExpenses, db.monthlyBalances, db.budgetGoals, db.debts, async () => {
    if (data.transactions) await transactionsDB.replaceAll(data.transactions);
    if (data.recurringExpenses) await recurringDB.replaceAll(data.recurringExpenses);
    if (data.monthlyBalances) await balancesDB.replaceAll(data.monthlyBalances);
    if (data.budgetGoals) await budgetDB.replaceAll(data.budgetGoals);
    if (data.debts) await debtsDB.replaceAll(data.debts);
  });
};

export const clearAllData = async () => {
  await db.transaction('rw', db.transactions, db.recurringExpenses, db.monthlyBalances, db.budgetGoals, db.debts, db.settings, async () => {
    await Promise.all([
      db.transactions.clear(),
      db.recurringExpenses.clear(),
      db.monthlyBalances.clear(),
      db.budgetGoals.clear(),
      db.debts.clear(),
      db.settings.clear()
    ]);
  });
};

export default db;
