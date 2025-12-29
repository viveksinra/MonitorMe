import { io, Socket } from 'socket.io-client';
import { BrowserWindow } from 'electron';
import {
  ClientEvents,
  ServerEvents,
  ConnectionStatus,
  IpcChannels,
  type ServerConfig,
  type MonitoringState,
  type UserRegistrationData,
} from '@monitor-me/shared';

let socket: Socket | null = null;
let connectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;
let mainWindow: BrowserWindow | null = null;
let currentUserData: UserRegistrationData | null = null;

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
    // Notify the renderer about view request
    mainWindow?.webContents.send('view:request', data);
  });

  socket.on(ServerEvents.VIEW_CANCELLED, (data: { adminId: string }) => {
    console.log(`[Socket] View cancelled by admin: ${data.adminId}`);
    // Notify the renderer
    mainWindow?.webContents.send('view:cancelled', data);
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
