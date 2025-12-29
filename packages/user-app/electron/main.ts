import { app, BrowserWindow, ipcMain, Tray } from 'electron';
import * as path from 'path';
import { randomUUID } from 'crypto';
import Store from 'electron-store';
import {
  IpcChannels,
  MonitoringState,
  WINDOW_CONFIG,
  USER_APP_NAME,
  CONSENT_VERSION,
  DEFAULT_SERVER_CONFIG,
  ConnectionStatus,
} from '@monitor-me/shared';
import type { ConsentData, AppConfig, ServerConfig } from '@monitor-me/shared';
import { createTray, updateTrayState, destroyTray } from './tray';
import { getAppQuitting, setAppQuitting } from './types';
import {
  connectToServer,
  disconnectFromServer,
  getConnectionStatus,
  sendStateUpdate,
  setMainWindow,
} from './socket-client';
import {
  initScheduler,
  startScheduler,
  stopScheduler,
  isSchedulerRunning,
  getLastCaptureTime,
  captureNow,
} from './screenshot-scheduler';

// Generate unique machine ID if not exists
function getMachineId(): string {
  let machineId = store.get('machineId') as string | undefined;
  if (!machineId) {
    machineId = randomUUID();
    store.set('machineId', machineId);
  }
  return machineId;
}

// Initialize electron-store
const store = new Store({
  name: 'monitor-me-user',
  defaults: {
    consent: null as ConsentData | null,
    config: {
      workHours: {
        startHour: 9,
        startMinute: 0,
        endHour: 18,
        endMinute: 0,
        activeDays: [1, 2, 3, 4, 5],
      },
      screenshotIntervalMinutes: 15,
      userName: '',
      machineId: '',
    } as AppConfig,
    serverConfig: DEFAULT_SERVER_CONFIG as ServerConfig,
    monitoringState: MonitoringState.IDLE,
    machineId: '',
  },
});

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let currentState: MonitoringState = MonitoringState.IDLE;

function createWindow(): void {
  const { width, height, minWidth, minHeight } = WINDOW_CONFIG.USER_APP;

  mainWindow = new BrowserWindow({
    width,
    height,
    minWidth,
    minHeight,
    title: USER_APP_NAME,
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
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('close', (event) => {
    // Prevent window from closing, minimize to tray instead
    if (mainWindow && !getAppQuitting()) {
      event.preventDefault();
      mainWindow.hide();
    }
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
  // Consent handlers
  ipcMain.handle(IpcChannels.GET_CONSENT, (): ConsentData | null => {
    return store.get('consent') as ConsentData | null;
  });

  ipcMain.handle(IpcChannels.SET_CONSENT, (_event, consent: ConsentData): void => {
    store.set('consent', { ...consent, consentVersion: CONSENT_VERSION });
  });

  ipcMain.handle(IpcChannels.HAS_CONSENT, (): boolean => {
    const consent = store.get('consent') as ConsentData | null;
    return consent !== null;
  });

  // Config handlers
  ipcMain.handle(IpcChannels.GET_CONFIG, (): AppConfig => {
    return store.get('config') as AppConfig;
  });

  ipcMain.handle(IpcChannels.SET_CONFIG, (_event, config: Partial<AppConfig>): void => {
    const currentConfig = store.get('config') as AppConfig;
    store.set('config', { ...currentConfig, ...config });
  });

  // State handlers
  ipcMain.handle(IpcChannels.GET_STATE, (): MonitoringState => {
    return currentState;
  });

  ipcMain.handle(IpcChannels.SET_STATE, (_event, state: MonitoringState): void => {
    currentState = state;
    store.set('monitoringState', state);
    updateTrayState(tray, state);
    mainWindow?.webContents.send(IpcChannels.ON_STATE_CHANGE, state);
    // Send state update to server
    sendStateUpdate(state);
  });

  // Server config handlers
  ipcMain.handle(IpcChannels.GET_SERVER_CONFIG, (): ServerConfig => {
    return store.get('serverConfig') as ServerConfig;
  });

  ipcMain.handle(IpcChannels.SET_SERVER_CONFIG, (_event, config: ServerConfig): void => {
    store.set('serverConfig', config);
  });

  // Socket connection handlers
  ipcMain.handle(IpcChannels.SOCKET_CONNECT, (_event, config: ServerConfig): void => {
    const appConfig = store.get('config') as AppConfig;
    const machineId = getMachineId();
    connectToServer(config, {
      name: appConfig.userName || 'Unknown User',
      machineId,
      state: currentState,
    });
  });

  ipcMain.handle(IpcChannels.SOCKET_DISCONNECT, (): void => {
    disconnectFromServer();
  });

  ipcMain.handle(IpcChannels.SOCKET_STATUS, (): ConnectionStatus => {
    return getConnectionStatus();
  });

  // Window controls
  ipcMain.on(IpcChannels.MINIMIZE_TO_TRAY, (): void => {
    mainWindow?.hide();
  });

  ipcMain.on(IpcChannels.QUIT_APP, (): void => {
    setAppQuitting(true);
    app.quit();
  });

  // Tray controls
  ipcMain.on(IpcChannels.PAUSE_MONITORING, (): void => {
    currentState = MonitoringState.PAUSED;
    store.set('monitoringState', currentState);
    updateTrayState(tray, currentState);
    mainWindow?.webContents.send(IpcChannels.ON_STATE_CHANGE, currentState);
  });

  ipcMain.on(IpcChannels.RESUME_MONITORING, (): void => {
    currentState = MonitoringState.IDLE;
    store.set('monitoringState', currentState);
    updateTrayState(tray, currentState);
    mainWindow?.webContents.send(IpcChannels.ON_STATE_CHANGE, currentState);
  });

  // Screenshot scheduler handlers
  ipcMain.handle(IpcChannels.START_SCREENSHOT_SCHEDULER, (): void => {
    const consent = store.get('consent') as ConsentData | null;
    if (consent?.screenshotConsent) {
      startScheduler();
    }
  });

  ipcMain.handle(IpcChannels.STOP_SCREENSHOT_SCHEDULER, (): void => {
    stopScheduler();
  });

  ipcMain.handle(IpcChannels.GET_SCHEDULER_STATUS, (): boolean => {
    return isSchedulerRunning();
  });

  ipcMain.handle(IpcChannels.GET_LAST_SCREENSHOT_TIME, (): string | null => {
    return getLastCaptureTime();
  });

  ipcMain.handle(IpcChannels.CAPTURE_SCREENSHOT_NOW, async (): Promise<void> => {
    await captureNow();
  });
}

// Initialize app
app.whenReady().then(() => {
  setupIpcHandlers();
  createWindow();

  // Create tray icon
  tray = createTray(() => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  // Restore last monitoring state
  currentState = store.get('monitoringState') as MonitoringState;
  updateTrayState(tray, currentState);

  // Initialize screenshot scheduler
  if (mainWindow) {
    initScheduler(mainWindow, store as unknown as Store<Record<string, unknown>>, tray);
  }

  // Auto-start scheduler if consent exists
  const consent = store.get('consent') as ConsentData | null;
  if (consent?.screenshotConsent) {
    startScheduler();
  }

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
  setAppQuitting(true);
  stopScheduler();
  destroyTray(tray);
});
