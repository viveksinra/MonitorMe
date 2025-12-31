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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserWebRTCManager = void 0;
const electron_1 = require("electron");
const shared_1 = require("@monitor-me/shared");
const path = __importStar(require("path"));
class UserWebRTCManager {
    socket;
    adminId;
    onConnectionStateChange;
    onError;
    webrtcWindow = null;
    constructor(config) {
        this.socket = config.socket;
        this.adminId = config.adminId;
        this.onConnectionStateChange = config.onConnectionStateChange;
        this.onError = config.onError;
    }
    async startScreenShare() {
        try {
            // Get desktop capturer source
            const sources = await electron_1.desktopCapturer.getSources({
                types: ['screen'],
                thumbnailSize: { width: 1, height: 1 },
            });
            if (sources.length === 0) {
                throw new Error('No screen sources available');
            }
            const primarySource = sources[0];
            // Create a hidden window for WebRTC (renderer context has navigator)
            this.webrtcWindow = new electron_1.BrowserWindow({
                show: false,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true,
                    preload: path.join(__dirname, 'webrtc-preload.js'),
                },
            });
            // Load a blank page
            await this.webrtcWindow.loadURL('data:text/html,<!DOCTYPE html><html><body></body></html>');
            // Set up IPC handlers for WebRTC events
            this.setupWebRTCHandlers();
            // Send source ID to renderer to create stream and peer connection
            this.webrtcWindow.webContents.send('webrtc:start', {
                sourceId: primarySource.id,
                adminId: this.adminId,
            });
            console.log('[WebRTC] Screen share started');
        }
        catch (error) {
            this.onError(error);
            await this.cleanup();
        }
    }
    setupWebRTCHandlers() {
        if (!this.webrtcWindow)
            return;
        const { ipcMain } = require('electron');
        // Handle WebRTC offer from renderer
        ipcMain.once('webrtc:offer', (_event, offer) => {
            this.socket.emit(shared_1.ClientEvents.WEBRTC_OFFER, {
                targetId: this.adminId,
                offer: offer,
            });
            console.log('[WebRTC] Offer sent to admin');
        });
        // Handle ICE candidates from renderer
        ipcMain.on('webrtc:ice-candidate', (_event, candidate) => {
            this.socket.emit(shared_1.ClientEvents.WEBRTC_ICE_CANDIDATE, {
                targetId: this.adminId,
                candidate: candidate,
            });
        });
        // Handle connection state changes from renderer
        ipcMain.on('webrtc:state-change', (_event, state) => {
            console.log(`[WebRTC] Connection state: ${state}`);
            this.onConnectionStateChange(state);
            if (state === 'failed' || state === 'disconnected' || state === 'closed') {
                this.cleanup();
            }
        });
        // Handle errors from renderer
        ipcMain.on('webrtc:error', (_event, error) => {
            this.onError(new Error(error));
        });
    }
    async handleAnswer(answer) {
        if (this.webrtcWindow) {
            this.webrtcWindow.webContents.send('webrtc:answer', answer);
            console.log('[WebRTC] Answer sent to renderer');
        }
    }
    async handleIceCandidate(candidate) {
        if (this.webrtcWindow) {
            this.webrtcWindow.webContents.send('webrtc:remote-ice-candidate', candidate);
        }
    }
    async cleanup() {
        console.log('[WebRTC] Cleaning up...');
        // Close and destroy the hidden WebRTC window
        if (this.webrtcWindow && !this.webrtcWindow.isDestroyed()) {
            this.webrtcWindow.webContents.send('webrtc:cleanup');
            this.webrtcWindow.close();
            this.webrtcWindow = null;
        }
    }
    isActive() {
        return this.webrtcWindow !== null && !this.webrtcWindow.isDestroyed();
    }
}
exports.UserWebRTCManager = UserWebRTCManager;
//# sourceMappingURL=webrtc-manager.js.map