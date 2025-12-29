"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setMainWindow = setMainWindow;
exports.setStore = setStore;
exports.getConnectionStatus = getConnectionStatus;
exports.connectToServer = connectToServer;
exports.disconnectFromServer = disconnectFromServer;
exports.sendStateUpdate = sendStateUpdate;
exports.updateUserData = updateUserData;
exports.isConnected = isConnected;
exports.acceptViewRequest = acceptViewRequest;
exports.rejectViewRequest = rejectViewRequest;
exports.endViewSession = endViewSession;
const socket_io_client_1 = require("socket.io-client");
const shared_1 = require("@monitor-me/shared");
const webrtc_manager_1 = require("./webrtc-manager");
let socket = null;
let connectionStatus = shared_1.ConnectionStatus.DISCONNECTED;
let mainWindow = null;
let currentUserData = null;
let currentWebRTCManager = null;
let currentViewingAdminId = null;
let store = null;
/**
 * Set the main window reference for IPC communication
 */
function setMainWindow(window) {
    mainWindow = window;
}
/**
 * Set the electron-store reference for consent checking
 */
function setStore(storeInstance) {
    store = storeInstance;
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
        currentViewingAdminId = data.adminId;
        // Notify the renderer about view request
        mainWindow?.webContents.send('view:request', data);
    });
    socket.on(shared_1.ServerEvents.VIEW_CANCELLED, (data) => {
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
    socket.on(shared_1.ServerEvents.WEBRTC_ANSWER_RECEIVED, async (data) => {
        console.log(`[Socket] Received WebRTC answer from ${data.fromId}`);
        if (currentWebRTCManager) {
            await currentWebRTCManager.handleAnswer(data.answer);
        }
    });
    socket.on(shared_1.ServerEvents.WEBRTC_ICE_CANDIDATE_RECEIVED, async (data) => {
        if (currentWebRTCManager) {
            await currentWebRTCManager.handleIceCandidate(data.candidate);
        }
    });
    socket.on(shared_1.ServerEvents.VIEW_ENDED, (data) => {
        console.log(`[Socket] View ended by ${data.endedBy}`);
        // Cleanup WebRTC
        if (currentWebRTCManager) {
            currentWebRTCManager.cleanup();
            currentWebRTCManager = null;
        }
        currentViewingAdminId = null;
        mainWindow?.webContents.send('view:ended', data);
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
/**
 * User accepts the view request and starts screen sharing
 */
async function acceptViewRequest() {
    if (!socket || !currentViewingAdminId) {
        throw new Error('No active view request');
    }
    // Check consent BEFORE accepting
    const consent = store?.get('consent');
    if (!consent?.liveViewConsent) {
        rejectViewRequest('Live view consent not given');
        mainWindow?.webContents.send('view:error', {
            message: 'You have not consented to live view. Please update your consent in settings.',
        });
        return;
    }
    try {
        // Create WebRTC manager
        currentWebRTCManager = new webrtc_manager_1.UserWebRTCManager({
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
        socket.emit(shared_1.ClientEvents.USER_ACCEPT_VIEW, {
            adminId: currentViewingAdminId,
        });
        console.log('[Socket] Accepted view request');
    }
    catch (error) {
        console.error('[Socket] Failed to accept view:', error);
        rejectViewRequest('Failed to start screen capture');
    }
}
/**
 * User rejects the view request
 */
function rejectViewRequest(reason) {
    if (!socket || !currentViewingAdminId) {
        return;
    }
    socket.emit(shared_1.ClientEvents.USER_REJECT_VIEW, {
        adminId: currentViewingAdminId,
        reason,
    });
    currentViewingAdminId = null;
    console.log('[Socket] Rejected view request');
}
/**
 * User ends the active view session
 */
function endViewSession() {
    if (!socket || !currentViewingAdminId) {
        return;
    }
    socket.emit(shared_1.ClientEvents.USER_END_VIEW, {
        adminId: currentViewingAdminId,
    });
    if (currentWebRTCManager) {
        currentWebRTCManager.cleanup();
        currentWebRTCManager = null;
    }
    currentViewingAdminId = null;
    console.log('[Socket] Ended view session');
}
//# sourceMappingURL=socket-client.js.map