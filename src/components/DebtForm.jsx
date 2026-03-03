import { useState } from 'react';

export default function DebtForm({ debt, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: debt?.name || '',
    balance: debt?.balance || '',
    interestRate: debt?.interestRate || '',
    minPayment: debt?.minPayment || '',
    type: debt?.type || 'credit-card'
  });
  const handle = (e) => {
    e.preventDefault();
    onSubmit({
      ...debt,
      ...form,
      balance: parseFloat(form.balance),
      interestRate: parseFloat(form.interestRate),
      minPayment: parseFloat(form.minPayment)
    });
  };
  return (
    <form onSubmit={handle} className="space-y-4">
      <div>
        <label className="block text-sm text-slate-600 font-medium mb-2">Debt Name</label>
        <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Chase Visa, Car Loan" className="w-full px-4 py-3 bg-gradient-to-r from-rose-50 to-white border-2 border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500" required />
      </div>
      <div>
        <label className="block text-sm text-slate-600 font-medium mb-2">Debt Type</label>
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-4 py-3 bg-white border-2 border-[#12233d]/20 rounded-xl focus:ring-2 focus:ring-[#00b4d8]">
          <option value="credit-card">Credit Card</option>
          <option value="car-loan">Car Loan</option>
          <option value="student-loan">Student Loan</option>
          <option value="mortgage">Mortgage</option>
          <option value="personal-loan">Personal Loan</option>
          <option value="medical">Medical Debt</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <label className="block text-sm text-slate-600 font-medium mb-2">Current Balance</label>
        <input type="number" step="0.01" min="0" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} placeholder="0.00" className="w-full px-4 py-3 bg-gradient-to-r from-rose-50 to-white border-2 border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-600 font-medium mb-2">Interest Rate (%)</label>
          <input type="number" step="0.1" min="0" max="100" value={form.interestRate} onChange={(e) => setForm({ ...form, interestRate: e.target.value })} placeholder="18.9" className="w-full px-4 py-3 bg-white border-2 border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500" required />
        </div>
        <div>
          <label className="block text-sm text-slate-600 font-medium mb-2">Min Payment</label>
          <input type="number" step="0.01" min="0" value={form.minPayment} onChange={(e) => setForm({ ...form, minPayment: e.target.value })} placeholder="50.00" className="w-full px-4 py-3 bg-white border-2 border-[#12233d]/20 rounded-xl focus:ring-2 focus:ring-[#00b4d8]" required />
        </div>
      </div>
      <div className="flex gap-3 pt-4">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-3 bg-slate-100 rounded-xl text-slate-700 font-medium hover:bg-slate-200">Cancel</button>
        <button type="submit" className="flex-1 px-4 py-3 bg-gradient-to-r from-rose-600 to-orange-500 text-white rounded-xl font-semibold shadow-lg hover:from-rose-700 hover:to-orange-600">{debt ? 'Update' : 'Add Debt'}</button>
      </div>
    </form>
  );
}
