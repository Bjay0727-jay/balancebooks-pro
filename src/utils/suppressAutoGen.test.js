import { describe, it, expect, beforeEach } from 'vitest';
import { suppressAutoGen } from './suppressAutoGen';

describe('suppressAutoGen', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('adds a suppression key to localStorage', () => {
    suppressAutoGen('rec-123', 2, 2026);
    const stored = JSON.parse(localStorage.getItem('bb_autoGenDeleted'));
    expect(stored).toContain('rec-123_2026-03');
  });

  it('does not duplicate existing suppression keys', () => {
    suppressAutoGen('rec-123', 2, 2026);
    suppressAutoGen('rec-123', 2, 2026);
    const stored = JSON.parse(localStorage.getItem('bb_autoGenDeleted'));
    expect(stored.filter(k => k === 'rec-123_2026-03').length).toBe(1);
  });

  it('supports multiple different suppression keys', () => {
    suppressAutoGen('rec-123', 0, 2026);
    suppressAutoGen('rec-456', 0, 2026);
    suppressAutoGen('rec-123', 1, 2026);
    const stored = JSON.parse(localStorage.getItem('bb_autoGenDeleted'));
    expect(stored).toHaveLength(3);
    expect(stored).toContain('rec-123_2026-01');
    expect(stored).toContain('rec-456_2026-01');
    expect(stored).toContain('rec-123_2026-02');
  });

  it('handles December correctly (month=11)', () => {
    suppressAutoGen('rec-789', 11, 2025);
    const stored = JSON.parse(localStorage.getItem('bb_autoGenDeleted'));
    expect(stored).toContain('rec-789_2025-12');
  });

  it('handles empty localStorage gracefully', () => {
    expect(() => suppressAutoGen('rec-1', 5, 2026)).not.toThrow();
  });
});
