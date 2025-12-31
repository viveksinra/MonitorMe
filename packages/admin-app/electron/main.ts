import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import Store from 'electron-store';
import {
  WINDOW_CONFIG,
  ADMIN_APP_NAME,
  IpcChannels,
  DEFAULT_SERVER_CONFIG,
  ConnectionStatus,
} from '@monitor-me/shared';
import type { ServerConfig, UserInfo } from '@monitor-me/shared';
import {
  connectToServer,
  disconnectFromServer,
  getConnectionStatus,
  getUsers,
  requestViewUser,
  setMainWindow,
  endViewSession,
  consumePendingWebRTC,
  sendWebRTCIceCandidate,
  sendWebRTCAnswer,
} from './socket-client';

// Initialize electron-store
const store = new Store({
  name: 'monitor-me-admin',
  defaults: {
    serverConfig: DEFAULT_SERVER_CONFIG as ServerConfig,
    adminName: 'Admin',
  },
});

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
      sandbox: false, // Disabled to allow preload script to resolve workspace packages
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
    setMainWindow(null);
  });

  // Set main window reference for socket client
  setMainWindow(mainWindow);
}

// Set up IPC handlers
function setupIpcHandlers(): void {
  // Server config handlers
  ipcMain.handle(IpcChannels.GET_SERVER_CONFIG, (): ServerConfig => {
    return store.get('serverConfig') as ServerConfig;
  });

  ipcMain.handle(IpcChannels.SET_SERVER_CONFIG, (_event, config: ServerConfig): void => {
    store.set('serverConfig', config);
  });

  // Socket connection handlers
  ipcMain.handle(IpcChannels.SOCKET_CONNECT, (_event, config: ServerConfig): void => {
    const adminName = store.get('adminName') as string;
    connectToServer(config, { name: adminName });
  });

  ipcMain.handle(IpcChannels.SOCKET_DISCONNECT, (): void => {
    disconnectFromServer();
  });

  ipcMain.handle(IpcChannels.SOCKET_STATUS, (): ConnectionStatus => {
    return getConnectionStatus();
  });

  // Users handlers
  ipcMain.handle(IpcChannels.GET_USERS, (): UserInfo[] => {
    return getUsers();
  });

  ipcMain.handle(IpcChannels.REQUEST_VIEW, (_event, userId: string): void => {
    requestViewUser(userId);
  });

  // Live view handlers
  ipcMain.handle('view:end-session', (_event, userId: string): void => {
    endViewSession(userId);
  });

  ipcMain.handle('view:get-stream', (): MediaStream | null => {
    // WebRTC runs in the renderer now; keep for backward compatibility.
    return null;
  });

  // WebRTC signaling pass-through (renderer -> main -> socket)
  ipcMain.handle('webrtc:send-answer', (_event, data: { userId: string; answer: RTCSessionDescriptionInit }): void => {
    sendWebRTCAnswer(data.userId, data.answer);
  });

  ipcMain.handle('webrtc:send-ice-candidate', (_event, data: { userId: string; candidate: RTCIceCandidateInit }): void => {
    sendWebRTCIceCandidate(data.userId, data.candidate);
  });

  // Allow renderer to fetch any buffered offer/ICE that arrived before UI mounted
  ipcMain.handle('webrtc:consume-pending', (_event, userId: string): { offer?: RTCSessionDescriptionInit; ice: RTCIceCandidateInit[] } => {
    return consumePendingWebRTC(userId);
  });
}

// Initialize app
app.whenReady().then(() => {
  setupIpcHandlers();
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

app.on('before-quit', () => {
  disconnectFromServer();
});
