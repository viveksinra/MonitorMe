import { io, Socket } from 'socket.io-client';
import { BrowserWindow } from 'electron';
import Store from 'electron-store';
import {
  ClientEvents,
  ServerEvents,
  ConnectionStatus,
  IpcChannels,
  type ServerConfig,
  type MonitoringState,
  type UserRegistrationData,
  type ConsentData,
} from '@monitor-me/shared';
import { UserWebRTCManager } from './webrtc-manager';

let socket: Socket | null = null;
let connectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;
let mainWindow: BrowserWindow | null = null;
let currentUserData: UserRegistrationData | null = null;
let currentWebRTCManager: UserWebRTCManager | null = null;
let currentViewingAdminId: string | null = null;
let store: Store | null = null;

/**
 * Set the main window reference for IPC communication
 */
export function setMainWindow(window: BrowserWindow | null): void {
  mainWindow = window;
}

/**
 * Set the electron-store reference for consent checking
 */
export function setStore(storeInstance: Store<Record<string, unknown>>): void {
  store = storeInstance as Store;
}

/**
 * Get current connection status
 */
export function getConnectionStatus(): ConnectionStatus {
  return connectionStatus;
}

/**
 * Update connection status and notify renderer
 */
function updateConnectionStatus(status: ConnectionStatus): void {
  connectionStatus = status;
  mainWindow?.webContents.send(IpcChannels.SOCKET_ON_STATUS_CHANGE, status);
  console.log(`[Socket] Connection status: ${status}`);
}

/**
 * Connect to the signaling server
 */
export function connectToServer(
  config: ServerConfig,
  userData: UserRegistrationData
): void {
  // Disconnect existing connection if any
  if (socket) {
    socket.disconnect();
  }

  currentUserData = userData;
  updateConnectionStatus(ConnectionStatus.CONNECTING);

  const serverUrl = `http://${config.host}:${config.port}`;
  console.log(`[Socket] Connecting to ${serverUrl}...`);

  socket = io(serverUrl, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
  });

  // Connection events
  socket.on('connect', () => {
    console.log(`[Socket] Connected to server`);
    updateConnectionStatus(ConnectionStatus.CONNECTED);

    // Register as user
    if (currentUserData) {
      socket?.emit(ClientEvents.USER_REGISTER, currentUserData);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`[Socket] Disconnected: ${reason}`);
    updateConnectionStatus(ConnectionStatus.DISCONNECTED);
  });

  socket.on('connect_error', (error) => {
    console.error(`[Socket] Connection error:`, error.message);
    updateConnectionStatus(ConnectionStatus.ERROR);
  });

  // Server events
  socket.on(ServerEvents.REGISTERED, (data: { id: string }) => {
    console.log(`[Socket] Registered with ID: ${data.id}`);
  });

  socket.on(ServerEvents.VIEW_REQUEST, (data: { adminId: string; adminName: string }) => {
    console.log(`[Socket] View request from admin: ${data.adminName}`);
    currentViewingAdminId = data.adminId;
    // Notify the renderer about view request
    mainWindow?.webContents.send('view:request', data);
  });

  socket.on(ServerEvents.VIEW_CANCELLED, (data: { adminId: string }) => {
    console.log(`[Socket] View cancelled by admin: ${data.adminId}`);
    currentViewingAdminId = null;

    // Cleanup WebRTC if active
    if (currentWebRTCManager) {
      currentWebRTCManager.cleanup();
      currentWebRTCManager = null;
    }

    // Notify the renderer
    mainWindow?.webContents.send('view:cancelled', data);
  });

  socket.on(ServerEvents.WEBRTC_ANSWER_RECEIVED, async (data: { fromId: string; answer: RTCSessionDescriptionInit }) => {
    console.log(`[Socket] Received WebRTC answer from ${data.fromId}`);

    if (currentWebRTCManager) {
      await currentWebRTCManager.handleAnswer(data.answer);
    }
  });

  socket.on(ServerEvents.WEBRTC_ICE_CANDIDATE_RECEIVED, async (data: { fromId: string; candidate: RTCIceCandidateInit }) => {
    if (currentWebRTCManager) {
      await currentWebRTCManager.handleIceCandidate(data.candidate);
    }
  });

  socket.on(ServerEvents.VIEW_ENDED, (data: { endedBy: 'user' | 'admin' }) => {
    console.log(`[Socket] View ended by ${data.endedBy}`);

    // Cleanup WebRTC
    if (currentWebRTCManager) {
      currentWebRTCManager.cleanup();
      currentWebRTCManager = null;
    }

    currentViewingAdminId = null;
    mainWindow?.webContents.send('view:ended', data);
  });

  socket.on(ServerEvents.ERROR, (data: { message: string }) => {
    console.error(`[Socket] Server error: ${data.message}`);
  });
}

/**
 * Disconnect from the signaling server
 */
export function disconnectFromServer(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  currentUserData = null;
  updateConnectionStatus(ConnectionStatus.DISCONNECTED);
}

/**
 * Send state update to server
 */
export function sendStateUpdate(state: MonitoringState): void {
  if (socket && socket.connected) {
    socket.emit(ClientEvents.USER_STATE_UPDATE, { state });
    console.log(`[Socket] Sent state update: ${state}`);
  }
}

/**
 * Update user data (for reconnection)
 */
export function updateUserData(userData: UserRegistrationData): void {
  currentUserData = userData;
}

/**
 * Check if connected
 */
export function isConnected(): boolean {
  return socket !== null && socket.connected;
}

/**
 * User accepts the view request and starts screen sharing
 */
export async function acceptViewRequest(): Promise<void> {
  if (!socket || !currentViewingAdminId) {
    throw new Error('No active view request');
  }

  // Check consent BEFORE accepting
  const consent = store?.get('consent') as ConsentData | null;

  if (!consent?.liveViewConsent) {
    rejectViewRequest('Live view consent not given');
    mainWindow?.webContents.send('view:error', {
      message: 'You have not consented to live view. Please update your consent in settings.',
    });
    return;
  }

  try {
    // Create WebRTC manager
    currentWebRTCManager = new UserWebRTCManager({
      socket,
      adminId: currentViewingAdminId,
      onConnectionStateChange: (state) => {
        console.log(`[WebRTC] Connection state: ${state}`);
        mainWindow?.webContents.send('webrtc:state-change', state);

        if (state === 'connected') {
          // Update monitoring state to LIVE_VIEW_ACTIVE
          mainWindow?.webContents.send('view:connected');
        }
      },
      onError: (error) => {
        console.error('[WebRTC] Error:', error);
        mainWindow?.webContents.send('view:error', { message: error.message });
        rejectViewRequest('WebRTC error occurred');
      },
    });

    // Start screen sharing
    await currentWebRTCManager.startScreenShare();

    // Notify server that user accepted
    socket.emit(ClientEvents.USER_ACCEPT_VIEW, {
      adminId: currentViewingAdminId,
    });

    console.log('[Socket] Accepted view request');
  } catch (error) {
    console.error('[Socket] Failed to accept view:', error);
    rejectViewRequest('Failed to start screen capture');
  }
}

/**
 * User rejects the view request
 */
export function rejectViewRequest(reason?: string): void {
  if (!socket || !currentViewingAdminId) {
    return;
  }

  socket.emit(ClientEvents.USER_REJECT_VIEW, {
    adminId: currentViewingAdminId,
    reason,
  });

  currentViewingAdminId = null;
  console.log('[Socket] Rejected view request');
}

/**
 * User ends the active view session
 */
export function endViewSession(): void {
  if (!socket || !currentViewingAdminId) {
    return;
  }

  socket.emit(ClientEvents.USER_END_VIEW, {
    adminId: currentViewingAdminId,
  });

  if (currentWebRTCManager) {
    currentWebRTCManager.cleanup();
    currentWebRTCManager = null;
  }

  currentViewingAdminId = null;
  console.log('[Socket] Ended view session');
}
