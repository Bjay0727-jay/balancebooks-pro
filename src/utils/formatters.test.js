import { describe, it, expect } from 'vitest';
import { uid, roundCents, currency, shortDate, getDateParts, getMonthKey, escapeCSVField } from './formatters';

describe('uid', () => {
  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => uid()));
    expect(ids.size).toBe(100);
  });

  it('returns a string', () => {
    expect(typeof uid()).toBe('string');
  });

  it('generates IDs with sufficient length', () => {
    expect(uid().length).toBeGreaterThan(8);
  });
});

describe('roundCents', () => {
  it('rounds to 2 decimal places', () => {
    expect(roundCents(1.005)).toBe(1.01);
    expect(roundCents(1.004)).toBe(1);
    expect(roundCents(0.1 + 0.2)).toBe(0.3);
  });

  it('handles exact values', () => {
    expect(roundCents(10.50)).toBe(10.5);
    expect(roundCents(100)).toBe(100);
    expect(roundCents(0)).toBe(0);
  });

  it('handles negative numbers', () => {
    expect(roundCents(-1.005)).toBe(-1);
    expect(roundCents(-99.99)).toBe(-99.99);
  });

  it('handles floating-point accumulation', () => {
    // Simulate adding many small amounts
    let total = 0;
    for (let i = 0; i < 100; i++) total += 0.01;
    expect(roundCents(total)).toBe(1);
  });
});

describe('currency', () => {
  it('formats positive numbers', () => {
    expect(currency(1234.56)).toBe('$1,234.56');
    expect(currency(0)).toBe('$0.00');
    expect(currency(1000000)).toBe('$1,000,000.00');
  });

  it('formats negative numbers', () => {
    expect(currency(-50.99)).toBe('-$50.99');
  });

  it('handles null/undefined/NaN', () => {
    expect(currency(null)).toBe('$0.00');
    expect(currency(undefined)).toBe('$0.00');
    expect(currency(NaN)).toBe('$0.00');
  });

  it('rounds floating-point artifacts', () => {
    expect(currency(0.1 + 0.2)).toBe('$0.30');
  });
});

describe('shortDate', () => {
  it('formats YYYY-MM-DD strings', () => {
    expect(shortDate('2026-01-15')).toBe('Jan 15');
    expect(shortDate('2026-12-01')).toBe('Dec 1');
    expect(shortDate('2026-06-30')).toBe('Jun 30');
  });

  it('handles empty/null input', () => {
    expect(shortDate('')).toBe('');
    expect(shortDate(null)).toBe('');
    expect(shortDate(undefined)).toBe('');
  });

  it('strips leading zeros from day', () => {
    expect(shortDate('2026-03-03')).toBe('Mar 3');
  });
});

describe('getDateParts', () => {
  it('parses YYYY-MM-DD correctly', () => {
    const parts = getDateParts('2026-03-15');
    expect(parts).toEqual({ year: 2026, month: 2, day: 15 }); // month is 0-indexed
  });

  it('handles January correctly', () => {
    const parts = getDateParts('2026-01-01');
    expect(parts).toEqual({ year: 2026, month: 0, day: 1 });
  });

  it('handles December correctly', () => {
    const parts = getDateParts('2025-12-31');
    expect(parts).toEqual({ year: 2025, month: 11, day: 31 });
  });

  it('returns null for invalid input', () => {
    expect(getDateParts('')).toBeNull();
    expect(getDateParts(null)).toBeNull();
    expect(getDateParts(undefined)).toBeNull();
  });
});

describe('getMonthKey', () => {
  it('converts 0-indexed month to ISO YYYY-MM', () => {
    expect(getMonthKey(0, 2026)).toBe('2026-01');  // January
    expect(getMonthKey(11, 2025)).toBe('2025-12'); // December
    expect(getMonthKey(5, 2026)).toBe('2026-06');  // June
  });

  it('pads single-digit months', () => {
    expect(getMonthKey(0, 2026)).toBe('2026-01');
    expect(getMonthKey(8, 2026)).toBe('2026-09');
  });

  it('does not pad double-digit months', () => {
    expect(getMonthKey(9, 2026)).toBe('2026-10');
    expect(getMonthKey(10, 2026)).toBe('2026-11');
  });
});

describe('escapeCSVField', () => {
  it('wraps strings in double quotes', () => {
    expect(escapeCSVField('hello')).toBe('"hello"');
  });

  it('escapes internal double quotes', () => {
    expect(escapeCSVField('say "hi"')).toBe('"say ""hi"""');
  });

  it('handles null and undefined', () => {
    expect(escapeCSVField(null)).toBe('""');
    expect(escapeCSVField(undefined)).toBe('""');
  });

  it('prevents formula injection with = prefix', () => {
    expect(escapeCSVField('=SUM(A1:A10)')).toBe("\"'=SUM(A1:A10)\"");
  });

  it('prevents formula injection with + prefix', () => {
    expect(escapeCSVField('+cmd|calc')).toBe("\"'+cmd|calc\"");
  });

  it('prevents formula injection with - prefix', () => {
    expect(escapeCSVField('-cmd|calc')).toBe("\"'-cmd|calc\"");
  });

  it('prevents formula injection with @ prefix', () => {
    expect(escapeCSVField('@SUM(A1)')).toBe("\"'@SUM(A1)\"");
  });

  it('handles normal strings without injection prefixes', () => {
    expect(escapeCSVField('Groceries')).toBe('"Groceries"');
    expect(escapeCSVField('Gas Station #42')).toBe('"Gas Station #42"');
  });
});
