import { Search, Receipt, Download, Trash2, Plus, Check, Edit2, Copy, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { CATEGORIES } from '../utils/constants';
import { useAppStore } from '../stores/useAppStore';
import { useFinancialData } from '../hooks/useFinancialData';
import { currency, shortDate } from '../utils/formatters';

const TX_PAGE_SIZE = 25;

export default function Transactions() {
  const transactions = useAppStore(s => s.transactions);
  const recurringExpenses = useAppStore(s => s.recurringExpenses);
  const monthlyBalances = useAppStore(s => s.monthlyBalances);
  const savingsGoal = useAppStore(s => s.savingsGoal);
  const budgetGoals = useAppStore(s => s.budgetGoals);
  const debts = useAppStore(s => s.debts);
  const search = useAppStore(s => s.search);
  const filterCat = useAppStore(s => s.filterCat);
  const filterPaid = useAppStore(s => s.filterPaid);
  const txPage = useAppStore(s => s.txPage);
  const setSearch = useAppStore(s => s.setSearch);
  const setFilterCat = useAppStore(s => s.setFilterCat);
  const setFilterPaid = useAppStore(s => s.setFilterPaid);
  const setTxPage = useAppStore(s => s.setTxPage);
  const setTransactions = useAppStore(s => s.setTransactions);
  const setEditTx = useAppStore(s => s.setEditTx);
  const setModal = useAppStore(s => s.setModal);
  const deleteTx = useAppStore(s => s.deleteTx);
  const duplicateTx = useAppStore(s => s.duplicateTx);
  const togglePaid = useAppStore(s => s.togglePaid);
  const { filtered } = useFinancialData();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px] relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#14b8a6]" size={18} /><input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gradient-to-r from-[#0f172a]/5 to-white border-2 border-[#1e3a5f]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14b8a6]" /></div>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="px-4 py-3 bg-gradient-to-r from-[#0f172a]/5 to-white border-2 border-[#1e3a5f]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"><option value="all">All Categories</option>{CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select>
        <select value={filterPaid} onChange={(e) => setFilterPaid(e.target.value)} className="px-4 py-3 bg-gradient-to-r from-[#14b8a6]/5 to-white border-2 border-[#14b8a6]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"><option value="all">All Status</option><option value="paid">Paid</option><option value="unpaid">Unpaid</option></select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Receipt size={16} className="text-blue-500" />
          <span><strong>{filtered.length}</strong> transactions {filterCat !== 'all' || filterPaid !== 'all' || search ? '(filtered)' : ''}</span>
          {transactions.length > 0 && <span className="text-slate-400">Total: {transactions.length}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const data = { version: __APP_VERSION__, exportDate: new Date().toISOString(), transactions, recurringExpenses, monthlyBalances, savingsGoal, budgetGoals, debts };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `balance-books-backup-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#1e3a5f] to-[#14b8a6] text-white rounded-lg font-medium hover:from-[#1e3a5f] hover:to-[#0f172a] shadow-sm text-sm"
          >
            <Download size={16} /><span>Backup All</span>
          </button>
          {(filterCat !== 'all' || filterPaid !== 'all' || search) && filtered.length > 0 && (
            <button
              onClick={() => {
                if (confirm(`Delete ${filtered.length} filtered transactions?\n\nThis will only delete the currently visible transactions matching your filters.\n\nThis cannot be undone.`)) {
                  const idsToDelete = new Set(filtered.map(t => t.id));
                  setTransactions(transactions.filter(t => !idsToDelete.has(t.id)));
                  setSearch(''); setFilterCat('all'); setFilterPaid('all');
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg font-medium hover:from-amber-600 hover:to-amber-700 shadow-sm text-sm"
            >
              <Trash2 size={16} /><span>Delete Filtered ({filtered.length})</span>
            </button>
          )}
          <button
            onClick={() => {
              if (confirm(`DELETE ALL ${transactions.length} TRANSACTIONS?\n\nThis will permanently remove ALL your transaction data.\n\nTip: Use "Backup All" first to save your data.\n\nThis cannot be undone!`)) {
                if (confirm('Are you absolutely sure? Type "yes" in your mind and click OK to confirm.')) {
                  setTransactions([]); setSearch(''); setFilterCat('all'); setFilterPaid('all');
                }
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-lg font-medium hover:from-rose-600 hover:to-rose-700 shadow-sm text-sm"
            disabled={transactions.length === 0}
          >
            <Trash2 size={16} /><span>Delete All</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border-2 border-[#1e3a5f]/10 shadow-sm divide-y divide-slate-100">
        {filtered.length > 0 ? filtered.slice(txPage * TX_PAGE_SIZE, (txPage + 1) * TX_PAGE_SIZE).map(tx => {
          const cat = CATEGORIES.find(c => c.id === tx.category);
          return (
            <div key={tx.id} className="flex items-center justify-between px-4 py-3 hover:bg-gradient-to-r hover:from-[#0f172a]/5/50 hover:to-[#14b8a6]/5/50">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <button onClick={() => togglePaid(tx.id)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${tx.paid ? 'bg-gradient-to-r from-[#14b8a6]/50 to-green-400 border-green-500' : 'border-blue-300 hover:border-green-400'}`}>{tx.paid && <Check size={14} className="text-white" />}</button>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ backgroundColor: cat?.bg }}>{cat?.icon}</div>
                <div className="min-w-0"><p className={`font-medium text-sm truncate ${tx.paid ? 'text-slate-900' : 'text-slate-600'}`}>{tx.desc}</p><p className="text-xs text-slate-500">{shortDate(tx.date)}</p></div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-bold text-sm ${tx.amount > 0 ? 'text-[#14b8a6]' : 'text-slate-900'}`}>{currency(tx.amount)}</span>
                <button onClick={() => duplicateTx(tx)} title="Duplicate" className="p-2 rounded-lg hover:bg-blue-100 text-slate-400 hover:text-blue-600"><Copy size={14} /></button>
                <button onClick={() => setEditTx(tx)} title="Edit" className="p-2 rounded-lg hover:bg-[#14b8a6]/10 text-[#14b8a6]"><Edit2 size={14} /></button>
                <button onClick={() => deleteTx(tx.id)} title="Delete" className="p-2 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600"><Trash2 size={14} /></button>
              </div>
            </div>
          );
        }) : (
          <div className="p-12 text-center">
            <Receipt className="mx-auto text-slate-300 mb-4" size={48} />
            <h3 className="font-semibold text-slate-600 mb-2">No transactions found</h3>
            <p className="text-sm text-slate-400 mb-4">{search || filterCat !== 'all' || filterPaid !== 'all' ? 'Try adjusting your filters' : 'Add your first transaction to get started'}</p>
            {!(search || filterCat !== 'all' || filterPaid !== 'all') && (
              <button onClick={() => setModal('add')} className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#1e3a5f] to-[#14b8a6] text-white rounded-lg font-medium hover:shadow-lg"><Plus size={16} />Add Transaction</button>
            )}
          </div>
        )}
        {filtered.length > TX_PAGE_SIZE && (
          <div className="p-4 flex items-center justify-between bg-slate-50">
            <span className="text-sm text-slate-500">Showing {txPage * TX_PAGE_SIZE + 1}-{Math.min((txPage + 1) * TX_PAGE_SIZE, filtered.length)} of {filtered.length}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setTxPage(Math.max(0, txPage - 1))} disabled={txPage === 0} className="px-3 py-1 rounded-lg text-sm font-medium bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40"><ChevronLeft size={16} className="inline" /> Prev</button>
              <span className="text-sm text-slate-600 font-medium">Page {txPage + 1} of {Math.ceil(filtered.length / TX_PAGE_SIZE)}</span>
              <button onClick={() => setTxPage(Math.min(Math.ceil(filtered.length / TX_PAGE_SIZE) - 1, txPage + 1))} disabled={(txPage + 1) * TX_PAGE_SIZE >= filtered.length} className="px-3 py-1 rounded-lg text-sm font-medium bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40">Next <ChevronRight size={16} className="inline" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
