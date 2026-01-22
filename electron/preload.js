const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Data persistence
  saveData: (data) => ipcRenderer.invoke('save-data', data),
  loadData: () => ipcRenderer.invoke('load-data'),
  
  // File operations
  exportCSV: (content) => ipcRenderer.invoke('export-csv', content),
  importCSV: () => ipcRenderer.invoke('import-csv'),
  
  // Menu events
  onMenuImport: (callback) => ipcRenderer.on('menu-import', callback),
  onMenuExport: (callback) => ipcRenderer.on('menu-export', callback),
  onNavigate: (callback) => ipcRenderer.on('navigate', (event, view) => callback(view)),
  onBackupData: (callback) => ipcRenderer.on('backup-data', (event, filePath) => callback(filePath)),
  onRestoreData: (callback) => ipcRenderer.on('restore-data', (event, filePath) => callback(filePath)),
  onCheckUpdates: (callback) => ipcRenderer.on('check-updates', callback),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  
  // Platform info
  platform: process.platform,
  isElectron: true,
});

// Expose app version
contextBridge.exposeInMainWorld('appInfo', {
  version: require('../package.json').version,
  name: 'Balance Books Pro',
});
