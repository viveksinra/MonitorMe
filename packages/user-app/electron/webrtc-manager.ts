import { desktopCapturer, BrowserWindow } from 'electron';
import type { Socket } from 'socket.io-client';
import { ClientEvents } from '@monitor-me/shared';
import * as path from 'path';

interface WebRTCManagerConfig {
  socket: Socket;
  adminId: string;
  onConnectionStateChange: (state: RTCPeerConnectionState) => void;
  onError: (error: Error) => void;
}

export class UserWebRTCManager {
  private socket: Socket;
  private adminId: string;
  private onConnectionStateChange: (state: RTCPeerConnectionState) => void;
  private onError: (error: Error) => void;
  private webrtcWindow: BrowserWindow | null = null;

  constructor(config: WebRTCManagerConfig) {
    this.socket = config.socket;
    this.adminId = config.adminId;
    this.onConnectionStateChange = config.onConnectionStateChange;
    this.onError = config.onError;
  }

  async startScreenShare(): Promise<void> {
    try {
      // Get desktop capturer source
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: 1, height: 1 },
      });

      if (sources.length === 0) {
        throw new Error('No screen sources available');
      }

      const primarySource = sources[0];

      // Create a hidden window for WebRTC (renderer context has navigator)
      this.webrtcWindow = new BrowserWindow({
        show: false,
        width: 1,
        height: 1,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: false,
          preload: path.join(__dirname, 'webrtc-preload.js'),
        },
      });

      // Grant media permissions
      this.webrtcWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
        if (permission === 'media') {
          callback(true);
        } else {
          callback(false);
        }
      });

      // Load a blank page
      await this.webrtcWindow.loadURL('data:text/html,<!DOCTYPE html><html><body></body></html>');

      // Wait for page to be ready
      await this.webrtcWindow.webContents.executeJavaScript('document.readyState');

      // Set up IPC handlers for WebRTC events
      this.setupWebRTCHandlers();

      // Inject and execute WebRTC code directly in the page context
      await this.injectWebRTCCode(primarySource.id);

      console.log('[WebRTC] Screen share started');
    } catch (error) {
      this.onError(error as Error);
      await this.cleanup();
    }
  }

  private setupWebRTCHandlers(): void {
    if (!this.webrtcWindow) return;

    const { ipcMain } = require('electron');

    // Handle WebRTC offer from renderer
    ipcMain.once('webrtc:offer', (_event: any, offer: RTCSessionDescriptionInit) => {
      this.socket.emit(ClientEvents.WEBRTC_OFFER, {
        targetId: this.adminId,
        offer: offer,
      });
      console.log('[WebRTC] Offer sent to admin');
    });

    // Handle ICE candidates from renderer
    ipcMain.on('webrtc:ice-candidate', (_event: any, candidate: RTCIceCandidateInit) => {
      this.socket.emit(ClientEvents.WEBRTC_ICE_CANDIDATE, {
        targetId: this.adminId,
        candidate: candidate,
      });
    });

    // Handle connection state changes from renderer
    ipcMain.on('webrtc:state-change', (_event: any, state: RTCPeerConnectionState) => {
      console.log(`[WebRTC] Connection state: ${state}`);
      this.onConnectionStateChange(state);

      if (state === 'failed' || state === 'disconnected' || state === 'closed') {
        this.cleanup();
      }
    });

    // Handle errors from renderer
    ipcMain.on('webrtc:error', (_event: any, error: string) => {
      this.onError(new Error(error));
    });
  }

  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (this.webrtcWindow) {
      this.webrtcWindow.webContents.send('webrtc:answer', answer);
      console.log('[WebRTC] Answer sent to renderer');
    }
  }

  async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (this.webrtcWindow) {
      this.webrtcWindow.webContents.send('webrtc:remote-ice-candidate', candidate);
    }
  }

  async cleanup(): Promise<void> {
    console.log('[WebRTC] Cleaning up...');

    // Close and destroy the hidden WebRTC window
    if (this.webrtcWindow && !this.webrtcWindow.isDestroyed()) {
      this.webrtcWindow.webContents.send('webrtc:cleanup');
      this.webrtcWindow.close();
      this.webrtcWindow = null;
    }
  }

  isActive(): boolean {
    return this.webrtcWindow !== null && !this.webrtcWindow.isDestroyed();
  }
}
