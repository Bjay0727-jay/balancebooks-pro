import { useEffect, useCallback } from 'react';
import { useAppStore } from '../stores/useAppStore';

const INPUT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

export function useKeyboardShortcuts() {
  const setModal = useAppStore(s => s.setModal);
  const setView = useAppStore(s => s.setView);
  const modal = useAppStore(s => s.modal);
  const month = useAppStore(s => s.month);
  const year = useAppStore(s => s.year);
  const setMonth = useAppStore(s => s.setMonth);
  const setYear = useAppStore(s => s.setYear);

  const handler = useCallback((e) => {
    // Skip when typing in an input field
    if (INPUT_TAGS.has(document.activeElement?.tagName)) return;
    // Skip when a modifier is held (except for ?)
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    // Don't handle shortcuts when a modal is open (except Escape, handled by Modal)
    if (modal) return;

    switch (e.key) {
      case 'n':
      case 'N':
        e.preventDefault();
        setModal('add');
        break;
      case '/':
        e.preventDefault();
        setView('transactions');
        // Focus search input after a tick (view needs to render)
        requestAnimationFrame(() => {
          const searchInput = document.querySelector('input[placeholder="Search..."]');
          if (searchInput) searchInput.focus();
        });
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (month === 0) { setMonth(11); setYear(year - 1); }
        else setMonth(month - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (month === 11) { setMonth(0); setYear(year + 1); }
        else setMonth(month + 1);
        break;
      case '1': setView('dashboard'); break;
      case '2': setView('transactions'); break;
      case '3': setView('budget'); break;
      case '4': setView('analytics'); break;
      case '5': setView('recurring'); break;
      case '?':
        e.preventDefault();
        setModal('keyboard-shortcuts');
        break;
      default:
        break;
    }
  }, [modal, month, year, setModal, setView, setMonth, setYear]);

  useEffect(() => {
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handler]);
}
