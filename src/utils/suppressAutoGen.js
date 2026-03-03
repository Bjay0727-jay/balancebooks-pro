import { getMonthKey } from './formatters';

/**
 * Call this when a user deletes an auto-generated transaction
 * to prevent it from being re-created.
 */
export function suppressAutoGen(recurringId, month, year) {
  const key = `${recurringId}_${getMonthKey(month, year)}`;
  const deletedKey = 'bb_autoGenDeleted';
  const deleted = JSON.parse(localStorage.getItem(deletedKey) || '[]');
  if (!deleted.includes(key)) {
    deleted.push(key);
    try { localStorage.setItem(deletedKey, JSON.stringify(deleted)); } catch {}
  }
}
