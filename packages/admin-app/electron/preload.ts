import { contextBridge } from 'electron';

// Admin app preload script
// More IPC methods will be added in Phase 2 when signaling server is implemented

contextBridge.exposeInMainWorld('electronAPI', {
  // Placeholder for future IPC methods
  // These will be implemented in Phase 2 with the signaling server

  // Get list of connected users
  getUsers: (): Promise<unknown[]> => Promise.resolve([]),

  // Request to view a user's screen
  requestScreenView: (userId: string): Promise<void> => {
    console.log('Screen view requested for:', userId);
    return Promise.resolve();
  },

  // Disconnect from viewing a screen
  disconnectScreenView: (userId: string): Promise<void> => {
    console.log('Disconnecting from:', userId);
    return Promise.resolve();
  },
});
