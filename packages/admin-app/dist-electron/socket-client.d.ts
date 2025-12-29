import { BrowserWindow } from 'electron';
import { ConnectionStatus, type ServerConfig, type UserInfo, type AdminRegistrationData } from '@monitor-me/shared';
/**
 * Set the main window reference for IPC communication
 */
export declare function setMainWindow(window: BrowserWindow | null): void;
/**
 * Get current connection status
 */
export declare function getConnectionStatus(): ConnectionStatus;
/**
 * Get current users list
 */
export declare function getUsers(): UserInfo[];
/**
 * Connect to the signaling server as admin
 */
export declare function connectToServer(config: ServerConfig, adminData: AdminRegistrationData): void;
/**
 * Disconnect from the signaling server
 */
export declare function disconnectFromServer(): void;
/**
 * Request to view a user's screen
 */
export declare function requestViewUser(targetUserId: string): void;
/**
 * Cancel view request
 */
export declare function cancelViewRequest(targetUserId: string): void;
/**
 * Check if connected
 */
export declare function isConnected(): boolean;
//# sourceMappingURL=socket-client.d.ts.map