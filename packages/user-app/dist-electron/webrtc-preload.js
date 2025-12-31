"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose IPC methods to the window context for WebRTC communication
electron_1.contextBridge.exposeInMainWorld('webrtcIpc', {
    sendOffer: (offer) => electron_1.ipcRenderer.send('webrtc:offer', offer),
    sendIceCandidate: (candidate) => electron_1.ipcRenderer.send('webrtc:ice-candidate', candidate),
    sendStateChange: (state) => electron_1.ipcRenderer.send('webrtc:state-change', state),
    sendError: (error) => electron_1.ipcRenderer.send('webrtc:error', error),
    onAnswer: (callback) => {
        electron_1.ipcRenderer.on('webrtc:answer', (_event, answer) => callback(answer));
    },
    onRemoteIceCandidate: (callback) => {
        electron_1.ipcRenderer.on('webrtc:remote-ice-candidate', (_event, candidate) => callback(candidate));
    },
    onCleanup: (callback) => {
        electron_1.ipcRenderer.on('webrtc:cleanup', callback);
    },
});
//# sourceMappingURL=webrtc-preload.js.map