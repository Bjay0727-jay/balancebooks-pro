// src/db/migration.js
import { db, initializeSettings, updateSettings } from './database';
import { STORAGE_KEYS } from '../utils/constants';

export async function migrateFromLocalStorage() {
  if (localStorage.getItem(STORAGE_KEYS.migrated)) {
    console.log('Already migrated to IndexedDB');
    return false;
  }
  
  console.log('Starting migration from localStorage to IndexedDB...');
  await initializeSettings();
  
  // Migrate transactions
  const txJson = localStorage.getItem(STORAGE_KEYS.transactions);
  if (txJson) {
    const transactions = JSON.parse(txJson);
    if (transactions.length) {
      await db.transactions.bulkAdd(transactions);
      console.log(`✓ Migrated ${transactions.length} transactions`);
    }
  }
  
  // Migrate recurring
  const recJson = localStorage.getItem(STORAGE_KEYS.recurring);
  if (recJson) {
    const recurring = JSON.parse(recJson);
    if (recurring.length) {
      await db.recurringExpenses.bulkAdd(recurring);
      console.log(`✓ Migrated ${recurring.length} recurring expenses`);
    }
  }
  
  // Migrate debts
  const debtsJson = localStorage.getItem(STORAGE_KEYS.debts);
  if (debtsJson) {
    const debts = JSON.parse(debtsJson);
    if (debts.length) {
      await db.debts.bulkAdd(debts);
      console.log(`✓ Migrated ${debts.length} debts`);
    }
  }
  
  // Migrate settings
  const savingsGoal = JSON.parse(localStorage.getItem(STORAGE_KEYS.savingsGoal) || '500');
  const budgetGoals = JSON.parse(localStorage.getItem(STORAGE_KEYS.budgetGoals) || '{}');
  await updateSettings({ savingsGoal, budgetGoals });
  
  localStorage.setItem(STORAGE_KEYS.migrated, Date.now().toString());
  console.log('✅ Migration complete!');
  return true;
}

export function getMigrationStatus() {
  return { migrated: !!localStorage.getItem(STORAGE_KEYS.migrated) };
}
