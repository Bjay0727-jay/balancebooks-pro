// src/hooks/useTransactions.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../db/database';
import { uid, getDateParts } from '../utils/formatters';

export function useTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await db.transactions.toArray();
      data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransactions(data);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  const addTransaction = useCallback(async (txData) => {
    const newTx = { ...txData, id: uid(), createdAt: new Date().toISOString() };
    await db.transactions.add(newTx);
    setTransactions(prev => [newTx, ...prev]);
    return newTx;
  }, []);

  const updateTransaction = useCallback(async (tx) => {
    await db.transactions.put(tx);
    setTransactions(prev => prev.map(t => t.id === tx.id ? tx : t));
    return tx;
  }, []);

  const deleteTransaction = useCallback(async (id) => {
    await db.transactions.delete(id);
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  const togglePaid = useCallback(async (id) => {
    const tx = transactions.find(t => t.id === id);
    if (tx) {
      const updated = { ...tx, paid: !tx.paid };
      await db.transactions.put(updated);
      setTransactions(prev => prev.map(t => t.id === id ? updated : t));
    }
  }, [transactions]);

  const importTransactions = useCallback(async (txArray) => {
    const newTxs = txArray.map(tx => ({ ...tx, id: tx.id || uid() }));
    await db.transactions.bulkAdd(newTxs);
    setTransactions(prev => [...newTxs, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date)));
    return newTxs;
  }, []);

  return { transactions, loading, addTransaction, updateTransaction, deleteTransaction, togglePaid, importTransactions, refresh: loadTransactions };
}

export function useMonthlyTransactions(transactions, month, year) {
  return useMemo(() => {
    return transactions.filter(t => {
      const parts = getDateParts(t.date);
      return parts && parts.month === month && parts.year === year;
    });
  }, [transactions, month, year]);
}

export function useTransactionStats(transactions) {
  return useMemo(() => {
    const income = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const savings = transactions.filter(t => t.category === 'savings').reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const unpaidCount = transactions.filter(t => !t.paid && t.amount < 0).length;
    return { income, expenses, savings, unpaidCount, net: income - expenses };
  }, [transactions]);
}
