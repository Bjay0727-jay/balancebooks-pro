import { useState, useMemo } from 'react';
import { Search, Receipt, Download, Trash2, Plus, Check, Edit2, Copy, ChevronLeft, ChevronRight, SlidersHorizontal, X, Globe, Split, CheckSquare, Square, MinusSquare, DollarSign, RefreshCw, ArrowUpDown } from 'lucide-react';
import { CATEGORIES } from '../utils/constants';
import { useAppStore } from '../stores/useAppStore';
import { useFinancialData } from '../hooks/useFinancialData';
import { currency, shortDate } from '../utils/formatters';
import { uid } from '../utils/formatters';

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
  const bulkSetPaid = useAppStore(s => s.bulkSetPaid);
  const bulkDeleteTx = useAppStore(s => s.bulkDeleteTx);
  const addRecurring = useAppStore(s => s.addRecurring);
  const { filtered } = useFinancialData();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sortBy, setSortBy] = useState('date-desc');

  // Selection state
  const [selected, setSelected] = useState(new Set());

  const hasAdvancedFilters = filterAmountMin !== '' || filterAmountMax !== '' || filterDateFrom || filterDateTo || searchAllMonths || filterAccount !== 'all';

  const clearAllFilters = () => {
    setSearch(''); setFilterCat('all'); setFilterPaid('all');
    setFilterAmountMin(''); setFilterAmountMax('');
    setFilterDateFrom(''); setFilterDateTo('');
    setSearchAllMonths(false); setFilterAccount('all'); setTxPage(0);
  };

  const isFiltered = filterCat !== 'all' || filterPaid !== 'all' || search || hasAdvancedFilters;

  // Sorted list
  const sorted = useMemo(() => {
    if (sortBy === 'date-desc') return filtered; // default from useFinancialData
    const copy = [...filtered];
    switch (sortBy) {
      case 'date-asc':
        copy.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        break;
      case 'amount-desc':
        copy.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
        break;
      case 'amount-asc':
        copy.sort((a, b) => Math.abs(a.amount) - Math.abs(b.amount));
        break;
    }
    return copy;
  }, [filtered, sortBy]);

  // Current page items
  const pageItems = useMemo(() =>
    sorted.slice(txPage * TX_PAGE_SIZE, (txPage + 1) * TX_PAGE_SIZE),
    [sorted, txPage]
  );

  // Selection helpers
  const allPageSelected = pageItems.length > 0 && pageItems.every(tx => selected.has(tx.id));
  const somePageSelected = pageItems.some(tx => selected.has(tx.id));

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allPageSelected) {
      // Deselect all on current page
      setSelected(prev => {
        const next = new Set(prev);
        pageItems.forEach(tx => next.delete(tx.id));
        return next;
      });
    } else {
      // Select all on current page
      setSelected(prev => {
        const next = new Set(prev);
        pageItems.forEach(tx => next.add(tx.id));
        return next;
      });
    }
  };

  const clearSelection = () => setSelected(new Set());

  // Bulk actions
  const handleBulkMarkPaid = () => {
    bulkSetPaid(selected, true);
    clearSelection();
  };

  const handleBulkMarkUnpaid = () => {
    bulkSetPaid(selected, false);
    clearSelection();
  };

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selected.size} selected expense(s)?\n\nThis cannot be undone.`)) {
      bulkDeleteTx(selected);
      clearSelection();
    }
  };

  const handleBulkMarkRecurring = () => {
    const selectedTxs = transactions.filter(t => selected.has(t.id) && t.amount < 0);
    if (selectedTxs.length === 0) {
      alert('Please select expenses (not income) to mark as recurring.');
      return;
    }
    let added = 0;
    selectedTxs.forEach(tx => {
      // Check if a recurring with this name already exists
      const exists = recurringExpenses.some(r =>
        r.name.toLowerCase() === tx.desc.toLowerCase()
      );
      if (!exists) {
        const day = parseInt(tx.date.split('-')[2]) || 1;
        addRecurring({
          name: tx.desc,
          amount: Math.abs(tx.amount),
          category: tx.category,
          dueDay: day,
          autoPay: tx.paid,
        });
        added++;
      }
    });
    clearSelection();
    if (added > 0) {
      alert(`${added} expense(s) added as recurring bills.\n\nView them in the Recurring section.`);
    } else {
      alert('All selected expenses are already in your recurring list.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px] relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#00b4d8]" size={18} /><input type="text" placeholder="Search expenses..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gradient-to-r from-[#0a1628]/5 to-white border-2 border-[#12233d]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00b4d8]" /></div>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="px-4 py-3 bg-gradient-to-r from-[#0a1628]/5 to-white border-2 border-[#12233d]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00b4d8]"><option value="all">All Categories</option>{CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select>
        <select value={filterPaid} onChange={(e) => setFilterPaid(e.target.value)} className="px-4 py-3 bg-gradient-to-r from-[#00b4d8]/5 to-white border-2 border-[#00b4d8]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00b4d8]"><option value="all">All Status</option><option value="paid">Paid</option><option value="unpaid">Unpaid</option></select>
        <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setTxPage(0); }} className="px-4 py-3 bg-gradient-to-r from-[#0a1628]/5 to-white border-2 border-[#12233d]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00b4d8]"><option value="date-desc">Date (Newest)</option><option value="date-asc">Date (Oldest)</option><option value="amount-desc">Amount (High→Low)</option><option value="amount-asc">Amount (Low→High)</option></select>
        <button onClick={() => setShowAdvanced(!showAdvanced)} className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 font-medium transition-colors ${showAdvanced || hasAdvancedFilters ? 'bg-[#00b4d8]/10 border-[#00b4d8] text-[#00b4d8]' : 'border-[#12233d]/20 text-slate-600 hover:border-[#00b4d8]/50'}`}>
          <SlidersHorizontal size={18} />
          <span className="hidden sm:inline">Filters</span>
          {hasAdvancedFilters && <span className="w-2 h-2 bg-[#00b4d8] rounded-full" />}
        </button>
      </div>

      {showAdvanced && (
        <div className="bg-gradient-to-r from-[#0a1628]/5 to-[#00b4d8]/5 rounded-xl p-4 border border-[#12233d]/20 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-700">Advanced Filters</h4>
            {hasAdvancedFilters && <button onClick={clearAllFilters} className="text-xs text-[#00b4d8] hover:underline flex items-center gap-1"><X size={12} />Clear all</button>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Min Amount ($)</label>
              <input type="number" min="0" step="0.01" placeholder="0.00" value={filterAmountMin} onChange={(e) => { setFilterAmountMin(e.target.value); setTxPage(0); }} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00b4d8] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Max Amount ($)</label>
              <input type="number" min="0" step="0.01" placeholder="No limit" value={filterAmountMax} onChange={(e) => { setFilterAmountMax(e.target.value); setTxPage(0); }} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00b4d8] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">From Date</label>
              <input type="date" value={filterDateFrom} onChange={(e) => { setFilterDateFrom(e.target.value); setTxPage(0); }} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00b4d8] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">To Date</label>
              <input type="date" value={filterDateTo} onChange={(e) => { setFilterDateTo(e.target.value); setTxPage(0); }} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00b4d8] focus:outline-none" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button onClick={() => { setSearchAllMonths(!searchAllMonths); setTxPage(0); }} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${searchAllMonths ? 'bg-[#00b4d8] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-[#00b4d8]'}`}>
              <Globe size={14} />Search all months
            </button>
            {accounts.length > 1 && (
              <select value={filterAccount} onChange={(e) => { setFilterAccount(e.target.value); setTxPage(0); }} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00b4d8] focus:outline-none">
                <option value="all">All Accounts</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
              </select>
            )}
          </div>
        </div>
      )}

      {/* Summary bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Receipt size={16} className="text-blue-500" />
          <span><strong>{filtered.length}</strong> expenses {isFiltered ? '(filtered)' : ''}</span>
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
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#12233d] to-[#00b4d8] text-white rounded-lg font-medium hover:from-[#12233d] hover:to-[#0a1628] shadow-sm text-sm"
          >
            <Download size={16} /><span>Backup All</span>
          </button>
          {isFiltered && filtered.length > 0 && (
            <button
              onClick={() => {
                if (confirm(`Delete ${filtered.length} filtered expenses?\n\nThis will only delete the currently visible expenses matching your filters.\n\nThis cannot be undone.`)) {
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
              if (confirm(`DELETE ALL ${transactions.length} EXPENSES?\n\nThis will permanently remove ALL your data.\n\nTip: Use "Backup All" first to save your data.\n\nThis cannot be undone!`)) {
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

      {/* Bulk Action Toolbar - shown when items selected */}
      {selected.size > 0 && (
        <div className="sticky top-[73px] z-20 bg-gradient-to-r from-[#12233d] to-[#00b4d8] rounded-xl p-3 shadow-lg flex flex-wrap items-center gap-3 text-white">
          <div className="flex items-center gap-2 font-medium text-sm">
            <CheckSquare size={16} />
            <span>{selected.size} selected</span>
          </div>
          <div className="h-5 w-px bg-white/30" />
          <button onClick={handleBulkMarkPaid} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors">
            <DollarSign size={14} /> Mark Paid
          </button>
          <button onClick={handleBulkMarkUnpaid} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors">
            <X size={14} /> Mark Unpaid
          </button>
          <button onClick={handleBulkMarkRecurring} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors">
            <RefreshCw size={14} /> Make Recurring
          </button>
          <button onClick={handleBulkDelete} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/40 rounded-lg text-sm font-medium hover:bg-red-500/60 transition-colors">
            <Trash2 size={14} /> Delete
          </button>
          <button onClick={clearSelection} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors">
            <X size={14} /> Clear
          </button>
        </div>
      )}

      {/* Expense List */}
      <div className="bg-white rounded-2xl border-2 border-[#12233d]/10 shadow-sm divide-y divide-slate-100">
        {/* Table header with Select All */}
        {filtered.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50/80 border-b border-slate-200">
            <button
              onClick={toggleSelectAll}
              className="p-0.5 text-slate-400 hover:text-[#00b4d8] transition-colors"
              aria-label={allPageSelected ? 'Deselect all' : 'Select all on page'}
            >
              {allPageSelected ? (
                <CheckSquare size={18} className="text-[#00b4d8]" />
              ) : somePageSelected ? (
                <MinusSquare size={18} className="text-[#00b4d8]" />
              ) : (
                <Square size={18} />
              )}
            </button>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide flex-1">Expense</span>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide w-20 text-center">Status</span>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide w-24 text-right">Amount</span>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide w-28 text-right">Actions</span>
          </div>
        )}

        {filtered.length > 0 ? pageItems.map(tx => {
          const cat = CATEGORIES.find(c => c.id === tx.category);
          const acct = accounts.length > 1 ? accounts.find(a => a.id === (tx.accountId || 'primary')) : null;
          const isSelected = selected.has(tx.id);
          return (
            <div key={tx.id} className={`flex items-center gap-3 px-4 py-3 hover:bg-gradient-to-r hover:from-[#0a1628]/5/50 hover:to-[#00b4d8]/5/50 transition-colors ${isSelected ? 'bg-[#00b4d8]/5' : ''}`}>
              {/* Selection checkbox */}
              <button
                onClick={() => toggleSelect(tx.id)}
                className="p-0.5 shrink-0 text-slate-400 hover:text-[#00b4d8] transition-colors"
                aria-label={isSelected ? 'Deselect' : 'Select'}
              >
                {isSelected ? (
                  <CheckSquare size={18} className="text-[#00b4d8]" />
                ) : (
                  <Square size={18} />
                )}
              </button>

              {/* Clickable main area — opens edit */}
              <div className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer" onClick={() => setEditTx(tx)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditTx(tx); } }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ backgroundColor: cat?.bg }}>{cat?.icon}</div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate text-slate-900">
                    {tx.desc}
                    {tx.autoGenerated && <span className="ml-1.5 text-[10px] text-[#00b4d8] bg-[#00b4d8]/10 px-1.5 py-0.5 rounded-full font-medium">auto</span>}
                    {tx.splits?.length > 0 && <span className="inline-flex items-center gap-0.5 ml-1.5 px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded text-[10px] font-semibold align-middle" title={`Split across ${tx.splits.length} categories`}><Split size={10} />{tx.splits.length}</span>}
                  </p>
                  <p className="text-xs text-slate-500">
                    {shortDate(tx.date)}
                    {acct && <span className="ml-1.5 text-[10px] text-slate-400">{acct.icon} {acct.name}</span>}
                  </p>
                </div>
              </div>

              {/* Paid/Unpaid status badge - clickable to toggle */}
              <button
                onClick={() => togglePaid(tx.id)}
                className={`w-20 text-center shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                  tx.paid
                    ? 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200'
                    : 'bg-amber-100 text-amber-700 border border-amber-300 hover:bg-amber-200'
                }`}
                title={tx.paid ? 'Click to mark as unpaid' : 'Click to mark as paid'}
              >
                {tx.paid ? 'Paid' : 'Unpaid'}
              </button>

              {/* Amount */}
              <span className={`font-bold text-sm w-24 text-right tabular-nums ${tx.amount > 0 ? 'text-[#00b4d8]' : 'text-slate-900'}`}>{currency(tx.amount)}</span>

              {/* Action buttons */}
              <div className="flex items-center gap-1 w-28 justify-end">
                <button onClick={() => duplicateTx(tx)} title="Duplicate" aria-label="Duplicate" className="p-2 rounded-lg hover:bg-blue-100 text-slate-400 hover:text-blue-600"><Copy size={14} /></button>
                <button onClick={() => setEditTx(tx)} title="Edit" aria-label="Edit" className="p-2 rounded-lg hover:bg-[#00b4d8]/10 text-[#00b4d8]"><Edit2 size={14} /></button>
                <button onClick={() => deleteTx(tx.id)} title="Delete" aria-label="Delete" className="p-2 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600"><Trash2 size={14} /></button>
              </div>
            </div>
          );
        }) : (
          <div className="p-12 text-center">
            <Receipt className="mx-auto text-slate-300 mb-4" size={48} />
            <h3 className="font-semibold text-slate-600 mb-2">No expenses found</h3>
            <p className="text-sm text-slate-400 mb-4">{isFiltered ? 'Try adjusting your filters' : 'Add your first expense to get started'}</p>
            {!isFiltered && (
              <button onClick={() => setModal('add')} className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#12233d] to-[#00b4d8] text-white rounded-lg font-medium hover:shadow-lg"><Plus size={16} />Add Expense</button>
            )}
          </div>
        )}
        {filtered.length > TX_PAGE_SIZE && (
          <div className="p-4 flex items-center justify-between bg-slate-50">
            <span className="text-sm text-slate-500">Showing {txPage * TX_PAGE_SIZE + 1}-{Math.min((txPage + 1) * TX_PAGE_SIZE, filtered.length)} of {filtered.length}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => { setTxPage(Math.max(0, txPage - 1)); clearSelection(); }} disabled={txPage === 0} aria-label="Previous page" className="px-3 py-1 rounded-lg text-sm font-medium bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40"><ChevronLeft size={16} className="inline" /> Prev</button>
              <span className="text-sm text-slate-600 font-medium">Page {txPage + 1} of {Math.ceil(filtered.length / TX_PAGE_SIZE)}</span>
              <button onClick={() => { setTxPage(Math.min(Math.ceil(filtered.length / TX_PAGE_SIZE) - 1, txPage + 1)); clearSelection(); }} disabled={(txPage + 1) * TX_PAGE_SIZE >= filtered.length} aria-label="Next page" className="px-3 py-1 rounded-lg text-sm font-medium bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40">Next <ChevronRight size={16} className="inline" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
