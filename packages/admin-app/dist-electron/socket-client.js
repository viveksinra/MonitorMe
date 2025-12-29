"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setMainWindow = setMainWindow;
exports.getConnectionStatus = getConnectionStatus;
exports.getUsers = getUsers;
exports.connectToServer = connectToServer;
exports.disconnectFromServer = disconnectFromServer;
exports.requestViewUser = requestViewUser;
exports.cancelViewRequest = cancelViewRequest;
exports.isConnected = isConnected;
const socket_io_client_1 = require("socket.io-client");
const shared_1 = require("@monitor-me/shared");
let socket = null;
let connectionStatus = shared_1.ConnectionStatus.DISCONNECTED;
let mainWindow = null;
let currentUsers = [];
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
 * Get current users list
 */
function getUsers() {
    return currentUsers;
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
 * Update users list and notify renderer
 */
function updateUsers(users) {
    currentUsers = users;
    mainWindow?.webContents.send(shared_1.IpcChannels.ON_USERS_UPDATE, users);
    console.log(`[Socket] Users updated: ${users.length} users`);
}
/**
 * Connect to the signaling server as admin
 */
function connectToServer(config, adminData) {
    // Disconnect existing connection if any
    if (socket) {
        socket.disconnect();
    }
    updateConnectionStatus(shared_1.ConnectionStatus.CONNECTING);
    const serverUrl = `http://${config.host}:${config.port}`;
    console.log(`[Socket] Connecting to ${serverUrl} as admin...`);
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
        // Register as admin
        socket?.emit(shared_1.ClientEvents.ADMIN_REGISTER, adminData);
    });
    socket.on('disconnect', (reason) => {
        console.log(`[Socket] Disconnected: ${reason}`);
        updateConnectionStatus(shared_1.ConnectionStatus.DISCONNECTED);
        updateUsers([]);
    });
    socket.on('connect_error', (error) => {
        console.error(`[Socket] Connection error:`, error.message);
        updateConnectionStatus(shared_1.ConnectionStatus.ERROR);
    });
    // Server events
    socket.on(shared_1.ServerEvents.REGISTERED, (data) => {
        console.log(`[Socket] Registered as admin with ID: ${data.id}`);
    });
    socket.on(shared_1.ServerEvents.USERS_LIST, (users) => {
        console.log(`[Socket] Received users list: ${users.length} users`);
        updateUsers(users);
    });
    socket.on(shared_1.ServerEvents.USER_CONNECTED, (user) => {
        console.log(`[Socket] User connected: ${user.name}`);
        const existingIndex = currentUsers.findIndex((u) => u.id === user.id);
        if (existingIndex >= 0) {
            currentUsers[existingIndex] = user;
        }
        else {
            currentUsers.push(user);
        }
        updateUsers([...currentUsers]);
    });
    socket.on(shared_1.ServerEvents.USER_DISCONNECTED, (data) => {
        console.log(`[Socket] User disconnected: ${data.userId}`);
        const user = currentUsers.find((u) => u.id === data.userId);
        if (user) {
            user.isOnline = false;
            user.lastSeen = new Date().toISOString();
            updateUsers([...currentUsers]);
        }
    });
    socket.on(shared_1.ServerEvents.USER_STATE_CHANGED, (data) => {
        console.log(`[Socket] User state changed: ${data.userId} -> ${data.state}`);
        const user = currentUsers.find((u) => u.id === data.userId);
        if (user) {
            user.state = data.state;
            updateUsers([...currentUsers]);
        }
    });
    socket.on(shared_1.ServerEvents.ERROR, (data) => {
        console.error(`[Socket] Server error: ${data.message}`);
    });
    // Screenshot notifications
    socket.on(shared_1.ServerEvents.SCREENSHOT_AVAILABLE, (metadata) => {
        console.log(`[Socket] New screenshot available from: ${metadata.userName}`);
        mainWindow?.webContents.send(shared_1.IpcChannels.ON_SCREENSHOT_AVAILABLE, metadata);
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
    currentUsers = [];
    updateConnectionStatus(shared_1.ConnectionStatus.DISCONNECTED);
    updateUsers([]);
}
/**
 * Request to view a user's screen
 */
function requestViewUser(targetUserId) {
    if (socket && socket.connected) {
        socket.emit(shared_1.ClientEvents.ADMIN_REQUEST_VIEW, { targetUserId });
        console.log(`[Socket] Requested view for user: ${targetUserId}`);
    }
}
/**
 * Cancel view request
 */
function cancelViewRequest(targetUserId) {
    if (socket && socket.connected) {
        socket.emit(shared_1.ClientEvents.ADMIN_CANCEL_VIEW, { targetUserId });
        console.log(`[Socket] Cancelled view for user: ${targetUserId}`);
    }
}
/**
 * Check if connected
 */
function isConnected() {
    return socket !== null && socket.connected;
}
//# sourceMappingURL=socket-client.js.map