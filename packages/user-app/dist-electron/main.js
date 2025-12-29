"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const crypto_1 = require("crypto");
const electron_store_1 = __importDefault(require("electron-store"));
const shared_1 = require("@monitor-me/shared");
const tray_1 = require("./tray");
const types_1 = require("./types");
const socket_client_1 = require("./socket-client");
// Generate unique machine ID if not exists
function getMachineId() {
    let machineId = store.get('machineId');
    if (!machineId) {
        machineId = (0, crypto_1.randomUUID)();
        store.set('machineId', machineId);
    }
    return machineId;
}
// Initialize electron-store
const store = new electron_store_1.default({
    name: 'monitor-me-user',
    defaults: {
        consent: null,
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
        },
        serverConfig: shared_1.DEFAULT_SERVER_CONFIG,
        monitoringState: shared_1.MonitoringState.IDLE,
        machineId: '',
    },
});
let mainWindow = null;
let tray = null;
let currentState = shared_1.MonitoringState.IDLE;
function createWindow() {
    const { width, height, minWidth, minHeight } = shared_1.WINDOW_CONFIG.USER_APP;
    mainWindow = new electron_1.BrowserWindow({
        width,
        height,
        minWidth,
        minHeight,
        title: shared_1.USER_APP_NAME,
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
    }
    else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });
    mainWindow.on('close', (event) => {
        // Prevent window from closing, minimize to tray instead
        if (mainWindow && !(0, types_1.getAppQuitting)()) {
            event.preventDefault();
            mainWindow.hide();
        }
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
        (0, socket_client_1.setMainWindow)(null);
    });
    // Set main window reference for socket client
    (0, socket_client_1.setMainWindow)(mainWindow);
}
// Set up IPC handlers
function setupIpcHandlers() {
    // Consent handlers
    electron_1.ipcMain.handle(shared_1.IpcChannels.GET_CONSENT, () => {
        return store.get('consent');
    });
    electron_1.ipcMain.handle(shared_1.IpcChannels.SET_CONSENT, (_event, consent) => {
        store.set('consent', { ...consent, consentVersion: shared_1.CONSENT_VERSION });
    });
    electron_1.ipcMain.handle(shared_1.IpcChannels.HAS_CONSENT, () => {
        const consent = store.get('consent');
        return consent !== null;
    });
    // Config handlers
    electron_1.ipcMain.handle(shared_1.IpcChannels.GET_CONFIG, () => {
        return store.get('config');
    });
    electron_1.ipcMain.handle(shared_1.IpcChannels.SET_CONFIG, (_event, config) => {
        const currentConfig = store.get('config');
        store.set('config', { ...currentConfig, ...config });
    });
    // State handlers
    electron_1.ipcMain.handle(shared_1.IpcChannels.GET_STATE, () => {
        return currentState;
    });
    electron_1.ipcMain.handle(shared_1.IpcChannels.SET_STATE, (_event, state) => {
        currentState = state;
        store.set('monitoringState', state);
        (0, tray_1.updateTrayState)(tray, state);
        mainWindow?.webContents.send(shared_1.IpcChannels.ON_STATE_CHANGE, state);
        // Send state update to server
        (0, socket_client_1.sendStateUpdate)(state);
    });
    // Server config handlers
    electron_1.ipcMain.handle(shared_1.IpcChannels.GET_SERVER_CONFIG, () => {
        return store.get('serverConfig');
    });
    electron_1.ipcMain.handle(shared_1.IpcChannels.SET_SERVER_CONFIG, (_event, config) => {
        store.set('serverConfig', config);
    });
    // Socket connection handlers
    electron_1.ipcMain.handle(shared_1.IpcChannels.SOCKET_CONNECT, (_event, config) => {
        const appConfig = store.get('config');
        const machineId = getMachineId();
        (0, socket_client_1.connectToServer)(config, {
            name: appConfig.userName || 'Unknown User',
            machineId,
            state: currentState,
        });
    });
    electron_1.ipcMain.handle(shared_1.IpcChannels.SOCKET_DISCONNECT, () => {
        (0, socket_client_1.disconnectFromServer)();
    });
    electron_1.ipcMain.handle(shared_1.IpcChannels.SOCKET_STATUS, () => {
        return (0, socket_client_1.getConnectionStatus)();
    });
    // Window controls
    electron_1.ipcMain.on(shared_1.IpcChannels.MINIMIZE_TO_TRAY, () => {
        mainWindow?.hide();
    });
    electron_1.ipcMain.on(shared_1.IpcChannels.QUIT_APP, () => {
        (0, types_1.setAppQuitting)(true);
        electron_1.app.quit();
    });
    // Tray controls
    electron_1.ipcMain.on(shared_1.IpcChannels.PAUSE_MONITORING, () => {
        currentState = shared_1.MonitoringState.PAUSED;
        store.set('monitoringState', currentState);
        (0, tray_1.updateTrayState)(tray, currentState);
        mainWindow?.webContents.send(shared_1.IpcChannels.ON_STATE_CHANGE, currentState);
    });
    electron_1.ipcMain.on(shared_1.IpcChannels.RESUME_MONITORING, () => {
        currentState = shared_1.MonitoringState.IDLE;
        store.set('monitoringState', currentState);
        (0, tray_1.updateTrayState)(tray, currentState);
        mainWindow?.webContents.send(shared_1.IpcChannels.ON_STATE_CHANGE, currentState);
    });
}
// Initialize app
electron_1.app.whenReady().then(() => {
    setupIpcHandlers();
    createWindow();
    // Create tray icon
    tray = (0, tray_1.createTray)(() => {
        mainWindow?.show();
        mainWindow?.focus();
    });
    // Restore last monitoring state
    currentState = store.get('monitoringState');
    (0, tray_1.updateTrayState)(tray, currentState);
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('before-quit', () => {
    (0, types_1.setAppQuitting)(true);
    (0, tray_1.destroyTray)(tray);
});
//# sourceMappingURL=main.js.map