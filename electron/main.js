const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

// Keep a global reference of the window object
let mainWindow = null;
let isQuitting = false;

// Determine if we're in development or production
const isDev = !app.isPackaged;

// User data path for storing app data
const userDataPath = app.getPath('userData');
const dataFilePath = path.join(userDataPath, 'balance-books-data.json');

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Balance Books Pro',
    icon: path.join(__dirname, '../build/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    backgroundColor: '#f8fafc',
    show: false, // Don't show until ready
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Handle window close - quit the app entirely on Windows/Linux
  mainWindow.on('close', (event) => {
    if (!isQuitting && process.platform === 'darwin') {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  // Cleanup on close
  mainWindow.on('closed', () => {
    mainWindow = null;
    // Force quit on Windows/Linux when window is closed
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Import Transactions',
          accelerator: 'CmdOrCtrl+I',
          click: () => {
            mainWindow.webContents.send('menu-import');
          },
        },
        {
          label: 'Export Data',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            mainWindow.webContents.send('menu-export');
          },
        },
        { type: 'separator' },
        {
          label: 'Backup Data',
          click: async () => {
            const { filePath } = await dialog.showSaveDialog(mainWindow, {
              title: 'Backup Data',
              defaultPath: `balance-books-backup-${new Date().toISOString().split('T')[0]}.json`,
              filters: [{ name: 'JSON', extensions: ['json'] }],
            });
            if (filePath) {
              mainWindow.webContents.send('backup-data', filePath);
            }
          },
        },
        {
          label: 'Restore Data',
          click: async () => {
            const { filePaths } = await dialog.showOpenDialog(mainWindow, {
              title: 'Restore Data',
              filters: [{ name: 'JSON', extensions: ['json'] }],
              properties: ['openFile'],
            });
            if (filePaths && filePaths[0]) {
              mainWindow.webContents.send('restore-data', filePaths[0]);
            }
          },
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Dashboard',
          accelerator: 'CmdOrCtrl+1',
          click: () => mainWindow.webContents.send('navigate', 'dashboard'),
        },
        {
          label: 'Transactions',
          accelerator: 'CmdOrCtrl+2',
          click: () => mainWindow.webContents.send('navigate', 'transactions'),
        },
        {
          label: 'Bank Accounts',
          accelerator: 'CmdOrCtrl+3',
          click: () => mainWindow.webContents.send('navigate', 'accounts'),
        },
        {
          label: '12-Month Cycle',
          accelerator: 'CmdOrCtrl+4',
          click: () => mainWindow.webContents.send('navigate', 'cycle'),
        },
        {
          label: 'Savings',
          accelerator: 'CmdOrCtrl+5',
          click: () => mainWindow.webContents.send('navigate', 'savings'),
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(process.platform === 'darwin'
          ? [
              { type: 'separator' },
              { role: 'front' },
              { type: 'separator' },
              { role: 'window' },
            ]
          : [{ role: 'close' }]),
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: () => shell.openExternal('https://docs.balancebookspro.com'),
        },
        {
          label: 'Support',
          click: () => shell.openExternal('https://support.balancebookspro.com'),
        },
        { type: 'separator' },
        {
          label: 'Check for Updates',
          click: () => mainWindow.webContents.send('check-updates'),
        },
        { type: 'separator' },
        {
          label: 'About Balance Books Pro',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Balance Books Pro',
              message: 'Balance Books Pro',
              detail: `Version: ${app.getVersion()}\nLicense: $13.99 Commercial\n\n© 2025 Balance Books Pro. All rights reserved.`,
            });
          },
        },
      ],
    },
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        {
          label: 'Preferences',
          accelerator: 'Cmd+,',
          click: () => mainWindow.webContents.send('navigate', 'settings'),
        },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC handlers for data persistence
ipcMain.handle('save-data', async (event, data) => {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('load-data', async () => {
  try {
    if (fs.existsSync(dataFilePath)) {
      const data = fs.readFileSync(dataFilePath, 'utf8');
      return { success: true, data: JSON.parse(data) };
    }
    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('export-csv', async (event, csvContent) => {
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Export Transactions',
    defaultPath: `balance-books-${new Date().toISOString().split('T')[0]}.csv`,
    filters: [{ name: 'CSV', extensions: ['csv'] }],
  });
  
  if (filePath) {
    try {
      fs.writeFileSync(filePath, csvContent);
      return { success: true, filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  return { success: false, cancelled: true };
});

ipcMain.handle('import-csv', async () => {
  const { filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Import Transactions',
    filters: [{ name: 'CSV', extensions: ['csv'] }],
    properties: ['openFile'],
  });
  
  if (filePaths && filePaths[0]) {
    try {
      const content = fs.readFileSync(filePaths[0], 'utf8');
      return { success: true, content };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  return { success: false, cancelled: true };
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  createMenu();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow) {
      mainWindow.show();
    }
  });
});

// Handle second instance - focus existing window
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// Mark as quitting before quit
app.on('before-quit', () => {
  isQuitting = true;
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS, apps stay open until explicitly quit
  // On Windows/Linux, quit immediately
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Force exit after quit
app.on('quit', () => {
  // Ensure all processes are terminated
  if (mainWindow) {
    mainWindow.destroy();
    mainWindow = null;
  }
  // Force exit to ensure no hanging processes
  process.exit(0);
});

// Handle will-quit to cleanup
app.on('will-quit', (event) => {
  // Cleanup any remaining resources
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.destroy();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.origin !== 'http://localhost:5173' && !navigationUrl.startsWith('file://')) {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
  });
});
