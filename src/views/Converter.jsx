import { useState, useRef, useMemo, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, Upload, Download, ArrowRight, AlertTriangle, CheckCircle, X, RefreshCw, Eye, ArrowRightLeft, ChevronDown, Trash2, Import, Sparkles, Loader2 } from 'lucide-react';
import { CATEGORIES } from '../utils/constants';
import { uid, currency, roundCents, escapeCSVField } from '../utils/formatters';
import { useAppStore } from '../stores/useAppStore';

const AI_SERVER = 'http://localhost:5555';

// ── Date parsing (same robust logic as useImportExport) ────────────────────
const parseDate = (dateValue) => {
  if (!dateValue && dateValue !== 0) return null;
  if (typeof dateValue === 'number' || (typeof dateValue === 'string' && /^\d+$/.test(dateValue.trim()))) {
    const num = parseFloat(dateValue);
    if (num > 0 && num < 100000) {
      const epoch = new Date(Date.UTC(1899, 11, 30));
      const d = new Date(epoch.getTime() + num * 86400000);
      if (!isNaN(d.getTime())) return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    }
  }
  const str = String(dateValue).trim();
  if (!str) return null;
  const iso = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
  const us = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (us) return `${us[3]}-${us[1].padStart(2, '0')}-${us[2].padStart(2, '0')}`;
  const usShort = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (usShort) { const y = parseInt(usShort[3]) > 50 ? '19' + usShort[3] : '20' + usShort[3]; return `${y}-${usShort[1].padStart(2, '0')}-${usShort[2].padStart(2, '0')}`; }
  const usDash = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (usDash) return `${usDash[3]}-${usDash[1].padStart(2, '0')}-${usDash[2].padStart(2, '0')}`;
  const longDate = str.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (longDate) {
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const m = months.findIndex(n => longDate[1].toLowerCase().startsWith(n));
    if (m >= 0) return `${longDate[3]}-${String(m + 1).padStart(2, '0')}-${longDate[2].padStart(2, '0')}`;
  }
  const d = new Date(str);
  if (!isNaN(d.getTime())) return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return null;
};

// ── Category mapping (fuzzy) ───────────────────────────────────────────────
const mapCategory = (catName) => {
  if (!catName) return 'other';
  const lower = String(catName).toLowerCase().trim();
  const exact = CATEGORIES.find(c => c.id === lower || c.name.toLowerCase() === lower);
  if (exact) return exact.id;
  const aliases = {
    'tithe': 'tithes', 'tithes': 'tithes', 'offering': 'tithes', 'church': 'tithes',
    'donation': 'gifts', 'charity': 'gifts', 'gift': 'gifts',
    'baby': 'childcare', 'daycare': 'childcare', 'child': 'childcare', 'kids': 'childcare',
    'pet': 'pets', 'dog': 'pets', 'cat': 'pets', 'vet': 'pets',
    'hair': 'personal', 'salon': 'personal', 'spa': 'personal',
    'gym': 'healthcare', 'medical': 'healthcare', 'doctor': 'healthcare', 'pharmacy': 'healthcare',
    'car': 'transportation', 'auto': 'transportation', 'gas': 'transportation', 'fuel': 'transportation', 'uber': 'transportation',
    'food': 'groceries', 'grocery': 'groceries', 'supermarket': 'groceries', 'market': 'groceries',
    'restaurant': 'dining', 'coffee': 'dining', 'cafe': 'dining', 'takeout': 'dining', 'doordash': 'dining', 'grubhub': 'dining',
    'netflix': 'subscriptions', 'spotify': 'subscriptions', 'hulu': 'subscriptions', 'subscription': 'subscriptions',
    'amazon': 'shopping', 'walmart': 'shopping', 'target': 'shopping', 'costco': 'shopping',
    'rent': 'housing', 'mortgage': 'housing', 'hoa': 'housing',
    'electric': 'utilities', 'water': 'utilities', 'internet': 'utilities', 'phone': 'utilities', 'utility': 'utilities',
    'salary': 'income', 'paycheck': 'income', 'wages': 'income', 'freelance': 'income', 'deposit': 'income', 'direct dep': 'income',
    'insurance': 'insurance', 'premium': 'insurance',
    'tuition': 'education', 'school': 'education', 'textbook': 'education',
    'invest': 'investment', 'stock': 'investment', 'dividend': 'investment',
    'loan': 'debt', 'credit card': 'debt', 'payment': 'debt',
    'saving': 'savings', 'transfer': 'transfer',
  };
  for (const [alias, catId] of Object.entries(aliases)) { if (lower.includes(alias)) return catId; }
  const partial = CATEGORIES.find(c => c.name.toLowerCase().includes(lower) || lower.includes(c.id) || lower.includes(c.name.toLowerCase()));
  if (partial) return partial.id;
  return 'other';
};

// ── Column role definitions ────────────────────────────────────────────────
const COLUMN_ROLES = [
  { id: 'skip', label: 'Skip (ignore)' },
  { id: 'date', label: 'Date' },
  { id: 'description', label: 'Description' },
  { id: 'amount', label: 'Amount (single column)' },
  { id: 'debit', label: 'Debit / Expense amount' },
  { id: 'credit', label: 'Credit / Income amount' },
  { id: 'category', label: 'Category' },
  { id: 'type', label: 'Type (income/expense)' },
  { id: 'status', label: 'Paid / Status' },
  { id: 'reference', label: 'Reference / Check #' },
  { id: 'balance', label: 'Balance (ignore)' },
];

// ── Auto-detect column roles from header names ─────────────────────────────
const autoDetectColumns = (headers) => {
  const roles = headers.map(() => 'skip');
  const lower = headers.map(h => String(h || '').toLowerCase().trim());

  // Date
  let idx = lower.findIndex(h => h === 'date' || h === 'transaction date' || h === 'trans date' || h === 'posting date' || h === 'post date');
  if (idx < 0) idx = lower.findIndex(h => h.includes('date'));
  if (idx >= 0) roles[idx] = 'date';

  // Description
  let dIdx = lower.findIndex(h => h === 'description' || h === 'desc' || h === 'memo' || h === 'payee' || h === 'merchant' || h === 'name' || h === 'details' || h === 'narrative' || h === 'transaction description' || h === 'particulars');
  if (dIdx < 0) dIdx = lower.findIndex(h => (h.includes('desc') || h.includes('memo') || h.includes('payee') || h.includes('merchant') || h.includes('narrat')) && roles[lower.indexOf(h)] === 'skip');
  if (dIdx >= 0) roles[dIdx] = 'description';

  // Amount (single column)
  const amtIdx = lower.findIndex(h => (h === 'amount' || h === 'sum' || h === 'total' || h === 'transaction amount') && roles[lower.indexOf(h)] === 'skip');
  if (amtIdx >= 0) roles[amtIdx] = 'amount';

  // Debit / Credit (split columns)
  const debitIdx = lower.findIndex(h => (h === 'debit' || h === 'debits' || h === 'withdrawal' || h === 'withdrawals' || h === 'charge' || h === 'charges' || h === 'money out') && roles[lower.indexOf(h)] === 'skip');
  const creditIdx = lower.findIndex(h => (h === 'credit' || h === 'credits' || h === 'deposit' || h === 'deposits' || h === 'money in') && roles[lower.indexOf(h)] === 'skip');
  if (debitIdx >= 0 && creditIdx >= 0 && amtIdx < 0) {
    roles[debitIdx] = 'debit';
    roles[creditIdx] = 'credit';
  } else if (debitIdx >= 0 && amtIdx < 0) {
    roles[debitIdx] = 'debit';
  } else if (creditIdx >= 0 && amtIdx < 0) {
    roles[creditIdx] = 'credit';
  }

  // Category
  const catIdx = lower.findIndex(h => (h === 'category' || h === 'cat' || h === 'class' || h === 'tag' || h === 'group') && roles[lower.indexOf(h)] === 'skip');
  if (catIdx >= 0) roles[catIdx] = 'category';

  // Type (income/expense)
  const typeIdx = lower.findIndex(h => (h === 'type' || h === 'transaction type' || h === 'trans type') && roles[lower.indexOf(h)] === 'skip');
  if (typeIdx >= 0) roles[typeIdx] = 'type';

  // Paid / Status
  const paidIdx = lower.findIndex(h => (h === 'paid' || h === 'status' || h === 'cleared' || h === 'reconciled') && roles[lower.indexOf(h)] === 'skip');
  if (paidIdx >= 0) roles[paidIdx] = 'status';

  // Balance (ignore but label it)
  const balIdx = lower.findIndex(h => (h === 'balance' || h === 'running balance' || h === 'running total') && roles[lower.indexOf(h)] === 'skip');
  if (balIdx >= 0) roles[balIdx] = 'balance';

  // Reference
  const refIdx = lower.findIndex(h => (h === 'reference' || h === 'ref' || h === 'check' || h === 'check #' || h === 'check number' || h === 'confirmation') && roles[lower.indexOf(h)] === 'skip');
  if (refIdx >= 0) roles[refIdx] = 'reference';

  return roles;
};

// ── Parse raw CSV text into array of arrays ────────────────────────────────
const parseCSVRaw = (text) => {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  return lines.map(line => {
    const parts = [];
    let current = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') inQuotes = !inQuotes;
      else if (ch === ',' && !inQuotes) { parts.push(current.trim()); current = ''; }
      else current += ch;
    }
    parts.push(current.trim());
    return parts.map(p => p.replace(/^"|"$/g, '').trim());
  });
};

// ── Parse amount string ────────────────────────────────────────────────────
const parseAmount = (val) => {
  if (val == null || val === '') return NaN;
  const str = String(val).trim();
  // Handle parentheses as negative: (123.45) => -123.45
  const parenMatch = str.match(/^\(([^)]+)\)$/);
  if (parenMatch) return -Math.abs(parseFloat(parenMatch[1].replace(/[$,\s]/g, '')));
  return parseFloat(str.replace(/[$,\s]/g, ''));
};

// ── Sign convention options ────────────────────────────────────────────────
const SIGN_CONVENTIONS = [
  { id: 'auto', label: 'Auto-detect', desc: 'Positive = income, negative = expense' },
  { id: 'bank', label: 'Bank statement', desc: 'Negative = expense, positive = deposit/income' },
  { id: 'credit-card', label: 'Credit card', desc: 'Positive = charge/expense, negative = payment/credit' },
  { id: 'all-positive', label: 'All positive', desc: 'Use Type column or Category to determine income vs expense' },
];


export default function Converter() {
  const addTx = useAppStore(s => s.addTx);
  const setView = useAppStore(s => s.setView);
  const setMonth = useAppStore(s => s.setMonth);
  const setYear = useAppStore(s => s.setYear);
  const setImportNotification = useAppStore(s => s.setImportNotification);
  const aiEnabled = useAppStore(s => s.aiEnabled);
  const aiApiKey = useAppStore(s => s.aiApiKey);
  const aiModel = useAppStore(s => s.aiModel);

  // File state
  const [step, setStep] = useState('upload'); // upload | map | preview | done
  const [filename, setFilename] = useState('');
  const [rawData, setRawData] = useState([]); // array of row arrays
  const [headers, setHeaders] = useState([]);
  const [columnRoles, setColumnRoles] = useState([]);
  const [signConvention, setSignConvention] = useState('auto');
  const [defaultPaid, setDefaultPaid] = useState(true);
  const [converted, setConverted] = useState([]);
  const [errors, setErrors] = useState([]);
  const [showAllErrors, setShowAllErrors] = useState(false);
  const fileRef = useRef(null);

  // AI state
  const [aiMode, setAiMode] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiColumnConfidence, setAiColumnConfidence] = useState(null); // [{index, role, confidence}]
  const [aiCategoryResults, setAiCategoryResults] = useState(null); // [{index, category, confidence}]
  const [aiError, setAiError] = useState(null);

  // AI helper: call /analyze endpoint
  const aiAnalyzeColumns = useCallback(async (hdrs, sampleRows) => {
    try {
      setAiLoading(true);
      setAiError(null);
      const res = await fetch(`${AI_SERVER}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headers: hdrs,
          sample_rows: sampleRows.slice(0, 3),
          api_key: aiApiKey,
          model: aiModel,
        }),
      });
      if (!res.ok) throw new Error('AI server returned ' + res.status);
      const data = await res.json();
      if (data.columns) {
        // Apply AI-detected column roles
        const newRoles = hdrs.map(() => 'skip');
        data.columns.forEach(col => {
          if (col.index >= 0 && col.index < newRoles.length && col.role !== 'skip') {
            newRoles[col.index] = col.role;
          }
        });
        setColumnRoles(newRoles);
        setAiColumnConfidence(data.columns);
        if (data.sign_convention) {
          setSignConvention(data.sign_convention);
        }
      }
    } catch (err) {
      setAiError('AI analysis unavailable: ' + err.message);
      // Fall back to heuristic
    } finally {
      setAiLoading(false);
    }
  }, [aiApiKey, aiModel]);

  // AI helper: call /categorize endpoint
  const aiCategorize = useCallback(async (descriptions) => {
    try {
      setAiLoading(true);
      setAiError(null);
      const res = await fetch(`${AI_SERVER}/categorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descriptions,
          api_key: aiApiKey,
          model: aiModel,
        }),
      });
      if (!res.ok) throw new Error('AI server returned ' + res.status);
      const data = await res.json();
      if (data.results) {
        setAiCategoryResults(data.results);
        return data.results;
      }
    } catch (err) {
      setAiError('AI categorization unavailable: ' + err.message);
    } finally {
      setAiLoading(false);
    }
    return null;
  }, [aiApiKey, aiModel]);

  // ── Step 1: File upload & parse ─────────────────────────────────────────
  const handleFile = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const name = file.name.toLowerCase();
    setFilename(file.name);
    setAiColumnConfidence(null);
    setAiCategoryResults(null);
    setAiError(null);

    try {
      let parsedHeaders = [];
      let parsedRows = [];

      if (name.endsWith('.csv') || name.endsWith('.txt') || name.endsWith('.tsv')) {
        const text = await file.text();
        const firstLine = text.split(/\r?\n/)[0] || '';
        let rows;
        if (name.endsWith('.tsv') || (firstLine.includes('\t') && !firstLine.includes(','))) {
          rows = text.split(/\r?\n/).filter(l => l.trim()).map(line => line.split('\t').map(c => c.trim()));
        } else {
          rows = parseCSVRaw(text);
        }
        if (rows.length < 2) { alert('File has no data rows.'); e.target.value = ''; return; }
        parsedHeaders = rows[0];
        parsedRows = rows.slice(1);
      } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
        const data = new Uint8Array(await file.arrayBuffer());
        const wb = XLSX.read(data, { type: 'array', cellDates: true, raw: false, dateNF: 'yyyy-mm-dd' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
        if (json.length < 2) { alert('Spreadsheet has no data rows.'); e.target.value = ''; return; }
        parsedHeaders = json[0].map(h => String(h || ''));
        parsedRows = json.slice(1).map(r => r.map(c => String(c ?? '')));
      } else {
        alert('Unsupported file type. Please use CSV, TSV, XLS, or XLSX.');
        if (e.target) e.target.value = '';
        return;
      }

      setHeaders(parsedHeaders);
      setRawData(parsedRows);
      setColumnRoles(autoDetectColumns(parsedHeaders));
      setStep('map');

      // If AI mode is active, also run AI analysis in background
      if (aiMode && aiEnabled && aiApiKey) {
        aiAnalyzeColumns(parsedHeaders, parsedRows);
      }
    } catch (err) {
      alert('Error reading file: ' + err.message);
    }
    if (e.target) e.target.value = '';
  }, [aiMode, aiEnabled, aiApiKey, aiAnalyzeColumns]);

  // ── Step 2 → 3: Convert mapped data ─────────────────────────────────────
  const runConversion = useCallback(async () => {
    const dateIdx = columnRoles.indexOf('date');
    const descIdx = columnRoles.indexOf('description');
    const amountIdx = columnRoles.indexOf('amount');
    const debitIdx = columnRoles.indexOf('debit');
    const creditIdx = columnRoles.indexOf('credit');
    const catIdx = columnRoles.indexOf('category');
    const typeIdx = columnRoles.indexOf('type');
    const statusIdx = columnRoles.indexOf('status');

    if (dateIdx < 0) { alert('Please map at least one column as "Date".'); return; }
    if (descIdx < 0) { alert('Please map at least one column as "Description".'); return; }
    if (amountIdx < 0 && debitIdx < 0 && creditIdx < 0) { alert('Please map at least one amount column (Amount, Debit, or Credit).'); return; }

    const txs = [];
    const errs = [];

    rawData.forEach((row, i) => {
      const rowNum = i + 2; // +2 because header is row 1
      try {
        // Skip empty rows
        if (!row || row.every(c => !c || !String(c).trim())) return;

        // Date
        const dateRaw = dateIdx >= 0 ? row[dateIdx] : '';
        const date = parseDate(dateRaw);
        if (!date) { errs.push(`Row ${rowNum}: Invalid date "${dateRaw}"`); return; }

        // Description
        const desc = descIdx >= 0 ? String(row[descIdx] || '').trim() : '';
        if (!desc) { errs.push(`Row ${rowNum}: Missing description`); return; }

        // Amount
        let amount = 0;
        if (amountIdx >= 0) {
          amount = parseAmount(row[amountIdx]);
        } else {
          const debitAmt = debitIdx >= 0 ? parseAmount(row[debitIdx]) : NaN;
          const creditAmt = creditIdx >= 0 ? parseAmount(row[creditIdx]) : NaN;
          if (!isNaN(debitAmt) && debitAmt !== 0) {
            amount = -Math.abs(debitAmt);
          } else if (!isNaN(creditAmt) && creditAmt !== 0) {
            amount = Math.abs(creditAmt);
          } else {
            errs.push(`Row ${rowNum}: No valid amount found`);
            return;
          }
        }

        if (isNaN(amount) || amount === 0) { errs.push(`Row ${rowNum}: Invalid amount`); return; }

        // Determine income vs expense based on sign convention
        const typeVal = typeIdx >= 0 ? String(row[typeIdx] || '').toLowerCase().trim() : '';
        const catVal = catIdx >= 0 ? String(row[catIdx] || '').trim() : '';
        let isIncome = false;

        if (typeVal === 'income' || typeVal === 'credit' || typeVal === 'deposit') {
          isIncome = true;
        } else if (typeVal === 'expense' || typeVal === 'debit' || typeVal === 'charge') {
          isIncome = false;
        } else if (signConvention === 'credit-card') {
          isIncome = amount < 0;
          amount = Math.abs(amount);
          if (!isIncome) amount = -amount;
        } else if (signConvention === 'all-positive') {
          const mappedCat = mapCategory(catVal || desc);
          isIncome = mappedCat === 'income';
        } else {
          isIncome = amount > 0;
        }

        const finalAmount = isIncome ? Math.abs(amount) : -Math.abs(amount);
        const category = isIncome ? 'income' : mapCategory(catVal || desc);

        let paid = defaultPaid;
        if (statusIdx >= 0) {
          const paidVal = String(row[statusIdx] || '').toLowerCase().trim();
          if (['yes', '1', 'true', 'y', 'paid', 'cleared', 'reconciled'].includes(paidVal)) paid = true;
          else if (['no', '0', 'false', 'n', 'unpaid', 'pending'].includes(paidVal)) paid = false;
        }

        txs.push({
          id: uid(),
          date,
          desc,
          amount: roundCents(finalAmount),
          category,
          paid,
        });
      } catch (err) {
        errs.push(`Row ${rowNum}: ${err.message}`);
      }
    });

    txs.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    // If AI mode is active, try to AI-categorize descriptions
    if (aiMode && aiEnabled && aiApiKey && txs.length > 0) {
      const descriptions = txs.map(t => t.desc);
      const aiResults = await aiCategorize(descriptions);
      if (aiResults) {
        aiResults.forEach(r => {
          if (r.index >= 0 && r.index < txs.length && txs[r.index].category !== 'income') {
            txs[r.index].category = r.category;
            txs[r.index]._aiConfidence = r.confidence;
          }
        });
      }
    }

    setConverted(txs);
    setErrors(errs);
    setStep('preview');
  }, [rawData, columnRoles, signConvention, defaultPaid, aiMode, aiEnabled, aiApiKey, aiCategorize]);

  // ── Export as BalanceBooks CSV ────────────────────────────────────────────
  const exportCSV = useCallback(() => {
    const rows = [
      ['Date', 'Description', 'Amount', 'Category', 'Type', 'Paid'],
    ];
    converted.forEach(tx => {
      const cat = CATEGORIES.find(c => c.id === tx.category);
      rows.push([
        tx.date,
        escapeCSVField(tx.desc),
        tx.amount.toFixed(2),
        tx.category,
        tx.amount >= 0 ? 'income' : 'expense',
        tx.paid ? 'yes' : 'no',
      ]);
    });
    const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const baseName = filename.replace(/\.[^.]+$/, '');
    a.download = `${baseName}-balancebooks.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [converted, filename]);

  // ── Export as XLS ────────────────────────────────────────────────────────
  const exportXLS = useCallback(() => {
    const wsData = [['Date', 'Description', 'Amount', 'Category', 'Type', 'Paid']];
    converted.forEach(tx => {
      const cat = CATEGORIES.find(c => c.id === tx.category);
      wsData.push([
        tx.date,
        tx.desc,
        tx.amount,
        cat ? cat.name : tx.category,
        tx.amount >= 0 ? 'Income' : 'Expense',
        tx.paid ? 'Yes' : 'No',
      ]);
    });
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 12 }, { wch: 40 }, { wch: 12 }, { wch: 18 }, { wch: 10 }, { wch: 8 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    const baseName = filename.replace(/\.[^.]+$/, '');
    XLSX.writeFile(wb, `${baseName}-balancebooks.xlsx`);
  }, [converted, filename]);

  // ── Import directly into BalanceBooks ────────────────────────────────────
  const importDirectly = useCallback(() => {
    if (converted.length === 0) return;
    converted.forEach(tx => addTx(tx));

    // Navigate to the month with most transactions
    const monthCounts = {};
    converted.forEach(tx => {
      const m = tx.date.slice(0, 7);
      monthCounts[m] = (monthCounts[m] || 0) + 1;
    });
    const topMonth = Object.entries(monthCounts).sort((a, b) => b[1] - a[1])[0];
    if (topMonth) {
      const [y, m] = topMonth[0].split('-').map(Number);
      setYear(y);
      setMonth(m - 1);
    }

    const income = converted.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const expenses = converted.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    setImportNotification({ count: converted.length, income, expenses });
    setTimeout(() => setImportNotification(null), 5000);

    setStep('done');
  }, [converted, addTx, setView, setMonth, setYear, setImportNotification]);

  // ── Computed stats for preview ───────────────────────────────────────────
  const previewStats = useMemo(() => {
    if (converted.length === 0) return null;
    const income = roundCents(converted.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0));
    const expenses = roundCents(converted.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0));
    const dateRange = converted.length > 0
      ? { from: converted[converted.length - 1].date, to: converted[0].date }
      : null;
    const categories = {};
    converted.forEach(tx => {
      categories[tx.category] = (categories[tx.category] || 0) + 1;
    });
    return { income, expenses, dateRange, categories, total: converted.length };
  }, [converted]);

  // ── Column role badge color ──────────────────────────────────────────────
  const roleBadge = (role) => {
    const colors = {
      date: 'bg-blue-100 text-blue-700 border-blue-200',
      description: 'bg-purple-100 text-purple-700 border-purple-200',
      amount: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      debit: 'bg-red-100 text-red-700 border-red-200',
      credit: 'bg-green-100 text-green-700 border-green-200',
      category: 'bg-amber-100 text-amber-700 border-amber-200',
      type: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      status: 'bg-teal-100 text-teal-700 border-teal-200',
      reference: 'bg-slate-100 text-slate-600 border-slate-200',
      balance: 'bg-slate-100 text-slate-400 border-slate-200',
      skip: 'bg-slate-50 text-slate-400 border-slate-200',
    };
    return colors[role] || colors.skip;
  };

  // ── Update a single column role ──────────────────────────────────────────
  const setColumnRole = (idx, role) => {
    setColumnRoles(prev => {
      const next = [...prev];
      next[idx] = role;
      return next;
    });
  };

  // ── Reset ────────────────────────────────────────────────────────────────
  const reset = () => {
    setStep('upload');
    setFilename('');
    setRawData([]);
    setHeaders([]);
    setColumnRoles([]);
    setSignConvention('auto');
    setDefaultPaid(true);
    setConverted([]);
    setErrors([]);
    setShowAllErrors(false);
    setAiColumnConfidence(null);
    setAiCategoryResults(null);
    setAiError(null);
  };

  // ── Manually edit a converted transaction's category ─────────────────────
  const updateConvertedCategory = (idx, newCat) => {
    setConverted(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], category: newCat };
      return next;
    });
  };

  const removeConvertedRow = (idx) => {
    setConverted(prev => prev.filter((_, i) => i !== idx));
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#12233d] to-[#00b4d8] rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <ArrowRightLeft size={24} />
            <h3 className="font-bold text-lg">Spreadsheet Converter</h3>
          </div>
          {aiEnabled && aiApiKey && (
            <button
              onClick={() => setAiMode(!aiMode)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${aiMode ? 'bg-white/20 text-white border border-white/40' : 'bg-white/10 text-white/70 border border-white/20 hover:bg-white/15'}`}
            >
              <Sparkles size={14} />
              AI {aiMode ? 'ON' : 'OFF'}
            </button>
          )}
        </div>
        <p className="text-blue-100 text-sm">
          Convert any billing spreadsheet, bank statement, or credit card export into BalanceBooks format.
          Supports CSV, TSV, XLS, and XLSX files from any bank or billing provider.
        </p>
        {aiMode && (
          <div className="mt-2 flex items-center gap-2 text-xs text-blue-200">
            <Sparkles size={12} /> AI-powered column detection and smart categorization active
          </div>
        )}
      </div>

      {/* Step Progress */}
      <div className="flex items-center gap-2 px-2">
        {['Upload', 'Map Columns', 'Preview & Export'].map((label, i) => {
          const stepIdx = ['upload', 'map', 'preview', 'done'].indexOf(step);
          const isActive = i <= stepIdx && step !== 'done';
          const isDone = i < stepIdx || step === 'done';
          return (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${isDone ? 'bg-[#00b4d8] text-white' : isActive ? 'bg-gradient-to-r from-[#12233d] to-[#00b4d8] text-white' : 'bg-slate-200 text-slate-400'}`}>
                {isDone ? <CheckCircle size={16} /> : i + 1}
              </div>
              <span className={`text-sm font-medium hidden sm:inline ${isActive || isDone ? 'text-slate-800' : 'text-slate-400'}`}>{label}</span>
              {i < 2 && <div className={`flex-1 h-0.5 ${i < stepIdx ? 'bg-[#00b4d8]' : 'bg-slate-200'}`} />}
            </div>
          );
        })}
      </div>

      {/* ─── STEP: Upload ─────────────────────────────────────────────────── */}
      {step === 'upload' && (
        <div className="bg-white rounded-2xl border-2 border-[#12233d]/20 shadow-sm p-8">
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#12233d] to-[#00b4d8] flex items-center justify-center mx-auto mb-6 shadow-lg">
              <FileSpreadsheet size={40} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Upload Your Spreadsheet</h3>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
              Drop any billing file - bank statement, credit card export, invoice list, QuickBooks export,
              Mint export, or any spreadsheet with transaction data.
            </p>

            <div className="relative max-w-md mx-auto">
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.tsv,.txt,.xlsx,.xls"
                onChange={handleFile}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="border-2 border-dashed border-[#00b4d8]/40 rounded-2xl p-10 hover:border-[#00b4d8] hover:bg-[#00b4d8]/5 transition-all cursor-pointer">
                <Upload size={36} className="text-[#00b4d8] mx-auto mb-4" />
                <p className="font-semibold text-slate-700">Click to select file</p>
                <p className="text-sm text-slate-400 mt-1">CSV, TSV, XLS, XLSX</p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-lg mx-auto text-xs text-slate-500">
              {['Bank Statements', 'Credit Card Exports', 'QuickBooks / Mint', 'Custom Spreadsheets'].map(label => (
                <div key={label} className="flex items-center gap-1.5 justify-center bg-slate-50 rounded-lg py-2 px-3 border border-slate-200">
                  <CheckCircle size={12} className="text-[#00b4d8]" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Status Banners */}
      {aiMode && aiLoading && (
        <div className="bg-violet-50 rounded-xl p-3 border border-violet-200 flex items-center gap-3">
          <Loader2 size={16} className="animate-spin text-violet-600" />
          <span className="text-sm text-violet-700 font-medium">AI is analyzing your spreadsheet...</span>
        </div>
      )}
      {aiMode && aiError && (
        <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 flex items-center gap-3">
          <AlertTriangle size={16} className="text-amber-600" />
          <span className="text-sm text-amber-700">{aiError} — using pattern matching instead.</span>
          <button onClick={() => setAiError(null)} className="ml-auto text-amber-400 hover:text-amber-600"><X size={14} /></button>
        </div>
      )}

      {/* ─── STEP: Map Columns ────────────────────────────────────────────── */}
      {step === 'map' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border-2 border-[#12233d]/20 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                  Map Your Columns
                  {aiMode && aiColumnConfidence && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 border border-violet-200">
                      <Sparkles size={10} /> AI Detected
                    </span>
                  )}
                </h4>
                <p className="text-sm text-slate-500">
                  {aiMode && aiColumnConfidence
                    ? <>AI detected column roles from <strong>{filename}</strong> ({rawData.length} rows). Review and adjust if needed.</>
                    : <>We auto-detected column roles from <strong>{filename}</strong> ({rawData.length} rows). Adjust any mappings that look wrong.</>
                  }
                </p>
              </div>
              <button onClick={reset} className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-lg">
                <X size={14} /> Cancel
              </button>
            </div>

            {/* Column mapping grid */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-[#12233d]/10">
                    <th className="text-left py-3 px-2 text-slate-500 font-medium w-32">Column Header</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium w-48">Map To</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Sample Values</th>
                  </tr>
                </thead>
                <tbody>
                  {headers.map((header, idx) => (
                    <tr key={idx} className={`border-b border-slate-100 ${columnRoles[idx] === 'skip' ? 'opacity-50' : ''}`}>
                      <td className="py-3 px-2">
                        <span className="font-medium text-slate-800">{header || `Column ${idx + 1}`}</span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="relative">
                          <select
                            value={columnRoles[idx]}
                            onChange={(e) => setColumnRole(idx, e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg border text-sm font-medium appearance-none cursor-pointer pr-8 ${roleBadge(columnRoles[idx])}`}
                          >
                            {COLUMN_ROLES.map(r => (
                              <option key={r.id} value={r.id}>{r.label}</option>
                            ))}
                          </select>
                          <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                        </div>
                        {aiMode && aiColumnConfidence && (() => {
                          const colConf = aiColumnConfidence.find(c => c.index === idx);
                          if (!colConf || colConf.role === 'skip') return null;
                          const pct = Math.round((colConf.confidence || 0) * 100);
                          const color = pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-amber-600' : 'text-red-500';
                          return (
                            <span className={`text-xs mt-0.5 flex items-center gap-1 ${color}`}>
                              <Sparkles size={9} /> {pct}% confident
                            </span>
                          );
                        })()}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex flex-wrap gap-1">
                          {rawData.slice(0, 3).map((row, ri) => (
                            <span key={ri} className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 max-w-[160px] truncate">
                              {row[idx] || '-'}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Options */}
          <div className="bg-white rounded-2xl border-2 border-[#12233d]/20 shadow-sm p-6">
            <h4 className="font-bold text-slate-900 mb-4">Conversion Options</h4>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Sign convention */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Amount Sign Convention</label>
                <select
                  value={signConvention}
                  onChange={(e) => setSignConvention(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-[#12233d]/20 rounded-xl text-sm focus:ring-2 focus:ring-[#00b4d8] focus:border-[#00b4d8]"
                >
                  {SIGN_CONVENTIONS.map(s => (
                    <option key={s.id} value={s.id}>{s.label} - {s.desc}</option>
                  ))}
                </select>
              </div>

              {/* Default paid status */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Default Payment Status</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDefaultPaid(true)}
                    className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${defaultPaid ? 'border-[#00b4d8] bg-[#00b4d8]/10 text-[#00b4d8]' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                  >
                    Mark as Paid
                  </button>
                  <button
                    onClick={() => setDefaultPaid(false)}
                    className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${!defaultPaid ? 'border-amber-400 bg-amber-50 text-amber-600' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                  >
                    Mark as Unpaid
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={reset} className="px-6 py-3 bg-slate-100 rounded-xl text-slate-700 font-medium hover:bg-slate-200">
              Back
            </button>
            {aiMode && aiEnabled && aiApiKey && (
              <button
                onClick={() => aiAnalyzeColumns(headers, rawData)}
                disabled={aiLoading}
                className="flex items-center gap-2 px-4 py-3 bg-violet-100 text-violet-700 rounded-xl font-medium hover:bg-violet-200 disabled:opacity-50"
              >
                {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                Re-analyze with AI
              </button>
            )}
            <button
              onClick={runConversion}
              disabled={aiLoading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#12233d] to-[#00b4d8] text-white rounded-xl font-semibold shadow-lg hover:from-[#0a1628] hover:to-[#0096b7] disabled:opacity-50"
            >
              {aiLoading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
              {aiMode ? 'AI Convert' : 'Convert'} {rawData.length} Rows
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP: Preview & Export ───────────────────────────────────────── */}
      {step === 'preview' && (
        <div className="space-y-4">
          {/* Stats */}
          {previewStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl p-4 border-2 border-[#12233d]/20 shadow-sm text-center">
                <p className="text-2xl font-bold text-[#00b4d8]">{previewStats.total}</p>
                <p className="text-xs text-slate-500">Transactions</p>
              </div>
              <div className="bg-white rounded-xl p-4 border-2 border-green-200 shadow-sm text-center">
                <p className="text-2xl font-bold text-green-600">{currency(previewStats.income)}</p>
                <p className="text-xs text-slate-500">Income</p>
              </div>
              <div className="bg-white rounded-xl p-4 border-2 border-red-200 shadow-sm text-center">
                <p className="text-2xl font-bold text-red-600">{currency(previewStats.expenses)}</p>
                <p className="text-xs text-slate-500">Expenses</p>
              </div>
              <div className="bg-white rounded-xl p-4 border-2 border-[#12233d]/20 shadow-sm text-center">
                <p className="text-sm font-bold text-slate-700">{previewStats.dateRange?.from}</p>
                <p className="text-xs text-slate-400">to</p>
                <p className="text-sm font-bold text-slate-700">{previewStats.dateRange?.to}</p>
              </div>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-amber-800 text-sm flex items-center gap-2">
                  <AlertTriangle size={16} /> {errors.length} row(s) skipped
                </p>
                <button onClick={() => setShowAllErrors(!showAllErrors)} className="text-xs text-amber-600 hover:text-amber-800">
                  {showAllErrors ? 'Show less' : 'Show all'}
                </button>
              </div>
              <ul className="mt-2 text-xs text-amber-700 space-y-1 max-h-32 overflow-y-auto">
                {(showAllErrors ? errors : errors.slice(0, 5)).map((err, i) => (
                  <li key={i}>&bull; {err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Transaction list */}
          <div className="bg-white rounded-2xl border-2 border-[#12233d]/20 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <Eye size={18} className="text-[#00b4d8]" /> Preview Converted Transactions
              </h4>
              <span className="text-sm text-slate-400">{converted.length} transactions</span>
            </div>
            <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-100">
              {converted.slice(0, 100).map((tx, i) => {
                const cat = CATEGORIES.find(c => c.id === tx.category);
                return (
                  <div key={tx.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 group">
                    <span className="text-lg w-8 text-center">{cat?.icon || '📦'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-900 truncate">{tx.desc}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{tx.date}</span>
                        <span>&bull;</span>
                        <select
                          value={tx.category}
                          onChange={(e) => updateConvertedCategory(i, e.target.value)}
                          className="bg-transparent border-none text-xs p-0 focus:ring-0 cursor-pointer hover:text-[#00b4d8] font-medium"
                        >
                          {CATEGORIES.map(c => (
                            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                          ))}
                        </select>
                        {tx._aiConfidence != null && (
                          <span className={`text-[10px] ${tx._aiConfidence >= 0.8 ? 'text-green-500' : tx._aiConfidence >= 0.5 ? 'text-amber-500' : 'text-red-400'}`}>
                            AI {Math.round(tx._aiConfidence * 100)}%
                          </span>
                        )}
                        <span>&bull;</span>
                        <span className={tx.paid ? 'text-green-600' : 'text-amber-500'}>
                          {tx.paid ? 'Paid' : 'Unpaid'}
                        </span>
                      </div>
                    </div>
                    <span className={`font-bold text-sm tabular-nums ${tx.amount >= 0 ? 'text-green-600' : 'text-slate-900'}`}>
                      {tx.amount >= 0 ? '+' : ''}{currency(tx.amount)}
                    </span>
                    <button
                      onClick={() => removeConvertedRow(i)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 transition-opacity"
                      title="Remove row"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
              {converted.length > 100 && (
                <div className="p-4 text-center text-sm text-slate-500 bg-slate-50">
                  ...and {converted.length - 100} more transactions
                </div>
              )}
            </div>
          </div>

          {/* Category breakdown */}
          {previewStats && Object.keys(previewStats.categories).length > 0 && (
            <div className="bg-white rounded-2xl border-2 border-[#12233d]/20 shadow-sm p-4">
              <h4 className="font-bold text-slate-900 mb-3 text-sm">Category Breakdown</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(previewStats.categories)
                  .sort((a, b) => b[1] - a[1])
                  .map(([catId, count]) => {
                    const cat = CATEGORIES.find(c => c.id === catId);
                    return (
                      <span key={catId} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border" style={{ backgroundColor: cat?.bg, color: cat?.color, borderColor: cat?.color + '40' }}>
                        {cat?.icon} {cat?.name || catId} <span className="font-bold">({count})</span>
                      </span>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => setStep('map')} className="px-6 py-3 bg-slate-100 rounded-xl text-slate-700 font-medium hover:bg-slate-200">
              Back to Mapping
            </button>
            <button
              onClick={exportCSV}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-[#00b4d8] text-[#00b4d8] rounded-xl font-semibold hover:bg-[#00b4d8]/5"
            >
              <Download size={18} /> Download CSV
            </button>
            <button
              onClick={exportXLS}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-emerald-500 text-emerald-600 rounded-xl font-semibold hover:bg-emerald-50"
            >
              <FileSpreadsheet size={18} /> Download XLS
            </button>
            <button
              onClick={importDirectly}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#12233d] to-[#00b4d8] text-white rounded-xl font-semibold shadow-lg hover:from-[#0a1628] hover:to-[#0096b7]"
            >
              <Import size={18} /> Import into BalanceBooks
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP: Done ───────────────────────────────────────────────────── */}
      {step === 'done' && (
        <div className="bg-white rounded-2xl border-2 border-[#12233d]/20 shadow-sm p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00b4d8] to-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CheckCircle size={40} className="text-white" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Import Complete!</h3>
          <p className="text-slate-500 mb-6">
            {converted.length} transactions from <strong>{filename}</strong> have been imported into BalanceBooks.
          </p>
          {previewStats && (
            <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto mb-8">
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <p className="text-lg font-bold text-green-700">{currency(previewStats.income)}</p>
                <p className="text-xs text-green-600">Income</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                <p className="text-lg font-bold text-red-700">{currency(previewStats.expenses)}</p>
                <p className="text-xs text-red-600">Expenses</p>
              </div>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <button onClick={reset} className="flex-1 px-6 py-3 border-2 border-[#12233d]/20 rounded-xl text-slate-700 font-medium hover:bg-slate-50">
              Convert Another File
            </button>
            <button
              onClick={() => setView('transactions')}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#12233d] to-[#00b4d8] text-white rounded-xl font-semibold shadow-lg hover:from-[#0a1628] hover:to-[#0096b7]"
            >
              View Transactions
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
