// src/utils/formatters.js

export const uid = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9) + '-' + Math.random().toString(36).substr(2, 9);
};

export const roundCents = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

export const currency = (n) => {
  if (n === null || n === undefined || isNaN(n)) return '$0.00';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(roundCents(n));
};

export const shortDate = (dateStr) => {
  if (!dateStr) return '';
  const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(match[2]) - 1]} ${parseInt(match[3])}`;
  }
  return '';
};

export const getDateParts = (dateStr) => {
  if (!dateStr) return null;
  const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return { year: parseInt(match[1]), month: parseInt(match[2]) - 1, day: parseInt(match[3]) };
  }
  return null;
};

// month is 0-indexed (from Date.getMonth()), output is ISO YYYY-MM (1-indexed)
export const getMonthKey = (month, year) => `${year}-${String(month + 1).padStart(2, '0')}`;

export const escapeCSVField = (s) => {
  const str = String(s == null ? '' : s);
  const escaped = str.replace(/"/g, '""');
  // Prevent CSV formula injection
  if (/^[=+\-@\t\r]/.test(escaped)) {
    return `"'${escaped}"`;
  }
  return `"${escaped}"`;
};
