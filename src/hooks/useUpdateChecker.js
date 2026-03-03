import { useState, useEffect, useCallback } from 'react';

const UPDATE_CHECK_URL = import.meta.env.VITE_UPDATE_CHECK_URL || 'https://www.balancebooksapp.com/version.json';
const CHECK_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours
const DISMISSED_KEY = 'bb_update_dismissed';

function compareVersions(current, latest) {
  const a = current.split('.').map(Number);
  const b = latest.split('.').map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = (b[i] || 0) - (a[i] || 0);
    if (diff !== 0) return diff > 0;
  }
  return false;
}

export function useUpdateChecker(currentVersion) {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [dismissed, setDismissed] = useState(() => {
    try {
      const stored = localStorage.getItem(DISMISSED_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const checkForUpdate = useCallback(async () => {
    try {
      const res = await fetch(UPDATE_CHECK_URL, { cache: 'no-cache' });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.version && compareVersions(currentVersion, data.version)) {
        const info = {
          version: data.version,
          releaseNotes: data.releaseNotes || '',
          downloadUrl: data.downloadUrl || 'https://www.balancebooksapp.com',
          publishedAt: data.publishedAt || null,
        };
        setUpdateInfo(info);
        return info;
      }
      setUpdateInfo(null);
      return null;
    } catch {
      // Network failure — silently ignore
      return null;
    }
  }, [currentVersion]);

  const dismiss = useCallback(() => {
    if (updateInfo) {
      const val = { version: updateInfo.version, at: Date.now() };
      setDismissed(val);
      try { localStorage.setItem(DISMISSED_KEY, JSON.stringify(val)); } catch {}
    }
  }, [updateInfo]);

  // Auto-check on mount and periodically
  useEffect(() => {
    checkForUpdate();
    const timer = setInterval(checkForUpdate, CHECK_INTERVAL);
    return () => clearInterval(timer);
  }, [checkForUpdate]);

  // Listen for Electron "check-updates" menu event
  useEffect(() => {
    if (window.electronAPI?.onCheckUpdates) {
      const handler = () => checkForUpdate().then(info => {
        if (!info) {
          alert('You are running the latest version of Balance Books Pro.');
        }
      });
      window.electronAPI.onCheckUpdates(handler);
      return () => window.electronAPI?.removeAllListeners?.('check-updates');
    }
  }, [checkForUpdate]);

  const showBanner = updateInfo && (!dismissed || dismissed.version !== updateInfo.version);

  return { updateInfo, showBanner, dismiss, checkForUpdate };
}
