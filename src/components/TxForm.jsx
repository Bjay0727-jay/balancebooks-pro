import { useState } from 'react';
import { CATEGORIES } from '../utils/constants';
import { Plus, Trash2, Split } from 'lucide-react';

export default function TxForm({ tx, onSubmit, onCancel, showPaid }) {
  const initType = tx?.amount > 0 ? 'income' : 'expense';
  const [form, setForm] = useState({
    date: tx?.date || new Date().toISOString().split('T')[0],
    desc: tx?.desc || '',
    amount: tx ? Math.abs(tx.amount) : '',
    type: initType,
    category: tx?.category || 'other',
    paid: tx ? (tx.paid || false) : (initType === 'income'),
  });
  const [splitMode, setSplitMode] = useState(() => !!(tx?.splits?.length));
  const [splits, setSplits] = useState(() =>
    tx?.splits?.length
      ? tx.splits.map(s => ({ category: s.category, amount: String(Math.abs(s.amount)) }))
      : []
  );

  const expenseCats = CATEGORIES.filter(c => c.id !== 'income');

  const addSplit = () => {
    setSplits(prev => [...prev, { category: 'other', amount: '' }]);
  };

  const updateSplit = (index, field, value) => {
    setSplits(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const removeSplit = (index) => {
    setSplits(prev => prev.filter((_, i) => i !== index));
  };

  const splitsTotal = splits.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
  const totalAmount = parseFloat(form.amount) || 0;
  const unallocated = totalAmount - splitsTotal;

  const handle = (e) => {
    e.preventDefault();
    const amt = form.type === 'income' ? Math.abs(totalAmount) : -Math.abs(totalAmount);
    const txData = {
      ...tx,
      date: form.date,
      desc: form.desc,
      amount: amt,
      category: form.category,
      paid: form.paid,
    };
    if (splitMode && splits.length > 0) {
      const sign = form.type === 'income' ? 1 : -1;
      txData.splits = splits
        .filter(s => parseFloat(s.amount) > 0)
        .map(s => ({ category: s.category, amount: sign * Math.abs(parseFloat(s.amount)) }));
    } else {
      delete txData.splits;
    }
    onSubmit(txData);
  };

  const toggleSplitMode = () => {
    if (!splitMode && splits.length === 0) {
      // Pre-populate with current category and full amount
      setSplits([{ category: form.category, amount: form.amount ? String(form.amount) : '' }]);
    }
    setSplitMode(!splitMode);
  };

  return (
    <form onSubmit={handle} className="space-y-4">
      <div>
        <label className="block text-sm text-slate-600 font-medium mb-2">Date</label>
        <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-4 py-3 bg-gradient-to-r from-[#0f172a]/5 to-white border-2 border-[#1e3a5f]/20 rounded-xl focus:ring-2 focus:ring-[#14b8a6]" required />
      </div>
      <div>
        <label className="block text-sm text-slate-600 font-medium mb-2">Description</label>
        <input type="text" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} placeholder="Enter description" className="w-full px-4 py-3 bg-white border-2 border-[#1e3a5f]/20 rounded-xl focus:ring-2 focus:ring-[#14b8a6]" required />
      </div>
      <div>
        <label className="block text-sm text-slate-600 font-medium mb-2">Amount</label>
        <input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" className="w-full px-4 py-3 bg-gradient-to-r from-[#14b8a6]/5 to-white border-2 border-[#14b8a6]/20 rounded-xl focus:ring-2 focus:ring-[#14b8a6]" required />
      </div>
      <div>
        <label className="block text-sm text-slate-600 font-medium mb-2">Type</label>
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, category: e.target.value === 'income' ? 'income' : form.category, paid: e.target.value === 'income' ? true : form.paid })} className="w-full px-4 py-3 bg-white border-2 border-[#1e3a5f]/20 rounded-xl focus:ring-2 focus:ring-[#14b8a6]">
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
      </div>

      {/* Category (hidden when in split mode with splits) */}
      {!(splitMode && splits.length > 0) && (
        <div>
          <label className="block text-sm text-slate-600 font-medium mb-2">Category</label>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-3 bg-white border-2 border-[#1e3a5f]/20 rounded-xl focus:ring-2 focus:ring-[#14b8a6]">
            {CATEGORIES.filter(c => form.type === 'income' ? c.id === 'income' : c.id !== 'income').map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </div>
      )}

      {/* Split Transaction Toggle */}
      {form.type === 'expense' && (
        <button
          type="button"
          onClick={toggleSplitMode}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${splitMode ? 'bg-purple-100 text-purple-700 border border-purple-300' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
        >
          <Split size={14} />
          {splitMode ? 'Cancel Split' : 'Split Across Categories'}
        </button>
      )}

      {/* Split Allocations */}
      {splitMode && form.type === 'expense' && (
        <div className="space-y-3 p-3 bg-purple-50 rounded-xl border border-purple-200">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-purple-800">Category Splits</p>
            {totalAmount > 0 && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${Math.abs(unallocated) < 0.01 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {Math.abs(unallocated) < 0.01 ? 'Fully allocated' : `$${unallocated.toFixed(2)} unallocated`}
              </span>
            )}
          </div>
          {splits.map((split, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                value={split.category}
                onChange={(e) => updateSplit(i, 'category', e.target.value)}
                className="flex-1 px-3 py-2 bg-white border border-purple-200 rounded-lg text-sm focus:ring-2 focus:ring-[#14b8a6]"
              >
                {expenseCats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
              <div className="relative w-28">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={split.amount}
                  onChange={(e) => updateSplit(i, 'amount', e.target.value)}
                  className="w-full pl-7 pr-2 py-2 bg-white border border-purple-200 rounded-lg text-sm text-right font-medium focus:ring-2 focus:ring-[#14b8a6]"
                />
              </div>
              <button type="button" onClick={() => removeSplit(i)} className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg" aria-label="Remove split">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button type="button" onClick={addSplit} className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800 font-medium">
            <Plus size={14} /> Add Split
          </button>
        </div>
      )}

      {showPaid && (
        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-gradient-to-r from-[#14b8a6]/5 to-blue-50 border-2 border-[#14b8a6]/20">
          <input type="checkbox" checked={form.paid} onChange={(e) => setForm({ ...form, paid: e.target.checked })} className="w-5 h-5 rounded border-green-300 text-[#14b8a6] focus:ring-[#14b8a6]" />
          <span className="text-slate-700 font-medium">Mark as paid</span>
        </label>
      )}
      <div className="flex gap-3 pt-4">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-3 bg-slate-100 rounded-xl text-slate-700 font-medium hover:bg-slate-200">Cancel</button>
        <button type="submit" className="flex-1 px-4 py-3 bg-gradient-to-r from-[#1e3a5f] to-[#14b8a6] text-white rounded-xl font-semibold shadow-lg hover:from-blue-700 hover:to-green-600">{tx ? 'Update' : 'Add'}</button>
      </div>
    </form>
  );
}
