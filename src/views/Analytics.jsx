import { BarChart3, TrendingUp, PieChart } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { useFinancialData } from '../hooks/useFinancialData';
import { FULL_MONTHS } from '../utils/constants';
import { currency } from '../utils/formatters';

export default function Analytics() {
  const month = useAppStore(s => s.month);
  const { spendingTrends, catBreakdown, stats } = useFinancialData();

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-2"><BarChart3 size={24} /><h3 className="font-bold text-lg">Financial Analytics</h3></div>
        <p className="text-purple-100">Visualize your spending patterns and trends</p>
      </div>

      <div className="bg-white rounded-2xl border-2 border-[#1e3a5f]/20 shadow-sm p-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-[#14b8a6]" />6-Month Spending Trends</h3>
        <div className="h-64 flex items-end justify-between gap-2">
          {spendingTrends.map((t, i) => {
            const maxVal = Math.max(...spendingTrends.map(s => Math.max(s.income, s.expenses))) || 1;
            const incomeHeight = (t.income / maxVal) * 200;
            const expenseHeight = (t.expenses / maxVal) * 200;
            return (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="flex gap-1 items-end h-52 mb-2">
                  <div className="w-6 bg-gradient-to-t from-[#14b8a6]/50 to-green-400 rounded-t transition-all hover:from-[#0d9488] hover:to-[#14b8a6]/50" style={{ height: `${incomeHeight}px` }} title={`Income: ${currency(t.income)}`} />
                  <div className="w-6 bg-gradient-to-t from-rose-500 to-rose-400 rounded-t transition-all hover:from-rose-600 hover:to-rose-500" style={{ height: `${expenseHeight}px` }} title={`Expenses: ${currency(t.expenses)}`} />
                </div>
                <span className="text-xs font-medium text-slate-600">{t.month}</span>
                <span className="text-xs text-slate-400">{t.year}</span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-gradient-to-r from-[#14b8a6]/50 to-green-400" /><span className="text-sm text-slate-600">Income</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-gradient-to-r from-rose-500 to-rose-400" /><span className="text-sm text-slate-600">Expenses</span></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border-2 border-[#1e3a5f]/20 shadow-sm p-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><PieChart size={18} className="text-purple-600" />Spending by Category ({FULL_MONTHS[month]})</h3>
        {catBreakdown.length === 0 ? (
          <div className="text-center py-8 text-slate-500"><PieChart size={48} className="mx-auto mb-3 text-slate-300" /><p>No spending data for this month</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-center">
              <svg width="200" height="200" viewBox="0 0 200 200">
                {(() => {
                  let cumulative = 0;
                  return catBreakdown.slice(0, 8).map((cat) => {
                    const pct = cat.pct / 100;
                    const startAngle = cumulative * 360;
                    cumulative += pct;
                    const endAngle = cumulative * 360;
                    const x1 = 100 + 80 * Math.cos((startAngle - 90) * Math.PI / 180);
                    const y1 = 100 + 80 * Math.sin((startAngle - 90) * Math.PI / 180);
                    const x2 = 100 + 80 * Math.cos((endAngle - 90) * Math.PI / 180);
                    const y2 = 100 + 80 * Math.sin((endAngle - 90) * Math.PI / 180);
                    const largeArc = pct > 0.5 ? 1 : 0;
                    return (<path key={cat.id} d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`} fill={cat.color} opacity={0.8} className="hover:opacity-100 transition-opacity cursor-pointer"><title>{cat.name}: {currency(cat.total)} ({cat.pct.toFixed(1)}%)</title></path>);
                  });
                })()}
                <circle cx="100" cy="100" r="40" fill="white" />
                <text x="100" y="95" textAnchor="middle" className="text-sm font-bold fill-slate-700">Total</text>
                <text x="100" y="115" textAnchor="middle" className="text-xs fill-slate-500">{currency(stats.expenses)}</text>
              </svg>
            </div>
            <div className="space-y-2">
              {catBreakdown.slice(0, 8).map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} /><span className="text-sm font-medium text-slate-700">{cat.icon} {cat.name}</span></div>
                  <div className="text-right"><span className="text-sm font-bold text-slate-900">{currency(cat.total)}</span><span className="text-xs text-slate-400 ml-2">({cat.pct.toFixed(1)}%)</span></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[#14b8a6]/5 to-[#14b8a6]/10 rounded-xl p-4 border border-[#14b8a6]/20">
          <p className="text-[#14b8a6] text-sm font-medium">Avg Monthly Income</p>
          <p className="text-xl font-bold text-green-700">{currency(spendingTrends.reduce((s, t) => s + t.income, 0) / 6)}</p>
        </div>
        <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl p-4 border border-rose-200">
          <p className="text-rose-600 text-sm font-medium">Avg Monthly Expenses</p>
          <p className="text-xl font-bold text-rose-700">{currency(spendingTrends.reduce((s, t) => s + t.expenses, 0) / 6)}</p>
        </div>
        <div className="bg-gradient-to-br from-[#0f172a]/5 to-blue-100 rounded-xl p-4 border border-[#1e3a5f]/20">
          <p className="text-[#14b8a6] text-sm font-medium">Avg Savings</p>
          <p className="text-xl font-bold text-blue-700">{currency(spendingTrends.reduce((s, t) => s + t.net, 0) / 6)}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <p className="text-purple-600 text-sm font-medium">Savings Rate</p>
          <p className="text-xl font-bold text-purple-700">
            {spendingTrends.reduce((s, t) => s + t.income, 0) > 0
              ? ((spendingTrends.reduce((s, t) => s + t.net, 0) / spendingTrends.reduce((s, t) => s + t.income, 0)) * 100).toFixed(1)
              : 0}%
          </p>
        </div>
      </div>
    </div>
  );
}
