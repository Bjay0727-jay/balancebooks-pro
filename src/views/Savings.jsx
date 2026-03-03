import { PiggyBank, TrendingUp, Target, Edit2 } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { useFinancialData } from '../hooks/useFinancialData';
import { currency } from '../utils/formatters';

export default function Savings() {
  const { transactions, savingsGoal, year, setModal } = useAppStore();
  const { stats } = useFinancialData();

  const ytdSavings = transactions
    .filter(t => t.category === 'savings' && new Date(t.date).getFullYear() === year)
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-[#00b4d8]/5 via-white to-blue-50 rounded-2xl border-2 border-[#00b4d8]/20 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 text-sm">This Month</span>
            <div className="p-2 rounded-xl bg-gradient-to-br from-green-100 to-green-200"><PiggyBank size={20} className="text-[#00b4d8]" /></div>
          </div>
          <p className="text-3xl font-bold text-[#00b4d8]">{currency(stats.saved)}</p>
          <div className="mt-4">
            <div className="h-3 bg-gradient-to-r from-[#12233d]/10 to-[#00b4d8]/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#00b4d8]/50 to-green-400 rounded-full" style={{ width: `${Math.min(100, (stats.saved / savingsGoal * 100))}%` }} />
            </div>
            <p className="text-xs text-slate-500 mt-2">{Math.min(100, (stats.saved / savingsGoal * 100)).toFixed(0)}% of {currency(savingsGoal)} goal</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-[#0a1628]/5 via-white to-[#00b4d8]/5 rounded-2xl border-2 border-[#12233d]/20 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 text-sm">Year to Date</span>
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#12233d]/10 to-blue-200"><TrendingUp size={20} className="text-[#00b4d8]" /></div>
          </div>
          <p className="text-3xl font-bold text-[#00b4d8]">{currency(ytdSavings)}</p>
        </div>
        <div className="bg-gradient-to-r from-[#0a1628]/5 via-white to-[#00b4d8]/5 rounded-2xl border-2 border-[#12233d]/20 shadow-sm p-6 cursor-pointer hover:shadow-lg transition-all" onClick={() => setModal('edit-goal')}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 text-sm">Monthly Goal</span>
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#12233d]/10 to-[#00b4d8]/10"><Target size={20} className="text-[#00b4d8]" /></div>
          </div>
          <p className="text-3xl font-bold text-[#00b4d8]">{currency(savingsGoal)}</p>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1"><Edit2 size={12} /> Click to edit</p>
        </div>
      </div>
    </div>
  );
}
