// src/hooks/useAppInit.js
import { useState, useEffect } from 'react';
import { initializeSettings } from '../db/database';
import { migrateFromLocalStorage, getMigrationStatus } from '../db/migration';

export function useAppInit() {
  const [initialized, setInitialized] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const status = getMigrationStatus();
        if (!status.migrated) {
          await migrateFromLocalStorage();
        } else {
          await initializeSettings();
        }
        setInitialized(true);
      } catch (err) {
        console.error('Init failed:', err);
      } finally {
        setInitializing(false);
      }
    }
    init();
  }, []);

  return { initialized, initializing };
}
