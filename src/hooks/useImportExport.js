import { CATEGORIES, FULL_MONTHS } from '../utils/constants';
import { uid, currency, roundCents, escapeCSVField, getDateParts } from '../utils/formatters';
import { useAppStore } from '../stores/useAppStore';

// Enhanced date parsing - handles multiple formats including Excel serial dates
const parseDate = (dateValue) => {
  if (!dateValue && dateValue !== 0) return null;
  if (typeof dateValue === 'number' || (typeof dateValue === 'string' && /^\d+$/.test(dateValue.trim()))) {
    const num = parseFloat(dateValue);
    if (num > 0 && num < 100000) {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const date = new Date(excelEpoch.getTime() + num * 86400000);
      if (!isNaN(date.getTime())) {
        return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
      }
    }
  }
  const str = String(dateValue).trim();
  if (!str) return null;
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) { const [, y, m, d] = isoMatch; return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`; }
  const usMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usMatch) { const [, m, d, y] = usMatch; return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`; }
  const usShortMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (usShortMatch) { const [, m, d, yy] = usShortMatch; const y = parseInt(yy) > 50 ? '19' + yy : '20' + yy; return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`; }
  const usDashMatch = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (usDashMatch) { const [, m, d, y] = usDashMatch; return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`; }
  const longDateMatch = str.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (longDateMatch) {
    const [, monthStr, d, y] = longDateMatch;
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const m = monthNames.findIndex(name => monthStr.toLowerCase().startsWith(name));
    if (m >= 0) return `${y}-${String(m + 1).padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const d = new Date(str);
  if (!isNaN(d.getTime())) return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return null;
};

// Map category names to IDs (case-insensitive, fuzzy matching)
const mapCategory = (catName) => {
  if (!catName) return 'other';
  const lower = String(catName).toLowerCase().trim();
  const exactMatch = CATEGORIES.find(c => c.id === lower || c.name.toLowerCase() === lower);
  if (exactMatch) return exactMatch.id;
  const aliases = {
    'tithe': 'tithes', 'tithes': 'tithes', 'offering': 'tithes', 'church': 'tithes',
    'donation': 'gifts', 'charity': 'gifts', 'gift': 'gifts',
    'baby': 'childcare', 'daycare': 'childcare', 'child': 'childcare', 'kids': 'childcare',
    'pet': 'pets', 'dog': 'pets', 'cat': 'pets', 'vet': 'pets',
    'hair': 'personal', 'salon': 'personal', 'spa': 'personal',
    'gym': 'healthcare', 'medical': 'healthcare', 'doctor': 'healthcare', 'pharmacy': 'healthcare',
    'car': 'transportation', 'auto': 'transportation', 'gas': 'transportation', 'fuel': 'transportation', 'uber': 'transportation',
    'food': 'groceries', 'grocery': 'groceries', 'supermarket': 'groceries',
    'restaurant': 'dining', 'coffee': 'dining', 'cafe': 'dining', 'takeout': 'dining',
    'netflix': 'subscriptions', 'spotify': 'subscriptions', 'hulu': 'subscriptions',
    'amazon': 'shopping', 'walmart': 'shopping', 'target': 'shopping',
    'rent': 'housing', 'mortgage': 'housing',
    'electric': 'utilities', 'water': 'utilities', 'internet': 'utilities', 'phone': 'utilities',
    'salary': 'income', 'paycheck': 'income', 'wages': 'income', 'freelance': 'income',
  };
  for (const [alias, catId] of Object.entries(aliases)) { if (lower.includes(alias)) return catId; }
  const partialMatch = CATEGORIES.find(c => c.name.toLowerCase().includes(lower) || lower.includes(c.id) || lower.includes(c.name.toLowerCase()));
  if (partialMatch) return partialMatch.id;
  return 'other';
};

const parseCSV = (content) => {
  const lines = content.split(/\r?\n/).filter(l => l.trim());
  const txs = [];
  const errors = [];
  for (let i = 1; i < lines.length; i++) {
    try {
      const parts = [];
      let current = '';
      let inQuotes = false;
      for (const char of lines[i]) { if (char === '"') inQuotes = !inQuotes; else if (char === ',' && !inQuotes) { parts.push(current.trim()); current = ''; } else current += char; }
      parts.push(current.trim());
      if (parts.length < 3) continue;
      const [dateStr, desc, amountStr, cat = '', type = '', paid = ''] = parts.map(p => p.replace(/"/g, '').trim());
      const date = parseDate(dateStr);
      const amount = parseFloat(amountStr.replace(/[$,]/g, ''));
      if (!date) { errors.push(`Row ${i + 1}: Invalid date "${dateStr}"`); continue; }
      if (!desc) { errors.push(`Row ${i + 1}: Missing description`); continue; }
      if (isNaN(amount)) { errors.push(`Row ${i + 1}: Invalid amount "${amountStr}"`); continue; }
      const isIncome = type.toLowerCase() === 'income' || (amount > 0 && !type);
      txs.push({ id: uid(), date, desc, amount: isIncome ? Math.abs(amount) : -Math.abs(amount), category: isIncome ? 'income' : mapCategory(cat), paid: ['yes', '1', 'true', 'y', 'paid'].includes(String(paid).toLowerCase()) });
    } catch (e) { errors.push(`Row ${i + 1}: Parse error - ${e.message}`); }
  }
  return { transactions: txs, errors };
};

const parseExcel = async (file) => {
  return new Promise((resolve) => {
    const XLSX = window.XLSX;
    if (!XLSX) { resolve({ transactions: [], errors: ['Excel library not loaded. Please save as CSV.'] }); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, dateNF: 'yyyy-mm-dd', defval: '' });
        const txs = [];
        const errors = [];
        const headers = json[0]?.map(h => String(h || '').toLowerCase().trim()) || [];
        const dateCol = headers.findIndex(h => h.includes('date'));
        const descCol = headers.findIndex(h => h.includes('desc') || h.includes('memo') || h.includes('payee') || h.includes('name'));
        const amountCol = headers.findIndex(h => h.includes('amount') || h.includes('sum') || h.includes('total'));
        const catCol = headers.findIndex(h => h.includes('cat') || h.includes('type'));
        const typeCol = headers.findIndex(h => h === 'type' || h.includes('income') || h.includes('expense'));
        const paidCol = headers.findIndex(h => h.includes('paid') || h.includes('status') || h.includes('cleared'));
        for (let i = 1; i < json.length; i++) {
          const row = json[i];
          if (!row || row.every(cell => !cell)) continue;
          const dateVal = row[dateCol >= 0 ? dateCol : 0];
          const desc = row[descCol >= 0 ? descCol : 1];
          const amountVal = row[amountCol >= 0 ? amountCol : 2];
          const cat = row[catCol >= 0 ? catCol : 3];
          const type = row[typeCol >= 0 ? typeCol : 4];
          const paid = row[paidCol >= 0 ? paidCol : 5];
          const date = parseDate(dateVal);
          const amount = parseFloat(String(amountVal || '0').replace(/[$,]/g, ''));
          if (!date) { errors.push(`Row ${i + 1}: Invalid date "${dateVal}"`); continue; }
          if (!desc) { errors.push(`Row ${i + 1}: Missing description`); continue; }
          if (isNaN(amount) || amount === 0) { errors.push(`Row ${i + 1}: Invalid amount "${amountVal}"`); continue; }
          const isIncome = String(type || '').toLowerCase() === 'income' || String(cat || '').toLowerCase() === 'income' || amount > 0;
          txs.push({ id: uid(), date, desc: String(desc).trim(), amount: isIncome ? Math.abs(amount) : -Math.abs(amount), category: isIncome ? 'income' : mapCategory(cat), paid: ['yes', '1', 'true', 'y', 'cleared', 'paid'].includes(String(paid || '').toLowerCase()) });
        }
        resolve({ transactions: txs, errors });
      } catch (err) { resolve({ transactions: [], errors: [`Failed to parse Excel: ${err.message}. Save as CSV and try again.`] }); }
    };
    reader.onerror = () => resolve({ transactions: [], errors: ['Failed to read file.'] });
    reader.readAsArrayBuffer(file);
  });
};

export function useImportExport() {
  const transactions = useAppStore(s => s.transactions);
  const recurringExpenses = useAppStore(s => s.recurringExpenses);
  const monthlyBalances = useAppStore(s => s.monthlyBalances);
  const savingsGoal = useAppStore(s => s.savingsGoal);
  const budgetGoals = useAppStore(s => s.budgetGoals);
  const debts = useAppStore(s => s.debts);
  const importData = useAppStore(s => s.importData);
  const setTransactions = useAppStore(s => s.setTransactions);
  const setImportData = useAppStore(s => s.setImportData);
  const setImportNotification = useAppStore(s => s.setImportNotification);
  const setModal = useAppStore(s => s.setModal);
  const setView = useAppStore(s => s.setView);
  const setMonth = useAppStore(s => s.setMonth);
  const setYear = useAppStore(s => s.setYear);

  const exportCSV = () => {
    const rows = [
      ['Balance Books Pro - Transaction Export'],
      [`Export Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`],
      ['Report Period: All Transactions'], [''],
      ['Date', 'Description', 'Amount', 'Category', 'Type', 'Status', 'Notes']
    ];
    const sortedTx = [...transactions].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    sortedTx.forEach(t => {
      const cat = CATEGORIES.find(c => c.id === t.category);
      rows.push([t.date, escapeCSVField(t.desc), roundCents(t.amount).toFixed(2), escapeCSVField(cat ? cat.name : t.category), t.amount >= 0 ? 'Income' : 'Expense', t.paid ? 'Paid' : 'Unpaid', '']);
    });
    const totalIncome = roundCents(transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0));
    const totalExpenses = roundCents(transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0));
    rows.push([''], ['SUMMARY'], ['Total Income', '', totalIncome.toFixed(2)], ['Total Expenses', '', (-totalExpenses).toFixed(2)], ['Net Amount', '', roundCents(totalIncome - totalExpenses).toFixed(2)], ['Total Transactions', '', transactions.length], [''], [`Generated by Balance Books Pro ${__APP_VERSION__}`]);
    const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `balance-books-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const downloadTemplate = () => {
    const rows = [
      ['Date', 'Description', 'Amount', 'Category', 'Type', 'Paid'],
      ['2025-01-15', 'Grocery Shopping', '-85.50', 'groceries', 'expense', 'yes'],
      ['2025-01-14', 'Gas Station', '-45.00', 'transportation', 'expense', 'yes'],
      ['2025-01-10', 'Electric Bill', '-125.00', 'utilities', 'expense', 'no'],
      ['2025-01-01', 'Paycheck', '2500.00', 'income', 'income', 'yes'],
      ['2025-01-05', 'Freelance Work', '350.00', 'income', 'income', 'yes']
    ];
    const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'balance-books-template.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleFileImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const filename = file.name.toLowerCase();
    let result;
    try {
      if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
        result = await parseExcel(file);
        if (result.transactions.length === 0 && result.errors.length > 0) { alert(`Unable to read Excel file.\n\n${result.errors[0]}`); e.target.value = ''; return; }
      } else if (filename.endsWith('.csv') || filename.endsWith('.txt')) {
        result = parseCSV(await file.text());
      } else { alert('Please upload a CSV or Excel file.'); e.target.value = ''; return; }
      if (result.transactions.length > 0) {
        result.transactions.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        setImportData({ transactions: result.transactions, errors: result.errors, filename: file.name, summary: { total: result.transactions.length, income: result.transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0), expenses: result.transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0) } });
        setModal('import-confirm');
      } else {
        alert(`No valid transactions found in "${file.name}".${result.errors.length > 0 ? '\n\n' + result.errors.slice(0, 5).join('\n') : ''}`);
      }
    } catch (err) { alert(`Error reading file: ${err.message}`); }
    e.target.value = '';
  };

  const confirmImport = () => {
    if (!importData?.transactions.length) return;
    setTransactions([...transactions, ...importData.transactions]);
    const monthCounts = {};
    importData.transactions.forEach(t => { const parts = getDateParts(t.date); if (parts) { const key = `${parts.year}-${parts.month}`; monthCounts[key] = (monthCounts[key] || 0) + 1; } });
    const topMonth = Object.entries(monthCounts).sort((a, b) => b[1] - a[1])[0];
    if (topMonth) { const [y, m] = topMonth[0].split('-').map(Number); setYear(y); setMonth(m); }
    setImportNotification({ count: importData.transactions.length, income: importData.transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0), expenses: importData.transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0) });
    setTimeout(() => setImportNotification(null), 5000);
    setView('dashboard');
    setImportData(null);
    setModal(null);
  };

  return { exportCSV, downloadTemplate, handleFileImport, confirmImport };
}
