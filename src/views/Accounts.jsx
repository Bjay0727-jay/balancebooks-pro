import { useState } from 'react';
import { Building2, Shield, Link2, Unlink, Plus, Edit2, Trash2 } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { currency } from '../utils/formatters';
import Modal from '../components/Modal';

const ACCOUNT_TYPES = [
  { id: 'checking', name: 'Checking', icon: '🏦' },
  { id: 'savings', name: 'Savings', icon: '💰' },
  { id: 'credit', name: 'Credit Card', icon: '💳' },
  { id: 'cash', name: 'Cash', icon: '💵' },
  { id: 'investment', name: 'Investment', icon: '📈' },
];

const ACCOUNT_COLORS = ['#1e3a5f', '#14b8a6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16'];

function AccountForm({ account, onSubmit, onCancel }) {
  const [name, setName] = useState(account?.name || '');
  const [type, setType] = useState(account?.type || 'checking');
  const [icon, setIcon] = useState(account?.icon || '🏦');
  const [color, setColor] = useState(account?.color || '#1e3a5f');
  const [initialBalance, setInitialBalance] = useState(account?.initialBalance?.toString() || '0');

  const handleTypeChange = (t) => {
    setType(t);
    const at = ACCOUNT_TYPES.find(a => a.id === t);
    if (at) setIcon(at.icon);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-slate-600 font-medium mb-2">Account Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chase Checking" className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-[#14b8a6] focus:outline-none" autoFocus />
      </div>
      <div>
        <label className="block text-sm text-slate-600 font-medium mb-2">Account Type</label>
        <div className="grid grid-cols-5 gap-2">
          {ACCOUNT_TYPES.map(at => (
            <button key={at.id} onClick={() => handleTypeChange(at.id)} className={`flex flex-col items-center p-2 rounded-xl border-2 transition-all ${type === at.id ? 'border-[#14b8a6] bg-[#14b8a6]/5' : 'border-slate-200 hover:border-slate-300'}`}>
              <span className="text-xl">{at.icon}</span>
              <span className="text-[10px] text-slate-600 mt-1">{at.name}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm text-slate-600 font-medium mb-2">Color</label>
        <div className="flex gap-2">
          {ACCOUNT_COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)} className={`w-8 h-8 rounded-full border-2 ${color === c ? 'border-slate-900 scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm text-slate-600 font-medium mb-2">Initial Balance</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
          <input type="number" value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-[#14b8a6] focus:outline-none font-bold text-lg" />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onCancel} className="flex-1 py-3 bg-slate-100 rounded-xl text-slate-700 font-medium">Cancel</button>
        <button onClick={() => { if (!name.trim()) return; onSubmit({ ...(account || {}), name: name.trim(), type, icon, color, initialBalance: parseFloat(initialBalance) || 0 }); }} disabled={!name.trim()} className="flex-1 py-3 bg-gradient-to-r from-[#1e3a5f] to-[#14b8a6] text-white rounded-xl font-semibold shadow-lg disabled:opacity-50">
          {account ? 'Update' : 'Add Account'}
        </button>
      </div>
    </div>
  );
}

export default function Accounts() {
  const accounts = useAppStore(s => s.accounts);
  const transactions = useAppStore(s => s.transactions);
  const addAccount = useAppStore(s => s.addAccount);
  const updateAccount = useAppStore(s => s.updateAccount);
  const deleteAccount = useAppStore(s => s.deleteAccount);
  const linkedAccounts = useAppStore(s => s.linkedAccounts);
  const setLinkedAccounts = useAppStore(s => s.setLinkedAccounts);
  const setModal = useAppStore(s => s.setModal);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editAcct, setEditAcct] = useState(null);

  const getAccountBalance = (accountId) => {
    const acctTxs = transactions.filter(t => (t.accountId || 'primary') === accountId);
    const acct = accounts.find(a => a.id === accountId);
    const initial = acct?.initialBalance || 0;
    return initial + acctTxs.reduce((s, t) => s + t.amount, 0);
  };

  const totalBalance = accounts.reduce((s, a) => s + getAccountBalance(a.id), 0);

  return (
    <div className="space-y-6">
      {/* Total Balance */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#1e3a5f] to-[#14b8a6] text-white shadow-lg">
        <p className="text-sm text-white/70 font-medium">Total Balance (All Accounts)</p>
        <p className="text-3xl font-bold mt-1">{currency(totalBalance)}</p>
        <p className="text-sm text-white/60 mt-2">{accounts.length} account{accounts.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Account Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts.map(acct => {
          const balance = getAccountBalance(acct.id);
          const txCount = transactions.filter(t => (t.accountId || 'primary') === acct.id).length;
          return (
            <div key={acct.id} className="bg-white rounded-2xl border-2 border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm" style={{ backgroundColor: acct.color + '20', borderColor: acct.color, borderWidth: 2 }}>
                    {acct.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{acct.name}</h4>
                    <p className="text-xs text-slate-500 capitalize">{acct.type} &bull; {txCount} transactions</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setEditAcct(acct)} className="p-2 rounded-lg hover:bg-[#14b8a6]/10 text-slate-400 hover:text-[#14b8a6]"><Edit2 size={14} /></button>
                  {acct.id !== 'primary' && (
                    <button onClick={() => { if (confirm(`Delete "${acct.name}"? Transactions will move to Primary Account.`)) deleteAccount(acct.id); }} className="p-2 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600"><Trash2 size={14} /></button>
                  )}
                </div>
              </div>
              <p className={`text-2xl font-bold ${balance >= 0 ? 'text-[#14b8a6]' : 'text-rose-600'}`}>{currency(balance)}</p>
            </div>
          );
        })}

        {/* Add Account Card */}
        <button onClick={() => setShowAddModal(true)} className="bg-gradient-to-r from-[#0f172a]/5 to-[#14b8a6]/5 rounded-2xl border-2 border-dashed border-[#1e3a5f]/20 p-8 text-center hover:border-[#14b8a6] transition-all">
          <Plus className="mx-auto text-[#14b8a6] mb-2" size={24} />
          <p className="font-medium text-slate-600">Add Account</p>
          <p className="text-xs text-slate-400 mt-1">Track multiple accounts separately</p>
        </button>
      </div>

      {/* Bank Connection */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0f172a]/5 via-white to-[#14b8a6]/5 border-2 border-[#1e3a5f]/20 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#14b8a6] shadow-lg"><Shield size={24} className="text-white" /></div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-slate-900 mb-2">Secure Bank Connection</h3>
            <p className="text-slate-500 text-sm">Auto-import transactions from your bank (coming soon)</p>
          </div>
          <button onClick={() => setModal('connect')} className="px-4 py-2 bg-gradient-to-r from-[#1e3a5f] to-[#14b8a6] text-white rounded-xl font-medium text-sm shadow-sm">
            <Link2 size={16} className="inline mr-1" />Connect
          </button>
        </div>
      </div>

      {linkedAccounts.length > 0 && linkedAccounts.map(acc => (
        <div key={acc.id} className="bg-white rounded-2xl border-2 border-[#14b8a6]/20 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#14b8a6] flex items-center justify-center text-white font-bold text-xl shadow-lg">{acc.institution.charAt(0)}</div>
              <div><h4 className="font-bold text-slate-900">{acc.institution}</h4><p className="text-xs text-[#14b8a6] font-medium">Auto-marking enabled</p></div>
            </div>
            <button onClick={() => setLinkedAccounts([])} className="px-3 py-2 rounded-xl bg-rose-100 text-rose-600 hover:bg-rose-200"><Unlink size={14} /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">{acc.accounts.map(a => (
            <div key={a.id} className="p-3 rounded-xl bg-white border-2 border-[#1e3a5f]/10"><p className="text-sm font-medium text-slate-700">{a.subtype}</p><p className="text-xs text-slate-400">{a.mask}</p></div>
          ))}</div>
        </div>
      ))}

      {showAddModal && (
        <Modal title="Add Account" onClose={() => setShowAddModal(false)}>
          <AccountForm onSubmit={(acct) => { addAccount(acct); setShowAddModal(false); }} onCancel={() => setShowAddModal(false)} />
        </Modal>
      )}

      {editAcct && (
        <Modal title="Edit Account" onClose={() => setEditAcct(null)}>
          <AccountForm account={editAcct} onSubmit={(acct) => { updateAccount(acct); setEditAcct(null); }} onCancel={() => setEditAcct(null)} />
        </Modal>
      )}
    </div>
  );
}
