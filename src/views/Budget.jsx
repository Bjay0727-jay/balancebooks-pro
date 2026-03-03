import { useState } from 'react';
import { Target, Plus, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { useFinancialData } from '../hooks/useFinancialData';
import { currency, shortDate } from '../utils/formatters';

export default function Budget() {
  const setModal = useAppStore(s => s.setModal);
  const { budgetAnalysis, budgetStats, monthTx } = useFinancialData();
  const [expandedCat, setExpandedCat] = useState(null);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border-2 border-[#12233d]/20 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">Total Budget</p>
          <p className="text-2xl font-bold text-[#00b4d8]">{currency(budgetStats.totalBudget)}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border-2 border-[#00b4d8]/20 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">Total Spent</p>
          <p className="text-2xl font-bold text-[#00b4d8]">{currency(budgetStats.totalSpent)}</p>
        </div>
        <div className={`bg-white rounded-2xl p-5 border-2 shadow-sm ${budgetStats.remaining >= 0 ? 'border-emerald-200' : 'border-rose-200'}`}>
          <p className="text-slate-500 text-sm font-medium mb-1">Remaining</p>
          <p className={`text-2xl font-bold ${budgetStats.remaining >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{currency(budgetStats.remaining)}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border-2 border-amber-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">Over Budget</p>
          <p className="text-2xl font-bold text-amber-600">{budgetStats.categoriesOverBudget} categories</p>
        </div>
      </div>

      {budgetStats.categoriesOverBudget > 0 && (
        <div className="bg-rose-50 border-2 border-rose-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-rose-700 font-semibold mb-2">
            <AlertTriangle size={18} />
            Budget Alert: {budgetStats.categoriesOverBudget} category(s) over budget!
          </div>
          <div className="flex flex-wrap gap-2">
            {budgetAnalysis.filter(b => b.status === 'over').map(b => (
              <span key={b.id} className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm font-medium">
                {b.icon} {b.name}: {currency(b.spent - b.budget)} over
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border-2 border-[#12233d]/20 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Target size={18} className="text-[#00b4d8]" />
            Category Budgets
          </h3>
          <button onClick={() => setModal('set-budgets')} className="px-4 py-2 bg-gradient-to-r from-[#12233d] to-[#00b4d8] text-white rounded-xl font-medium text-sm shadow-lg hover:from-[#0a1628] hover:to-[#0096b7]">
            <Plus size={16} className="inline mr-1" />Set Budgets
          </button>
        </div>

        {budgetAnalysis.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Target size={48} className="mx-auto mb-3 text-slate-300" />
            <p className="font-medium">No budgets set yet</p>
            <p className="text-sm">Click "Set Budgets" to create spending limits for each category</p>
          </div>
        ) : (
          <div className="space-y-4">
            {budgetAnalysis.map(b => {
              const isExpanded = expandedCat === b.id;
              const catTxs = isExpanded ? monthTx.filter(t => t.amount < 0 && (t.category === b.id || t.splits?.some(s => s.category === b.id))).sort((a, c) => (c.date || '').localeCompare(a.date || '')) : [];
              return (
              <div key={b.id} className="border border-slate-200 rounded-xl overflow-hidden hover:border-blue-300 transition-all">
                <button type="button" onClick={() => setExpandedCat(isExpanded ? null : b.id)} className="w-full p-4 text-left cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{b.icon}</span>
                      <span className="font-medium text-slate-900">{b.name}</span>
                      {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                    </div>
                    <div className="text-right">
                      <span className={`font-bold ${b.status === 'over' ? 'text-rose-600' : b.status === 'warning' ? 'text-amber-600' : 'text-[#00b4d8]'}`}>
                        {currency(b.spent)}
                      </span>
                      <span className="text-slate-400"> / {currency(b.budget)}</span>
                    </div>
                  </div>
                  <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`absolute h-full rounded-full transition-all ${b.status === 'over' ? 'bg-gradient-to-r from-rose-500 to-rose-600' : b.status === 'warning' ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-green-400 to-[#00b4d8]/50'}`}
                      style={{ width: `${Math.min(b.percentUsed, 100)}%` }}
                    />
                    {b.percentUsed > 100 && <div className="absolute right-0 top-0 h-full w-1 bg-rose-700 animate-pulse" />}
                  </div>
                  <div className="flex justify-between mt-1 text-xs">
                    <span className={b.status === 'over' ? 'text-rose-600 font-medium' : 'text-slate-500'}>{b.percentUsed.toFixed(0)}% used</span>
                    <span className={b.remaining >= 0 ? 'text-[#00b4d8]' : 'text-rose-600'}>{b.remaining >= 0 ? `${currency(b.remaining)} left` : `${currency(Math.abs(b.remaining))} over`}</span>
                  </div>
                </button>
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 divide-y divide-slate-100">
                    {catTxs.length > 0 ? catTxs.map(tx => (
                      <div key={tx.id} className="flex items-center justify-between px-4 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-800 truncate">{tx.desc}</p>
                          <p className="text-xs text-slate-400">{shortDate(tx.date)}</p>
                        </div>
                        <span className="text-sm font-bold text-slate-900 tabular-nums">{currency(tx.amount)}</span>
                      </div>
                    )) : (
                      <p className="px-4 py-3 text-sm text-slate-400">No transactions this month</p>
                    )}
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
