const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { MemorySummaries } = require('../supabase/functions/memory/summaries');
const { Logger } = require('../utils/logger');

// Custom logger for UI events
class UILogger {
  private static windows: Electron.BrowserWindow[] = [];

  static addWindow(window: Electron.BrowserWindow) {
    this.windows.push(window);
  }

  static log(...args: any[]) {
    Logger.log(...args);
    // Send log to all windows
    this.windows.forEach(window => {
      window.webContents.send('log-update', args.join(' '));
    });
  }
}

let mainWindow: Electron.BrowserWindow | null = null;

async function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Add window to UILogger
  UILogger.addWindow(mainWindow);

  // Load the index.html file
  await mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

// Initialize the application
app.whenReady().then(async () => {
  await createWindow();

  // Set up IPC handlers
  ipcMain.handle('get-short-term-memory', async () => {
    try {
      const memories = await MemorySummaries.getActiveMemories();
      return memories.short || [];
    } catch (error) {
      console.error('Error fetching short-term memory:', error);
      return [];
    }
  });

  // Replace default Logger with UILogger
  Object.assign(Logger, UILogger);
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createWindow();
  }
}); 