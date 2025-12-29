"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setMainWindow = setMainWindow;
exports.getConnectionStatus = getConnectionStatus;
exports.connectToServer = connectToServer;
exports.disconnectFromServer = disconnectFromServer;
exports.sendStateUpdate = sendStateUpdate;
exports.updateUserData = updateUserData;
exports.isConnected = isConnected;
const socket_io_client_1 = require("socket.io-client");
const shared_1 = require("@monitor-me/shared");
let socket = null;
let connectionStatus = shared_1.ConnectionStatus.DISCONNECTED;
let mainWindow = null;
let currentUserData = null;
/**
 * Set the main window reference for IPC communication
 */
function setMainWindow(window) {
    mainWindow = window;
}
/**
 * Get current connection status
 */
function getConnectionStatus() {
    return connectionStatus;
}
/**
 * Update connection status and notify renderer
 */
function updateConnectionStatus(status) {
    connectionStatus = status;
    mainWindow?.webContents.send(shared_1.IpcChannels.SOCKET_ON_STATUS_CHANGE, status);
    console.log(`[Socket] Connection status: ${status}`);
}
/**
 * Connect to the signaling server
 */
function connectToServer(config, userData) {
    // Disconnect existing connection if any
    if (socket) {
        socket.disconnect();
    }
    currentUserData = userData;
    updateConnectionStatus(shared_1.ConnectionStatus.CONNECTING);
    const serverUrl = `http://${config.host}:${config.port}`;
    console.log(`[Socket] Connecting to ${serverUrl}...`);
    socket = (0, socket_io_client_1.io)(serverUrl, {
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
        updateConnectionStatus(shared_1.ConnectionStatus.CONNECTED);
        // Register as user
        if (currentUserData) {
            socket?.emit(shared_1.ClientEvents.USER_REGISTER, currentUserData);
        }
    });
    socket.on('disconnect', (reason) => {
        console.log(`[Socket] Disconnected: ${reason}`);
        updateConnectionStatus(shared_1.ConnectionStatus.DISCONNECTED);
    });
    socket.on('connect_error', (error) => {
        console.error(`[Socket] Connection error:`, error.message);
        updateConnectionStatus(shared_1.ConnectionStatus.ERROR);
    });
    // Server events
    socket.on(shared_1.ServerEvents.REGISTERED, (data) => {
        console.log(`[Socket] Registered with ID: ${data.id}`);
    });
    socket.on(shared_1.ServerEvents.VIEW_REQUEST, (data) => {
        console.log(`[Socket] View request from admin: ${data.adminName}`);
        // Notify the renderer about view request
        mainWindow?.webContents.send('view:request', data);
    });
    socket.on(shared_1.ServerEvents.VIEW_CANCELLED, (data) => {
        console.log(`[Socket] View cancelled by admin: ${data.adminId}`);
        // Notify the renderer
        mainWindow?.webContents.send('view:cancelled', data);
    });
    socket.on(shared_1.ServerEvents.ERROR, (data) => {
        console.error(`[Socket] Server error: ${data.message}`);
    });
}
/**
 * Disconnect from the signaling server
 */
function disconnectFromServer() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
    currentUserData = null;
    updateConnectionStatus(shared_1.ConnectionStatus.DISCONNECTED);
}
/**
 * Send state update to server
 */
function sendStateUpdate(state) {
    if (socket && socket.connected) {
        socket.emit(shared_1.ClientEvents.USER_STATE_UPDATE, { state });
        console.log(`[Socket] Sent state update: ${state}`);
    }
}
/**
 * Update user data (for reconnection)
 */
function updateUserData(userData) {
    currentUserData = userData;
}
/**
 * Check if connected
 */
function isConnected() {
    return socket !== null && socket.connected;
}
//# sourceMappingURL=socket-client.js.map