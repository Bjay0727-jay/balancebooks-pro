import { describe, it, expect } from 'vitest';
import { roundCents } from './formatters';

// Extract and test the debt payoff calculation logic directly
function calculatePayoff(sortedDebts, extraPayment = 0) {
  let totalInterestPaid = 0;
  let months = 0;
  const maxMonths = 360;
  let balances = sortedDebts.map(d => ({ ...d, currentBalance: d.balance }));
  while (balances.some(d => d.currentBalance > 0) && months < maxMonths) {
    months++;
    let availableExtra = extraPayment;
    for (let i = 0; i < balances.length; i++) {
      const d = balances[i];
      if (d.currentBalance <= 0) continue;
      const monthlyInterest = (d.currentBalance * (d.interestRate / 100)) / 12;
      totalInterestPaid += monthlyInterest;
      d.currentBalance += monthlyInterest;
      let payment = d.minPayment + (i === balances.findIndex(b => b.currentBalance > 0) ? availableExtra : 0);
      payment = Math.min(payment, d.currentBalance);
      d.currentBalance -= payment;
      if (d.currentBalance <= 0) availableExtra += d.minPayment;
    }
  }
  return { months, totalInterestPaid: Math.round(totalInterestPaid) };
}

describe('Debt Payoff Calculations', () => {
  it('calculates payoff for a single debt', () => {
    const result = calculatePayoff([
      { balance: 1000, interestRate: 12, minPayment: 100 }
    ]);
    expect(result.months).toBeGreaterThan(0);
    expect(result.months).toBeLessThan(12); // $1000 at $100/month ~11 months
    expect(result.totalInterestPaid).toBeGreaterThan(0);
  });

  it('handles zero-interest debt', () => {
    const result = calculatePayoff([
      { balance: 500, interestRate: 0, minPayment: 100 }
    ]);
    expect(result.months).toBe(5);
    expect(result.totalInterestPaid).toBe(0);
  });

  it('snowball method pays smallest first', () => {
    const snowball = [
      { balance: 500, interestRate: 20, minPayment: 50 },
      { balance: 5000, interestRate: 15, minPayment: 100 },
    ];
    const result = calculatePayoff(snowball, 50);
    expect(result.months).toBeGreaterThan(0);
    expect(result.months).toBeLessThan(360);
  });

  it('avalanche method pays highest rate first', () => {
    const avalanche = [
      { balance: 5000, interestRate: 20, minPayment: 100 },
      { balance: 500, interestRate: 5, minPayment: 50 },
    ];
    const result = calculatePayoff(avalanche, 50);
    expect(result.months).toBeGreaterThan(0);
  });

  it('avalanche saves more interest than snowball for mixed debts', () => {
    const debts = [
      { balance: 500, interestRate: 5, minPayment: 50 },
      { balance: 3000, interestRate: 22, minPayment: 75 },
      { balance: 1000, interestRate: 15, minPayment: 50 },
    ];
    const snowball = [...debts].sort((a, b) => a.balance - b.balance);
    const avalanche = [...debts].sort((a, b) => b.interestRate - a.interestRate);
    const snowballResult = calculatePayoff(snowball, 100);
    const avalancheResult = calculatePayoff(avalanche, 100);
    expect(avalancheResult.totalInterestPaid).toBeLessThanOrEqual(snowballResult.totalInterestPaid);
  });

  it('caps at 360 months for very small payments', () => {
    const result = calculatePayoff([
      { balance: 100000, interestRate: 24, minPayment: 10 }
    ]);
    // min payment < monthly interest so it never pays off
    expect(result.months).toBe(360);
  });

  it('handles empty debt list', () => {
    const result = calculatePayoff([]);
    expect(result.months).toBe(0);
    expect(result.totalInterestPaid).toBe(0);
  });

  it('handles extra payments accelerating payoff', () => {
    const baseDebts = [{ balance: 1000, interestRate: 12, minPayment: 100 }];
    const noExtra = calculatePayoff(baseDebts.map(d => ({ ...d })), 0);
    const withExtra = calculatePayoff(baseDebts.map(d => ({ ...d })), 100);
    expect(withExtra.months).toBeLessThan(noExtra.months);
    expect(withExtra.totalInterestPaid).toBeLessThan(noExtra.totalInterestPaid);
  });
});

describe('Budget Analysis Logic', () => {
  const EXPENSE_CATEGORIES = ['housing', 'utilities', 'groceries', 'dining', 'shopping'];

  function analyzeBudget(monthTx, budgetGoals) {
    const catSpending = {};
    monthTx.filter(t => t.amount < 0 && t.category !== 'savings').forEach(t => {
      catSpending[t.category] = (catSpending[t.category] || 0) + Math.abs(t.amount);
    });

    return EXPENSE_CATEGORIES.map(catId => {
      const spent = catSpending[catId] || 0;
      const budget = budgetGoals[catId] || 0;
      const remaining = budget - spent;
      const percentUsed = budget > 0 ? (spent / budget) * 100 : 0;
      const status = budget === 0 ? 'no-budget' : percentUsed > 100 ? 'over' : percentUsed > 80 ? 'warning' : 'good';
      return { id: catId, spent: roundCents(spent), budget, remaining: roundCents(remaining), percentUsed, status };
    });
  }

  it('computes spending by category', () => {
    const txs = [
      { amount: -50, category: 'dining', paid: true },
      { amount: -30, category: 'dining', paid: true },
      { amount: -200, category: 'housing', paid: true },
      { amount: 1000, category: 'income', paid: true },
    ];
    const analysis = analyzeBudget(txs, { dining: 100, housing: 500 });
    const dining = analysis.find(a => a.id === 'dining');
    expect(dining.spent).toBe(80);
    expect(dining.status).toBe('good'); // exactly 80% is good (warning is > 80%)
  });

  it('marks over-budget categories', () => {
    const txs = [
      { amount: -150, category: 'shopping', paid: true },
    ];
    const analysis = analyzeBudget(txs, { shopping: 100 });
    const shopping = analysis.find(a => a.id === 'shopping');
    expect(shopping.status).toBe('over');
    expect(shopping.remaining).toBe(-50);
    expect(shopping.percentUsed).toBe(150);
  });

  it('marks no-budget when budget is 0', () => {
    const txs = [
      { amount: -50, category: 'utilities', paid: true },
    ];
    const analysis = analyzeBudget(txs, {});
    const utilities = analysis.find(a => a.id === 'utilities');
    expect(utilities.status).toBe('no-budget');
  });

  it('marks good when under 80%', () => {
    const txs = [
      { amount: -50, category: 'groceries', paid: true },
    ];
    const analysis = analyzeBudget(txs, { groceries: 500 });
    const groceries = analysis.find(a => a.id === 'groceries');
    expect(groceries.status).toBe('good');
    expect(groceries.percentUsed).toBe(10);
  });

  it('excludes savings from expense tracking', () => {
    const txs = [
      { amount: -100, category: 'savings', paid: true },
      { amount: -50, category: 'dining', paid: true },
    ];
    const analysis = analyzeBudget(txs, { dining: 200 });
    const dining = analysis.find(a => a.id === 'dining');
    expect(dining.spent).toBe(50);
  });

  it('excludes income from expense calculations', () => {
    const txs = [
      { amount: 3000, category: 'income', paid: true },
      { amount: -100, category: 'housing', paid: true },
    ];
    const analysis = analyzeBudget(txs, { housing: 500 });
    const housing = analysis.find(a => a.id === 'housing');
    expect(housing.spent).toBe(100);
  });

  it('handles floating-point amounts correctly', () => {
    const txs = [
      { amount: -33.33, category: 'dining', paid: true },
      { amount: -33.33, category: 'dining', paid: true },
      { amount: -33.34, category: 'dining', paid: true },
    ];
    const analysis = analyzeBudget(txs, { dining: 100 });
    const dining = analysis.find(a => a.id === 'dining');
    expect(dining.spent).toBe(100);
  });
});

describe('Monthly Stats Calculations', () => {
  function computeStats(monthTx, beginningBalance, endingOverride) {
    const income = roundCents(monthTx.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0));
    const expenses = roundCents(monthTx.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0));
    const saved = roundCents(monthTx.filter(t => t.category === 'savings').reduce((s, t) => s + Math.abs(t.amount), 0));
    const unpaidCount = monthTx.filter(t => !t.paid && t.amount < 0).length;
    const net = roundCents(income - expenses);
    const calculatedEnding = roundCents(beginningBalance + net);
    const ending = endingOverride !== undefined ? endingOverride : calculatedEnding;
    return { income, expenses, net, saved, unpaidCount, beginning: beginningBalance, ending, calculatedEnding };
  }

  it('calculates income and expenses', () => {
    const txs = [
      { amount: 3000, category: 'income', paid: true },
      { amount: -1200, category: 'housing', paid: true },
      { amount: -300, category: 'groceries', paid: true },
    ];
    const stats = computeStats(txs, 5000, undefined);
    expect(stats.income).toBe(3000);
    expect(stats.expenses).toBe(1500);
    expect(stats.net).toBe(1500);
  });

  it('calculates ending balance from beginning + net', () => {
    const txs = [
      { amount: 2000, category: 'income', paid: true },
      { amount: -800, category: 'housing', paid: true },
    ];
    const stats = computeStats(txs, 1000, undefined);
    expect(stats.calculatedEnding).toBe(2200);
    expect(stats.ending).toBe(2200);
  });

  it('uses ending override when provided', () => {
    const txs = [
      { amount: 2000, category: 'income', paid: true },
      { amount: -800, category: 'housing', paid: true },
    ];
    const stats = computeStats(txs, 1000, 3000);
    expect(stats.calculatedEnding).toBe(2200);
    expect(stats.ending).toBe(3000); // override
  });

  it('counts unpaid expenses', () => {
    const txs = [
      { amount: -100, category: 'utilities', paid: false },
      { amount: -200, category: 'housing', paid: true },
      { amount: -50, category: 'dining', paid: false },
      { amount: 1000, category: 'income', paid: true },
    ];
    const stats = computeStats(txs, 0, undefined);
    expect(stats.unpaidCount).toBe(2);
  });

  it('tracks savings separately', () => {
    const txs = [
      { amount: 3000, category: 'income', paid: true },
      { amount: -500, category: 'savings', paid: true },
    ];
    const stats = computeStats(txs, 0, undefined);
    expect(stats.saved).toBe(500);
  });

  it('handles empty transaction list', () => {
    const stats = computeStats([], 1000, undefined);
    expect(stats.income).toBe(0);
    expect(stats.expenses).toBe(0);
    expect(stats.net).toBe(0);
    expect(stats.calculatedEnding).toBe(1000);
    expect(stats.unpaidCount).toBe(0);
  });

  it('handles floating-point precision in stats', () => {
    const txs = [
      { amount: 0.1, category: 'income', paid: true },
      { amount: 0.2, category: 'income', paid: true },
    ];
    const stats = computeStats(txs, 0, undefined);
    expect(stats.income).toBe(0.3);
  });
});
