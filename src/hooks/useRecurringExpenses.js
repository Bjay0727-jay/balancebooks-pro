// src/hooks/useRecurringExpenses.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../db/database';
import { uid } from '../utils/formatters';

export function useRecurringExpenses() {
  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRecurring = useCallback(async () => {
    try {
      setLoading(true);
      const data = await db.recurringExpenses.toArray();
      setRecurringExpenses(data);
    } catch (err) {
      console.error('Failed to load recurring:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRecurring(); }, [loadRecurring]);

  const addRecurring = useCallback(async (expense) => {
    const newExpense = { ...expense, id: uid(), active: expense.active !== false };
    await db.recurringExpenses.add(newExpense);
    setRecurringExpenses(prev => [...prev, newExpense]);
    return newExpense;
  }, []);

  const updateRecurring = useCallback(async (expense) => {
    await db.recurringExpenses.put(expense);
    setRecurringExpenses(prev => prev.map(r => r.id === expense.id ? expense : r));
    return expense;
  }, []);

  const deleteRecurring = useCallback(async (id) => {
    await db.recurringExpenses.delete(id);
    setRecurringExpenses(prev => prev.filter(r => r.id !== id));
  }, []);

  const toggleActive = useCallback(async (id) => {
    const expense = recurringExpenses.find(r => r.id === id);
    if (expense) {
      const updated = { ...expense, active: !expense.active };
      await db.recurringExpenses.put(updated);
      setRecurringExpenses(prev => prev.map(r => r.id === id ? updated : r));
    }
  }, [recurringExpenses]);

  const totalMonthly = useMemo(() => {
    return recurringExpenses.filter(r => r.active).reduce((sum, r) => sum + r.amount, 0);
  }, [recurringExpenses]);

  const upcomingBills = useMemo(() => {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth();
    const year = today.getFullYear();
    
    return recurringExpenses
      .filter(r => r.active)
      .map(r => {
        let dueDate = new Date(year, month, r.dueDay);
        if (r.dueDay < day) dueDate = new Date(year, month + 1, r.dueDay);
        const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        return { ...r, dueDate, daysUntil };
      })
      .filter(r => r.daysUntil >= 0 && r.daysUntil <= 7)
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [recurringExpenses]);

  return { 
    recurringExpenses, 
    loading, 
    addRecurring, 
    updateRecurring, 
    deleteRecurring, 
    toggleActive, 
    totalMonthly, 
    upcomingBills, 
    refresh: loadRecurring 
  };
}
