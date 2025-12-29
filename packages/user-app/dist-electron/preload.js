"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const shared_1 = require("@monitor-me/shared");
// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // Consent
    getConsent: () => electron_1.ipcRenderer.invoke(shared_1.IpcChannels.GET_CONSENT),
    setConsent: (consent) => electron_1.ipcRenderer.invoke(shared_1.IpcChannels.SET_CONSENT, consent),
    hasConsent: () => electron_1.ipcRenderer.invoke(shared_1.IpcChannels.HAS_CONSENT),
    // Config
    getConfig: () => electron_1.ipcRenderer.invoke(shared_1.IpcChannels.GET_CONFIG),
    setConfig: (config) => electron_1.ipcRenderer.invoke(shared_1.IpcChannels.SET_CONFIG, config),
    // Monitoring state
    getState: () => electron_1.ipcRenderer.invoke(shared_1.IpcChannels.GET_STATE),
    setState: (state) => electron_1.ipcRenderer.invoke(shared_1.IpcChannels.SET_STATE, state),
    onStateChange: (callback) => {
        const handler = (_event, state) => callback(state);
        electron_1.ipcRenderer.on(shared_1.IpcChannels.ON_STATE_CHANGE, handler);
        return () => {
            electron_1.ipcRenderer.removeListener(shared_1.IpcChannels.ON_STATE_CHANGE, handler);
        };
    },
    // Window controls
    minimizeToTray: () => electron_1.ipcRenderer.send(shared_1.IpcChannels.MINIMIZE_TO_TRAY),
    quitApp: () => electron_1.ipcRenderer.send(shared_1.IpcChannels.QUIT_APP),
});
//# sourceMappingURL=preload.js.map