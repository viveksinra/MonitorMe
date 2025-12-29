import { io, Socket } from 'socket.io-client';
import { BrowserWindow } from 'electron';
import {
  ClientEvents,
  ServerEvents,
  ConnectionStatus,
  IpcChannels,
  type ServerConfig,
  type UserInfo,
  type AdminRegistrationData,
  type ScreenshotMetadata,
} from '@monitor-me/shared';
import { AdminWebRTCManager } from './webrtc-manager';

let socket: Socket | null = null;
let connectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;
let mainWindow: BrowserWindow | null = null;
let currentUsers: UserInfo[] = [];
let currentWebRTCManager: AdminWebRTCManager | null = null;

/**
 * Set the main window reference for IPC communication
 */
export function setMainWindow(window: BrowserWindow | null): void {
  mainWindow = window;
}

/**
 * Get current connection status
 */
export function getConnectionStatus(): ConnectionStatus {
  return connectionStatus;
}

/**
 * Get current users list
 */
export function getUsers(): UserInfo[] {
  return currentUsers;
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
 * Update users list and notify renderer
 */
function updateUsers(users: UserInfo[]): void {
  currentUsers = users;
  mainWindow?.webContents.send(IpcChannels.ON_USERS_UPDATE, users);
  console.log(`[Socket] Users updated: ${users.length} users`);
}

/**
 * Connect to the signaling server as admin
 */
export function connectToServer(
  config: ServerConfig,
  adminData: AdminRegistrationData
): void {
  // Disconnect existing connection if any
  if (socket) {
    socket.disconnect();
  }

  updateConnectionStatus(ConnectionStatus.CONNECTING);

  const serverUrl = `http://${config.host}:${config.port}`;
  console.log(`[Socket] Connecting to ${serverUrl} as admin...`);

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

    // Register as admin
    socket?.emit(ClientEvents.ADMIN_REGISTER, adminData);
  });

  socket.on('disconnect', (reason) => {
    console.log(`[Socket] Disconnected: ${reason}`);
    updateConnectionStatus(ConnectionStatus.DISCONNECTED);
    updateUsers([]);
  });

  socket.on('connect_error', (error) => {
    console.error(`[Socket] Connection error:`, error.message);
    updateConnectionStatus(ConnectionStatus.ERROR);
  });

  // Server events
  socket.on(ServerEvents.REGISTERED, (data: { id: string }) => {
    console.log(`[Socket] Registered as admin with ID: ${data.id}`);
  });

  socket.on(ServerEvents.USERS_LIST, (users: UserInfo[]) => {
    console.log(`[Socket] Received users list: ${users.length} users`);
    updateUsers(users);
  });

  socket.on(ServerEvents.USER_CONNECTED, (user: UserInfo) => {
    console.log(`[Socket] User connected: ${user.name}`);
    const existingIndex = currentUsers.findIndex((u) => u.id === user.id);
    if (existingIndex >= 0) {
      currentUsers[existingIndex] = user;
    } else {
      currentUsers.push(user);
    }
    updateUsers([...currentUsers]);
  });

  socket.on(ServerEvents.USER_DISCONNECTED, (data: { userId: string }) => {
    console.log(`[Socket] User disconnected: ${data.userId}`);
    const user = currentUsers.find((u) => u.id === data.userId);
    if (user) {
      user.isOnline = false;
      user.lastSeen = new Date().toISOString();
      updateUsers([...currentUsers]);
    }
  });

  socket.on(
    ServerEvents.USER_STATE_CHANGED,
    (data: { userId: string; state: string }) => {
      console.log(`[Socket] User state changed: ${data.userId} -> ${data.state}`);
      const user = currentUsers.find((u) => u.id === data.userId);
      if (user) {
        user.state = data.state as UserInfo['state'];
        updateUsers([...currentUsers]);
      }
    }
  );

  socket.on(ServerEvents.ERROR, (data: { message: string }) => {
    console.error(`[Socket] Server error: ${data.message}`);
  });

  // Screenshot notifications
  socket.on(ServerEvents.SCREENSHOT_AVAILABLE, (metadata: ScreenshotMetadata) => {
    console.log(`[Socket] New screenshot available from: ${metadata.userName}`);
    mainWindow?.webContents.send(IpcChannels.ON_SCREENSHOT_AVAILABLE, metadata);
  });

  // WebRTC view events
  socket.on(ServerEvents.VIEW_ACCEPTED, async (data: { userId: string; userName: string }) => {
    console.log(`[Socket] View accepted by ${data.userName}`);

    // Initialize WebRTC manager
    if (mainWindow && socket) {
      currentWebRTCManager = new AdminWebRTCManager({
        socket,
        userId: data.userId,
        userName: data.userName,
        mainWindow,
        onConnectionStateChange: (state) => {
          console.log(`[WebRTC] Connection state: ${state}`);
          mainWindow?.webContents.send('webrtc:state-change', { userId: data.userId, state });
        },
        onError: (error) => {
          console.error('[WebRTC] Error:', error);
          mainWindow?.webContents.send('webrtc:error', { userId: data.userId, error: error.message });
          endViewSession(data.userId);
        },
      });

      await currentWebRTCManager.initialize();
    }

    mainWindow?.webContents.send('view:accepted', data);
  });

  socket.on(ServerEvents.VIEW_REJECTED, (data: { userId: string; reason?: string }) => {
    console.log(`[Socket] View rejected by user: ${data.reason}`);

    currentWebRTCManager = null;

    mainWindow?.webContents.send('view:rejected', data);
  });

  socket.on(ServerEvents.WEBRTC_OFFER_RECEIVED, async (data: { fromId: string; offer: RTCSessionDescriptionInit }) => {
    console.log(`[Socket] Received WebRTC offer from ${data.fromId}`);

    if (currentWebRTCManager) {
      await currentWebRTCManager.handleOffer(data.offer);
    }
  });

  socket.on(ServerEvents.WEBRTC_ICE_CANDIDATE_RECEIVED, async (data: { fromId: string; candidate: RTCIceCandidateInit }) => {
    if (currentWebRTCManager) {
      await currentWebRTCManager.handleIceCandidate(data.candidate);
    }
  });

  socket.on(ServerEvents.VIEW_ENDED, (data: { endedBy: 'user' | 'admin'; userId?: string }) => {
    console.log(`[Socket] View ended by ${data.endedBy}`);

    if (currentWebRTCManager) {
      currentWebRTCManager.cleanup();
      currentWebRTCManager = null;
    }

    mainWindow?.webContents.send('view:ended', data);
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
  currentUsers = [];
  updateConnectionStatus(ConnectionStatus.DISCONNECTED);
  updateUsers([]);
}

/**
 * Request to view a user's screen
 */
export function requestViewUser(targetUserId: string): void {
  if (socket && socket.connected) {
    socket.emit(ClientEvents.ADMIN_REQUEST_VIEW, { targetUserId });
    console.log(`[Socket] Requested view for user: ${targetUserId}`);
  }
}

/**
 * Cancel view request
 */
export function cancelViewRequest(targetUserId: string): void {
  if (socket && socket.connected) {
    socket.emit(ClientEvents.ADMIN_CANCEL_VIEW, { targetUserId });
    console.log(`[Socket] Cancelled view for user: ${targetUserId}`);
  }
}

/**
 * Check if connected
 */
export function isConnected(): boolean {
  return socket !== null && socket.connected;
}

/**
 * Admin ends the view session
 */
export function endViewSession(userId: string): void {
  if (!socket) {
    return;
  }

  socket.emit(ClientEvents.ADMIN_END_VIEW, { userId });

  if (currentWebRTCManager) {
    currentWebRTCManager.cleanup();
    currentWebRTCManager = null;
  }

  console.log('[Socket] Ended view session');
}

/**
 * Get the current remote stream for rendering
 */
export function getRemoteStream(): MediaStream | null {
  return currentWebRTCManager?.getRemoteStream() || null;
}
