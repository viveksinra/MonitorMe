import { BrowserWindow, desktopCapturer } from 'electron';
import { createServer } from 'http';
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

  private static localPageUrl: string | null = null;
  private static localPageServerStarting: Promise<string> | null = null;

  constructor(config: WebRTCManagerConfig) {
    this.socket = config.socket;
    this.adminId = config.adminId;
    this.onConnectionStateChange = config.onConnectionStateChange;
    this.onError = config.onError;
  }

  private static ensureLocalWebRTCPageUrl(): Promise<string> {
    if (UserWebRTCManager.localPageUrl) {
      return Promise.resolve(UserWebRTCManager.localPageUrl);
    }
    if (UserWebRTCManager.localPageServerStarting) {
      return UserWebRTCManager.localPageServerStarting;
    }

    UserWebRTCManager.localPageServerStarting = new Promise<string>((resolve, reject) => {
      const server = createServer((req, res) => {
        const url = req.url || '/';
        if (url.startsWith('/webrtc')) {
          res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-store',
          });
          // A minimal page. We rely on the preload to expose IPC, and inject the WebRTC code from the main process.
          res.end('<!doctype html><html><head><meta charset="utf-8"></head><body>MonitorMe WebRTC</body></html>');
          return;
        }

        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not Found');
      });

      server.on('error', (err) => {
        reject(err);
      });

      server.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        if (!addr || typeof addr === 'string') {
          reject(new Error('Failed to start local WebRTC page server'));
          return;
        }

        UserWebRTCManager.localPageUrl = `http://127.0.0.1:${addr.port}/webrtc`;
        resolve(UserWebRTCManager.localPageUrl);
      });
    });

    return UserWebRTCManager.localPageServerStarting;
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
      this.webrtcWindow.webContents.session.setPermissionRequestHandler((_webContents, permission, callback) => {
        if (permission === 'media' || permission === 'display-capture') {
          callback(true);
        } else {
          callback(false);
        }
      });

      // Load a local http://127.0.0.1 page so Chromium treats it as a secure context and exposes navigator.mediaDevices
      const localUrl = await UserWebRTCManager.ensureLocalWebRTCPageUrl();
      await this.webrtcWindow.loadURL(localUrl);

      // Wait for page to be ready
      await this.webrtcWindow.webContents.executeJavaScript('document.readyState');

      // Debug: confirm getUserMedia is available in this context (shows in terminal logs)
      try {
        const env = await this.webrtcWindow.webContents.executeJavaScript(
          `({ href: location.href, origin: location.origin, protocol: location.protocol, hasNavigator: typeof navigator !== 'undefined', hasMediaDevices: !!(navigator && navigator.mediaDevices), getUserMediaType: typeof (navigator && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) })`
        );
        console.log('[WebRTC] Hidden window env:', env);
      } catch (e) {
        console.warn('[WebRTC] Failed to probe hidden window env:', e);
      }

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

  private async injectWebRTCCode(sourceId: string): Promise<void> {
    if (!this.webrtcWindow) return;

    // Execute WebRTC setup directly in the page context (where navigator exists)
    await this.webrtcWindow.webContents.executeJavaScript(`
      (async () => {
        try {
          console.log('[WebRTC] Starting screen capture...');
          
          const mediaDevices = navigator && navigator.mediaDevices;
          if (!mediaDevices || typeof mediaDevices.getUserMedia !== 'function') {
            throw new Error(
              'getUserMedia is not available in this context. ' +
              'origin=' + location.origin + ' protocol=' + location.protocol + ' href=' + location.href
            );
          }

          // Get screen stream
          const stream = await mediaDevices.getUserMedia({
            audio: false,
            video: {
              mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: '${sourceId}',
                minWidth: 1280,
                maxWidth: 1280,
                minHeight: 720,
                maxHeight: 720,
                minFrameRate: 15,
                maxFrameRate: 30,
              }
            }
          });

          console.log('[WebRTC] Stream captured, creating peer connection...');

          // Create peer connection
          window.peerConnection = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
          });

          // Add tracks
          stream.getTracks().forEach(track => {
            window.peerConnection.addTrack(track, stream);
          });

          // Store stream for cleanup
          window.localStream = stream;

          // Set up handlers using exposed IPC
          window.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
              window.webrtcIpc.sendIceCandidate(event.candidate.toJSON());
            }
          };

          window.peerConnection.onconnectionstatechange = () => {
            const state = window.peerConnection.connectionState;
            window.webrtcIpc.sendStateChange(state);
            console.log('[WebRTC] Connection state:', state);
          };

          // Listen for answer from admin
          window.webrtcIpc.onAnswer(async (answer) => {
            try {
              await window.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
              console.log('[WebRTC] Answer received and set');
            } catch (error) {
              console.error('[WebRTC] Error setting answer:', error);
            }
          });

          // Listen for remote ICE candidates
          window.webrtcIpc.onRemoteIceCandidate(async (candidate) => {
            try {
              await window.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (error) {
              console.error('[WebRTC] Error adding ICE candidate:', error);
            }
          });

          // Listen for cleanup
          window.webrtcIpc.onCleanup(() => {
            if (window.localStream) {
              window.localStream.getTracks().forEach(track => track.stop());
              window.localStream = null;
            }
            if (window.peerConnection) {
              window.peerConnection.close();
              window.peerConnection = null;
            }
          });

          // Create and send offer
          const offer = await window.peerConnection.createOffer({
            offerToReceiveVideo: false,
            offerToReceiveAudio: false,
          });

          await window.peerConnection.setLocalDescription(offer);
          
          // Send the actual localDescription (fully populated after setLocalDescription)
          const localDesc = window.peerConnection.localDescription;
          if (!localDesc) {
            throw new Error('Local description is null after setLocalDescription');
          }
          
          window.webrtcIpc.sendOffer({ type: localDesc.type, sdp: localDesc.sdp });

          console.log('[WebRTC] Offer created and sent');
        } catch (error) {
          console.error('[WebRTC] Error:', error);
          window.webrtcIpc.sendError(error.message);
        }
      })();
    `);
  }

  private setupWebRTCHandlers(): void {
    if (!this.webrtcWindow) return;

    const { ipcMain } = require('electron');

    // Handle WebRTC offer from renderer
    ipcMain.once('webrtc:offer', (_event: any, offer: RTCSessionDescriptionInit) => {
      console.log('[WebRTC] Offer received from renderer:', JSON.stringify({ type: offer.type, sdpLength: offer.sdp?.length }));
      this.socket.emit(ClientEvents.WEBRTC_OFFER, {
        targetId: this.adminId,
        offer: offer,
      });
      console.log('[WebRTC] Offer sent to admin via socket');
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
