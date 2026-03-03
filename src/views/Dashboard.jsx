import { Calculator, Edit2, TrendingUp, Bell, Building2, Link2, Wallet, ArrowUpRight, ArrowDownRight, Target, RefreshCw, Sparkles, AlertTriangle, Lightbulb, CreditCard, Receipt, Check, Clock, PieChart } from 'lucide-react';
import { CATEGORIES } from '../utils/constants';
import { useAppStore } from '../stores/useAppStore';
import { useFinancialData } from '../hooks/useFinancialData';
import { currency, shortDate } from '../utils/formatters';

function EditableStatCard({ label, value, icon: Icon, iconBg, valueColor, onEdit }) {
  const setModal = useAppStore(s => s.setModal);
  return (
    <div className="bg-white rounded-2xl p-5 border-2 border-[#12233d]/20 shadow-sm cursor-pointer hover:border-[#00b4d8] hover:shadow-lg transition-all group" onClick={() => setModal(onEdit)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-500 text-sm font-medium">{label}</span>
        <div className={`p-2 rounded-xl ${iconBg}`}><Icon size={16} className="text-[#00b4d8]" /></div>
      </div>
      <div className="flex items-baseline gap-1">
        <p className={`font-bold ${valueColor} text-2xl`}>{currency(value)}</p>
        <Edit2 size={14} className="ml-2 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const setModal = useAppStore(s => s.setModal);
  const setView = useAppStore(s => s.setView);
  const linkedAccounts = useAppStore(s => s.linkedAccounts);
  const dashboardWidget = useAppStore(s => s.dashboardWidget);
  const setDashboardWidget = useAppStore(s => s.setDashboardWidget);
  const year = useAppStore(s => s.year);
  const { stats, monthTx, catBreakdown, totalMonthlyRecurring, upcomingBills, savingsRecommendations, spendingTrends, ytdStats } = useFinancialData();

  return (
    <div className="space-y-6">
      {/* Balance Overview */}
      <div className="bg-gradient-to-r from-[#12233d] via-[#0a1628] to-[#00b4d8]/50 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3"><Calculator size={24} /><h3 className="font-bold text-lg">Monthly Balance Overview</h3></div>
          <span className="text-white text-sm bg-white/20 px-3 py-1 rounded-full font-medium">Click any card to edit</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/15 backdrop-blur rounded-xl p-4 cursor-pointer hover:bg-white/25 transition-all border border-white/20" onClick={() => setModal('edit-beginning')}>
            <div className="flex items-center justify-between mb-1"><p className="text-[#00b4d8]/70 text-sm">Beginning Balance</p><Edit2 size={12} className="text-blue-200" /></div>
            <p className="text-2xl font-bold">{currency(stats.beginning)}</p>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-xl p-4 cursor-pointer hover:bg-white/25 transition-all border border-white/20" onClick={() => setModal('edit-income')}>
            <div className="flex items-center justify-between mb-1"><p className="text-green-100 text-sm">+ Income</p><Edit2 size={12} className="text-green-200" /></div>
            <p className="text-2xl font-bold text-green-200">{currency(stats.income)}</p>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-xl p-4 cursor-pointer hover:bg-white/25 transition-all border border-white/20" onClick={() => setModal('edit-expenses')}>
            <div className="flex items-center justify-between mb-1"><p className="text-rose-100 text-sm">- Expenses</p><Edit2 size={12} className="text-rose-200" /></div>
            <p className="text-2xl font-bold text-rose-200">{currency(stats.expenses)}</p>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-xl p-4 cursor-pointer hover:bg-white/25 transition-all border border-white/20" onClick={() => setModal('edit-ending')}>
            <div className="flex items-center justify-between mb-1"><p className="text-green-100 text-sm">Ending Balance</p><Edit2 size={12} className="text-green-200" /></div>
            <p className="text-2xl font-bold text-green-300">{currency(stats.ending)}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className={stats.net >= 0 ? "text-green-300" : "text-rose-300"} />
            <span className="text-sm">Net Change: <span className={`font-bold ${stats.net >= 0 ? "text-green-300" : "text-rose-300"}`}>{stats.net >= 0 ? '+' : ''}{currency(stats.net)}</span></span>
          </div>
          <span className="text-xs text-blue-200">Ending balance carries to next month</span>
        </div>
      </div>

      {upcomingBills.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-white to-orange-50 border-2 border-amber-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3"><Bell size={20} className="text-amber-600" /><h3 className="font-semibold text-amber-800">Upcoming Bills</h3></div>
          <div className="space-y-2">{upcomingBills.slice(0, 3).map(b => (
            <div key={b.id} className="flex items-center justify-between text-sm"><span className="text-amber-700">{b.name}</span><div className="flex items-center gap-2"><span className="font-semibold text-amber-900">{currency(b.amount)}</span><span className="text-amber-600">{b.daysUntil === 0 ? 'Today' : b.daysUntil === 1 ? 'Tomorrow' : `in ${b.daysUntil} days`}</span></div></div>
          ))}</div>
        </div>
      )}

      {linkedAccounts.length === 0 && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0a1628]/50 via-[#12233d] to-[#00b4d8]/50 text-white shadow-xl">
          <div className="flex items-center justify-between"><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-white/20"><Building2 size={24} /></div><div><h3 className="font-semibold text-lg">Connect Your Bank</h3><p className="text-[#00b4d8]/70 text-sm">Auto-mark expenses as paid</p></div></div><button onClick={() => setModal('connect')} className="flex items-center gap-2 px-5 py-3 bg-white text-[#00b4d8] rounded-xl font-semibold hover:bg-blue-50 shadow-lg"><Link2 size={18} />Connect</button></div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <EditableStatCard label="Beginning Balance" value={stats.beginning} icon={Wallet} iconBg="bg-gradient-to-br from-[#12233d]/10 to-blue-200" valueColor="text-[#00b4d8]" onEdit="edit-beginning" />
        <EditableStatCard label="Income" value={stats.income} icon={ArrowUpRight} iconBg="bg-gradient-to-br from-green-100 to-green-200" valueColor="text-[#00b4d8]" onEdit="edit-income" />
        <div className="bg-white rounded-2xl p-5 border-2 border-rose-200 shadow-sm cursor-pointer hover:border-rose-400 hover:shadow-lg transition-all group" onClick={() => setModal('edit-expenses')}>
          <div className="flex items-center justify-between mb-3"><span className="text-slate-500 text-sm font-medium">Expenses</span><div className="p-2 rounded-xl bg-gradient-to-br from-rose-100 to-rose-200"><ArrowDownRight size={16} className="text-rose-600" /></div></div>
          <div className="flex items-baseline gap-1"><p className="font-bold text-rose-600 text-2xl">{currency(stats.expenses)}</p><Edit2 size={14} className="ml-2 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
          {stats.unpaidCount > 0 && <p className="text-xs text-amber-600 mt-1 font-medium">{stats.unpaidCount} unpaid</p>}
        </div>
        <EditableStatCard label="Ending Balance" value={stats.ending} icon={Target} iconBg="bg-gradient-to-br from-green-100 to-green-200" valueColor="text-[#00b4d8]" onEdit="edit-ending" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-[#0a1628]/5 via-white to-[#00b4d8]/5 rounded-2xl p-5 border-2 border-[#12233d]/20 shadow-sm">
          <div className="flex items-center justify-between mb-3"><span className="text-slate-500 text-sm font-medium">Net Change</span><div className="p-2 rounded-xl bg-gradient-to-br from-[#12233d]/10 to-[#00b4d8]/10"><TrendingUp size={16} className={stats.net >= 0 ? "text-[#00b4d8]" : "text-rose-600"} /></div></div>
          <p className={`font-bold text-2xl ${stats.net >= 0 ? 'text-[#00b4d8]' : 'text-rose-600'}`}>{stats.net >= 0 ? '+' : ''}{currency(stats.net)}</p>
        </div>
        <div className="bg-gradient-to-r from-[#0a1628]/5 via-white to-[#00b4d8]/5 rounded-2xl p-5 border-2 border-[#12233d]/20 shadow-sm">
          <div className="flex items-center justify-between mb-3"><span className="text-slate-500 text-sm font-medium">Monthly Recurring</span><div className="p-2 rounded-xl bg-gradient-to-br from-[#12233d]/10 to-blue-200"><RefreshCw size={16} className="text-[#00b4d8]" /></div></div>
          <p className="font-bold text-[#00b4d8] text-2xl">{currency(totalMonthlyRecurring)}</p><p className="text-xs text-slate-500 mt-1">/month committed</p>
        </div>
      </div>

      {savingsRecommendations.filter(r => r.priority === 'high').length > 0 && (
        <div className="bg-gradient-to-r from-[#00b4d8]/5 via-white to-blue-50 rounded-2xl p-6 border-2 border-[#00b4d8]/20 shadow-sm">
          <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-3"><Sparkles size={20} className="text-[#00b4d8]" /><h3 className="font-semibold text-slate-900">Priority Recommendations</h3></div><button onClick={() => setView('recommendations')} className="text-sm text-[#00b4d8] font-medium hover:text-[#0096b7] bg-blue-50 px-3 py-1 rounded-full">View All</button></div>
          <div className="space-y-3">{savingsRecommendations.filter(r => r.priority === 'high').slice(0, 2).map(rec => (
            <div key={rec.id} className="flex items-start gap-3 bg-white rounded-xl p-4 border border-[#00b4d8]/10 shadow-sm hover:shadow-md transition-all">
              <div className={`p-2 rounded-xl ${rec.type === 'alert' ? 'bg-gradient-to-br from-rose-100 to-rose-200' : rec.type === 'success' ? 'bg-gradient-to-br from-green-100 to-green-200' : 'bg-gradient-to-br from-[#12233d]/10 to-[#00b4d8]/10'}`}>{rec.type === 'alert' ? <AlertTriangle size={16} className="text-rose-600" /> : <Lightbulb size={16} className="text-[#00b4d8]" />}</div>
              <div className="flex-1"><p className="font-medium text-slate-900">{rec.title}</p><p className="text-sm text-slate-500 line-clamp-2">{rec.description}</p>{rec.potential > 0 && <p className="text-sm text-[#00b4d8] font-semibold mt-1">Save up to {currency(rec.potential)}/mo</p>}</div>
            </div>
          ))}</div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 border-2 border-[#12233d]/10 shadow-sm">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><CreditCard size={18} className="text-[#00b4d8]" />Spending by Category</h3>
        <div className="space-y-4">{catBreakdown.slice(0, 5).map(cat => (
          <div key={cat.id}><div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><span>{cat.icon}</span><span className="font-medium text-slate-700 text-sm">{cat.name}</span></div><span className="font-bold text-slate-900 text-sm">{currency(cat.total)}</span></div><div className="h-3 bg-gradient-to-r from-[#0a1628]/5 to-[#00b4d8]/5 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${cat.pct}%`, backgroundColor: cat.color }} /></div></div>
        ))}</div>
      </div>

      <div className="bg-white rounded-2xl border-2 border-[#00b4d8]/10 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-[#00b4d8]/10 bg-gradient-to-r from-[#00b4d8]/5 via-white to-blue-50"><h3 className="font-semibold text-slate-900 flex items-center gap-2"><Receipt size={18} className="text-[#00b4d8]" />Recent Transactions</h3><button onClick={() => setView('transactions')} className="text-sm text-[#00b4d8] font-medium hover:text-green-700 bg-[#00b4d8]/5 px-3 py-1 rounded-full">View All</button></div>
        <div className="divide-y divide-slate-100">{monthTx.slice(0, 6).map(tx => {
          const cat = CATEGORIES.find(c => c.id === tx.category);
          return (
            <div key={tx.id} className="flex items-center justify-between px-6 py-4 hover:bg-gradient-to-r hover:from-[#0a1628]/5/30 hover:to-[#00b4d8]/5/30">
              <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: cat?.bg }}>{cat?.icon}</div><div><div className="flex items-center gap-2"><p className="font-medium text-slate-900 text-sm">{tx.desc}</p>{tx.paid ? <Check size={14} className="text-green-500" /> : <Clock size={14} className="text-amber-500" />}</div><p className="text-xs text-slate-500">{shortDate(tx.date)}</p></div></div>
              <span className={`font-bold text-sm ${tx.amount > 0 ? 'text-[#00b4d8]' : 'text-slate-900'}`}>{tx.amount > 0 ? '+' : ''}{currency(tx.amount)}</span>
            </div>
          );
        })}</div>
      </div>

      {/* Switchable Widget - YTD / Cash Flow */}
      <div className="bg-white rounded-2xl border-2 border-[#12233d]/10 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[#12233d]/10 bg-gradient-to-r from-purple-50 via-white to-blue-50">
          <div className="flex gap-2">
            <button onClick={() => setDashboardWidget('ytd')} className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${dashboardWidget === 'ytd' ? 'bg-gradient-to-r from-[#12233d] to-[#00b4d8] text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Year-to-Date</button>
            <button onClick={() => setDashboardWidget('cashflow')} className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${dashboardWidget === 'cashflow' ? 'bg-gradient-to-r from-[#12233d] to-[#00b4d8] text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Cash Flow</button>
          </div>
          <span className="text-xs text-slate-400">{year}</span>
        </div>

        {dashboardWidget === 'ytd' && (
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-4 border border-green-200"><p className="text-green-600 text-xs font-medium mb-1">YTD Income</p><p className="text-xl font-bold text-green-700">{currency(ytdStats.income)}</p><p className="text-xs text-green-500 mt-1">~{currency(ytdStats.avgMonthlyIncome)}/mo avg</p></div>
              <div className="bg-gradient-to-br from-rose-50 to-red-100 rounded-xl p-4 border border-rose-200"><p className="text-rose-600 text-xs font-medium mb-1">YTD Expenses</p><p className="text-xl font-bold text-rose-700">{currency(ytdStats.expenses)}</p><p className="text-xs text-rose-500 mt-1">~{currency(ytdStats.avgMonthlyExpenses)}/mo avg</p></div>
              <div className={`bg-gradient-to-br ${ytdStats.net >= 0 ? 'from-blue-50 to-indigo-100 border-blue-200' : 'from-amber-50 to-orange-100 border-amber-200'} rounded-xl p-4 border`}><p className={`${ytdStats.net >= 0 ? 'text-blue-600' : 'text-amber-600'} text-xs font-medium mb-1`}>YTD Net</p><p className={`text-xl font-bold ${ytdStats.net >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>{ytdStats.net >= 0 ? '+' : ''}{currency(ytdStats.net)}</p><p className={`text-xs ${ytdStats.net >= 0 ? 'text-blue-500' : 'text-amber-500'} mt-1`}>{ytdStats.monthsElapsed} months tracked</p></div>
              <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl p-4 border border-purple-200"><p className="text-purple-600 text-xs font-medium mb-1">YTD Savings</p><p className="text-xl font-bold text-purple-700">{currency(ytdStats.savings)}</p><p className="text-xs text-purple-500 mt-1">{ytdStats.savingsRate.toFixed(1)}% of income</p></div>
            </div>
            <div className="space-y-3">
              <div><div className="flex justify-between text-sm mb-1"><span className="text-slate-600">Income vs Expenses</span><span className={`font-semibold ${ytdStats.income >= ytdStats.expenses ? 'text-green-600' : 'text-rose-600'}`}>{ytdStats.income > 0 ? ((ytdStats.expenses / ytdStats.income) * 100).toFixed(0) : 0}% spent</span></div><div className="h-3 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all ${ytdStats.income >= ytdStats.expenses ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-rose-400 to-red-500'}`} style={{ width: `${Math.min(100, ytdStats.income > 0 ? (ytdStats.expenses / ytdStats.income) * 100 : 0)}%` }} /></div></div>
              <div><div className="flex justify-between text-sm mb-1"><span className="text-slate-600">Savings Rate (Goal: 20%)</span><span className={`font-semibold ${ytdStats.savingsRate >= 20 ? 'text-green-600' : ytdStats.savingsRate >= 10 ? 'text-amber-600' : 'text-rose-600'}`}>{ytdStats.savingsRate.toFixed(1)}%</span></div><div className="h-3 bg-slate-100 rounded-full overflow-hidden relative"><div className="absolute left-[20%] top-0 w-0.5 h-full bg-slate-300" title="20% goal" /><div className={`h-full rounded-full transition-all ${ytdStats.savingsRate >= 20 ? 'bg-gradient-to-r from-green-400 to-emerald-500' : ytdStats.savingsRate >= 10 ? 'bg-gradient-to-r from-amber-400 to-yellow-500' : 'bg-gradient-to-r from-rose-400 to-red-500'}`} style={{ width: `${Math.min(100, ytdStats.savingsRate * 2)}%` }} /></div></div>
            </div>
          </div>
        )}

        {dashboardWidget === 'cashflow' && (
          <div className="p-6">
            <div className="h-48 flex items-end justify-between gap-2 mb-4">
              {spendingTrends.map((t, i) => {
                const maxVal = Math.max(...spendingTrends.map(s => Math.max(s.income, s.expenses))) || 1;
                const incomeHeight = Math.max(4, (t.income / maxVal) * 160);
                const expenseHeight = Math.max(4, (t.expenses / maxVal) * 160);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div className="flex gap-1 items-end h-40 mb-2">
                      <div className="w-full max-w-[24px] bg-gradient-to-t from-green-500 to-emerald-400 rounded-t-md transition-all hover:from-green-600 hover:to-emerald-500 cursor-pointer" style={{ height: `${incomeHeight}px` }} title={`Income: ${currency(t.income)}`} />
                      <div className="w-full max-w-[24px] bg-gradient-to-t from-rose-500 to-rose-400 rounded-t-md transition-all hover:from-rose-600 hover:to-rose-500 cursor-pointer" style={{ height: `${expenseHeight}px` }} title={`Expenses: ${currency(t.expenses)}`} />
                    </div>
                    <span className="text-xs font-medium text-slate-600">{t.month}</span>
                    <span className={`text-xs font-semibold ${t.net >= 0 ? 'text-green-600' : 'text-rose-600'}`}>{t.net >= 0 ? '+' : ''}{currency(t.net)}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-center gap-6 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-gradient-to-r from-green-500 to-emerald-400" /><span className="text-sm text-slate-600">Income</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-gradient-to-r from-rose-500 to-rose-400" /><span className="text-sm text-slate-600">Expenses</span></div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
              <div className="text-center"><p className="text-lg font-bold text-green-600">{currency(spendingTrends.reduce((s, t) => s + t.income, 0))}</p><p className="text-xs text-slate-500">6-Mo Income</p></div>
              <div className="text-center"><p className="text-lg font-bold text-rose-600">{currency(spendingTrends.reduce((s, t) => s + t.expenses, 0))}</p><p className="text-xs text-slate-500">6-Mo Expenses</p></div>
              <div className="text-center"><p className={`text-lg font-bold ${spendingTrends.reduce((s, t) => s + t.net, 0) >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>{spendingTrends.reduce((s, t) => s + t.net, 0) >= 0 ? '+' : ''}{currency(spendingTrends.reduce((s, t) => s + t.net, 0))}</p><p className="text-xs text-slate-500">6-Mo Net</p></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
