import { useEffect, useCallback } from 'react';
import { useAppStore } from '../stores/useAppStore';

const DROPBOX_APP_KEY = typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_DROPBOX_APP_KEY || '') : '';
const DROPBOX_REDIRECT_URI = typeof window !== 'undefined' ? window.location.origin : '';

export function useDropbox() {
  const dropboxToken = useAppStore(s => s.dropboxToken);
  const setDropboxToken = useAppStore(s => s.setDropboxToken);
  const setDropboxConnected = useAppStore(s => s.setDropboxConnected);
  const setDropboxError = useAppStore(s => s.setDropboxError);
  const setDropboxSyncing = useAppStore(s => s.setDropboxSyncing);
  const setDropboxLastSync = useAppStore(s => s.setDropboxLastSync);
  const setLastBackupDate = useAppStore(s => s.setLastBackupDate);
  const setRestoreData = useAppStore(s => s.setRestoreData);
  const setModal = useAppStore(s => s.setModal);
  const disconnectDropbox = useAppStore(s => s.disconnectDropbox);

  // Handle Dropbox OAuth callback (PKCE or legacy implicit)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const codeVerifier = sessionStorage.getItem('bb_dropbox_code_verifier');
    if (code && codeVerifier && DROPBOX_APP_KEY) {
      (async () => {
        try {
          const resp = await fetch('https://api.dropboxapi.com/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ code, grant_type: 'authorization_code', client_id: DROPBOX_APP_KEY, redirect_uri: DROPBOX_REDIRECT_URI, code_verifier: codeVerifier }),
          });
          if (resp.ok) {
            const data = await resp.json();
            setDropboxToken(data.access_token);
            setDropboxConnected(true);
            setDropboxError(null);
          } else {
            setDropboxError('Failed to connect to Dropbox. Please try again.');
          }
        } catch (err) {
          setDropboxError('Connection error: ' + err.message);
        } finally {
          sessionStorage.removeItem('bb_dropbox_code_verifier');
          window.history.replaceState(null, '', window.location.pathname);
        }
      })();
    }
    // Legacy implicit flow
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      const hashParams = new URLSearchParams(hash.substring(1));
      const token = hashParams.get('access_token');
      if (token) {
        setDropboxToken(token);
        setDropboxConnected(true);
        setDropboxError(null);
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, []);

  const connectDropbox = useCallback(async () => {
    if (!DROPBOX_APP_KEY) {
      alert('Dropbox integration is not configured.\n\nSet VITE_DROPBOX_APP_KEY and rebuild.');
      return;
    }
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const codeVerifier = btoa(String.fromCharCode(...array)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier));
    const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    sessionStorage.setItem('bb_dropbox_code_verifier', codeVerifier);
    window.location.href = `https://www.dropbox.com/oauth2/authorize?client_id=${DROPBOX_APP_KEY}&response_type=code&redirect_uri=${encodeURIComponent(DROPBOX_REDIRECT_URI)}&code_challenge=${codeChallenge}&code_challenge_method=S256&token_access_type=offline`;
  }, []);

  const syncToDropbox = useCallback(async (token = dropboxToken) => {
    if (!token) { setDropboxError('Not connected to Dropbox'); return; }
    setDropboxSyncing(true);
    setDropboxError(null);
    const state = useAppStore.getState();
    try {
      const backup = {
        appName: 'BalanceBooks Pro', version: __APP_VERSION__, exportDate: new Date().toISOString(), syncedFrom: window.location.hostname,
        data: { transactions: state.transactions, recurringExpenses: state.recurringExpenses, monthlyBalances: state.monthlyBalances, savingsGoal: state.savingsGoal, budgetGoals: state.budgetGoals, debts: state.debts }
      };
      const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/octet-stream', 'Dropbox-API-Arg': JSON.stringify({ path: '/balancebooks-backup.json', mode: 'overwrite', autorename: false, mute: false }) },
        body: JSON.stringify(backup, null, 2)
      });
      if (response.ok) { const now = new Date().toISOString(); setDropboxLastSync(now); setLastBackupDate(now); setDropboxError(null); }
      else if (response.status === 401) { disconnectDropbox(); setDropboxError('Session expired. Please reconnect.'); }
      else { const err = await response.json().catch(() => ({})); throw new Error(err.error_summary || 'Upload failed'); }
    } catch (err) { setDropboxError(err.message || 'Sync failed.'); }
    finally { setDropboxSyncing(false); }
  }, [dropboxToken]);

  const restoreFromDropbox = useCallback(async () => {
    if (!dropboxToken) { setDropboxError('Not connected to Dropbox'); return; }
    setDropboxSyncing(true);
    setDropboxError(null);
    try {
      const response = await fetch('https://content.dropboxapi.com/2/files/download', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${dropboxToken}`, 'Dropbox-API-Arg': JSON.stringify({ path: '/balancebooks-backup.json' }) }
      });
      if (response.ok) {
        const backup = await response.json();
        setRestoreData({
          filename: 'Dropbox Cloud Backup', date: backup.exportDate, version: backup.version || '1.0',
          summary: { transactions: backup.data?.transactions?.length || 0, recurringBills: backup.data?.recurringExpenses?.length || 0, debts: backup.data?.debts?.length || 0, budgetGoals: Object.keys(backup.data?.budgetGoals || {}).filter(k => backup.data.budgetGoals[k] > 0).length },
          raw: backup, source: 'dropbox'
        });
        setModal('restore-wizard');
      } else if (response.status === 409) { setDropboxError('No backup found. Sync your data first!'); }
      else if (response.status === 401) { disconnectDropbox(); setDropboxError('Session expired.'); }
      else { throw new Error('Download failed'); }
    } catch (err) { setDropboxError(err.message || 'Restore failed.'); }
    finally { setDropboxSyncing(false); }
  }, [dropboxToken]);

  return { connectDropbox, syncToDropbox, restoreFromDropbox, disconnectDropbox };
}
