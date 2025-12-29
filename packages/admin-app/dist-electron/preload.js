"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const shared_1 = require("@monitor-me/shared");
// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // Server config
    getServerConfig: () => electron_1.ipcRenderer.invoke(shared_1.IpcChannels.GET_SERVER_CONFIG),
    setServerConfig: (config) => electron_1.ipcRenderer.invoke(shared_1.IpcChannels.SET_SERVER_CONFIG, config),
    // Socket connection
    connectToServer: (config) => electron_1.ipcRenderer.invoke(shared_1.IpcChannels.SOCKET_CONNECT, config),
    disconnectFromServer: () => electron_1.ipcRenderer.invoke(shared_1.IpcChannels.SOCKET_DISCONNECT),
    getConnectionStatus: () => electron_1.ipcRenderer.invoke(shared_1.IpcChannels.SOCKET_STATUS),
    onConnectionStatusChange: (callback) => {
        const handler = (_event, status) => callback(status);
        electron_1.ipcRenderer.on(shared_1.IpcChannels.SOCKET_ON_STATUS_CHANGE, handler);
        return () => {
            electron_1.ipcRenderer.removeListener(shared_1.IpcChannels.SOCKET_ON_STATUS_CHANGE, handler);
        };
    },
    // Users
    getUsers: () => electron_1.ipcRenderer.invoke(shared_1.IpcChannels.GET_USERS),
    onUsersUpdate: (callback) => {
        const handler = (_event, users) => callback(users);
        electron_1.ipcRenderer.on(shared_1.IpcChannels.ON_USERS_UPDATE, handler);
        return () => {
            electron_1.ipcRenderer.removeListener(shared_1.IpcChannels.ON_USERS_UPDATE, handler);
        };
    },
    // View requests
    requestScreenView: (userId) => electron_1.ipcRenderer.invoke(shared_1.IpcChannels.REQUEST_VIEW, userId),
    // Live view event listeners
    onViewAccepted: (callback) => {
        const handler = (_event, data) => callback(data);
        electron_1.ipcRenderer.on('view:accepted', handler);
        return () => {
            electron_1.ipcRenderer.removeListener('view:accepted', handler);
        };
    },
    onViewRejected: (callback) => {
        const handler = (_event, data) => callback(data);
        electron_1.ipcRenderer.on('view:rejected', handler);
        return () => {
            electron_1.ipcRenderer.removeListener('view:rejected', handler);
        };
    },
    onViewEnded: (callback) => {
        const handler = () => callback();
        electron_1.ipcRenderer.on('view:ended', handler);
        return () => {
            electron_1.ipcRenderer.removeListener('view:ended', handler);
        };
    },
    onStreamReady: (callback) => {
        const handler = (_event, data) => callback(data);
        electron_1.ipcRenderer.on('webrtc:stream-ready', handler);
        return () => {
            electron_1.ipcRenderer.removeListener('webrtc:stream-ready', handler);
        };
    },
    onWebRTCStateChange: (callback) => {
        const handler = (_event, data) => callback(data);
        electron_1.ipcRenderer.on('webrtc:state-change', handler);
        return () => {
            electron_1.ipcRenderer.removeListener('webrtc:state-change', handler);
        };
    },
    onWebRTCError: (callback) => {
        const handler = (_event, data) => callback(data);
        electron_1.ipcRenderer.on('webrtc:error', handler);
        return () => {
            electron_1.ipcRenderer.removeListener('webrtc:error', handler);
        };
    },
    // Live view actions
    endViewSession: (userId) => electron_1.ipcRenderer.invoke('view:end-session', userId),
    getRemoteStream: () => electron_1.ipcRenderer.invoke('view:get-stream'),
});
//# sourceMappingURL=preload.js.map