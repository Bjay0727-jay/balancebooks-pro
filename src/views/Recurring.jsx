import { Plus, Check, Edit2, Trash2, RefreshCw } from 'lucide-react';
import { CATEGORIES, FREQUENCY_OPTIONS } from '../utils/constants';
import { currency } from '../utils/formatters';
import { useAppStore } from '../stores/useAppStore';
import { useFinancialData } from '../hooks/useFinancialData';

export default function Recurring() {
  const recurringExpenses = useAppStore(s => s.recurringExpenses);
  const setModal = useAppStore(s => s.setModal);
  const setEditRecurring = useAppStore(s => s.setEditRecurring);
  const deleteRecurring = useAppStore(s => s.deleteRecurring);
  const toggleRecurringActive = useAppStore(s => s.toggleRecurringActive);
  const createFromRecurring = useAppStore(s => s.createFromRecurring);
  const { totalMonthlyRecurring } = useFinancialData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-[#12233d] via-[#0a1628] to-[#00b4d8]/50 rounded-2xl text-white shadow-xl">
        <div><h3 className="text-lg font-semibold">Monthly Recurring</h3><p className="text-3xl font-bold">{currency(totalMonthlyRecurring)}</p></div>
        <button onClick={() => setModal('add-recurring')} className="flex items-center gap-2 px-4 py-3 bg-white text-[#00b4d8] rounded-xl font-medium hover:bg-blue-50 shadow-lg"><Plus size={18} />Add</button>
      </div>
      <div className="bg-white rounded-2xl border-2 border-[#12233d]/10 shadow-sm divide-y divide-slate-100">
        {recurringExpenses.map(r => {
          const cat = CATEGORIES.find(c => c.id === r.category);
          const freq = FREQUENCY_OPTIONS.find(f => f.id === r.frequency);
          return (
            <div key={r.id} className={`flex items-center justify-between px-4 py-4 hover:bg-gradient-to-r hover:from-[#0a1628]/5/50 hover:to-[#00b4d8]/5/50 ${!r.active ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-3">
                <button onClick={() => toggleRecurringActive(r.id)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${r.active ? 'bg-gradient-to-r from-[#12233d] to-[#00b4d8] border-blue-500' : 'border-slate-300'}`}>{r.active && <Check size={14} className="text-white" />}</button>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: cat?.bg }}>{cat?.icon}</div>
                <div><p className="font-medium text-slate-900">{r.name}</p><div className="flex items-center gap-2 text-xs text-slate-500"><span>{freq?.name}</span><span>Due: {r.dueDay}</span>{r.autoPay && <span className="text-[#00b4d8] font-medium">Auto-pay</span>}</div></div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-900">{currency(r.amount)}</span>
                <button onClick={() => createFromRecurring(r)} className="p-2 rounded-lg hover:bg-[#00b4d8]/10 text-green-500 hover:text-[#00b4d8]" title="Create transaction"><Plus size={14} /></button>
                <button onClick={() => setEditRecurring(r)} className="p-2 rounded-lg hover:bg-[#00b4d8]/10 text-[#00b4d8]"><Edit2 size={14} /></button>
                <button onClick={() => deleteRecurring(r.id)} className="p-2 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600"><Trash2 size={14} /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
