// src/hooks/useDebts.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../db/database';
import { uid } from '../utils/formatters';

export function useDebts() {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDebts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await db.debts.toArray();
      setDebts(data);
    } catch (err) {
      console.error('Failed to load debts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDebts(); }, [loadDebts]);

  const addDebt = useCallback(async (debt) => {
    const newDebt = { ...debt, id: uid() };
    await db.debts.add(newDebt);
    setDebts(prev => [...prev, newDebt]);
    return newDebt;
  }, []);

  const updateDebt = useCallback(async (debt) => {
    await db.debts.put(debt);
    setDebts(prev => prev.map(d => d.id === debt.id ? debt : d));
    return debt;
  }, []);

  const deleteDebt = useCallback(async (id) => {
    await db.debts.delete(id);
    setDebts(prev => prev.filter(d => d.id !== id));
  }, []);

  // Debt payoff calculator - Snowball vs Avalanche methods
  const payoffPlan = useMemo(() => {
    if (debts.length === 0) {
      return { 
        snowball: [], 
        avalanche: [], 
        totalDebt: 0, 
        totalMinPayment: 0, 
        snowballMonths: 0, 
        avalancheMonths: 0, 
        snowballInterest: 0, 
        avalancheInterest: 0, 
        interestSavings: 0 
      };
    }

    const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0);
    const totalMinPayment = debts.reduce((sum, d) => sum + d.minPayment, 0);
    
    // Snowball: smallest balance first
    const snowball = [...debts].sort((a, b) => a.balance - b.balance);
    
    // Avalanche: highest interest first
    const avalanche = [...debts].sort((a, b) => b.interestRate - a.interestRate);

    const calculatePayoff = (sortedDebts) => {
      let totalInterestPaid = 0;
      let months = 0;
      const maxMonths = 360;
      let balances = sortedDebts.map(d => ({ ...d, currentBalance: d.balance }));

      while (balances.some(d => d.currentBalance > 0) && months < maxMonths) {
        months++;
        let availableExtra = 0;

        for (let i = 0; i < balances.length; i++) {
          const d = balances[i];
          if (d.currentBalance <= 0) continue;

          // Add monthly interest
          const monthlyInterest = (d.currentBalance * (d.interestRate / 100)) / 12;
          totalInterestPaid += monthlyInterest;
          d.currentBalance += monthlyInterest;

          // Apply payment (min + extra for first unpaid debt)
          const firstDebtIndex = balances.findIndex(b => b.currentBalance > 0);
          let payment = d.minPayment + (i === firstDebtIndex ? availableExtra : 0);
          payment = Math.min(payment, d.currentBalance);
          d.currentBalance -= payment;

          // When debt paid off, roll payment to next
          if (d.currentBalance <= 0) {
            availableExtra += d.minPayment;
          }
        }
      }

      return { months, totalInterestPaid: Math.round(totalInterestPaid) };
    };

    const snowballResult = calculatePayoff([...snowball]);
    const avalancheResult = calculatePayoff([...avalanche]);

    return {
      snowball,
      avalanche,
      totalDebt,
      totalMinPayment,
      snowballMonths: snowballResult.months,
      snowballInterest: snowballResult.totalInterestPaid,
      avalancheMonths: avalancheResult.months,
      avalancheInterest: avalancheResult.totalInterestPaid,
      interestSavings: snowballResult.totalInterestPaid - avalancheResult.totalInterestPaid
    };
  }, [debts]);

  return { 
    debts, 
    loading, 
    addDebt, 
    updateDebt, 
    deleteDebt, 
    payoffPlan, 
    refresh: loadDebts 
  };
}
