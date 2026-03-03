import { useState } from 'react';
import { CATEGORIES } from '../utils/constants';

export default function TxForm({ tx, onSubmit, onCancel, showPaid }) {
  const initType = tx?.amount > 0 ? 'income' : 'expense';
  const [form, setForm] = useState({ date: tx?.date || new Date().toISOString().split('T')[0], desc: tx?.desc || '', amount: tx ? Math.abs(tx.amount) : '', type: initType, category: tx?.category || 'other', paid: tx ? (tx.paid || false) : (initType === 'income') });
  const handle = (e) => { e.preventDefault(); const amt = form.type === 'income' ? Math.abs(parseFloat(form.amount)) : -Math.abs(parseFloat(form.amount)); onSubmit({ ...tx, date: form.date, desc: form.desc, amount: amt, category: form.category, paid: form.paid }); };
  return (
    <form onSubmit={handle} className="space-y-4">
      <div><label className="block text-sm text-slate-600 font-medium mb-2">Date</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-4 py-3 bg-gradient-to-r from-[#0f172a]/5 to-white border-2 border-[#1e3a5f]/20 rounded-xl focus:ring-2 focus:ring-[#14b8a6]" required /></div>
      <div><label className="block text-sm text-slate-600 font-medium mb-2">Description</label><input type="text" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} placeholder="Enter description" className="w-full px-4 py-3 bg-white border-2 border-[#1e3a5f]/20 rounded-xl focus:ring-2 focus:ring-[#14b8a6]" required /></div>
      <div><label className="block text-sm text-slate-600 font-medium mb-2">Amount</label><input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" className="w-full px-4 py-3 bg-gradient-to-r from-[#14b8a6]/5 to-white border-2 border-[#14b8a6]/20 rounded-xl focus:ring-2 focus:ring-[#14b8a6]" required /></div>
      <div><label className="block text-sm text-slate-600 font-medium mb-2">Type</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, category: e.target.value === 'income' ? 'income' : form.category, paid: e.target.value === 'income' ? true : form.paid })} className="w-full px-4 py-3 bg-white border-2 border-[#1e3a5f]/20 rounded-xl focus:ring-2 focus:ring-[#14b8a6]"><option value="expense">Expense</option><option value="income">Income</option></select></div>
      <div><label className="block text-sm text-slate-600 font-medium mb-2">Category</label><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-3 bg-white border-2 border-[#1e3a5f]/20 rounded-xl focus:ring-2 focus:ring-[#14b8a6]">{CATEGORIES.filter(c => form.type === 'income' ? c.id === 'income' : c.id !== 'income').map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select></div>
      {showPaid && <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-gradient-to-r from-[#14b8a6]/5 to-blue-50 border-2 border-[#14b8a6]/20"><input type="checkbox" checked={form.paid} onChange={(e) => setForm({ ...form, paid: e.target.checked })} className="w-5 h-5 rounded border-green-300 text-[#14b8a6] focus:ring-[#14b8a6]" /><span className="text-slate-700 font-medium">Mark as paid</span></label>}
      <div className="flex gap-3 pt-4"><button type="button" onClick={onCancel} className="flex-1 px-4 py-3 bg-slate-100 rounded-xl text-slate-700 font-medium hover:bg-slate-200">Cancel</button><button type="submit" className="flex-1 px-4 py-3 bg-gradient-to-r from-[#1e3a5f] to-[#14b8a6] text-white rounded-xl font-semibold shadow-lg hover:from-blue-700 hover:to-green-600">{tx ? 'Update' : 'Add'}</button></div>
    </form>
  );
}
