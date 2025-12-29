"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Admin app preload script
// More IPC methods will be added in Phase 2 when signaling server is implemented
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // Placeholder for future IPC methods
    // These will be implemented in Phase 2 with the signaling server
    // Get list of connected users
    getUsers: () => Promise.resolve([]),
    // Request to view a user's screen
    requestScreenView: (userId) => {
        console.log('Screen view requested for:', userId);
        return Promise.resolve();
    },
    // Disconnect from viewing a screen
    disconnectScreenView: (userId) => {
        console.log('Disconnecting from:', userId);
        return Promise.resolve();
    },
});
//# sourceMappingURL=preload.js.map