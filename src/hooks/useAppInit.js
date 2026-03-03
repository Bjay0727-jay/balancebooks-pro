// src/hooks/useAppInit.js
import { useState, useEffect } from 'react';
import { migrateFromLocalStorage, needsMigration, loadFromIndexedDB } from '../db/migration';

export function useAppInit() {
  const [initialized, setInitialized] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    async function init() {
      try {
        // Run migration if needed (localStorage -> IndexedDB)
        if (needsMigration()) {
          const result = await migrateFromLocalStorage();
          if (!result.success && !result.skipped) {
            console.warn('[Init] Migration failed, falling back to localStorage');
            setInitialized(true);
            setInitializing(false);
            return;
          }
        }
        // Load data from IndexedDB
        const loaded = await loadFromIndexedDB();
        setData(loaded);
        setInitialized(true);
      } catch (err) {
        console.error('[Init] Failed:', err);
        // Fall through — App.jsx will use its own localStorage fallback
        setInitialized(true);
      } finally {
        setInitializing(false);
      }
    }
    init();
  }, []);

  return { initialized, initializing, data };
}
