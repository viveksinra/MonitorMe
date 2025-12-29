import { BrowserWindow } from 'electron';
import { ConnectionStatus, type ServerConfig, type MonitoringState, type UserRegistrationData } from '@monitor-me/shared';
/**
 * Set the main window reference for IPC communication
 */
export declare function setMainWindow(window: BrowserWindow | null): void;
/**
 * Get current connection status
 */
export declare function getConnectionStatus(): ConnectionStatus;
/**
 * Connect to the signaling server
 */
export declare function connectToServer(config: ServerConfig, userData: UserRegistrationData): void;
/**
 * Disconnect from the signaling server
 */
export declare function disconnectFromServer(): void;
/**
 * Send state update to server
 */
export declare function sendStateUpdate(state: MonitoringState): void;
/**
 * Update user data (for reconnection)
 */
export declare function updateUserData(userData: UserRegistrationData): void;
/**
 * Check if connected
 */
export declare function isConnected(): boolean;
//# sourceMappingURL=socket-client.d.ts.map