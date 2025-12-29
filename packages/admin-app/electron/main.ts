import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { WINDOW_CONFIG, ADMIN_APP_NAME } from '@monitor-me/shared';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  const { width, height, minWidth, minHeight } = WINDOW_CONFIG.ADMIN_APP;

  mainWindow = new BrowserWindow({
    width,
    height,
    minWidth,
    minHeight,
    title: ADMIN_APP_NAME,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    show: false,
    icon: path.join(__dirname, '../assets/icon.png'),
  });

  // Load the app
  if (process.env.NODE_ENV === 'development' || process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL || 'http://localhost:5174');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Initialize app
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
