import { CreditCard, Plus, Edit2, Trash2 } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { useFinancialData } from '../hooks/useFinancialData';
import { uid, currency } from '../utils/formatters';

export default function Debts() {
  const debts = useAppStore(s => s.debts);
  const setDebts = useAppStore(s => s.setDebts);
  const setModal = useAppStore(s => s.setModal);
  const setEditDebt = useAppStore(s => s.setEditDebt);
  const { debtPayoffPlan } = useFinancialData();

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-gradient-to-r from-rose-600 to-orange-500 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2"><CreditCard size={24} /><h3 className="font-bold text-lg">Debt Payoff Planner</h3></div>
            <p className="text-rose-100">Track and eliminate your debts with proven strategies</p>
          </div>
          <button onClick={() => setModal('add-debt')} className="px-5 py-3 bg-white text-rose-600 rounded-xl font-semibold shadow-lg hover:bg-rose-50">
            <Plus size={18} className="inline mr-1" />Add Debt
          </button>
        </div>
      </div>

      {debts.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border-2 border-rose-200 shadow-sm">
            <p className="text-slate-500 text-sm font-medium mb-1">Total Debt</p>
            <p className="text-2xl font-bold text-rose-600">{currency(debtPayoffPlan.totalDebt)}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border-2 border-amber-200 shadow-sm">
            <p className="text-slate-500 text-sm font-medium mb-1">Min. Payments</p>
            <p className="text-2xl font-bold text-amber-600">{currency(debtPayoffPlan.totalMinPayment)}/mo</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border-2 border-[#12233d]/20 shadow-sm">
            <p className="text-slate-500 text-sm font-medium mb-1">Payoff Time</p>
            <p className="text-2xl font-bold text-[#00b4d8]">{Math.ceil(debtPayoffPlan.avalancheMonths / 12)} years</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border-2 border-[#00b4d8]/20 shadow-sm">
            <p className="text-slate-500 text-sm font-medium mb-1">Interest Saved</p>
            <p className="text-2xl font-bold text-[#00b4d8]">{currency(debtPayoffPlan.interestSavings)}</p>
            <p className="text-xs text-slate-400">with avalanche method</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border-2 border-[#12233d]/20 shadow-sm p-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><CreditCard size={18} className="text-rose-600" />Your Debts</h3>
        {debts.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <CreditCard size={48} className="mx-auto mb-3 text-slate-300" />
            <p className="font-medium">No debts added yet</p>
            <p className="text-sm">Click "Add Debt" to start tracking your debts</p>
          </div>
        ) : (
          <div className="space-y-3">
            {debts.map(d => (
              <div key={d.id} className="border border-slate-200 rounded-xl p-4 hover:border-rose-300 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-semibold text-slate-900">{d.name}</span>
                    <span className="ml-2 text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full">{d.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditDebt(d)} className="p-2 text-[#00b4d8] hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                    <button onClick={() => setDebts(debts.filter(x => x.id !== d.id))} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 size={16} /></button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div><p className="text-slate-500">Balance</p><p className="font-bold text-rose-600">{currency(d.balance)}</p></div>
                  <div><p className="text-slate-500">Interest Rate</p><p className="font-bold text-amber-600">{d.interestRate}%</p></div>
                  <div><p className="text-slate-500">Min Payment</p><p className="font-bold text-[#00b4d8]">{currency(d.minPayment)}/mo</p></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {debts.length > 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-[#0a1628]/5 to-blue-100 rounded-2xl border-2 border-[#12233d]/20 p-6">
            <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">Debt Snowball</h4>
            <p className="text-sm text-[#00b4d8] mb-4">Pay smallest balances first for quick wins</p>
            <div className="space-y-2 mb-4">
              {debtPayoffPlan.snowball.map((d, i) => (
                <div key={d.id} className="flex items-center gap-2 text-sm">
                  <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">{i + 1}</span>
                  <span className="text-slate-700">{d.name}</span>
                  <span className="text-[#00b4d8] ml-auto font-medium">{currency(d.balance)}</span>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-[#12233d]/20">
              <p className="text-sm text-slate-600">Est. payoff: <strong>{Math.ceil(debtPayoffPlan.snowballMonths / 12)} years</strong></p>
              <p className="text-sm text-slate-600">Total interest: <strong className="text-rose-600">{currency(debtPayoffPlan.snowballInterest)}</strong></p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#00b4d8]/5 to-[#00b4d8]/10 rounded-2xl border-2 border-[#00b4d8]/20 p-6">
            <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
              Debt Avalanche
              <span className="text-xs px-2 py-1 bg-[#00b4d8]/50 text-white rounded-full">Recommended</span>
            </h4>
            <p className="text-sm text-[#00b4d8] mb-4">Pay highest interest first to save money</p>
            <div className="space-y-2 mb-4">
              {debtPayoffPlan.avalanche.map((d, i) => (
                <div key={d.id} className="flex items-center gap-2 text-sm">
                  <span className="w-6 h-6 rounded-full bg-[#00b4d8]/50 text-white text-xs flex items-center justify-center">{i + 1}</span>
                  <span className="text-slate-700">{d.name}</span>
                  <span className="text-amber-600 ml-auto font-medium">{d.interestRate}% APR</span>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-[#00b4d8]/20">
              <p className="text-sm text-slate-600">Est. payoff: <strong>{Math.ceil(debtPayoffPlan.avalancheMonths / 12)} years</strong></p>
              <p className="text-sm text-slate-600">Total interest: <strong className="text-[#00b4d8]">{currency(debtPayoffPlan.avalancheInterest)}</strong></p>
              <p className="text-sm font-semibold text-green-700 mt-2">Save {currency(debtPayoffPlan.interestSavings)} vs snowball!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
