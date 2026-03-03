import { Building2, Shield, Link2, Unlink } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

export default function Accounts() {
  const linkedAccounts = useAppStore(s => s.linkedAccounts);
  const setLinkedAccounts = useAppStore(s => s.setLinkedAccounts);
  const setModal = useAppStore(s => s.setModal);

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0f172a]/5 via-white to-[#14b8a6]/5 border-2 border-[#1e3a5f]/20 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#14b8a6] shadow-lg"><Shield size={24} className="text-white" /></div>
          <div><h3 className="font-semibold text-lg text-slate-900 mb-2">Secure Bank Connection</h3><p className="text-slate-500 text-sm">Transactions auto-marked as paid when cleared</p></div>
        </div>
      </div>
      {linkedAccounts.length > 0 ? linkedAccounts.map(acc => (
        <div key={acc.id} className="bg-gradient-to-r from-white via-[#1e3a5f]/5 to-[#14b8a6]/5 rounded-2xl border-2 border-[#14b8a6]/20 shadow-sm p-6">
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
      )) : (
        <div className="bg-gradient-to-r from-white via-[#1e3a5f]/5 to-[#14b8a6]/5 rounded-2xl border-2 border-[#1e3a5f]/20 shadow-sm p-8 text-center">
          <Building2 className="mx-auto text-blue-300 mb-4" size={48} />
          <h3 className="font-bold text-slate-900 mb-2">No Banks Connected</h3>
          <p className="text-slate-500 text-sm mb-4">Connect your bank to auto-track payments</p>
          <button onClick={() => setModal('connect')} className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#1e3a5f] to-[#14b8a6] text-white rounded-xl font-medium hover:from-blue-700 hover:to-green-600 shadow-lg transition-all">
            <Link2 size={18} />Connect Bank
          </button>
        </div>
      )}
    </div>
  );
}
