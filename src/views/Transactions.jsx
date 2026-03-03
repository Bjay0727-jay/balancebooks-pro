import { useState } from 'react';
import { Search, Receipt, Download, Trash2, Plus, Check, Edit2, Copy, ChevronLeft, ChevronRight, SlidersHorizontal, X, Globe, Split } from 'lucide-react';
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
  const accounts = useAppStore(s => s.accounts);
  const search = useAppStore(s => s.search);
  const filterCat = useAppStore(s => s.filterCat);
  const filterPaid = useAppStore(s => s.filterPaid);
  const filterAmountMin = useAppStore(s => s.filterAmountMin);
  const filterAmountMax = useAppStore(s => s.filterAmountMax);
  const filterDateFrom = useAppStore(s => s.filterDateFrom);
  const filterDateTo = useAppStore(s => s.filterDateTo);
  const searchAllMonths = useAppStore(s => s.searchAllMonths);
  const filterAccount = useAppStore(s => s.filterAccount);
  const txPage = useAppStore(s => s.txPage);
  const setSearch = useAppStore(s => s.setSearch);
  const setFilterCat = useAppStore(s => s.setFilterCat);
  const setFilterPaid = useAppStore(s => s.setFilterPaid);
  const setFilterAmountMin = useAppStore(s => s.setFilterAmountMin);
  const setFilterAmountMax = useAppStore(s => s.setFilterAmountMax);
  const setFilterDateFrom = useAppStore(s => s.setFilterDateFrom);
  const setFilterDateTo = useAppStore(s => s.setFilterDateTo);
  const setSearchAllMonths = useAppStore(s => s.setSearchAllMonths);
  const setFilterAccount = useAppStore(s => s.setFilterAccount);
  const setTxPage = useAppStore(s => s.setTxPage);
  const setTransactions = useAppStore(s => s.setTransactions);
  const setEditTx = useAppStore(s => s.setEditTx);
  const setModal = useAppStore(s => s.setModal);
  const deleteTx = useAppStore(s => s.deleteTx);
  const duplicateTx = useAppStore(s => s.duplicateTx);
  const togglePaid = useAppStore(s => s.togglePaid);
  const { filtered } = useFinancialData();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const hasAdvancedFilters = filterAmountMin !== '' || filterAmountMax !== '' || filterDateFrom || filterDateTo || searchAllMonths || filterAccount !== 'all';

  const clearAllFilters = () => {
    setSearch(''); setFilterCat('all'); setFilterPaid('all');
    setFilterAmountMin(''); setFilterAmountMax('');
    setFilterDateFrom(''); setFilterDateTo('');
    setSearchAllMonths(false); setFilterAccount('all'); setTxPage(0);
  };

  const isFiltered = filterCat !== 'all' || filterPaid !== 'all' || search || hasAdvancedFilters;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px] relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#14b8a6]" size={18} /><input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gradient-to-r from-[#0f172a]/5 to-white border-2 border-[#1e3a5f]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14b8a6]" /></div>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="px-4 py-3 bg-gradient-to-r from-[#0f172a]/5 to-white border-2 border-[#1e3a5f]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"><option value="all">All Categories</option>{CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select>
        <select value={filterPaid} onChange={(e) => setFilterPaid(e.target.value)} className="px-4 py-3 bg-gradient-to-r from-[#14b8a6]/5 to-white border-2 border-[#14b8a6]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"><option value="all">All Status</option><option value="paid">Paid</option><option value="unpaid">Unpaid</option></select>
        <button onClick={() => setShowAdvanced(!showAdvanced)} className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 font-medium transition-colors ${showAdvanced || hasAdvancedFilters ? 'bg-[#14b8a6]/10 border-[#14b8a6] text-[#14b8a6]' : 'border-[#1e3a5f]/20 text-slate-600 hover:border-[#14b8a6]/50'}`}>
          <SlidersHorizontal size={18} />
          <span className="hidden sm:inline">Filters</span>
          {hasAdvancedFilters && <span className="w-2 h-2 bg-[#14b8a6] rounded-full" />}
        </button>
      </div>

      {showAdvanced && (
        <div className="bg-gradient-to-r from-[#0f172a]/5 to-[#14b8a6]/5 rounded-xl p-4 border border-[#1e3a5f]/20 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-700">Advanced Filters</h4>
            {hasAdvancedFilters && <button onClick={clearAllFilters} className="text-xs text-[#14b8a6] hover:underline flex items-center gap-1"><X size={12} />Clear all</button>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Min Amount ($)</label>
              <input type="number" min="0" step="0.01" placeholder="0.00" value={filterAmountMin} onChange={(e) => { setFilterAmountMin(e.target.value); setTxPage(0); }} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#14b8a6] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Max Amount ($)</label>
              <input type="number" min="0" step="0.01" placeholder="No limit" value={filterAmountMax} onChange={(e) => { setFilterAmountMax(e.target.value); setTxPage(0); }} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#14b8a6] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">From Date</label>
              <input type="date" value={filterDateFrom} onChange={(e) => { setFilterDateFrom(e.target.value); setTxPage(0); }} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#14b8a6] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">To Date</label>
              <input type="date" value={filterDateTo} onChange={(e) => { setFilterDateTo(e.target.value); setTxPage(0); }} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#14b8a6] focus:outline-none" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button onClick={() => { setSearchAllMonths(!searchAllMonths); setTxPage(0); }} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${searchAllMonths ? 'bg-[#14b8a6] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-[#14b8a6]'}`}>
              <Globe size={14} />Search all months
            </button>
            {accounts.length > 1 && (
              <select value={filterAccount} onChange={(e) => { setFilterAccount(e.target.value); setTxPage(0); }} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#14b8a6] focus:outline-none">
                <option value="all">All Accounts</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
              </select>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Receipt size={16} className="text-blue-500" />
          <span><strong>{filtered.length}</strong> transactions {isFiltered ? '(filtered)' : ''}</span>
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
          {isFiltered && filtered.length > 0 && (
            <button
              onClick={() => {
                if (confirm(`Delete ${filtered.length} filtered transactions?\n\nThis will only delete the currently visible transactions matching your filters.\n\nThis cannot be undone.`)) {
                  const idsToDelete = new Set(filtered.map(t => t.id));
                  setTransactions(transactions.filter(t => !idsToDelete.has(t.id)));
                  clearAllFilters();
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
                  setTransactions([]); clearAllFilters();
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
          const acct = accounts.length > 1 ? accounts.find(a => a.id === (tx.accountId || 'primary')) : null;
          return (
            <div key={tx.id} className="flex items-center justify-between px-4 py-3 hover:bg-gradient-to-r hover:from-[#0f172a]/5/50 hover:to-[#14b8a6]/5/50">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <button onClick={() => togglePaid(tx.id)} aria-label={tx.paid ? 'Mark as unpaid' : 'Mark as paid'} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${tx.paid ? 'bg-gradient-to-r from-[#14b8a6]/50 to-green-400 border-green-500' : 'border-blue-300 hover:border-green-400'}`}>{tx.paid && <Check size={14} className="text-white" />}</button>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ backgroundColor: cat?.bg }}>{cat?.icon}</div>
                <div className="min-w-0">
                  <p className={`font-medium text-sm truncate ${tx.paid ? 'text-slate-900' : 'text-slate-600'}`}>
                    {tx.desc}
                    {tx.autoGenerated && <span className="ml-1.5 text-[10px] text-[#14b8a6] bg-[#14b8a6]/10 px-1.5 py-0.5 rounded-full font-medium">auto</span>}
                    {tx.splits?.length > 0 && <span className="inline-flex items-center gap-0.5 ml-1.5 px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded text-[10px] font-semibold align-middle" title={`Split across ${tx.splits.length} categories`}><Split size={10} />{tx.splits.length}</span>}
                  </p>
                  <p className="text-xs text-slate-500">
                    {shortDate(tx.date)}
                    {acct && <span className="ml-1.5 text-[10px] text-slate-400">{acct.icon} {acct.name}</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-bold text-sm ${tx.amount > 0 ? 'text-[#14b8a6]' : 'text-slate-900'}`}>{currency(tx.amount)}</span>
                <button onClick={() => duplicateTx(tx)} title="Duplicate" aria-label="Duplicate transaction" className="p-2 rounded-lg hover:bg-blue-100 text-slate-400 hover:text-blue-600"><Copy size={14} /></button>
                <button onClick={() => setEditTx(tx)} title="Edit" aria-label="Edit transaction" className="p-2 rounded-lg hover:bg-[#14b8a6]/10 text-[#14b8a6]"><Edit2 size={14} /></button>
                <button onClick={() => deleteTx(tx.id)} title="Delete" aria-label="Delete transaction" className="p-2 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600"><Trash2 size={14} /></button>
              </div>
            </div>
          );
        }) : (
          <div className="p-12 text-center">
            <Receipt className="mx-auto text-slate-300 mb-4" size={48} />
            <h3 className="font-semibold text-slate-600 mb-2">No transactions found</h3>
            <p className="text-sm text-slate-400 mb-4">{isFiltered ? 'Try adjusting your filters' : 'Add your first transaction to get started'}</p>
            {!isFiltered && (
              <button onClick={() => setModal('add')} className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#1e3a5f] to-[#14b8a6] text-white rounded-lg font-medium hover:shadow-lg"><Plus size={16} />Add Transaction</button>
            )}
          </div>
        )}
        {filtered.length > TX_PAGE_SIZE && (
          <div className="p-4 flex items-center justify-between bg-slate-50">
            <span className="text-sm text-slate-500">Showing {txPage * TX_PAGE_SIZE + 1}-{Math.min((txPage + 1) * TX_PAGE_SIZE, filtered.length)} of {filtered.length}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setTxPage(Math.max(0, txPage - 1))} disabled={txPage === 0} aria-label="Previous page" className="px-3 py-1 rounded-lg text-sm font-medium bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40"><ChevronLeft size={16} className="inline" /> Prev</button>
              <span className="text-sm text-slate-600 font-medium">Page {txPage + 1} of {Math.ceil(filtered.length / TX_PAGE_SIZE)}</span>
              <button onClick={() => setTxPage(Math.min(Math.ceil(filtered.length / TX_PAGE_SIZE) - 1, txPage + 1))} disabled={(txPage + 1) * TX_PAGE_SIZE >= filtered.length} aria-label="Next page" className="px-3 py-1 rounded-lg text-sm font-medium bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40">Next <ChevronRight size={16} className="inline" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
