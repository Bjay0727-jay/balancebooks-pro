import { describe, it, expect } from 'vitest';
import { CATEGORIES, FREQUENCY_OPTIONS, MONTHS, FULL_MONTHS, STORAGE_KEYS, getCategoryById } from './constants';

describe('CATEGORIES', () => {
  it('has at least 20 categories', () => {
    expect(CATEGORIES.length).toBeGreaterThanOrEqual(20);
  });

  it('each category has required fields', () => {
    CATEGORIES.forEach(cat => {
      expect(cat).toHaveProperty('id');
      expect(cat).toHaveProperty('name');
      expect(cat).toHaveProperty('color');
      expect(cat).toHaveProperty('bg');
      expect(cat).toHaveProperty('icon');
      expect(typeof cat.id).toBe('string');
      expect(typeof cat.name).toBe('string');
    });
  });

  it('has unique IDs', () => {
    const ids = CATEGORIES.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('includes income and other categories', () => {
    expect(CATEGORIES.find(c => c.id === 'income')).toBeDefined();
    expect(CATEGORIES.find(c => c.id === 'other')).toBeDefined();
  });
});

describe('getCategoryById', () => {
  it('returns matching category', () => {
    const income = getCategoryById('income');
    expect(income.id).toBe('income');
    expect(income.name).toBe('Income');
  });

  it('falls back to "other" for unknown IDs', () => {
    const result = getCategoryById('nonexistent');
    expect(result.id).toBe('other');
  });
});

describe('FREQUENCY_OPTIONS', () => {
  it('has 5 options', () => {
    expect(FREQUENCY_OPTIONS).toHaveLength(5);
  });

  it('options are in ascending order of days', () => {
    for (let i = 1; i < FREQUENCY_OPTIONS.length; i++) {
      expect(FREQUENCY_OPTIONS[i].days).toBeGreaterThan(FREQUENCY_OPTIONS[i - 1].days);
    }
  });
});

describe('MONTHS / FULL_MONTHS', () => {
  it('has 12 months each', () => {
    expect(MONTHS).toHaveLength(12);
    expect(FULL_MONTHS).toHaveLength(12);
  });

  it('starts with January', () => {
    expect(MONTHS[0]).toBe('Jan');
    expect(FULL_MONTHS[0]).toBe('January');
  });

  it('ends with December', () => {
    expect(MONTHS[11]).toBe('Dec');
    expect(FULL_MONTHS[11]).toBe('December');
  });
});

describe('STORAGE_KEYS', () => {
  it('all keys are prefixed with bb_', () => {
    Object.values(STORAGE_KEYS).forEach(key => {
      expect(key).toMatch(/^bb_/);
    });
  });
});
