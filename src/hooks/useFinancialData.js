import { useMemo } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { CATEGORIES, FREQUENCY_OPTIONS, MONTHS } from '../utils/constants';
import { getDateParts, getMonthKey, roundCents, currency } from '../utils/formatters';

export function useFinancialData() {
  const transactions = useAppStore(s => s.transactions);
  const recurringExpenses = useAppStore(s => s.recurringExpenses);
  const monthlyBalances = useAppStore(s => s.monthlyBalances);
  const month = useAppStore(s => s.month);
  const year = useAppStore(s => s.year);
  const savingsGoal = useAppStore(s => s.savingsGoal);
  const budgetGoals = useAppStore(s => s.budgetGoals);
  const debts = useAppStore(s => s.debts);
  const search = useAppStore(s => s.search);
  const filterCat = useAppStore(s => s.filterCat);
  const filterPaid = useAppStore(s => s.filterPaid);

  const currentMonthKey = getMonthKey(month, year);

  const getBeginningBalance = (m, y) => {
    const key = getMonthKey(m, y);
    if (monthlyBalances[key]?.beginning !== undefined) return monthlyBalances[key].beginning;
    const prevMonth = m === 0 ? 11 : m - 1;
    const prevYear = m === 0 ? y - 1 : y;
    const prevKey = getMonthKey(prevMonth, prevYear);
    if (monthlyBalances[prevKey]?.ending !== undefined) return monthlyBalances[prevKey].ending;
    return 0;
  };

  const beginningBalance = getBeginningBalance(month, year);

  const monthTx = useMemo(() => transactions.filter(t => {
    const parts = getDateParts(t.date);
    return parts && parts.month === month && parts.year === year;
  }), [transactions, month, year]);

  const filtered = useMemo(() => {
    let list = [...transactions].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    if (search) list = list.filter(t => t.desc.toLowerCase().includes(search.toLowerCase()));
    if (filterCat !== 'all') list = list.filter(t => t.category === filterCat);
    if (filterPaid === 'paid') list = list.filter(t => t.paid);
    if (filterPaid === 'unpaid') list = list.filter(t => !t.paid);
    return list;
  }, [transactions, search, filterCat, filterPaid]);

  const stats = useMemo(() => {
    const income = roundCents(monthTx.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0));
    const expenses = roundCents(monthTx.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0));
    const saved = roundCents(monthTx.filter(t => t.category === 'savings').reduce((s, t) => s + Math.abs(t.amount), 0));
    const unpaidCount = monthTx.filter(t => !t.paid && t.amount < 0).length;
    const net = roundCents(income - expenses);
    const calculatedEnding = roundCents(beginningBalance + net);
    const ending = monthlyBalances[currentMonthKey]?.ending !== undefined
      ? monthlyBalances[currentMonthKey].ending
      : calculatedEnding;
    return { income, expenses, net, saved, unpaidCount, beginning: beginningBalance, ending, calculatedEnding };
  }, [monthTx, beginningBalance, monthlyBalances, currentMonthKey]);

  const catBreakdown = useMemo(() => {
    const map = {};
    monthTx.filter(t => t.amount < 0 && t.category !== 'savings').forEach(t => { map[t.category] = (map[t.category] || 0) + Math.abs(t.amount); });
    return Object.entries(map).map(([id, total]) => ({ ...CATEGORIES.find(c => c.id === id), total, pct: stats.expenses > 0 ? (total / stats.expenses) * 100 : 0 })).sort((a, b) => b.total - a.total);
  }, [monthTx, stats.expenses]);

  const budgetAnalysis = useMemo(() => {
    return CATEGORIES.filter(c => c.id !== 'income').map(cat => {
      const spent = catBreakdown.find(c => c.id === cat.id)?.total || 0;
      const budget = budgetGoals[cat.id] || 0;
      const remaining = budget - spent;
      const percentUsed = budget > 0 ? (spent / budget) * 100 : 0;
      const status = budget === 0 ? 'no-budget' : percentUsed > 100 ? 'over' : percentUsed > 80 ? 'warning' : 'good';
      return { ...cat, spent, budget, remaining, percentUsed, status };
    }).filter(b => b.budget > 0 || b.spent > 0).sort((a, b) => b.spent - a.spent);
  }, [catBreakdown, budgetGoals]);

  const budgetStats = useMemo(() => {
    const totalBudget = Object.values(budgetGoals).reduce((s, v) => s + (v || 0), 0);
    const totalSpent = budgetAnalysis.reduce((s, b) => s + b.spent, 0);
    const categoriesOverBudget = budgetAnalysis.filter(b => b.status === 'over').length;
    const categoriesNearLimit = budgetAnalysis.filter(b => b.status === 'warning').length;
    return { totalBudget, totalSpent, remaining: totalBudget - totalSpent, categoriesOverBudget, categoriesNearLimit };
  }, [budgetGoals, budgetAnalysis]);

  const debtPayoffPlan = useMemo(() => {
    if (debts.length === 0) return { snowball: [], avalanche: [], totalDebt: 0, totalInterest: 0 };
    const totalDebt = debts.reduce((s, d) => s + d.balance, 0);
    const totalMinPayment = debts.reduce((s, d) => s + d.minPayment, 0);
    const snowball = [...debts].sort((a, b) => a.balance - b.balance);
    const avalanche = [...debts].sort((a, b) => b.interestRate - a.interestRate);
    const calculatePayoff = (sortedDebts, extraPayment = 0) => {
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
    };
    const snowballResult = calculatePayoff(snowball, 0);
    const avalancheResult = calculatePayoff(avalanche, 0);
    return {
      snowball, avalanche, totalDebt, totalMinPayment,
      snowballMonths: snowballResult.months, snowballInterest: snowballResult.totalInterestPaid,
      avalancheMonths: avalancheResult.months, avalancheInterest: avalancheResult.totalInterestPaid,
      interestSavings: snowballResult.totalInterestPaid - avalancheResult.totalInterestPaid
    };
  }, [debts]);

  const spendingTrends = useMemo(() => {
    const trends = [];
    for (let i = 5; i >= 0; i--) {
      const m = (month - i + 12) % 12;
      const y = month - i < 0 ? year - 1 : year;
      const txs = transactions.filter(t => {
        const parts = getDateParts(t.date);
        return parts && parts.month === m && parts.year === y;
      });
      const income = txs.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
      const expenses = txs.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
      trends.push({ month: MONTHS[m], year: y, income, expenses, net: income - expenses });
    }
    return trends;
  }, [transactions, month, year]);

  const ytdStats = useMemo(() => {
    const ytdTxs = transactions.filter(t => {
      const parts = getDateParts(t.date);
      return parts && parts.year === year;
    });
    const income = ytdTxs.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const expenses = ytdTxs.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    const savings = ytdTxs.filter(t => t.category === 'savings').reduce((s, t) => s + Math.abs(t.amount), 0);
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;
    const net = income - expenses;
    const monthsElapsed = month + 1;
    return { income, expenses, savings, savingsRate, net, monthsElapsed, avgMonthlyIncome: income / monthsElapsed, avgMonthlyExpenses: expenses / monthsElapsed };
  }, [transactions, year, month]);

  const savingsRecommendations = useMemo(() => {
    const recs = [];
    const avgIncome = stats.income || 0;
    const savingsRate = avgIncome > 0 ? (stats.saved / avgIncome) * 100 : 0;
    const expenseRatio = avgIncome > 0 ? (stats.expenses / avgIncome) * 100 : 0;

    const check = (id, catId, threshold, type, priority, title, descFn, pctSave, tips, icon) => {
      const val = catBreakdown.find(c => c.id === catId)?.total || 0;
      if (val > threshold) recs.push({ id, type, priority, title, description: descFn(val), potential: val * pctSave, tips, icon });
    };

    check(1, 'dining', 150, 'reduce', 'high', 'Reduce Dining Out Costs',
      v => `You spent ${currency(v)} on dining this month. Consider meal prepping on Sundays.`, 0.4,
      ['Cook at home 2 more days per week', 'Use meal planning apps like Mealime', 'Bring lunch to work instead of buying'], '🍽️');
    check(2, 'subscriptions', 50, 'audit', 'medium', 'Audit Your Subscriptions',
      v => `${currency(v)} in monthly subscriptions. Review each service and cancel what you don\'t use.`, 0.3,
      ['Cancel streaming services you rarely watch', 'Look for annual payment discounts', 'Share family plans'], '📱');
    check(3, 'shopping', 200, 'reduce', 'high', 'Curb Impulse Shopping',
      v => `${currency(v)} on shopping. Try the 24-hour rule before non-essential purchases.`, 0.35,
      ['Wait 24 hours before buying anything over $50', 'Unsubscribe from retail emails', 'Use a shopping list'], '🛍️');
    check(6, 'entertainment', 200, 'reduce', 'medium', 'Find Free Entertainment',
      v => `${currency(v)} on entertainment. Look for free local events, parks, and activities.`, 0.3,
      ['Check library for free events', 'Host game nights at home', 'Explore free outdoor activities'], '🎬');
    check(7, 'transportation', 400, 'reduce', 'medium', 'Lower Transportation Costs',
      v => `${currency(v)} on transportation. Consider carpooling or public transit.`, 0.2,
      ['Combine multiple errands into one trip', 'Use GasBuddy for cheaper gas', 'Carpool 2-3 days/week'], '🚗');
    check(8, 'groceries', 600, 'reduce', 'medium', 'Optimize Grocery Spending',
      v => `${currency(v)} on groceries. Smart shopping can save 15-20% monthly.`, 0.15,
      ['Make a list and stick to it', 'Buy store brands', 'Use cashback apps like Ibotta'], '🛒');
    check(9, 'utilities', 300, 'reduce', 'low', 'Lower Utility Bills',
      v => `${currency(v)} on utilities. Small changes can reduce costs by 10-15%.`, 0.1,
      ['Adjust thermostat 2 degrees', 'Switch to LED bulbs', 'Use smart power strips'], '💡');

    if (savingsRate < 10 && avgIncome > 0) {
      recs.push({ id: 4, type: 'alert', priority: 'high', title: 'Savings Rate Below 10%',
        description: `You're only saving ${savingsRate.toFixed(1)}% of income. Experts recommend at least 20%.`,
        potential: avgIncome * 0.1 - stats.saved, tips: ['Set up automatic transfer on payday', 'Start with $25-50 per paycheck', 'Build a 3-month emergency fund'], icon: '⚠️' });
    } else if (savingsRate < 20 && avgIncome > 0) {
      recs.push({ id: 4, type: 'increase', priority: 'medium', title: 'Boost Savings to 20%',
        description: `Current savings rate: ${savingsRate.toFixed(1)}%. Add ${currency(avgIncome * 0.2 - stats.saved)} more monthly.`,
        potential: avgIncome * 0.2 - stats.saved, tips: ['Increase savings by 1% each month', 'Save all windfalls', 'Follow the 50/30/20 rule'], icon: '📈' });
    }

    if (expenseRatio > 90 && avgIncome > 0) {
      recs.push({ id: 10, type: 'alert', priority: 'high', title: 'Living Paycheck to Paycheck',
        description: `Spending ${expenseRatio.toFixed(0)}% of income. Almost no buffer for emergencies.`,
        potential: avgIncome * 0.1, tips: ['Track every expense for one week', 'Cut one non-essential expense', 'Build a $1,000 emergency fund'], icon: '🔴' });
    }

    if (stats.unpaidCount > 3) {
      recs.push({ id: 11, type: 'alert', priority: 'high', title: 'Manage Unpaid Bills',
        description: `${stats.unpaidCount} unpaid expenses this month. Stay on top of due dates.`,
        potential: 0, tips: ['Set up calendar reminders', 'Enable autopay for fixed bills', 'Review bills weekly'], icon: '📋' });
    }

    const housing = catBreakdown.find(c => c.id === 'housing')?.total || 0;
    if (housing > 0 && avgIncome > 0 && (housing / avgIncome) > 0.30) {
      recs.push({ id: 12, type: 'alert', priority: 'medium', title: 'Housing Costs High',
        description: `Housing is ${((housing / avgIncome) * 100).toFixed(0)}% of income. Experts recommend under 30%.`,
        potential: housing - (avgIncome * 0.30), tips: ['Consider a roommate', 'Negotiate rent at renewal', 'Look for affordable areas'], icon: '🏠' });
    }

    if (savingsRate >= 20) {
      recs.push({ id: 5, type: 'success', priority: 'low', title: 'Excellent Savings Rate!',
        description: `Saving ${savingsRate.toFixed(1)}% — above the recommended 20%!`,
        potential: 0, tips: ['Consider maxing retirement accounts', 'Look into index funds', 'Keep it up!'], icon: '🏆' });
    }

    if (stats.ending > stats.beginning && stats.beginning > 0) {
      recs.push({ id: 13, type: 'success', priority: 'low', title: 'Positive Cash Flow!',
        description: `Balance grew by ${currency(stats.ending - stats.beginning)} this month.`,
        potential: 0, tips: ['Maintain momentum', 'Increase savings goal', 'Plan for large expenses'], icon: '✅' });
    }

    return recs.sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]));
  }, [catBreakdown, stats]);

  const upcomingBills = useMemo(() => {
    const today = new Date();
    const day = today.getDate();
    return recurringExpenses.filter(r => r.active).map(r => {
      let dueDate = new Date(year, month, r.dueDay);
      if (r.dueDay < day) dueDate = new Date(year, month + 1, r.dueDay);
      const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      return { ...r, dueDate, daysUntil };
    }).filter(r => r.daysUntil >= 0 && r.daysUntil <= 7).sort((a, b) => a.daysUntil - b.daysUntil);
  }, [recurringExpenses, month, year]);

  const cycleData = useMemo(() => {
    const data = [];
    for (let i = 0; i < 12; i++) {
      const m = (month - 11 + i + 12) % 12;
      const y = year - (month - 11 + i < 0 ? 1 : 0);
      const key = getMonthKey(m, y);
      const txs = transactions.filter(t => {
        const parts = getDateParts(t.date);
        return parts && parts.month === m && parts.year === y;
      });
      const inc = txs.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
      const exp = txs.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
      const beginning = getBeginningBalance(m, y);
      const calculated = beginning + inc - exp;
      const ending = monthlyBalances[key]?.ending !== undefined ? monthlyBalances[key].ending : calculated;
      data.push({ month: MONTHS[m], year: y, monthNum: m, income: inc, expenses: exp, net: inc - exp, beginning, ending });
    }
    return data;
  }, [transactions, month, year, monthlyBalances]);

  const totalMonthlyRecurring = recurringExpenses.filter(r => r.active).reduce((s, r) => s + r.amount, 0);

  return {
    monthTx, filtered, stats, catBreakdown,
    budgetAnalysis, budgetStats, debtPayoffPlan,
    spendingTrends, ytdStats, savingsRecommendations,
    upcomingBills, cycleData, totalMonthlyRecurring,
    currentMonthKey, beginningBalance, getBeginningBalance,
  };
}
