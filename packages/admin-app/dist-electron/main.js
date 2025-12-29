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
const electron_store_1 = __importDefault(require("electron-store"));
const shared_1 = require("@monitor-me/shared");
const socket_client_1 = require("./socket-client");
// Initialize electron-store
const store = new electron_store_1.default({
    name: 'monitor-me-admin',
    defaults: {
        serverConfig: shared_1.DEFAULT_SERVER_CONFIG,
        adminName: 'Admin',
    },
});
let mainWindow = null;
function createWindow() {
    const { width, height, minWidth, minHeight } = shared_1.WINDOW_CONFIG.ADMIN_APP;
    mainWindow = new electron_1.BrowserWindow({
        width,
        height,
        minWidth,
        minHeight,
        title: shared_1.ADMIN_APP_NAME,
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
    }
    else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
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
    // Server config handlers
    electron_1.ipcMain.handle(shared_1.IpcChannels.GET_SERVER_CONFIG, () => {
        return store.get('serverConfig');
    });
    electron_1.ipcMain.handle(shared_1.IpcChannels.SET_SERVER_CONFIG, (_event, config) => {
        store.set('serverConfig', config);
    });
    // Socket connection handlers
    electron_1.ipcMain.handle(shared_1.IpcChannels.SOCKET_CONNECT, (_event, config) => {
        const adminName = store.get('adminName');
        (0, socket_client_1.connectToServer)(config, { name: adminName });
    });
    electron_1.ipcMain.handle(shared_1.IpcChannels.SOCKET_DISCONNECT, () => {
        (0, socket_client_1.disconnectFromServer)();
    });
    electron_1.ipcMain.handle(shared_1.IpcChannels.SOCKET_STATUS, () => {
        return (0, socket_client_1.getConnectionStatus)();
    });
    // Users handlers
    electron_1.ipcMain.handle(shared_1.IpcChannels.GET_USERS, () => {
        return (0, socket_client_1.getUsers)();
    });
    electron_1.ipcMain.handle(shared_1.IpcChannels.REQUEST_VIEW, (_event, userId) => {
        (0, socket_client_1.requestViewUser)(userId);
    });
}
// Initialize app
electron_1.app.whenReady().then(() => {
    setupIpcHandlers();
    createWindow();
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
    (0, socket_client_1.disconnectFromServer)();
});
//# sourceMappingURL=main.js.map