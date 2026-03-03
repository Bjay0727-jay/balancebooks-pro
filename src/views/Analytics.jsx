import { BarChart3, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { useFinancialData } from '../hooks/useFinancialData';
import { FULL_MONTHS } from '../utils/constants';
import { currency } from '../utils/formatters';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#00b4d8', '#12233d', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#ec4899'];

const CurrencyTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-3 text-sm">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
          {entry.name}: {currency(entry.value)}
        </p>
      ))}
    </div>
  );
};

export default function Analytics() {
  const month = useAppStore(s => s.month);
  const { spendingTrends, catBreakdown, stats, cycleData } = useFinancialData();

  const trendData = spendingTrends.map(t => ({
    name: `${t.month} ${t.year}`,
    Income: t.income,
    Expenses: t.expenses,
    Net: t.net,
  }));

  const pieData = catBreakdown.slice(0, 8).map(cat => ({
    name: `${cat.icon} ${cat.name}`,
    value: cat.total,
    color: cat.color,
  }));

  const netWorthData = cycleData.map(d => ({
    name: `${d.month} ${d.year}`,
    Balance: d.ending,
  }));

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-gradient-to-r from-[#12233d] to-[#00b4d8] rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-2"><BarChart3 size={24} /><h3 className="font-bold text-lg">Financial Analytics</h3></div>
        <p className="text-purple-100">Visualize your spending patterns and trends</p>
      </div>

      {/* Income vs Expenses Area Chart */}
      <div className="bg-white rounded-2xl border-2 border-[#12233d]/20 shadow-sm p-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-[#00b4d8]" />6-Month Income vs. Expenses</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00b4d8" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00b4d8" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={v => `$${(v / 1000).toFixed(v >= 1000 ? 1 : 0)}${v >= 1000 ? 'k' : ''}`} />
            <Tooltip content={<CurrencyTooltip />} />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            <Area type="monotone" dataKey="Income" stroke="#00b4d8" fill="url(#incomeGrad)" strokeWidth={2} />
            <Area type="monotone" dataKey="Expenses" stroke="#ef4444" fill="url(#expenseGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Net Bar Chart */}
      <div className="bg-white rounded-2xl border-2 border-[#12233d]/20 shadow-sm p-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><BarChart3 size={18} className="text-blue-600" />Monthly Net Cash Flow</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={trendData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={v => `$${v}`} />
            <Tooltip content={<CurrencyTooltip />} />
            <Bar dataKey="Net" radius={[4, 4, 0, 0]}>
              {trendData.map((entry, i) => (
                <Cell key={i} fill={entry.Net >= 0 ? '#00b4d8' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Pie Chart */}
        <div className="bg-white rounded-2xl border-2 border-[#12233d]/20 shadow-sm p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><PieChartIcon size={18} className="text-purple-600" />Spending by Category</h3>
          {pieData.length === 0 ? (
            <div className="text-center py-8 text-slate-500"><PieChartIcon size={48} className="mx-auto mb-3 text-slate-300" /><p>No spending data</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" paddingAngle={2}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => currency(value)} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="space-y-1 mt-2">
            {pieData.map((cat, i) => (
              <div key={i} className="flex items-center justify-between text-sm px-1">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color || COLORS[i] }} /><span className="text-slate-700">{cat.name}</span></div>
                <span className="font-medium text-slate-900">{currency(cat.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Net Worth Trend */}
        <div className="bg-white rounded-2xl border-2 border-[#12233d]/20 shadow-sm p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-emerald-600" />Balance Trend (12 months)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={netWorthData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#12233d" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#12233d" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={v => `$${(v / 1000).toFixed(1)}k`} />
              <Tooltip content={<CurrencyTooltip />} />
              <Area type="monotone" dataKey="Balance" stroke="#12233d" fill="url(#balGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[#00b4d8]/5 to-[#00b4d8]/10 rounded-xl p-4 border border-[#00b4d8]/20">
          <p className="text-[#00b4d8] text-sm font-medium">Avg Monthly Income</p>
          <p className="text-xl font-bold text-green-700">{currency(spendingTrends.reduce((s, t) => s + t.income, 0) / 6)}</p>
        </div>
        <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl p-4 border border-rose-200">
          <p className="text-rose-600 text-sm font-medium">Avg Monthly Expenses</p>
          <p className="text-xl font-bold text-rose-700">{currency(spendingTrends.reduce((s, t) => s + t.expenses, 0) / 6)}</p>
        </div>
        <div className="bg-gradient-to-br from-[#0a1628]/5 to-blue-100 rounded-xl p-4 border border-[#12233d]/20">
          <p className="text-[#00b4d8] text-sm font-medium">Avg Savings</p>
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
