/**
 * BalanceBooks Pro - Migration Utility
 * Migrates data from localStorage to IndexedDB
 */

import { db, transactionsDB, recurringDB, balancesDB, budgetDB, debtsDB, settingsDB } from './database';

const MIGRATION_KEY = 'bb_indexeddb_migrated';
const MIGRATION_VERSION = '2';

// Helper to load from localStorage
const loadLS = (key, defaultValue) => {
  try {
    const saved = localStorage.getItem('bb_' + key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch {
    return defaultValue;
  }
};

/**
 * Check if migration is needed
 */
export const needsMigration = () => {
  const migrated = localStorage.getItem(MIGRATION_KEY);
  return migrated !== MIGRATION_VERSION;
};

/**
 * Check if IndexedDB has data
 */
export const hasIndexedDBData = async () => {
  try {
    const count = await db.transactions.count();
    return count > 0;
  } catch {
    return false;
  }
};

/**
 * Migrate all data from localStorage to IndexedDB
 * Returns: { success: boolean, counts: object, error?: string }
 */
export const migrateFromLocalStorage = async () => {
  // Skip if already migrated
  if (!needsMigration()) {
    console.log('[Migration] Already migrated to v' + MIGRATION_VERSION);
    return { success: true, skipped: true };
  }

  console.log('[Migration] Starting localStorage → IndexedDB migration...');

  try {
    // Load all data from localStorage
    const transactions = loadLS('transactions', []);
    const recurring = loadLS('recurring', []);
    const monthlyBalances = loadLS('monthlyBalances', {});
    const budgetGoals = loadLS('budgetGoals', {});
    const debts = loadLS('debts', []);
    const savingsGoal = loadLS('savingsGoal', 500);
    const autoBackup = loadLS('autoBackup', false);
    const lastBackup = loadLS('lastBackup', null);
    const notifications = loadLS('notifications', false);

    // Perform migration in a transaction
    await db.transaction('rw', 
      db.transactions, 
      db.recurringExpenses, 
      db.monthlyBalances, 
      db.budgetGoals, 
      db.debts, 
      db.settings, 
      async () => {
        // Clear existing IndexedDB data first
        await Promise.all([
          db.transactions.clear(),
          db.recurringExpenses.clear(),
          db.monthlyBalances.clear(),
          db.budgetGoals.clear(),
          db.debts.clear()
        ]);

        // Migrate transactions
        if (transactions.length > 0) {
          await db.transactions.bulkAdd(transactions);
        }

        // Migrate recurring expenses
        if (recurring.length > 0) {
          await db.recurringExpenses.bulkAdd(recurring);
        }

        // Migrate monthly balances
        const balanceRecords = Object.entries(monthlyBalances).map(([monthKey, data]) => ({
          monthKey,
          ...data
        }));
        if (balanceRecords.length > 0) {
          await db.monthlyBalances.bulkAdd(balanceRecords);
        }

        // Migrate budget goals
        const budgetRecords = Object.entries(budgetGoals).map(([category, amount]) => ({
          category,
          amount
        }));
        if (budgetRecords.length > 0) {
          await db.budgetGoals.bulkAdd(budgetRecords);
        }

        // Migrate debts
        if (debts.length > 0) {
          await db.debts.bulkAdd(debts);
        }

        // Migrate settings
        await db.settings.bulkPut([
          { key: 'savingsGoal', value: savingsGoal },
          { key: 'autoBackup', value: autoBackup },
          { key: 'lastBackup', value: lastBackup },
          { key: 'notifications', value: notifications }
        ]);
      }
    );

    // Mark migration complete
    localStorage.setItem(MIGRATION_KEY, MIGRATION_VERSION);

    const counts = {
      transactions: transactions.length,
      recurring: recurring.length,
      balances: Object.keys(monthlyBalances).length,
      budgets: Object.keys(budgetGoals).length,
      debts: debts.length
    };

    console.log('[Migration] Complete!', counts);
    return { success: true, counts };

  } catch (error) {
    console.error('[Migration] Failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Load all data from IndexedDB
 * Returns object with all app data
 */
export const loadFromIndexedDB = async () => {
  try {
    const [
      transactions,
      recurringExpenses,
      monthlyBalances,
      budgetGoals,
      debts,
      settings
    ] = await Promise.all([
      transactionsDB.getAll(),
      recurringDB.getAll(),
      balancesDB.getAll(),
      budgetDB.getAll(),
      debtsDB.getAll(),
      settingsDB.getMultiple(['savingsGoal', 'autoBackup', 'lastBackup', 'notifications'], {
        savingsGoal: 500,
        autoBackup: false,
        lastBackup: null,
        notifications: false
      })
    ]);

    return {
      transactions,
      recurringExpenses,
      monthlyBalances,
      budgetGoals,
      debts,
      savingsGoal: settings.savingsGoal,
      autoBackup: settings.autoBackup,
      lastBackup: settings.lastBackup,
      notifications: settings.notifications
    };
  } catch (error) {
    console.error('[IndexedDB] Load failed:', error);
    throw error;
  }
};

/**
 * Clear localStorage data after successful migration verification
 */
export const clearLocalStorageData = () => {
  const keysToRemove = [
    'bb_transactions',
    'bb_recurring', 
    'bb_monthlyBalances',
    'bb_budgetGoals',
    'bb_debts',
    'bb_savingsGoal',
    'bb_autoBackup',
    'bb_lastBackup',
    'bb_notifications'
  ];
  
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch {}
  });
  
  console.log('[Migration] Cleared localStorage data');
};

export default migrateFromLocalStorage;
